"use client";
import React, { useState, useEffect } from "react";
import LoadingOverlay from "@/components/ui/loading/LoadingOverlay";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';


const breadcrumbs = [
  { name: "Home", href: "/" },
  { name: "Property", href: "/property" },
  { name: "View", href: "/property/view" }
];

interface Property {
  PropertyID: string;
  PropertyName: string;
  Location?: string;
  PropertyType?: string;
  Price?: string;
  Status?: string;
  Description?: string;
  Features?: string;
  Bedrooms?: string;
  Bathrooms?: string;
  Area?: string;
  YearBuilt?: string;
  photo_url?: string[];
  is_active?: boolean;
  created_date?: string;
  updated_date?: string;
  Width?: string;
  Length?: string;
}

export default function ViewPropertyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('id');
  

  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [propertyNotFound, setPropertyNotFound] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Fetch property data from API
  useEffect(() => {
    if (!propertyId) {
      setPropertyNotFound(true);
      setIsLoading(false);
      return;
    }
    const fetchProperty = async () => {
      setIsLoading(true);
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const res = await fetch(`${apiBase}/property-profile/pagination`, {
          method: "POST",
          headers,
          body: JSON.stringify({ page_number: "1", page_size: "1", search_type: "property_profile_id", query_search: propertyId })
        });
        const data = await res.json();
        
        const prop = data[0]?.data?.[0];
        if (!prop) {
          setPropertyNotFound(true);
          setIsLoading(false);
          return;
        }
        
        // Helper function to format price
        const formatPrice = (price: string | number | null | undefined) => {
          if (!price) return '';
          const numPrice = parseFloat(String(price));
          if (isNaN(numPrice)) return '';
          return `$${numPrice.toLocaleString()}`;
        };

        // Helper function to format date
        const formatDate = (dateString: string | null | undefined) => {
          if (!dateString) return 'N/A';
          try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'N/A';
            
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = date.getHours();
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours % 12 || 12;
            
            return `${year}-${month}-${day} ${displayHours}:${minutes} ${ampm}`;
          } catch {
            return 'N/A';
          }
        };

        // Helper function to calculate area
        const calculateArea = (width: string | number | null | undefined, length: string | number | null | undefined) => {
          const w = parseFloat(String(width || 0));
          const l = parseFloat(String(length || 0));
          if (isNaN(w) || isNaN(l) || w <= 0 || l <= 0) return null;
          return w * l;
        };
        
        const calculatedArea = calculateArea(prop.width, prop.length);
        
        setProperty({
          PropertyID: String(prop.property_profile_id),
          PropertyName: prop.property_profile_name || '',
          Location: [
            prop.province_name,
            prop.district_name,
            prop.commune_name,
            prop.village_name,
            prop.home_number ? `#${prop.home_number}` : ''
          ].filter(Boolean).join(', '),
          PropertyType: prop.property_type_name || '',
          Price: formatPrice(prop.price),
          Status: prop.is_active ? 'Available' : 'Inactive',
          Description: prop.description || '',
          Features: prop.feature || '',
          Bedrooms: prop.bedroom ? String(prop.bedroom) : '',
          Bathrooms: prop.bathroom ? String(prop.bathroom) : '',
          Area: calculatedArea?.toFixed(2) || '',
          YearBuilt: prop.year_built ? String(prop.year_built) : '',
          photo_url: prop.photo_url || [],
          is_active: !!prop.is_active,
          created_date: formatDate(prop.created_date),
          updated_date: formatDate(prop.updated_date),
          // Add new fields for width and length
          Width: prop.width ? parseFloat(String(prop.width)).toFixed(2) : '',
          Length: prop.length ? parseFloat(String(prop.length)).toFixed(2) : '',
        });
        setIsLoading(false);
      } catch {
        setPropertyNotFound(true);
        setIsLoading(false);
      }
    };
    fetchProperty();
  }, [propertyId]);



  const handleEdit = () => {
    router.push(`/property/edit?id=${propertyId}`);
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Deleting property:', propertyId);
      router.push('/property');
    } catch (error) {
      console.error('Error deleting property:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleBack = () => {
    router.push('/property');
  };

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      'Available': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      'Reserved': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
      'Sold': 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
      'Under Construction': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      'Maintenance': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'}`}>
        {status}
      </span>
    );
  };

  const getActiveBadge = (isActive: boolean) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isActive 
          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
      }`}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  if (isLoading) {
    return <LoadingOverlay isLoading={true} />;
  }

  if (propertyNotFound || !property) {
    return (
      <div>
        <PageBreadcrumb crumbs={breadcrumbs} />
        <ComponentCard title="Property Details">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Property Not Found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">The property you&apos;re looking for doesn&apos;t exist or has been removed.</p>
              <Button onClick={handleBack}>Back to Property List</Button>
            </div>
          </div>
        </ComponentCard>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb crumbs={breadcrumbs} />
      
      <ComponentCard title="Property Details">
        <div className="space-y-8">
          {/* Header with Action Buttons */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {property.PropertyName}
              </h1>
              <div className="flex items-center gap-3">
                {property.Status && getStatusBadge(property.Status)}
                {getActiveBadge(property.is_active || false)}
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleBack}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </Button>
              <Button variant="outline" onClick={handleEdit}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </Button>
              <Button 
                variant="outline" 
                onClick={handleDelete}
                className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-900/10"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </Button>
            </div>
          </div>

          {/* Property Information Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Basic Information</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Property ID:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">{property.PropertyID}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Location:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">{property.Location || 'N/A'}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Property Type:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">{property.PropertyType || 'N/A'}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Price:</div>
                    <div className="col-span-2 text-sm font-semibold text-green-600 dark:text-green-400">{property.Price || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* Property Details */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Property Details</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Width:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">{property.Width ? `${property.Width} m` : 'N/A'}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Length:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">{property.Length ? `${property.Length} m` : 'N/A'}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Area:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">
                      {property.Area ? `${property.Area} m²` : 'N/A'}
                      {property.Width && property.Length && property.Area && (
                        <span className="text-gray-500 dark:text-gray-400 ml-2">
                          ({property.Width} × {property.Length} m)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Bedrooms:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">{property.Bedrooms || 'N/A'}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Bathrooms:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">{property.Bathrooms || 'N/A'}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Year Built:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">{property.YearBuilt || 'N/A'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description and Features */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Description</h3>
                <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {property.Description || 'No description available.'}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Features & Amenities</h3>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  {property.Features ? (
                    <div className="flex flex-wrap gap-2">
                      {property.Features.split(',').map((feature, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
                        >
                          {feature.trim()}
                        </span>
                      ))}
                    </div>
                  ) : (
                    'No features listed.'
                  )}
                </div>
              </div>

              {/* Property Images Carousel */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Property Images Gallery</h3>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  {property.photo_url && property.photo_url.length > 0 ? (
                    <div className="relative group rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-900 shadow-lg">
                      <Swiper
                        modules={[Navigation, Pagination, Autoplay]}
                        spaceBetween={0}
                        slidesPerView={1}
                        autoplay={{
                          delay: 4000,
                          disableOnInteraction: false,
                        }}
                        navigation={{
                          nextEl: '.swiper-button-next-custom',
                          prevEl: '.swiper-button-prev-custom',
                        }}
                        pagination={{
                          el: '.custom-pagination',
                          clickable: true,
                          bulletClass: 'swiper-pagination-bullet custom-bullet',
                          bulletActiveClass: 'swiper-pagination-bullet-active custom-bullet-active',
                        }}
                        className="h-80 rounded-xl"
                      >
                        {property.photo_url.map((imageUrl, index) => (
                          <SwiperSlide key={index}>
                            <div 
                              className="relative h-full w-full cursor-pointer overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center" 
                              onClick={() => {
                                setSelectedImageIndex(index);
                                setShowImageModal(true);
                              }}
                            >
                              <Image 
                                src={imageUrl} 
                                alt={`Property image ${index + 1}`}
                                width={800}
                                height={320}
                                className="max-h-full max-w-full object-contain"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                                unoptimized={true}
                              />
                              {/* Overlay gradient for better text visibility */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
                              
                              {/* Image counter overlay */}
                              <div className="absolute top-4 right-4 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                                {index + 1} / {property.photo_url?.length || 0}
                              </div>
                            </div>
                          </SwiperSlide>
                        ))}
                      </Swiper>

                      {/* Custom Navigation Arrows */}
                      <div className="swiper-button-prev-custom absolute left-4 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-lg backdrop-blur-sm transition-all duration-200 hover:bg-white hover:shadow-xl group-hover:opacity-100 opacity-0 cursor-pointer">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </div>
                      
                      <div className="swiper-button-next-custom absolute right-4 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-lg backdrop-blur-sm transition-all duration-200 hover:bg-white hover:shadow-xl group-hover:opacity-100 opacity-0 cursor-pointer">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      
                      {/* Custom Pagination Dots */}
                      <div className="custom-pagination absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2"></div>
                    </div>
                  ) : (
                    <div className="flex h-80 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-900">
                      <div className="text-center">
                        <svg className="mx-auto mb-4 h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-lg font-medium text-gray-500 dark:text-gray-400">No images available</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">Property images will appear here</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">System Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Created Date:</div>
                  <div className="col-span-2 text-sm text-gray-900 dark:text-white">{property.created_date || 'N/A'}</div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated:</div>
                  <div className="col-span-2 text-sm text-gray-900 dark:text-white">{property.updated_date || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ComponentCard>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full dark:bg-red-900/20">
            <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-center text-gray-900 dark:text-white">
            Delete Property
          </h3>
          <p className="mb-6 text-center text-gray-600 dark:text-gray-400">
            Are you sure you want to delete &quot;{property.PropertyName}&quot;? This action cannot be undone.
          </p>
          <div className="flex justify-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-900/10"
            >
              {isDeleting ? 'Deleting...' : 'Delete Property'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Image Modal */}
      <Modal isOpen={showImageModal} onClose={() => setShowImageModal(false)}>
        <div className="relative w-full max-w-4xl mx-auto">
          {property?.photo_url && property.photo_url.length > 0 && (
            <>
              <div className="relative bg-black rounded-lg overflow-hidden">
                <Image
                  src={property.photo_url[selectedImageIndex]}
                  alt={`Property image ${selectedImageIndex + 1}`}
                  width={800}
                  height={600}
                  className="w-full h-auto max-h-[60vh] object-contain mx-auto block"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                  unoptimized={true}
                />
                
                {/* Navigation buttons */}
                {property.photo_url.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setSelectedImageIndex(prev => prev > 0 ? prev - 1 : property.photo_url!.length - 1)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-all z-10"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedImageIndex(prev => prev < property.photo_url!.length - 1 ? prev + 1 : 0)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-all z-10"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
              
              {/* Image counter and thumbnails */}
              <div className="p-4 bg-white dark:bg-gray-900 rounded-b-lg">
                <div className="text-center text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {selectedImageIndex + 1} of {property.photo_url.length}
                </div>
                
                {property.photo_url.length > 1 && (
                  <div className="flex justify-center gap-2 overflow-x-auto max-w-full pb-2">
                    {property.photo_url.map((imageUrl, index) => (
                      <button
                        type="button"
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`flex-shrink-0 w-12 h-12 rounded-md overflow-hidden border-2 transition-all ${
                          index === selectedImageIndex
                            ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
                            : 'border-gray-300 hover:border-gray-400 dark:border-gray-600'
                        }`}
                      >
                        <Image
                          src={imageUrl}
                          alt={`Thumbnail ${index + 1}`}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                          unoptimized={true}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}

{/* Custom Swiper Styles */}
<style jsx global>{`
  .custom-bullet {
    background: rgba(255, 255, 255, 0.5) !important;
    width: 8px !important;
    height: 8px !important;
    border-radius: 50% !important;
    transition: all 0.3s ease !important;
  }
  
  .custom-bullet-active {
    background: white !important;
    width: 12px !important;
    height: 12px !important;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3) !important;
  }

  .swiper-button-next-custom:after,
  .swiper-button-prev-custom:after {
    display: none !important;
  }

  .swiper-button-disabled {
    opacity: 0.3 !important;
    cursor: not-allowed !important;
  }
`}</style>
