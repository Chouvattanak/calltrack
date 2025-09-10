"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Select from "@/components/form/Select";
import Address, { IAddress } from "@/components/form/Address";
import PhotoUpload, { PhotoFile } from "@/components/form/PhotoUpload";
import SuccessModal from "@/components/ui/modal/SuccessModal";
import LoadingOverlay from "@/components/ui/loading/LoadingOverlay";
import api from "@/lib/api";

const breadcrumbs = [
  { name: "Home", href: "/" },
  { name: "Property", href: "/property" },
  { name: "Edit", href: "/property/edit" }
];


interface ISelectOption {
  value: string;
  label: string;
}

interface FormData {
  property_profile_id: string;
  PropertyName: string;
  Location: IAddress;
  PropertyType: ISelectOption | null;
  Project: ISelectOption | null;
  ProjectOwner: ISelectOption | null;
  Price: string;
  Description: string;
  Features: string;
  Bedrooms: string;
  Bathrooms: string;
  YearBuilt: string;
  Width: string;
  Length: string;
  Status: ISelectOption | null;
  photo_url?: string[];
}

interface FormErrors {
  PropertyName?: string;
  Location?: string;
  PropertyType?: string;
  Project?: string;
  Price?: string;
  Description?: string;
  Features?: string;
  Bedrooms?: string;
  Bathrooms?: string;
  YearBuilt?: string;
  Width?: string;
  Length?: string;
}

export default function EditPropertyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorModal, setErrorModal] = useState<{ open: boolean; statusCode?: number; message?: string }>({ open: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectOptions, setProjectOptions] = useState<ISelectOption[]>([]);
  const [propertyTypeOptions, setPropertyTypeOptions] = useState<ISelectOption[]>([]);
  const [projectOwnerOptions, setProjectOwnerOptions] = useState<ISelectOption[]>([]);
  const [statusOptions, setStatusOptions] = useState<ISelectOption[]>([]);
  const [photos, setPhotos] = useState<PhotoFile[]>([]);

  // Fetch dropdowns and property data
  useEffect(() => {
    let isMounted = true;
    
    async function fetchDropdownsAndData() {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      // Fetch project options
      try {
        const res = await fetch(`${apiBase}/project/pagination`, {
          method: "POST",
          headers,
          body: JSON.stringify({ page_number: "1", page_size: "100" })
        });
        const data = await res.json();
        const apiResult = data[0];
        if (apiResult && apiResult.data && isMounted) {
          setProjectOptions(apiResult.data.map((proj: unknown) => {
            const p = proj as Record<string, unknown>;
            return { value: String(p.project_id), label: p.project_name as string };
          }));
        }
      } catch {}
      // Fetch property type options
      try {
        const res = await fetch(`${apiBase}/property-type/pagination`, {
          method: "POST",
          headers,
          body: JSON.stringify({ page_number: "1", page_size: "100" })
        });
        const data = await res.json();
        const apiResult = data[0];
        if (apiResult && apiResult.data && isMounted) {
          setPropertyTypeOptions(apiResult.data.map((type: unknown) => {
            const t = type as Record<string, unknown>;
            return { value: String(t.property_type_id), label: t.property_type_name as string };
          }));
        }
      } catch {}
      // Fetch project owner options (if needed)
      try {
        const res = await fetch(`${apiBase}/project-owner/pagination`, {
          method: "POST",
          headers,
          body: JSON.stringify({ page_number: "1", page_size: "100" })
        });
        const data = await res.json();
        const apiResult = data[0];
        if (apiResult && apiResult.data && isMounted) {
          setProjectOwnerOptions(apiResult.data.map((owner: unknown) => {
            const o = owner as Record<string, unknown>;
            return { value: String(o.project_owner_id), label: o.project_owner_name as string };
          }));
        }
      } catch {}

      // Fetch property status options
      try {
        const response = await fetch(`${apiBase}/property-status/pagination`, {
          method: "POST",
          headers,
          body: JSON.stringify({ page_number: "1", page_size: "100" })
        });
        const data = await response.json();
        console.log("Property Status API response:", data);
        const apiResult = data[0];
        if (apiResult && apiResult.data && isMounted) {
          setStatusOptions(apiResult.data.map((status: { property_status_id: number, property_status_name: string }) => ({ value: status.property_status_id.toString(), label: status.property_status_name })));
        }
      } catch (err) {
        console.error("Property Status API error:", err);
        setStatusOptions([]);
      }

      // Fetch property data
      if (!propertyId) {
        if (isMounted) {
          setNotFound(true);
          setLoading(false);
        }
        return;
      }
      try {
        const res = await fetch(`${apiBase}/property-profile/pagination`, {
          method: "POST",
          headers,
          body: JSON.stringify({ page_number: "1", page_size: "10", search_type: "property_profile_id", query_search: propertyId })
        });
        const data = await res.json();
        const apiResult = data[0];
        if (!apiResult || !apiResult.data || !apiResult.data[0]) {
          if (isMounted) {
            setNotFound(true);
            setLoading(false);
          }
          return;
        }
        const prop = apiResult.data[0];
        if (isMounted) {
          setFormData({
            property_profile_id: String(prop.property_profile_id),
            PropertyName: prop.property_profile_name || '',
            Location: {
              province: prop.province_id ? { value: String(prop.province_id), label: prop.province_name } : null,
              district: prop.district_id ? { value: String(prop.district_id), label: prop.district_name } : null,
              commune: prop.commune_id ? { value: String(prop.commune_id), label: prop.commune_name } : null,
              village: prop.village_id ? { value: String(prop.village_id), label: prop.village_name } : null,
              homeAddress: prop.home_number || '',
              streetAddress: prop.address || '',
            },
            PropertyType: prop.property_type_id ? { value: String(prop.property_type_id), label: prop.property_type_name } : null,
            Project: prop.project_id ? { value: String(prop.project_id), label: prop.project_name } : null,
            ProjectOwner: prop.project_owner_id ? { value: String(prop.project_owner_id), label: prop.project_owner_name } : null,
            Price: prop.price ? String(prop.price) : '',
            Description: prop.description || '',
            Features: prop.feature || '',
            Bedrooms: prop.bedroom ? String(prop.bedroom) : '',
            Bathrooms: prop.bathroom ? String(prop.bathroom) : '',
            YearBuilt: prop.year_built ? String(prop.year_built) : '',
            Width: prop.width ? String(prop.width) : '',
            Length: prop.length ? String(prop.length) : '',
            Status: prop.property_status_id ? { value: String(prop.property_status_id), label: prop.property_status_name || 'Unknown' } : null,
            photo_url: prop.photo_url || [],
          });

          // Convert existing photo URLs to PhotoFile objects
          if (prop.photo_url && Array.isArray(prop.photo_url)) {
            const existingPhotos: PhotoFile[] = prop.photo_url.map((url: string, index: number) => ({
              id: `existing-${index}`,
              file: null,
              preview: url,
              name: `Photo ${index + 1}`,
              size: 0,
              isExisting: true,
            }));
            setPhotos(existingPhotos);
          }
          // Set loading to false only after all data is loaded and ready to render
          setLoading(false);
        }
      } catch {
        if (isMounted) {
          setNotFound(true);
          setLoading(false);
        }
      }
    }
    fetchDropdownsAndData();
    return () => { isMounted = false; };
  }, [propertyId]);


  // Handlers
  const handleChange = (field: keyof FormData, value: unknown) => {
    if (!formData) return;
    setFormData((prev) => prev ? { ...prev, [field]: value } : prev);
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleAddressSave = (value: IAddress) => {
    if (!formData) return;
    setFormData((prev) => prev ? { ...prev, Location: value } : prev);
    setFormErrors((prev) => ({ ...prev, Location: undefined }));
  };

  const validate = (): boolean => {
    if (!formData) return false;
    const errors: FormErrors = {};
    if (!formData.PropertyName) errors.PropertyName = 'Property name is required';
    if (!formData.Location || !formData.Location.province) errors.Location = 'Province is required';
    if (!formData.PropertyType) errors.PropertyType = 'Property type is required';
    if (!formData.Project) errors.Project = 'Project is required';
    if (!formData.Price) errors.Price = 'Price is required';
    if (!formData.Description) errors.Description = 'Description is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Photo handlers
  const handlePhotosChange = (newPhotos: PhotoFile[]) => {
    setPhotos(newPhotos);
  };

  const uploadMultiplePhotosToStorage = async (photoFiles: PhotoFile[]): Promise<string[]> => {
    if (photoFiles.length === 0) {
      return [];
    }

    const photoFormData = new FormData();
    
    // Append all photo files
    photoFiles.forEach((photo) => {
      if (photo.file) {
        photoFormData.append('photo', photo.file);
      }
    });
    
    // Append menu and photoId once
    photoFormData.append('menu', 'property_profile');
    photoFormData.append('photoId', String(formData?.property_profile_id || ''));

    try {
      const uploadResponse = await api.post('/files/upload-multiple-photos', photoFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      console.log('Multiple photos upload response:', uploadResponse.data);
      
      // Extract the imageUrls array from the response
      const imageUrls = uploadResponse.data.imageUrls;
      if (!imageUrls || !Array.isArray(imageUrls)) {
        throw new Error('No imageUrls array returned from upload response');
      }
      
      console.log('Extracted imageUrls:', imageUrls);
      return imageUrls;
    } catch (error) {
      console.error('Error uploading multiple photos:', error);
      throw error;
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    router.push('/property');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !formData) return;
    setIsSubmitting(true);
    
    try {
      // Process photos similar to site visit edit page
      const existingPhotos = photos
        .filter(photo => photo.isExisting)
        .map(photo => photo.preview);
      
      const newPhotoFiles = photos.filter(photo => !photo.isExisting && photo.file);
      
      console.log('Existing photos:', existingPhotos);
      console.log('New photo files to upload:', newPhotoFiles.length);
      
      const photoUrls = [...existingPhotos];
      
      // Upload new photos if any
      if (newPhotoFiles.length > 0) {
        console.log("Uploading new photos:", newPhotoFiles.length);
        try {
          // Upload all new photos at once using the multiple photos endpoint
          const uploadedUrls = await uploadMultiplePhotosToStorage(newPhotoFiles);
          photoUrls.push(...uploadedUrls);
          console.log("Successfully uploaded photos, URLs:", uploadedUrls);
          console.log('Final photo URLs array:', photoUrls);
        } catch (uploadError) {
          console.error("Error uploading photos:", uploadError);
          alert("Error uploading photos. Please try again.");
          setIsSubmitting(false);
          return;
        }
      }
      
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      
      const payload = {
        property_profile_id: String(formData.property_profile_id),
        property_type_id: String(formData.PropertyType?.value || ""),
        project_id: String(formData.Project?.value || ""),
        project_owner_id: "5", // Hard-coded to 5 as requested (same as create page)
        property_status_id: String(formData.Status?.value || "1"),
        village_id: String(formData.Location.village?.value || ""),
        property_profile_name: String(formData.PropertyName || ""),
        home_number: String(formData.Location.homeAddress || ""),
        room_number: String(formData.Location.homeAddress || ""), // Use same as home_number for consistency
        address: String(formData.Location.streetAddress || ""),
        width: String(formData.Width || ""),
        length: String(formData.Length || ""),
        price: String(formData.Price || ""),
        bedroom: String(formData.Bedrooms || ""),
        bathroom: String(formData.Bathrooms || ""),
        year_built: String(formData.YearBuilt || ""),
        description: String(formData.Description || ""),
        feature: String(formData.Features || ""),
        photo_url: photoUrls, // Use the uploaded photo URLs
        is_active: true
      };
      
      console.log("Property Update Payload before PUT request:");
      console.log(JSON.stringify(payload, null, 2));
      console.log('API Base URL:', process.env.NEXT_PUBLIC_API_BASE_URL);
      console.log('Endpoint: /property-profile/update');
      console.log('Project Owner ID: hardcoded to "5"');
      
      // Use api client instead of fetch for better authentication handling
      const response = await api.put('/property-profile/update', payload);
      
      console.log('Update property response status:', response.status);
      console.log('Update property response data:', response.data);
      
      // Only treat status 200 as success
      if (response.status === 200) {
        console.log('Update property success response:', response.data);
        setShowSuccessModal(true);
      } else if (response.status === 400) {
        // Bad request - client error
        const errorMessage = response.data?.message || 'Bad request. Please check your input and try again.';
        console.error('Update property 400 error:', errorMessage);
        alert(`Error: ${errorMessage}`);
        setIsSubmitting(false);
        return; // Don't redirect
      } else if (response.status === 500 || response.status === 501) {
        // Server errors
        const errorMessage = response.data?.message || 'Server error. Please try again later.';
        console.error('Update property server error:', response.status, errorMessage);
        alert(`Server Error (${response.status}): ${errorMessage}`);
        setIsSubmitting(false);
        return; // Don't redirect
      } else {
        // Any other non-200 status is treated as error
        const errorMessage = response.data?.message || `Unexpected response status: ${response.status}`;
        console.error('Update property unexpected status:', response.status, errorMessage);
        alert(`Error (${response.status}): ${errorMessage}`);
        setIsSubmitting(false);
        return; // Don't redirect
      }
    } catch (error: any) {
      console.error('Error updating property:', error);
      
      // Handle different types of errors
      if (error.response) {
        // The request was made and the server responded with a status code
        const status = error.response.status;
        const errorMessage = error.response.data?.message || error.message || 'Unknown error occurred';
        
        if (status === 400) {
          alert(`Bad Request: ${errorMessage}`);
        } else if (status === 500 || status === 501) {
          alert(`Server Error (${status}): ${errorMessage}`);
        } else {
          alert(`Error (${status}): ${errorMessage}`);
        }
      } else if (error.request) {
        // The request was made but no response was received
        alert("Network error: Unable to reach the server. Please check your internet connection.");
      } else {
        // Something happened in setting up the request
        alert(`Request error: ${error.message || 'Failed to update property. Please try again.'}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render branches
  if (loading) {
    return <LoadingOverlay isLoading={true} />;
  }

  if (notFound || !formData) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Property Not Found</h3>
        <p className="text-gray-600 mb-4">The property you&apos;re looking for doesn&apos;t exist.</p>
        <Button onClick={() => router.push('/property')}>Back to Property List</Button>
      </div>
    );
  }

  // Grouped form layout (like create page)
  if (!formData) return null;
  return (
    <div>
      <PageBreadcrumb crumbs={breadcrumbs} />
      <ComponentCard title="Edit Property">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* General Information */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <h4 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">General Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="PropertyName">Property Name *</Label>
                <Input
                  id="PropertyName"
                  type="text"
                  value={formData.PropertyName}
                  onChange={(e) => handleChange('PropertyName', e.target.value)}
                  placeholder="Enter property name"
                  className={formErrors.PropertyName ? 'border-red-500' : ''}
                />
                {formErrors.PropertyName && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.PropertyName}</p>
                )}
              </div>
              <div>
                <Label htmlFor="PropertyType">Property Type *</Label>
                <Select
                  value={formData.PropertyType}
                  onChange={(value) => handleChange('PropertyType', value)}
                  options={propertyTypeOptions}
                  placeholder="Select Property Type"
                  className={formErrors.PropertyType ? 'border-red-500' : ''}
                />
                {formErrors.PropertyType && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.PropertyType}</p>
                )}
              </div>
              <div>
                <Label htmlFor="Project">Project *</Label>
                <Select
                  value={formData.Project}
                  onChange={(value) => handleChange('Project', value)}
                  options={projectOptions}
                  placeholder="Select Project"
                  className={formErrors.Project ? 'border-red-500' : ''}
                />
                {formErrors.Project && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.Project}</p>
                )}
              </div>
              <div>
                <Label htmlFor="ProjectOwner">Project Owner</Label>
                <Select
                  value={formData.ProjectOwner}
                  onChange={(value) => handleChange('ProjectOwner', value)}
                  options={projectOwnerOptions}
                  placeholder="Select Project Owner"
                />
              </div>
              <div>
                <Label htmlFor="Price">Price *</Label>
                <Input
                  id="Price"
                  type="text"
                  value={formData.Price}
                  onChange={(e) => handleChange('Price', e.target.value)}
                  placeholder="Enter price"
                  className={formErrors.Price ? 'border-red-500' : ''}
                />
                {formErrors.Price && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.Price}</p>
                )}
              </div>
              <div>
                <Label htmlFor="Status">Status</Label>
                <Select
                  value={formData.Status}
                  onChange={(value) => handleChange('Status', value)}
                  options={statusOptions}
                  placeholder="Select Status"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <h4 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">Location</h4>
            <Address
              value={formData.Location}
              onSave={handleAddressSave}
              error={formErrors.Location}
              label="Location *"
            />
          </div>

          {/* Property Details */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <h4 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">Property Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="Width">Width</Label>
                <Input
                  id="Width"
                  type="text"
                  value={formData.Width}
                  onChange={(e) => handleChange('Width', e.target.value)}
                  placeholder="Enter width"
                  className={formErrors.Width ? 'border-red-500' : ''}
                />
                {formErrors.Width && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.Width}</p>
                )}
              </div>
              <div>
                <Label htmlFor="Length">Length</Label>
                <Input
                  id="Length"
                  type="text"
                  value={formData.Length}
                  onChange={(e) => handleChange('Length', e.target.value)}
                  placeholder="Enter length"
                  className={formErrors.Length ? 'border-red-500' : ''}
                />
                {formErrors.Length && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.Length}</p>
                )}
              </div>
              <div>
                <Label htmlFor="Bedrooms">Bedrooms</Label>
                <Input
                  id="Bedrooms"
                  type="number"
                  value={formData.Bedrooms}
                  onChange={(e) => handleChange('Bedrooms', e.target.value)}
                  placeholder="Number of bedrooms"
                />
              </div>
              <div>
                <Label htmlFor="Bathrooms">Bathrooms</Label>
                <Input
                  id="Bathrooms"
                  type="number"
                  value={formData.Bathrooms}
                  onChange={(e) => handleChange('Bathrooms', e.target.value)}
                  placeholder="Number of bathrooms"
                />
              </div>
              <div>
                <Label htmlFor="YearBuilt">Year Built</Label>
                <Input
                  id="YearBuilt"
                  type="number"
                  value={formData.YearBuilt}
                  onChange={(e) => handleChange('YearBuilt', e.target.value)}
                  placeholder="Year property was built"
                />
              </div>
            </div>
          </div>

          {/* Features & Description */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <h4 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">Features & Description</h4>
            <div className="space-y-6">
              <div>
                <Label htmlFor="Description">Description *</Label>
                <TextArea
                  value={formData.Description}
                  onChange={(value) => handleChange('Description', value)}
                  placeholder="Enter property description"
                  rows={4}
                  className={formErrors.Description ? 'border-red-500' : ''}
                />
                {formErrors.Description && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.Description}</p>
                )}
              </div>
              <div>
                <Label htmlFor="Features">Features & Amenities</Label>
                <TextArea
                  value={formData.Features}
                  onChange={(value) => handleChange('Features', value)}
                  placeholder="Enter property features and amenities (e.g., Pool, Gym, Parking, etc.)"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Property Photos */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <h4 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">Property Photos</h4>
            <PhotoUpload
              photos={photos}
              onPhotosChange={handlePhotosChange}
            />
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/property')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </ComponentCard>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        statusCode={200}
        message="The property profile has been successfully updated."
        buttonText="Back to Property List"
      />
      {/* Error Modal */}
      <SuccessModal
        isOpen={errorModal.open}
        onClose={() => setErrorModal({ open: false })}
        statusCode={errorModal.statusCode}
        message={errorModal.message}
        buttonText="Okay, Got It"
      />
    </div>
  );
}
