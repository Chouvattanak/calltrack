"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import DatePicker from "@/components/form/date-picker";
import TextArea from "@/components/form/input/TextArea";
import InputField from "@/components/form/input/InputField";
import { TimeIcon } from "@/icons";
import PhotoUpload, { PhotoFile } from "@/components/form/PhotoUpload";
import SuccessModal from "@/components/ui/modal/SuccessModal";

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

interface PipelineInfo {
  pipelineId: string;
  pipelineName: string;
  leadId: string;
  leadName: string;
  propertyName: string;
  propertyProfileId: string;
  callerName: string;
  callerId: string;
}

type SiteVisitFormErrors = {
  visitDate?: string;
  visitStartTime?: string;
  visitEndTime?: string;
  visitStatus?: string;
  visitType?: string;
  purpose?: string;
  remark?: string;
};

export default function EditSiteVisitPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pipelineId = searchParams.get('pipelineId') || '';
  const siteVisitId = searchParams.get('siteVisitId') || '';

  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Call Pipeline", href: "/callpipeline" },
    { name: "Site Visit", href: `/callpipeline/sitevisit?pipelineId=${pipelineId}` },
    { name: "Edit Site Visit" },
  ];

  const [pipelineInfo, setPipelineInfo] = useState<PipelineInfo | null>(null);
  const [siteVisitData, setSiteVisitData] = useState<SiteVisitData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data state
  const [formData, setFormData] = useState({
    visitDate: "",
    visitStartTime: "",
    visitEndTime: "",
    purpose: "",
    remark: "",
  });
  const [errors, setErrors] = useState<SiteVisitFormErrors>({});
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Load pipeline and site visit data
  const loadData = useCallback(async () => {
    if (!pipelineId || !siteVisitId) {
      setIsLoading(false);
      return;
    }

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      // Load pipeline info first
      const pipelineBody = {
        page_number: "1",
        page_size: "10",
        search_type: "call_log_id",
        query_search: pipelineId,
      };

      const pipelineRes = await fetch(`${apiBase}/call-log/pagination`, {
        method: "POST",
        headers,
        body: JSON.stringify(pipelineBody),
      });

      if (pipelineRes.ok) {
        const pipelineData = await pipelineRes.json();
        let logArr = [];
        if (Array.isArray(pipelineData) && pipelineData.length > 0 && Array.isArray(pipelineData[0].data)) {
          logArr = pipelineData[0].data;
        } else if (Array.isArray(pipelineData?.data)) {
          logArr = pipelineData.data;
        }

        if (logArr.length > 0) {
          const log = logArr[0];
          setPipelineInfo({
            pipelineId: log.call_log_id || "",
            pipelineName: `${log.lead_name || 'Unknown Lead'} - ${log.property_profile_name || 'Unknown Property'}`,
            leadId: log.lead_id || "",
            leadName: log.lead_name || "Unknown Lead",
            propertyName: log.property_profile_name || "Unknown Property",
            propertyProfileId: log.property_profile_id || "",
            callerName: log.created_by_name || "Unknown Creator",
            callerId: log.current_staff_id || ""
          });
        }
      }

      // Load site visit data with pipeline validation
      // First, get all site visits for this pipeline to ensure the site visit belongs to it
      const pipelineVisitsBody = {
        page_number: "1",
        page_size: "100",
        search_type: "call_log_id",
        query_search: pipelineId,
      };

      const pipelineVisitsRes = await fetch(`${apiBase}/site-visit/pagination`, {
        method: "POST",
        headers,
        body: JSON.stringify(pipelineVisitsBody),
      });

      if (!pipelineVisitsRes.ok) {
        throw new Error("Failed to fetch pipeline site visits");
      }

      const pipelineVisitsData = await pipelineVisitsRes.json();
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
      const visit = targetSiteVisit;
      setSiteVisitData(visit);

      // Parse date and time from datetime strings
      const startDateTime = String(visit.start_datetime || '');
      const endDateTime = String(visit.end_datetime || '');

      let visitDate = '';
      let visitStartTime = '';
      let visitEndTime = '';

      if (startDateTime) {
        const startParts = startDateTime.split(' ');
        if (startParts.length >= 2) {
          visitDate = startParts[0];
          visitStartTime = startParts[1];
        }
      }

      if (endDateTime) {
        const endParts = endDateTime.split(' ');
        if (endParts.length >= 2) {
          visitEndTime = endParts[1];
        }
      }

      // Populate form data
      setFormData({
        visitDate: visitDate,
        visitStartTime: visitStartTime,
        visitEndTime: visitEndTime,
        purpose: String(visit.purpose || ''),
        remark: String(visit.remark || ''),
      });

      // Convert existing images to PhotoFile format if any
      if (visit.photo_url && Array.isArray(visit.photo_url) && visit.photo_url.length > 0) {
        console.log("Original photo URLs:", visit.photo_url);
        const photoFiles: PhotoFile[] = visit.photo_url
          .filter((url: string) => {
            // Skip placeholder/example URLs
            if (url.includes('example.com') || url.includes('placeholder')) {
              console.log('Skipping placeholder URL:', url);
              return false;
            }
            return true;
          })
          .map((url: string, index: number) => {
            const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
            console.log(`Photo ${index + 1}: ${url} -> ${proxyUrl}`);
            return {
              id: `existing-${index}`,
              file: null,
              preview: proxyUrl, // Use proxy endpoint
              name: `Photo ${index + 1}`,
              size: 0,
              isExisting: true,
            };
          });
        setPhotos(photoFiles);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      
      // Check if this is a "site visit not found in pipeline" error
      if (error instanceof Error && error.message.includes('not found in pipeline')) {
        alert(`Access denied: This site visit does not belong to pipeline ${pipelineId}. You will be redirected to the site visit history.`);
        router.push(`/callpipeline/sitevisit?pipelineId=${pipelineId}`);
        return;
      }
      
      alert('Failed to load site visit data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [pipelineId, siteVisitId, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Form handlers
  const handleFormChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof SiteVisitFormErrors]) {
      setErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        delete newErrors[field as keyof SiteVisitFormErrors];
        return newErrors;
      });
    }
  };

  // Handle photos change from PhotoUpload component
  const handlePhotosChange = (newPhotos: PhotoFile[]) => {
    setPhotos(newPhotos);
  };

  // Upload multiple photos function (following property edit pattern)
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
    photoFormData.append('menu', 'site_visit');
    photoFormData.append('photoId', String(siteVisitId));

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

  const validateForm = () => {
    const newErrors: SiteVisitFormErrors = {};
    
    if (!formData.visitDate) newErrors.visitDate = "Visit date is required.";
    if (!formData.visitStartTime) newErrors.visitStartTime = "Start time is required.";
    if (!formData.purpose.trim()) newErrors.purpose = "Purpose is required.";
    if (!formData.remark.trim()) newErrors.remark = "Remark is required.";
    
    // Validate end time is after start time if both are provided
    if (formData.visitStartTime && formData.visitEndTime) {
      const startTime = new Date(`2000-01-01T${formData.visitStartTime}`);
      const endTime = new Date(`2000-01-01T${formData.visitEndTime}`);
      if (endTime <= startTime) {
        newErrors.visitEndTime = "End time must be after start time.";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !siteVisitData) return;
    
    try {
      setIsSubmitting(true);
      
      // Combine date and time for API
      const startDatetime = `${formData.visitDate} ${formData.visitStartTime}`;
      const endDatetime = formData.visitEndTime ? `${formData.visitDate} ${formData.visitEndTime}` : '';

      // Prepare photo URLs - combine existing and new photos
      const existingPhotos = siteVisitData.photo_url || [];
      const newPhotoFiles = photos.filter(photo => photo.file);
      
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

      const updatedData = {
        site_visit_id: siteVisitData.site_visit_id,
        call_id: siteVisitData.call_id,
        property_profile_id: String(siteVisitData.property_profile_id),
        staff_id: String(siteVisitData.staff_id),
        lead_id: siteVisitData.lead_id,
        contact_result_id: String(siteVisitData.contact_result_id),
        purpose: formData.purpose,
        start_datetime: startDatetime,
        end_datetime: endDatetime,
        photo_url: photoUrls, // Updated with current photos
        remark: formData.remark,
        is_active: siteVisitData.is_active, // Add missing is_active field
      };
      
      console.log("Updated Site Visit Data to submit:");
      console.log("- site_visit_id:", updatedData.site_visit_id);
      console.log("- photo_url array:", updatedData.photo_url);
      console.log("- photo_url length:", updatedData.photo_url.length);
      console.log("Full updatedData:", updatedData);
      
      // Make actual API call for site visit update
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      
      console.log("About to make PUT request to:", `${apiBase}/site-visit/update`);
      console.log("Request headers:", headers);
      
      const response = await fetch(`${apiBase}/site-visit/update`, {
        method: "PUT",
        headers,
        body: JSON.stringify(updatedData),
      });
      
      const responseData = await response.json();
      console.log("Update Site Visit API Response:", responseData);
      
      if (!response.ok) {
        console.error("API Error Response:", responseData);
        // Handle specific error cases
        if (responseData.error) {
          throw new Error(`Failed to update site visit: ${responseData.error}`);
        } else {
          throw new Error(`Failed to update site visit: ${response.status} - ${JSON.stringify(responseData)}`);
        }
      }
      
      // Show success modal instead of alert
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error("Error updating site visit:", error);
      alert("Failed to update site visit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/callpipeline/sitevisit?pipelineId=${pipelineId}`);
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    router.push(`/callpipeline/sitevisit?pipelineId=${pipelineId}`);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div>
        <PageBreadcrumb crumbs={breadcrumbs} />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading site visit data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Redirect if no data
  if (!pipelineId || !siteVisitId || !siteVisitData) {
    router.push("/callpipeline");
    return null;
  }

  return (
    <div>
      <PageBreadcrumb crumbs={breadcrumbs} />
      <div className="space-y-6">
        
        {/* Site Visit Information Card */}
        <ComponentCard title="Edit Site Visit">
          <div className="mb-6 rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="flex items-center justify-between border-b border-stroke pb-3 dark:border-strokedark">
              <div>
                <h3 className="text-base font-semibold text-black dark:text-white">
                  Site Visit Information
                </h3>
                <p className="mt-1 text-sm text-body dark:text-bodydark">
                  Site Visit ID: {siteVisitData.site_visit_id}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                  Pipeline: {pipelineInfo?.pipelineId}
                </span>
              </div>
            </div>
            
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-md bg-gray-1 p-3 dark:bg-meta-4">
                <dt className="text-xs font-medium text-body dark:text-bodydark">Property</dt>
                <dd className="mt-1 text-sm font-semibold text-black dark:text-white">
                  {siteVisitData.property_profile_name}
                </dd>
              </div>
              <div className="rounded-md bg-gray-1 p-3 dark:bg-meta-4">
                <dt className="text-xs font-medium text-body dark:text-bodydark">Lead</dt>
                <dd className="mt-1 text-sm font-semibold text-black dark:text-white">
                  {siteVisitData.lead_name}
                </dd>
              </div>
              <div className="rounded-md bg-gray-1 p-3 dark:bg-meta-4">
                <dt className="text-xs font-medium text-body dark:text-bodydark">Staff</dt>
                <dd className="mt-1 text-sm font-semibold text-black dark:text-white">
                  {siteVisitData.staff_name}
                </dd>
              </div>
            </div>
            
            <div className="mt-3 rounded-md bg-blue-50 p-2 dark:bg-blue-900/10">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-4 w-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    Update the site visit information below. Changes will be saved when you submit the form.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-3">
              
              {/* Visit Date */}
              <div>
                <DatePicker
                  id="visit-date-picker"
                  label="Visit Date *"
                  placeholder="Select visit date"
                  defaultDate={formData.visitDate}
                  onChange={(selectedDates) => {
                    if (selectedDates.length > 0) {
                      const date = selectedDates[0];
                      const formattedDate = date.toISOString().split('T')[0];
                      handleFormChange('visitDate', formattedDate);
                    }
                  }}
                />
                {errors.visitDate && <p className="text-sm text-red-500 mt-1">{errors.visitDate}</p>}
              </div>

              {/* Visit Start Time */}
              <div>
                <Label htmlFor="visitStartTime">Start Time *</Label>
                <div className="relative">
                  <InputField
                    type="time"
                    id="visitStartTime"
                    value={formData.visitStartTime}
                    onChange={(e) => handleFormChange('visitStartTime', e.target.value)}
                    error={!!errors.visitStartTime}
                  />
                  <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                    <TimeIcon />
                  </span>
                </div>
                {errors.visitStartTime && <p className="text-sm text-red-500 mt-1">{errors.visitStartTime}</p>}
              </div>

              {/* Visit End Time */}
              <div>
                <Label htmlFor="visitEndTime">End Time</Label>
                <div className="relative">
                  <InputField
                    type="time"
                    id="visitEndTime"
                    value={formData.visitEndTime}
                    onChange={(e) => handleFormChange('visitEndTime', e.target.value)}
                    error={!!errors.visitEndTime}
                  />
                  <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                    <TimeIcon />
                  </span>
                </div>
                {errors.visitEndTime && <p className="text-sm text-red-500 mt-1">{errors.visitEndTime}</p>}
              </div>
            </div>

            {/* Purpose */}
            <div>
              <Label htmlFor="purpose">Purpose *</Label>
              <InputField
                type="text"
                id="purpose"
                placeholder="e.g., Property inspection, client meeting, documentation"
                value={formData.purpose}
                onChange={(e) => handleFormChange('purpose', e.target.value)}
                error={!!errors.purpose}
              />
              {errors.purpose && <p className="text-sm text-red-500 mt-1">{errors.purpose}</p>}
            </div>

            {/* Remark - Full width */}
            <div>
              <Label htmlFor="remark">Remark *</Label>
              <TextArea
                placeholder="Enter detailed remarks about the site visit..."
                value={formData.remark}
                onChange={(value) => handleFormChange("remark", value)}
                rows={4}
              />
              {errors.remark && <p className="text-sm text-red-500 mt-1">{errors.remark}</p>}
            </div>

            {/* Document Upload Section */}
            <div>
              <Label htmlFor="documents">Upload Documents</Label>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Upload photos, floor plans, contracts, or other relevant documents from the site visit.
              </p>
              
              {/* Photo Upload Component */}
              <PhotoUpload
                photos={photos}
                onPhotosChange={handlePhotosChange}
                maxFiles={10}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Updating..." : "Update Site Visit"}
              </Button>
            </div>
          </div>
        </ComponentCard>
      </div>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        statusCode={200}
        message="The site visit information has been updated and saved to the database."
        buttonText="Continue"
      />
    </div>
  );
}
