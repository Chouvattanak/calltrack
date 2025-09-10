"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "../ui/button/Button";
import Label from "../form/Label";
import Select from "../form/Select";
import DatePicker from "../form/date-picker";
import TextArea from "../form/input/TextArea";
import InputField from "../form/input/InputField";
import PhotoUpload, { PhotoFile } from "../form/PhotoUpload";
import { TimeIcon } from "@/icons";

interface SelectOption {
  value: string;
  label: string;
}

type SiteVisitFormErrors = {
  visitDate?: string;
  visitStartTime?: string;
  visitEndTime?: string;
  contactResult?: string;
  notes?: string;
  is_follow_up?: string;
  follow_up_date?: string;
};

export default function SiteVisitCreate() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pipelineId = searchParams.get("pipelineId") || "";

  // Form state
  const [formData, setFormData] = useState({
    visitDate: "",
    visitStartTime: "",
    visitEndTime: "",
    contactResult: null as SelectOption | null,
    purpose: "",
    notes: "",
    is_follow_up: false,
    follow_up_date: null as Date | null,
  });
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [errors, setErrors] = useState<SiteVisitFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Data state
  const [pipelineInfo, setPipelineInfo] = useState<any>(null);
  const [statusOptions, setStatusOptions] = useState<SelectOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch pipeline info
  useEffect(() => {
    if (!pipelineId) return;
    const fetchPipeline = async () => {
      setIsLoading(true);
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const res = await fetch(`${apiBase}/call-log/pagination`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            page_number: "1",
            page_size: "10",
            search_type: "call_log_id",
            query_search: pipelineId,
          }),
        });
        if (!res.ok) throw new Error("Failed to fetch pipeline info");
        const data = await res.json();
        let logArr = [];
        if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0].data)) {
          logArr = data[0].data;
        } else if (Array.isArray(data?.data)) {
          logArr = data.data;
        } else if (Array.isArray(data?.results)) {
          logArr = data.results;
        }
        if (logArr.length > 0) {
          const log = logArr[0];
          setPipelineInfo({
            pipelineId: log.call_log_id || "",
            leadId: log.lead_id || "",
            leadName: log.lead_name || "",
            propertyName: log.property_profile_name || "",
            propertyProfileId: log.property_profile_id || "",
            propertyPrice: log.property_profile_price || undefined,
            callerName: log.created_by_name || "",
            callerPhone: log.created_by_phone || "",
            leadPhone: log.lead_phone || "",
            callerId: log.current_staff_id || "",
            purpose: log.purpose || "Site visit scheduled."
          });
        }
      } catch {
        setPipelineInfo(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPipeline();
  }, [pipelineId]);

  // Fetch status options
  useEffect(() => {
    const fetchStatus = async () => {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      try {
        const response = await fetch(`${apiBase}/contact-result/pagination`, {
          method: "POST",
          headers,
          body: JSON.stringify({ 
            page_number: "1", 
            page_size: "100",
            menu_id: "MU_02",
            search_type: "",
            query_search: ""
          })
        });
        const data = await response.json();
        const apiResult = data[0];
        if (apiResult && apiResult.data) {
          setStatusOptions(apiResult.data.map((result: { contact_result_id: number, contact_result_name: string }) => ({ 
            value: result.contact_result_id.toString(), 
            label: result.contact_result_name 
          })));
        }
      } catch {
        setStatusOptions([]);
      }
    };
    fetchStatus();
  }, []);

  const handleChange = (field: keyof typeof formData, value: string | SelectOption | null | boolean | Date) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors: SiteVisitFormErrors = {};
    if (!formData.visitDate) newErrors.visitDate = "Visit date is required.";
    if (!formData.visitStartTime) newErrors.visitStartTime = "Start time is required.";
    if (!formData.contactResult) newErrors.contactResult = "Contact result is required.";
    if (!formData.notes.trim()) newErrors.notes = "Notes/Remarks are required.";
    if (formData.visitStartTime && formData.visitEndTime) {
      const startTime = new Date(`2000-01-01T${formData.visitStartTime}`);
      const endTime = new Date(`2000-01-01T${formData.visitEndTime}`);
      if (endTime <= startTime) {
        newErrors.visitEndTime = "End time must be after start time.";
      }
    }
    if (formData.is_follow_up && !formData.follow_up_date) {
      newErrors.follow_up_date = "Follow-up date is required if follow-up is needed.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      visitDate: "",
      visitStartTime: "",
      visitEndTime: "",
      contactResult: null,
      purpose: "",
      notes: "",
      is_follow_up: false,
      follow_up_date: null,
    });
    setPhotos([]);
    setErrors({});
  };

  // Upload single photo function for site visit
  const uploadSiteVisitPhotoToStorage = async (photoFile: File, siteVisitId: string): Promise<string> => {
    const photoFormData = new FormData();
    photoFormData.append('photo', photoFile);
    photoFormData.append('menu', 'site_visit');
    photoFormData.append('photoId', String(siteVisitId));
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const uploadResponse = await fetch(`${apiBase}/files/upload-one-photo`, {
      method: 'POST',
      headers,
      body: photoFormData,
    });
    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json().catch(() => ({}));
      throw new Error(errorData.message || `Photo upload failed with status ${uploadResponse.status}`);
    }
    const uploadData = await uploadResponse.json();
    return uploadData.photoUrl || uploadData.url || '';
  };

  const handleSave = async () => {
    if (!validate() || !pipelineInfo) return;
    try {
      setIsSubmitting(true);
      // Upload photos first
      const photoUrls: string[] = [];
      if (photos.length > 0) {
        try {
          const tempSiteVisitId = `SV-${Date.now()}`;
          for (const photoFile of photos) {
            if (photoFile.file) {
              const uploadedUrl = await uploadSiteVisitPhotoToStorage(photoFile.file, tempSiteVisitId);
              photoUrls.push(uploadedUrl);
            }
          }
        } catch (error: any) {
          alert(`Error uploading photos: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
          setIsSubmitting(false);
          return;
        }
      }
      // Format datetime strings for API
      const startDatetime = `${formData.visitDate} ${formData.visitStartTime}:00`;
      const endDatetime = formData.visitEndTime
        ? `${formData.visitDate} ${formData.visitEndTime}:00`
        : "";
      // Prepare API request body
      const apiRequestBody = {
        call_id: pipelineInfo.pipelineId,
        property_profile_id: String(pipelineInfo.propertyProfileId),
        staff_id: String(pipelineInfo.callerId || "000001"),
        lead_id: pipelineInfo.leadId,
        contact_result_id: formData.contactResult?.value || "1",
        purpose: pipelineInfo.purpose || "Site visit scheduled.",
        start_datetime: startDatetime,
        end_datetime: endDatetime,
        photo_url: photoUrls,
        remark: formData.notes
      };
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const response = await fetch(`${apiBase}/site-visit/create`, {
        method: "POST",
        headers,
        body: JSON.stringify(apiRequestBody),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API request failed with status ${response.status}`);
      }
      // After successful site visit creation, update call log follow-up info
      if (formData.is_follow_up) {
        const getCurrentCallLogResponse = await fetch(`${apiBase}/call-log/pagination`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            page_number: "1",
            page_size: "10",
            search_type: "call_log_id",
            query_search: pipelineInfo.pipelineId,
          }),
        });
        if (getCurrentCallLogResponse.ok) {
          const currentCallLogData = await getCurrentCallLogResponse.json();
          if (Array.isArray(currentCallLogData) && currentCallLogData.length > 0 && currentCallLogData[0].data && Array.isArray(currentCallLogData[0].data) && currentCallLogData[0].data.length > 0) {
            const currentLog = currentCallLogData[0].data[0];
            const callLogUpdateRequestBody = {
              call_log_id: pipelineInfo.pipelineId,
              lead_id: currentLog.lead_id,
              property_profile_id: String(currentLog.property_profile_id),
              status_id: String(currentLog.status_id || "1"),
              purpose: currentLog.purpose || "Call pipeline management",
              fail_reason: currentLog.fail_reason || null,
              follow_up_date: formData.follow_up_date
                ? `${formData.follow_up_date.getFullYear()}-${String(formData.follow_up_date.getMonth() + 1).padStart(2, '0')}-${String(formData.follow_up_date.getDate()).padStart(2, '0')}`
                : null,
              is_follow_up: formData.is_follow_up,
              is_active: currentLog.is_active !== undefined ? currentLog.is_active : true,
              updated_by: "1"
            };
            await fetch(`${apiBase}/call-log/update-info`, {
              method: "PUT",
              headers,
              body: JSON.stringify(callLogUpdateRequestBody),
            });
          }
        }
      }
      setShowSuccessModal(true);
      resetForm();
    } catch (error: any) {
      alert(`Failed to save quick site visit: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessOk = () => {
    setShowSuccessModal(false);
    if (typeof window !== 'undefined') {
      window.location.replace('/callpipeline');
    } else if (router && typeof router.replace === 'function') {
      router.replace('/callpipeline');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Quick Site Visit</h2>
      {isLoading || !pipelineInfo ? (
        <div className="text-center py-8 text-gray-500">Loading pipeline information...</div>
      ) : (
        <form className="space-y-6" onSubmit={e => { e.preventDefault(); handleSave(); }}>
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-4">
            <div>
              <DatePicker
                id="quick-site-visit-date-picker"
                label="Visit Date *"
                placeholder="Select visit date"
                defaultDate={formData.visitDate}
                onChange={(selectedDates) => {
                  if (selectedDates && selectedDates.length > 0) {
                    const dateStr = selectedDates[0].toISOString().split('T')[0];
                    handleChange('visitDate', dateStr);
                  }
                }}
              />
              {errors.visitDate && <p className="text-sm text-red-500 mt-1">{errors.visitDate}</p>}
            </div>
            <div>
              <Label htmlFor="quickSiteVisitStartTime">Start Time *</Label>
              <div className="relative">
                <InputField
                  type="time"
                  id="quickSiteVisitStartTime"
                  value={formData.visitStartTime}
                  onChange={(e) => handleChange('visitStartTime', e.target.value)}
                  error={!!errors.visitStartTime}
                />
                <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                  <TimeIcon />
                </span>
              </div>
              {errors.visitStartTime && <p className="text-sm text-red-500 mt-1">{errors.visitStartTime}</p>}
            </div>
            <div>
              <Label htmlFor="quickSiteVisitEndTime">End Time</Label>
              <div className="relative">
                <InputField
                  type="time"
                  id="quickSiteVisitEndTime"
                  value={formData.visitEndTime}
                  onChange={(e) => handleChange('visitEndTime', e.target.value)}
                  error={!!errors.visitEndTime}
                />
                <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                  <TimeIcon />
                </span>
              </div>
              {errors.visitEndTime && <p className="text-sm text-red-500 mt-1">{errors.visitEndTime}</p>}
            </div>
            <div>
              <Label htmlFor="quickSiteVisitContactResult">Site Visit Result *</Label>
              <Select
                options={statusOptions}
                value={formData.contactResult}
                onChange={(option) => handleChange('contactResult', option)}
                placeholder="Select contact result"
              />
              {errors.contactResult && <p className="text-sm text-red-500 mt-1">{errors.contactResult}</p>}
            </div>
            <div>
              <Label htmlFor="quickSiteVisitFollowUpToggle">Follow-up Required</Label>
              <div className="flex items-center">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="quickSiteVisitFollowUpToggle"
                    checked={formData.is_follow_up}
                    onChange={(e) => handleChange('is_follow_up', e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out ${
                    formData.is_follow_up ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'
                  }`}>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${
                      formData.is_follow_up ? 'transform translate-x-5' : ''
                    }`}></div>
                  </div>
                </label>
              </div>
              {errors.is_follow_up && <p className="text-sm text-red-500 mt-1">{errors.is_follow_up}</p>}
            </div>
            {formData.is_follow_up && (
              <div>
                <DatePicker
                  id="quick-site-visit-follow-up-date-picker"
                  label="Follow-up Date *"
                  placeholder="Select follow-up date"
                  defaultDate={formData.follow_up_date || undefined}
                  onChange={(selectedDates) => {
                    if (selectedDates && selectedDates.length > 0) {
                      handleChange('follow_up_date', selectedDates[0]);
                    }
                  }}
                />
                {errors.follow_up_date && <p className="text-sm text-red-500 mt-1">{errors.follow_up_date}</p>}
              </div>
            )}
            <div>
              <Label htmlFor="quickSiteVisitNotes">Notes/Remarks *</Label>
              <TextArea
                value={formData.notes}
                onChange={(value) => handleChange('notes', value)}
                placeholder="Enter notes or remarks about the site visit"
                rows={4}
                error={!!errors.notes}
              />
              {errors.notes && <p className="text-sm text-red-500 mt-1">{errors.notes}</p>}
            </div>
            <div>
              <Label>Photos</Label>
              <PhotoUpload photos={photos} onPhotosChange={setPhotos} />
              <p className="text-xs text-gray-500 mt-1">Upload up to 10 photos (5MB each)</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                router.replace("/callpipeline");
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Site Visit"}
            </Button>
          </div>
        </form>
      )}
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-800">Success!</h3>
            <p className="mb-6 text-sm text-gray-500">The action was completed successfully. Click OK to refresh and see the latest info.</p>
            <Button variant="primary" onClick={handleSuccessOk} className="w-full">OK</Button>
          </div>
        </div>
      )}
    </div>
  );
}
