"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  XMarkIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon
} from "@heroicons/react/24/outline";

interface SiteVisitData {
  site_visit_id: string;
  call_id: string;
  property_profile_id: number;
  property_profile_name: string;
  staff_id: number;
  staff_name: string;
  lead_id: string;
  lead_name: string;
  contact_result_id: number;
  contact_result_name: string;
  purpose: string;
  start_datetime: string;
  end_datetime: string;
  photo_url: string[];
  remark: string;
  is_active: boolean;
  created_date: string;
  created_by_name: string;
  last_update: string | null;
  updated_by_name: string;
}

export default function ViewSiteVisitPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const siteVisitId = searchParams.get('siteVisitId') || '';
  const pipelineId = searchParams.get('pipelineId') || '';

  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Call Pipeline", href: "/callpipeline" },
    ...(pipelineId ? [{ name: "Site Visit", href: `/callpipeline/sitevisit?pipelineId=${pipelineId}` }] : []),
    { name: "View Site Visit" },
  ];

  const [siteVisitData, setSiteVisitData] = useState<SiteVisitData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Photo gallery state
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Load site visit data
  const loadSiteVisitData = useCallback(async () => {
    if (!siteVisitId) {
      setError("Site visit ID is required");
      setIsLoading(false);
      return;
    }

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      
      // First, get all site visits for this pipeline to ensure the site visit belongs to it
      const pipelineVisitsBody = {
        page_number: "1",
        page_size: "100",
        search_type: "call_log_id",
        query_search: pipelineId,
      };
      
      console.log("Making API call to:", `${apiBase}/site-visit/pagination`);
      console.log("Request body:", pipelineVisitsBody);
      
      const pipelineVisitsRes = await fetch(`${apiBase}/site-visit/pagination`, {
        method: "POST",
        headers,
        body: JSON.stringify(pipelineVisitsBody),
      });
      
      if (!pipelineVisitsRes.ok) throw new Error("Failed to fetch pipeline site visits");
      
      const pipelineVisitsData = await pipelineVisitsRes.json();
      console.log("Pipeline visits API Response:", pipelineVisitsData);
      
      let pipelineVisitsArr = [];
      if (Array.isArray(pipelineVisitsData) && pipelineVisitsData.length > 0 && pipelineVisitsData[0].data) {
        pipelineVisitsArr = pipelineVisitsData[0].data;
      }

      // Find the specific site visit in the pipeline's site visits
      const targetSiteVisit = pipelineVisitsArr.find((visit: SiteVisitData) => 
        visit.site_visit_id === siteVisitId
      );

      if (!targetSiteVisit) {
        throw new Error(`Site visit ${siteVisitId} not found in pipeline ${pipelineId}`);
      }

      // Use the found site visit data
      const visitArr = [targetSiteVisit];
      
      console.log("Parsed visitArr:", visitArr);
      
      if (visitArr.length > 0) {
        const siteVisit = visitArr[0];
        // Filter out empty photo URLs and ensure it's an array
        if (siteVisit.photo_url && Array.isArray(siteVisit.photo_url)) {
          siteVisit.photo_url = siteVisit.photo_url.filter((url: string) => url && url.trim() !== '');
        } else {
          siteVisit.photo_url = [];
        }
        console.log("✅ Site visit after photo filtering:", siteVisit);
        setSiteVisitData(siteVisit);
      } else {
        setError("Site visit not found");
      }
    } catch (error) {
      console.error("Error loading site visit data:", error);
      
      // Check if this is a "site visit not found in pipeline" error
      if (error instanceof Error && error.message.includes('not found in pipeline')) {
        setError(`Access denied: This site visit does not belong to pipeline ${pipelineId}.`);
        return;
      }
      
      setError("Failed to load site visit data");
    } finally {
      setIsLoading(false);
    }
  }, [siteVisitId, pipelineId]);

  useEffect(() => {
    loadSiteVisitData();
  }, [loadSiteVisitData]);

  // Reset photo index when site visit data changes or photos are filtered
  useEffect(() => {
    if (siteVisitData?.photo_url) {
      if (siteVisitData.photo_url.length === 0 || currentPhotoIndex >= siteVisitData.photo_url.length) {
        setCurrentPhotoIndex(0);
      }
    } else {
      setCurrentPhotoIndex(0);
    }
  }, [siteVisitData?.photo_url, currentPhotoIndex]);

  // Helper functions
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString: string): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return 'N/A';
    }
  };

  const calculateDuration = (): string => {
    if (!siteVisitData?.start_datetime || !siteVisitData?.end_datetime) return 'N/A';
    try {
      const start = new Date(siteVisitData.start_datetime);
      const end = new Date(siteVisitData.end_datetime);
      const diffMinutes = Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
      
      if (diffMinutes <= 0) return 'N/A';
      
      const hours = Math.floor(diffMinutes / 60);
      const remainingMinutes = diffMinutes % 60;
      
      if (hours > 0) {
        return `${hours}h ${remainingMinutes}m`;
      }
      return `${diffMinutes}m`;
    } catch {
      return 'N/A';
    }
  };

  // Photo navigation functions
  const nextPhoto = useCallback(() => {
    if (siteVisitData?.photo_url && siteVisitData.photo_url.length > 0) {
      setCurrentPhotoIndex((prev) => 
        prev === siteVisitData.photo_url.length - 1 ? 0 : prev + 1
      );
    }
  }, [siteVisitData?.photo_url]);

  const previousPhoto = useCallback(() => {
    if (siteVisitData?.photo_url && siteVisitData.photo_url.length > 0) {
      setCurrentPhotoIndex((prev) => 
        prev === 0 ? siteVisitData.photo_url.length - 1 : prev - 1
      );
    }
  }, [siteVisitData?.photo_url]);

  const openPhotoModal = (index: number) => {
    setCurrentPhotoIndex(index);
    setIsPhotoModalOpen(true);
  };

  const closePhotoModal = () => {
    setIsPhotoModalOpen(false);
    setIsFullscreen(false);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (isPhotoModalOpen) {
        if (event.key === 'ArrowLeft') {
          previousPhoto();
        } else if (event.key === 'ArrowRight') {
          nextPhoto();
        } else if (event.key === 'Escape') {
          closePhotoModal();
        } else if (event.key === 'f' || event.key === 'F') {
          setIsFullscreen(prev => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPhotoModalOpen, nextPhoto, previousPhoto]);

  // Loading state
  if (isLoading) {
    return (
      <div>
        <PageBreadcrumb crumbs={breadcrumbs} />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading site visit information...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !siteVisitData) {
    return (
      <div>
        <PageBreadcrumb crumbs={breadcrumbs} />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">{error || "Site visit not found."}</p>
            <Button variant="outline" onClick={() => router.back()}>
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb crumbs={breadcrumbs} />
      
      <div className="space-y-6">
        {/* Header */}
        <ComponentCard title="Site Visit Details">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Site Visit #{siteVisitData.site_visit_id}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {siteVisitData.property_profile_name} • {siteVisitData.lead_name}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ChevronLeftIcon className="w-4 h-4" />
                Back
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => router.push(`/callpipeline/sitevisit/edit?pipelineId=${siteVisitData.call_id}&siteVisitId=${siteVisitData.site_visit_id}`)}
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </Button>
            </div>
          </div>

          {/* Site Visit Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Basic Information */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Visit Information
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Visit ID:</div>
                    <div className="col-span-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-mono font-medium bg-indigo-50 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {siteVisitData.site_visit_id}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Visit Date:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">
                      {formatDate(siteVisitData.start_datetime)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Start Time:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">
                      {formatTime(siteVisitData.start_datetime)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">End Time:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">
                      {formatTime(siteVisitData.end_datetime)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Duration:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                        {calculateDuration()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Status:</div>
                    <div className="col-span-2">
                      <Badge
                        size="sm"
                        color={
                          siteVisitData.contact_result_name === "Completed"
                            ? "success"
                            : siteVisitData.contact_result_name === "Failed" || siteVisitData.contact_result_name === "Cancelled"
                            ? "error"
                            : "warning"
                        }
                      >
                        {siteVisitData.contact_result_name}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Purpose:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">
                      {siteVisitData.purpose || 'No purpose specified'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Additional Information */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Property & Staff Information
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Property:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">
                      {siteVisitData.property_profile_name}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Lead:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">
                      {siteVisitData.lead_name}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Staff Member:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                            <span className="text-xs font-medium text-blue-800 dark:text-blue-300">
                              {siteVisitData.staff_name?.charAt(0)?.toUpperCase() || 'S'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{siteVisitData.staff_name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">ID: {siteVisitData.staff_id}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Created Date:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">
                      {formatDate(siteVisitData.created_date)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Created By:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">
                      {siteVisitData.created_by_name}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Update:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">
                      {formatDate(siteVisitData.last_update)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Remarks Section */}
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Visit Notes
            </h3>
            <div className="bg-gray-50 dark:bg-white/[0.02] rounded-lg p-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {siteVisitData.remark || 'No notes provided for this visit.'}
              </p>
            </div>
          </div>
        </ComponentCard>

        {/* Photos Section */}
        <ComponentCard title="Visit Photos">
          {siteVisitData.photo_url && siteVisitData.photo_url.length > 0 ? (
            <div className="space-y-6">
              {/* Photo Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-500/10">
                    <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Site Visit Photos
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {siteVisitData.photo_url.length} photo{siteVisitData.photo_url.length > 1 ? 's' : ''} available
                    </p>
                  </div>
                </div>
                
                {/* Photo Counter Badge */}
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                    {currentPhotoIndex + 1} of {siteVisitData.photo_url.length}
                  </span>
                  <button
                    onClick={() => openPhotoModal(currentPhotoIndex)}
                    className="inline-flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg transition-colors"
                  >
                    <ArrowsPointingOutIcon className="w-4 h-4 mr-2" />
                    Fullscreen
                  </button>
                </div>
              </div>
              
              {/* Modern Photo Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                {/* Photo Display Area */}
                <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                  <div className="relative w-full h-80 md:h-96">
                    {siteVisitData.photo_url && 
                     siteVisitData.photo_url.length > 0 && 
                     currentPhotoIndex < siteVisitData.photo_url.length &&
                     siteVisitData.photo_url[currentPhotoIndex] && 
                     siteVisitData.photo_url[currentPhotoIndex].trim() !== '' ? (
                      <Image
                        src={siteVisitData.photo_url[currentPhotoIndex]}
                        alt={`Site visit photo ${currentPhotoIndex + 1}`}
                        fill
                        className="object-contain p-4"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none'; // Hide broken image
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-gray-500 dark:text-gray-400">No image available</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Navigation Arrows - Only show if more than 1 photo */}
                    {siteVisitData.photo_url.length > 1 && (
                      <>
                        {/* Previous Button */}
                        <button
                          onClick={previousPhoto}
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 p-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 border border-gray-200 dark:border-gray-600"
                        >
                          <ChevronLeftIcon className="w-5 h-5" />
                        </button>

                        {/* Next Button */}
                        <button
                          onClick={nextPhoto}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 border border-gray-200 dark:border-gray-600"
                        >
                          <ChevronRightIcon className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Photo Info Footer */}
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Photo {currentPhotoIndex + 1}
                    </div>
                    
                    {/* Navigation Indicators */}
                    {siteVisitData.photo_url.length > 1 && (
                      <div className="flex items-center gap-1">
                        {siteVisitData.photo_url.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentPhotoIndex(index)}
                            className={`w-2 h-2 rounded-full transition-all duration-200 ${
                              index === currentPhotoIndex 
                                ? 'bg-blue-500 w-6' 
                                : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      {siteVisitData.photo_url.length > 1 && (
                        <>
                          <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs">←→</kbd>
                          <span>Navigate</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="flex flex-col items-center">
                <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Photos</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No photos were uploaded for this site visit.
                </p>
              </div>
            </div>
          )}
        </ComponentCard>
      </div>

      {/* Photo Modal */}
      {isPhotoModalOpen && siteVisitData.photo_url && siteVisitData.photo_url.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
          <div className={`relative ${isFullscreen ? 'w-full h-full' : 'max-w-4xl max-h-[90vh] w-full mx-4'}`}>
            {/* Close Button */}
            <button
              onClick={closePhotoModal}
              className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-opacity"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="absolute top-4 left-4 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-opacity"
            >
              {isFullscreen ? (
                <ArrowsPointingInIcon className="w-6 h-6" />
              ) : (
                <ArrowsPointingOutIcon className="w-6 h-6" />
              )}
            </button>

            {/* Previous Button */}
            {siteVisitData.photo_url.length > 1 && (
              <button
                onClick={previousPhoto}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-opacity"
              >
                <ChevronLeftIcon className="w-8 h-8" />
              </button>
            )}

            {/* Next Button */}
            {siteVisitData.photo_url.length > 1 && (
              <button
                onClick={nextPhoto}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-opacity"
              >
                <ChevronRightIcon className="w-8 h-8" />
              </button>
            )}

            {/* Main Photo */}
            <div className="w-full h-full flex items-center justify-center">
              <div className="relative max-w-full max-h-full">
                {siteVisitData.photo_url && 
                 siteVisitData.photo_url.length > 0 && 
                 currentPhotoIndex < siteVisitData.photo_url.length &&
                 siteVisitData.photo_url[currentPhotoIndex] && 
                 siteVisitData.photo_url[currentPhotoIndex].trim() !== '' ? (
                  <Image
                    src={siteVisitData.photo_url[currentPhotoIndex]}
                    alt={`Site visit photo ${currentPhotoIndex + 1}`}
                    width={800}
                    height={600}
                    className={`${isFullscreen ? 'max-w-full max-h-full' : 'max-w-full max-h-full'} object-contain`}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none'; // Hide broken image
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center w-96 h-96 bg-gray-200 dark:bg-gray-700 rounded-lg">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-300 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400">No image available</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Photo Counter */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 px-4 py-2 bg-black bg-opacity-50 text-white rounded-full text-sm">
              {currentPhotoIndex + 1} / {siteVisitData.photo_url.length}
            </div>

            {/* Navigation Instructions */}
            <div className="absolute bottom-4 right-4 z-10 text-white text-xs bg-black bg-opacity-50 px-3 py-2 rounded">
              <div>← → to navigate</div>
              <div>ESC to close</div>
              <div>F for fullscreen</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
