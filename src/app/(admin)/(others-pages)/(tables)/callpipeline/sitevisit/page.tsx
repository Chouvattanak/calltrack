"use client";
import React, { useState, useEffect, useCallback } from "react";
// Types for API call log (reuse from quickcall page)
interface ApiCallLog {
  call_log_id: string;
  call_date: string;
  contact_type_id: number;
  contact_value: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
  caller_name: string;
  lead_name: string;
  primary_contact_number: string;
  created_by_name: string;
  call_log_details: any[];
}
import { useRouter, useSearchParams } from "next/navigation";

// Components
import LoadingOverlay from "@/components/ui/loading/LoadingOverlay";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import DatePicker from "@/components/form/date-picker";
import TextArea from "@/components/form/input/TextArea";
import InputField from "@/components/form/input/InputField";
import PhotoUpload, { PhotoFile } from "@/components/form/PhotoUpload";
import { Modal } from "@/components/ui/modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Icons  
import { TimeIcon } from "@/icons";
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon, 
  EllipsisHorizontalIcon 
} from "@heroicons/react/24/outline";

// Utils and Helpers
import { getApiBase, getApiHeaders } from "@/lib/apiHelpers";

// Types and Interfaces
interface SelectOption {
  value: string;
  label: string;
}

interface PipelineInfo {
  pipelineId: string;
  pipelineName: string;
  leadId: string;
  leadName: string;
  leadCompany: string;
  propertyName: string;
  propertyLocation: string;
  propertyProfileId: string;
  callerName: string;
  callerPhone: string;
  callerId: string;
}

interface SiteVisitEntry {
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

interface SiteVisitFormData {
  visitDate: Date;
  visitStartTime: string;
  visitEndTime: string;
  contactResult: SelectOption | null;
  purpose: string;
  notes: string;
  isFollowUp: boolean;
  followUpDate: Date | null;
}

interface SiteVisitPaginationResponse {
  message: string;
  error: null | string;
  status_code: number;
  total_row: number;
  data: SiteVisitEntry[];
}

// Constants
const CONTACT_RESULT_STYLES = {
  'Completed': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
  'No Answer': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
  'Voicemail': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
  'Busy': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
  'Failed': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
  'Interest': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
  'Callback': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
  'Schedule Site Visit': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300',
  'Cancelled': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
} as const;

const DEFAULT_FORM_DATA: SiteVisitFormData = {
  visitDate: new Date(),
  visitStartTime: '',
  visitEndTime: '',
  contactResult: null,
  purpose: '',
  notes: '',
  isFollowUp: false,
  followUpDate: null,
};

// Utility Functions
const formatDate = (dateString: string): string => {
  if (!dateString || dateString === 'N/A') return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  } catch {
    return 'N/A';
  }
};

const formatTime = (timeString: string): string => {
  if (!timeString || timeString === 'N/A') return 'N/A';
  try {
    if (timeString.includes(':') && !timeString.includes('T')) {
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes), 0);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    if (timeString.includes('T')) {
      const date = new Date(timeString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    return timeString;
  } catch {
    return 'N/A';
  }
};

const formatDuration = (minutes: number): string => {
  if (!minutes || minutes === 0) return '0 min';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins} min`;
};

const formatPhoneNumber = (phone: string): string => {
  if (!phone || phone === 'N/A') return 'N/A';
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 0) return 'N/A';
  
  // Handle different phone number formats
  if (cleaned.startsWith('855')) {
    // Already has country code 855
    const localNumber = cleaned.substring(3);
    if (localNumber.length >= 8) {
      // Format: (+855) XXX-XXX-XXXX
      return `(+855) ${localNumber.slice(0, 3)}-${localNumber.slice(3, 6)}-${localNumber.slice(6)}`;
    }
  } else if (cleaned.length >= 8 && cleaned.length <= 9) {
    // Local Cambodian number without country code
    // Add country code and format: (+855) XXX-XXX-XXXX
    return `(+855) ${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length >= 10) {
    // International number with different country code
    const countryCode = cleaned.slice(0, cleaned.length - 9);
    const localNumber = cleaned.slice(cleaned.length - 9);
    return `(+${countryCode}) ${localNumber.slice(0, 3)}-${localNumber.slice(3, 6)}-${localNumber.slice(6)}`;
  }
  
  // If we can't format it properly, return original
  return phone;
};

const getContactResultStyle = (resultName: string): string => {
  return CONTACT_RESULT_STYLES[resultName as keyof typeof CONTACT_RESULT_STYLES] || 
         'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
};

const validateFormData = (data: SiteVisitFormData): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  if (!data.visitDate) errors.visitDate = 'Visit date is required';
  if (!data.visitStartTime) errors.visitStartTime = 'Start time is required';
  if (!data.contactResult) errors.contactResult = 'Contact result is required';
  if (!data.notes.trim()) errors.notes = 'Notes are required';
  
  if (data.visitStartTime && data.visitEndTime) {
    const startTime = new Date(`2000-01-01T${data.visitStartTime}`);
    const endTime = new Date(`2000-01-01T${data.visitEndTime}`);
    if (endTime <= startTime) {
      errors.visitEndTime = 'End time must be after start time';
    }
  }
  
  if (data.isFollowUp && !data.followUpDate) {
    errors.followUpDate = 'Follow-up date is required';
  }
  
  return errors;
};

// Utility function to count valid photo URLs
const getValidPhotoCount = (photoUrls: string[] | null | undefined): number => {
  if (!photoUrls || !Array.isArray(photoUrls)) return 0;
  return photoUrls.filter((url: string) => url && url.trim() !== '').length;
};

// Utility function to filter valid photo URLs
const getValidPhotoUrls = (photoUrls: string[] | null | undefined): string[] => {
  if (!photoUrls || !Array.isArray(photoUrls)) return [];
  return photoUrls.filter((url: string) => url && url.trim() !== '');
};

export default function SiteVisitPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pipelineId = searchParams.get('pipelineId') || '';

  // State for current call log info (API-driven only)
  const [currentCallLog, setCurrentCallLog] = useState<ApiCallLog | null>(null);
  const [isLoadingCallLog, setIsLoadingCallLog] = useState(false);

  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Call Pipeline", href: "/callpipeline" },
    { name: "Site Visit Management" },
  ];

  // State Management
  const [pipelineInfo, setPipelineInfo] = useState<PipelineInfo | null>(null);
  const [isLoadingPipeline, setIsLoadingPipeline] = useState(true);
  const [siteVisitHistory, setSiteVisitHistory] = useState<SiteVisitEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  // Extend SelectOption to include contact_result_description for robust status mapping
  type StatusOption = SelectOption & { contact_result_description?: string };
  type ContactResultApiItem = {
    contact_result_id?: number;
    id?: number;
    contact_result_name?: string;
    name?: string;
    contact_result_description?: string;
  };
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([]);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  // Statistics State
  const [totalItems, setTotalItems] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  // Fetch call log info for cards (like quickcall page)
  useEffect(() => {
    if (!pipelineId) return;
    setIsLoadingCallLog(true);
    fetch(`${getApiBase()}/call-log/pagination`, {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({
        page_number: "1",
        page_size: "1",
        search_type: "call_log_id",
        query_search: pipelineId,
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0 && data[0].data && data[0].data.length > 0) {
          setCurrentCallLog(data[0].data[0]);
        } else {
          setCurrentCallLog(null);
        }
      })
      .catch(() => setCurrentCallLog(null))
      .finally(() => setIsLoadingCallLog(false));
  }, [pipelineId]);

  // Form State
  const [formData, setFormData] = useState<SiteVisitFormData>(DEFAULT_FORM_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Form State
  const [editFormData, setEditFormData] = useState<SiteVisitFormData>(DEFAULT_FORM_DATA);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [editPhotos, setEditPhotos] = useState<PhotoFile[]>([]);
  const [isEditingSubmitting, setIsEditingSubmitting] = useState(false);
  const [editingVisit, setEditingVisit] = useState<SiteVisitEntry | null>(null);

  // Modal State
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Load status options from API
  const loadStatusOptions = useCallback(async () => {
    try {
      setIsLoadingStatus(true);

      const response = await fetch(`${getApiBase()}/contact-result/pagination`, {
        method: "POST",
        headers: getApiHeaders(),
        body: JSON.stringify({ 
          page_number: "1", 
          page_size: "100",
          menu_id: "MU_03",
          search_type: "MU_03",
          query_search: ""
        })
      });

      if (response.ok) {
        const data = await response.json();
        let options: StatusOption[] = [];

        if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0].data)) {
          options = data[0].data.map((item: ContactResultApiItem) => ({
            value: String(item.contact_result_id || item.id),
            label: String(item.contact_result_name || item.name),
            contact_result_description: item.contact_result_description
          }));
        } else if (Array.isArray(data?.data)) {
          options = data.data.map((item: ContactResultApiItem) => ({
            value: String(item.contact_result_id || item.id),
            label: String(item.contact_result_name || item.name),
            contact_result_description: item.contact_result_description
          }));
        } else if (Array.isArray(data)) {
          options = data.map((item: ContactResultApiItem) => ({
            value: String(item.contact_result_id || item.id),
            label: String(item.contact_result_name || item.name),
            contact_result_description: item.contact_result_description
          }));
        }

        setStatusOptions(options);
      }
    } catch (error) {
      console.error("Error loading status options:", error);
      setStatusOptions([
        { value: "1", label: "No Answer" },
        { value: "2", label: "Busy" },
        { value: "9", label: "Completed" }
      ]);
    } finally {
      setIsLoadingStatus(false);
    }
  }, []);

  // Load pipeline information
  const loadPipelineInfo = useCallback(async () => {
    if (!pipelineId) {
      setIsLoadingPipeline(false);
      return;
    }

    try {
      const body = {
        page_number: "1",
        page_size: "10",
        search_type: "call_log_id",
        query_search: pipelineId,
      };
      
      const res = await fetch(`${getApiBase()}/call-log/pagination`, {
        method: "POST",
        headers: getApiHeaders(),
        body: JSON.stringify(body),
      });
      
      if (!res.ok) throw new Error("Failed to fetch call log data");
      
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
        
        // Debug: Log the call log structure
        console.log("🔍 Call Log Structure:", JSON.stringify(log, null, 2));
        
        // Extract lead phone number from call_log_details > contact_data where channel_type_id is 3
        let leadPhone = 'N/A';
        if (log.call_log_details && Array.isArray(log.call_log_details)) {
          // Look through all call log details to find contact data
          for (const callDetail of log.call_log_details) {
            console.log("📞 Checking call detail:", callDetail.call_log_detail_id);
            if (callDetail.contact_data && Array.isArray(callDetail.contact_data)) {
              for (const contactGroup of callDetail.contact_data) {
                console.log("📱 Checking contact group:", contactGroup);
                if (contactGroup.channel_type_id === 3) {
                  console.log("✅ Found channel_type_id = 3, checking contact_values...");
                  if (contactGroup.contact_values && Array.isArray(contactGroup.contact_values)) {
                    for (const contactValue of contactGroup.contact_values) {
                      console.log("📞 Checking contact_value:", contactValue);
                      if (contactValue.contact_number) {
                        leadPhone = contactValue.contact_number;
                        console.log("✅ Found phone number:", leadPhone);
                        break;
                      }
                    }
                  }
                }
                if (leadPhone !== 'N/A') break;
              }
            }
            if (leadPhone !== 'N/A') break;
          }
        }
        
        console.log("📱 Final extracted phone number:", leadPhone);
        
        setPipelineInfo({
          pipelineId: log.call_log_id || "",
          pipelineName: `${log.lead_name || 'Unknown Lead'} - ${log.property_profile_name || 'Unknown Property'}`,
          leadId: log.lead_id || "",
          leadName: log.lead_name || "Unknown Lead",
          leadCompany: "N/A",
          propertyName: log.property_profile_name || "Unknown Property",
          propertyLocation: "N/A",
          propertyProfileId: log.property_profile_id || "",
          callerName: log.created_by_name || "Unknown Creator",
          callerPhone: leadPhone,
          callerId: log.current_staff_id || ""
        });
      }
    } catch (error) {
      console.error("Error loading pipeline information:", error);
    } finally {
      setIsLoadingPipeline(false);
    }
  }, [pipelineId]);

  // Load site visit history
  const loadSiteVisitHistory = useCallback(async () => {
    if (!pipelineId) {
      setIsLoadingHistory(false);
      return;
    }

    // Load site visit history from API
    console.log("� Loading site visit history for pipeline:", pipelineId);
    console.log("Expected API call:", {
      endpoint: "/site-visit/pagination",
      method: "POST",
      body: {
        page_number: String(currentPage),
        page_size: String(pageSize),
        search_type: "call_log_id",
        query_search: pipelineId,
      }
    });

    try {
      setIsLoadingHistory(true);

      const body = {
        page_number: String(currentPage),
        page_size: String(pageSize),
        search_type: "call_log_id",
        query_search: pipelineId,
      };

      const response = await fetch(`${getApiBase()}/site-visit/pagination`, {
        method: "POST",
        headers: getApiHeaders(),
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("📝 Site Visit API Response:", data);
        
        let visitArr: SiteVisitEntry[] = [];
        let totalCount = 0;
        
        // Handle the expected API response structure: [{ message, status_code, total_row, data }]
        if (Array.isArray(data) && data.length > 0 && data[0].data) {
          visitArr = data[0].data;
          totalCount = data[0].total_row || visitArr.length;
        } else if (Array.isArray(data?.data)) {
          visitArr = data.data;
          totalCount = data.total_row || visitArr.length;
        } else if (Array.isArray(data)) {
          visitArr = data;
          totalCount = visitArr.length;
        }

        // Filter out empty photo URLs for each visit
        visitArr = visitArr.map(visit => ({
          ...visit,
          photo_url: getValidPhotoUrls(visit.photo_url)
        }));

        console.log("📝 Processed Site Visits:", visitArr);
        setSiteVisitHistory(visitArr);
        setTotalItems(totalCount);

        // Calculate statistics
        if (visitArr.length > 0) {
          // Calculate total duration
          let totalDurationMinutes = 0;
          visitArr.forEach(visit => {
            if (visit.start_datetime && visit.end_datetime) {
              const start = new Date(visit.start_datetime);
              const end = new Date(visit.end_datetime);
              const duration = Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
              if (duration > 0) totalDurationMinutes += duration;
            }
          });
          setTotalDuration(totalDurationMinutes);

          // Set last visit lead info
          // (Removed lastVisit, no longer needed)
          console.log("🔍 Setting last visit lead - pipelineInfo:", pipelineInfo);
          console.log("📱 callerPhone from pipelineInfo:", pipelineInfo?.callerPhone);
          // (Removed setLastVisitLead, now using pipelineInfo only)
        } else {
          setTotalDuration(0);
          // (Removed setLastVisitLead, now using pipelineInfo only)
        }
      } else {
        console.error("Failed to fetch site visit data");
        setSiteVisitHistory([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Error loading site visit history:", error);
      setSiteVisitHistory([]);
      setTotalItems(0);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [pipelineId, currentPage, pageSize, pipelineInfo]);

  // Form handlers
  const handleFormChange = (
    field: keyof SiteVisitFormData,
    value: string | SelectOption | null | boolean | Date
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleEditFormChange = (
    field: keyof SiteVisitFormData,
    value: string | SelectOption | null | boolean | Date
  ) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
    if (editErrors[field]) {
      setEditErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const resetForm = () => {
    setFormData(DEFAULT_FORM_DATA);
    setPhotos([]);
    setErrors({});
  };

  const resetEditForm = () => {
    setEditFormData(DEFAULT_FORM_DATA);
    setEditPhotos([]);
    setEditErrors({});
    setEditingVisit(null);
  };

  // Photo upload handler for multiple photos
  const uploadMultiplePhotosToStorage = async (photoFiles: PhotoFile[], siteVisitId: string): Promise<string[]> => {
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
      // For file uploads, we need headers without Content-Type (let browser set it for multipart/form-data)
      const headers = getApiHeaders();
      delete headers["Content-Type"];
      
      const uploadResponse = await fetch(`${getApiBase()}/files/upload-multiple-photos`, {
        method: 'POST',
        headers,
        body: photoFormData,
      });
      
      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        throw new Error(errorData.message || `Photo upload failed with status ${uploadResponse.status}`);
      }
      
      const uploadData = await uploadResponse.json();
      console.log('Multiple photos upload response:', uploadData);
      
      // Extract the imageUrls array from the response
      const imageUrls = uploadData.imageUrls;
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

  // Create site visit
  const handleCreateSubmit = async () => {
    const formErrors = validateFormData(formData);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    if (!pipelineInfo) return;

    try {
      setIsSubmitting(true);
      // Upload photos first if any
      const photoUrls: string[] = [];
      if (photos.length > 0) {
        try {
          const tempSiteVisitId = `SV-${Date.now()}`;
          console.log("Uploading new photos:", photos.length);
          // Upload all photos at once using the multiple photos endpoint
          const uploadedUrls = await uploadMultiplePhotosToStorage(photos, tempSiteVisitId);
          photoUrls.push(...uploadedUrls);
          console.log("Successfully uploaded photos, URLs:", uploadedUrls);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          alert(`Error uploading photos: ${errorMessage}`);
          return;
        }
      }

      const startDatetime = `${formData.visitDate.toISOString().split('T')[0]} ${formData.visitStartTime}:00`;
      const endDatetime = formData.visitEndTime
        ? `${formData.visitDate.toISOString().split('T')[0]} ${formData.visitEndTime}:00`
        : "";

      // Always use contact_result_description for status_id (parent status), matching CallLogsTable.tsx logic
      let statusId = "1";
      if (formData.contactResult && formData.contactResult.value && statusOptions.length > 0) {
        // Find the selected option from statusOptions
        const selected = statusOptions.find(
          (item) => String(item.value) === String(formData.contactResult!.value)
        );
        // Use contact_result_description from the selected option
        if (selected && selected.contact_result_description && selected.contact_result_description.length > 0) {
          statusId = selected.contact_result_description;
        } else {
          statusId = String(formData.contactResult.value);
        }
      }

      const apiRequestBody = {
        call_id: pipelineInfo.pipelineId,
        property_profile_id: String(pipelineInfo.propertyProfileId),
        staff_id: String(pipelineInfo.callerId || "000001"),
        lead_id: pipelineInfo.leadId,
        contact_result_id: formData.contactResult?.value || "1",
        purpose: formData.purpose || "Site visit scheduled.",
        start_datetime: startDatetime,
        end_datetime: endDatetime,
        photo_url: photoUrls,
        remark: formData.notes,
        status_id: statusId // <-- robust mapping for call log update
      };

      // Create site visit
      const response = await fetch(`${getApiBase()}/site-visit/create`, {
        method: "POST",
        headers: getApiHeaders(),
        body: JSON.stringify(apiRequestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API request failed with status ${response.status}`);
      }

      // After successful site visit creation, update call log status if needed
      // Always fetch the current call log to check for status change
      const getCurrentCallLogResponse = await fetch(`${getApiBase()}/call-log/pagination`, {
        method: "POST",
        headers: getApiHeaders(),
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
          const parentStatusId = String(currentLog.status_id);
          if (
            (formData.isFollowUp && formData.followUpDate) ||
            (typeof statusId === 'string' && parentStatusId !== statusId)
          ) {
            // Prepare the call log update request with the expected structure
            const callLogUpdateRequestBody = {
              call_log_id: pipelineInfo.pipelineId,
              lead_id: currentLog.lead_id,
              property_profile_id: String(currentLog.property_profile_id),
              status_id: statusId,
              purpose: currentLog.purpose || "Call pipeline management",
              fail_reason: currentLog.fail_reason || null,
              follow_up_date: formData.followUpDate
                ? `${formData.followUpDate.getFullYear()}-${String(formData.followUpDate.getMonth() + 1).padStart(2, '0')}-${String(formData.followUpDate.getDate()).padStart(2, '0')}`
                : null,
              is_follow_up: formData.isFollowUp,
              is_active: currentLog.is_active !== undefined ? currentLog.is_active : true,
              updated_by: "1"
            };
            console.log('[Quick Site Visit] PUT /call-log/update-info body:', callLogUpdateRequestBody);
            // Log the callLogUpdateRequestBody before calling the API
            console.log('callLogUpdateRequestBody:', callLogUpdateRequestBody);
            await fetch(`${getApiBase()}/call-log/update-info`, {
              method: "PUT",
              headers: getApiHeaders(),
              body: JSON.stringify(callLogUpdateRequestBody),
            });
          }
        }
      }

      setShowQuickModal(false);
      resetForm();
      setShowSuccessModal(true);
      loadSiteVisitHistory();
    } catch (error) {
      alert(`Failed to save site visit: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update site visit 
  const handleEditSubmit = async () => {
    const formErrors = validateFormData(editFormData);
    if (Object.keys(formErrors).length > 0) {
      setEditErrors(formErrors);
      return;
    }

    if (!editingVisit) return;

    try {
      setIsEditingSubmitting(true);

      // Process photos - upload all new photos and preserve existing ones
      const existingPhotos = editingVisit.photo_url || [];
      const newPhotoFiles = editPhotos.filter(photo => photo.file);

      console.log('Existing photos:', existingPhotos);
      console.log('New photo files to upload:', newPhotoFiles.length);

      const photoUrls = [...existingPhotos];

      // Upload new photos if any
      if (newPhotoFiles.length > 0) {
        console.log("Uploading new photos:", newPhotoFiles.length);
        try {
          // Upload all new photos at once using the multiple photos endpoint
          const uploadedUrls = await uploadMultiplePhotosToStorage(newPhotoFiles, editingVisit.site_visit_id);
          photoUrls.push(...uploadedUrls);
          console.log("Successfully uploaded photos, URLs:", uploadedUrls);
          console.log('Final photo URLs array:', photoUrls);
        } catch (uploadError) {
          console.error("Error uploading photos:", uploadError);
          alert("Error uploading photos. Please try again.");
          setIsEditingSubmitting(false);
          return;
        }
      }

      const startDatetime = `${editFormData.visitDate.toISOString().split('T')[0]} ${editFormData.visitStartTime}:00`;
      const endDatetime = editFormData.visitEndTime
        ? `${editFormData.visitDate.toISOString().split('T')[0]} ${editFormData.visitEndTime}:00`
        : "";

      // Robust mapping: get contact_result_description for status_id (parent status) from selected contactResult
      let statusId = "1";
      if (editFormData.contactResult && editFormData.contactResult.value && statusOptions.length > 0) {
        const selected = statusOptions.find(
          (item) => String(item.value) === String(editFormData.contactResult!.value)
        );
        if (selected && selected.contact_result_description && selected.contact_result_description.length > 0) {
          statusId = selected.contact_result_description;
        } else {
          statusId = String(editFormData.contactResult.value);
        }
      }

      const apiRequestBody = {
        site_visit_id: editingVisit.site_visit_id,
        call_id: editingVisit.call_id,
        property_profile_id: String(editingVisit.property_profile_id),
        staff_id: String(editingVisit.staff_id),
        lead_id: editingVisit.lead_id,
        contact_result_id: editFormData.contactResult?.value || "1",
        purpose: editFormData.purpose || "Site visit updated.",
        start_datetime: startDatetime,
        end_datetime: endDatetime,
        photo_url: photoUrls, // Use the combined photo URLs (existing + new uploads)
        remark: editFormData.notes,
        is_active: editingVisit.is_active,
        status_id: statusId // <-- robust mapping for parent status
      };

      // Log the request body before calling the API
      console.log('[SiteVisit Edit] PUT /site-visit/update body:', apiRequestBody);
      const response = await fetch(`${getApiBase()}/site-visit/update`, {
        method: "PUT",
        headers: getApiHeaders(),
        body: JSON.stringify(apiRequestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API request failed with status ${response.status}`);
      }

      // After successful site visit update, update call log status if needed (mirror handleCreateSubmit)
      // Always fetch the current call log to check for status change
      const getCurrentCallLogResponse = await fetch(`${getApiBase()}/call-log/pagination`, {
        method: "POST",
        headers: getApiHeaders(),
        body: JSON.stringify({
          page_number: "1",
          page_size: "10",
          search_type: "call_log_id",
          query_search: editingVisit.call_id,
        }),
      });
      if (getCurrentCallLogResponse.ok) {
        const currentCallLogData = await getCurrentCallLogResponse.json();
        if (Array.isArray(currentCallLogData) && currentCallLogData.length > 0 && currentCallLogData[0].data && Array.isArray(currentCallLogData[0].data) && currentCallLogData[0].data.length > 0) {
          const currentLog = currentCallLogData[0].data[0];
          const parentStatusId = String(currentLog.status_id);
          // If follow up or status changed, update call log
          if (
            (editFormData.isFollowUp && editFormData.followUpDate) ||
            (typeof statusId === 'string' && parentStatusId !== statusId)
          ) {
            const callLogUpdateRequestBody = {
              call_log_id: editingVisit.call_id,
              lead_id: currentLog.lead_id,
              property_profile_id: String(currentLog.property_profile_id),
              status_id: statusId,
              purpose: currentLog.purpose || "Call pipeline management",
              fail_reason: currentLog.fail_reason || null,
              follow_up_date: editFormData.followUpDate
                ? `${editFormData.followUpDate.getFullYear()}-${String(editFormData.followUpDate.getMonth() + 1).padStart(2, '0')}-${String(editFormData.followUpDate.getDate()).padStart(2, '0')}`
                : null,
              is_follow_up: editFormData.isFollowUp,
              is_active: currentLog.is_active !== undefined ? currentLog.is_active : true,
              updated_by: "1"
            };
            console.log('[SiteVisit Edit] PUT /call-log/update-info body:', callLogUpdateRequestBody);
            await fetch(`${getApiBase()}/call-log/update-info`, {
              method: "PUT",
              headers: getApiHeaders(),
              body: JSON.stringify(callLogUpdateRequestBody),
            });
          }
        }
      }

      setShowEditModal(false);
      resetEditForm();
      setShowSuccessModal(true);
      loadSiteVisitHistory();
    } catch (error) {
      alert(`Failed to update site visit: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsEditingSubmitting(false);
    }
  };

  // Action handlers
  const handleViewVisit = (visit: SiteVisitEntry) => {
    // Navigate to the dedicated view page instead of opening a modal
    router.push(`/callpipeline/sitevisit/view?pipelineId=${pipelineId}&siteVisitId=${visit.site_visit_id}`);
  };

  const handleEditVisit = (visit: SiteVisitEntry) => {
    setEditingVisit(visit);
    
    // Parse visit date and times from start_datetime
    const startDate = new Date(visit.start_datetime);
    const endDate = visit.end_datetime ? new Date(visit.end_datetime) : null;
    
    const visitDate = startDate;
    const startTime = startDate.toTimeString().slice(0, 5); // HH:MM
    const endTime = endDate ? endDate.toTimeString().slice(0, 5) : '';

    // Find matching status option
    const statusOption = statusOptions.find(opt => opt.value === String(visit.contact_result_id));

    setEditFormData({
      visitDate: visitDate,
      visitStartTime: startTime,
      visitEndTime: endTime,
      contactResult: statusOption || null,
      purpose: visit.purpose,
      notes: visit.remark,
      isFollowUp: false,
      followUpDate: null,
    });
    
    setShowEditModal(true);
  };

  const handleDeleteVisit = async (visit: SiteVisitEntry) => {
    const confirmed = confirm(`Are you sure you want to delete site visit ${visit.site_visit_id}?\n\nThis action cannot be undone.`);
    if (!confirmed) return;

    try {
      // TODO: Implement delete API call when available
      alert(`Delete functionality for site visit ${visit.site_visit_id} will be implemented soon.`);
    } catch (error) {
      alert(`Failed to delete site visit: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Effect hooks
  useEffect(() => {
    loadStatusOptions();
  }, [loadStatusOptions]);

  useEffect(() => {
    loadPipelineInfo();
  }, [loadPipelineInfo]);

  useEffect(() => {
    if (statusOptions.length > 0 && pipelineInfo) {
      loadSiteVisitHistory();
    }
  }, [loadSiteVisitHistory, statusOptions, pipelineInfo]);

  // (Removed lastVisitLead update effect, now using pipelineInfo only)

  // Calculate pagination
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, siteVisitHistory.length);
  const currentHistory = siteVisitHistory;

  // Pagination component
  const Pagination = ({ currentPage, totalPages, onPageChange }: { currentPage: number, totalPages: number, onPageChange: (page: number) => void }) => {
    const getPageNumbers = () => {
      const pages = [];
      const pageLimit = 2;
      
      if (totalPages <= 1) return [];

      pages.push(1);

      if (currentPage > pageLimit + 1) {
        pages.push('...');
      }

      const startPage = Math.max(2, currentPage - pageLimit);
      const endPage = Math.min(totalPages - 1, currentPage + pageLimit);

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - pageLimit - 1) {
        pages.push('...');
      }

      if (totalPages > 1) {
        pages.push(totalPages);
      }
      
      return [...new Set(pages)];
    };

    return (
      <nav className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        {getPageNumbers().map((page, index) =>
          typeof page === 'number' ? (
            <Button 
              key={index} 
              variant={currentPage === page ? 'primary' : 'outline'} 
              size="sm" 
              onClick={() => onPageChange(page)} 
              className="w-9"
            >
              {page}
            </Button>
          ) : (
            <span key={index} className="px-2 py-1 text-sm text-gray-500">...</span>
          )
        )}
        <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </nav>
    );
  };

  // Loading or error states
  if (isLoadingPipeline) {
    return (
      <div>
        <PageBreadcrumb crumbs={breadcrumbs} />
        <LoadingOverlay isLoading={true} />
      </div>
    );
  }

  if (!pipelineId) {
    router.push("/callpipeline");
    return null;
  }

  if (!pipelineInfo) {
    return (
      <div>
        <PageBreadcrumb crumbs={breadcrumbs} />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">Pipeline not found.</p>
            <Button variant="outline" onClick={() => router.push("/callpipeline")}>
              Back to Call Pipeline
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
        {/* Quick Site Visit Management */}
        <ComponentCard title="Quick Site Visit Management">
          <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary bg-opacity-10">
                  <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-black dark:text-white">
                    Site Visit Entry
                  </h3>
                  <p className="text-xs text-body dark:text-bodydark">
                    Schedule or log a site visit for this pipeline
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setShowQuickModal(true)}
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Site Visit
              </Button>
            </div>
          </div>
        </ComponentCard>

        {/* Quick Site Visit Modal */}
        <Modal 
          isOpen={showQuickModal} 
          onClose={() => {
            setShowQuickModal(false);
            resetForm();
          }}
          className="max-w-4xl p-6"
        >
          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white">
              📍 Quick Site Visit
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              {pipelineInfo ? `Schedule a site visit for Pipeline #${pipelineInfo.pipelineId}` : 'Schedule a new site visit'}
            </p>
          </div>
          
          {isLoadingPipeline ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto mb-4"></div>
                <p className="text-gray-500 dark:text-gray-400">Loading pipeline information...</p>
              </div>
            </div>
          ) : pipelineInfo ? (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 mb-6">
                <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-3 dark:border-gray-700 dark:from-blue-900/20 dark:to-indigo-900/20">
                  <div className="space-y-1">
                    <h3 className="text-xs font-semibold text-gray-900 dark:text-white">Pipeline</h3>
                    <p className="text-sm font-bold text-blue-800 dark:text-blue-200">#{pipelineInfo.pipelineId}</p>
                  </div>
                </div>
                <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-gradient-to-br from-green-50 to-emerald-50 p-3 dark:border-gray-700 dark:from-green-900/20 dark:to-emerald-900/20">
                  <div className="space-y-1">
                    <h3 className="text-xs font-semibold text-gray-900 dark:text-white">Lead</h3>
                    <p className="text-sm font-bold text-green-800 dark:text-green-200">{pipelineInfo.leadName}</p>
                  </div>
                </div>
                <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-gradient-to-br from-purple-50 to-pink-50 p-3 dark:border-gray-700 dark:from-purple-900/20 dark:to-pink-900/20">
                  <div className="space-y-1">
                    <h3 className="text-xs font-semibold text-gray-900 dark:text-white">Property</h3>
                    <p className="text-sm font-bold text-purple-800 dark:text-purple-200">{pipelineInfo.propertyName}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-4">
                  <div>
                    <DatePicker
                      id="quick-site-visit-date-picker"
                      label="Visit Date *"
                      placeholder="Select visit date"
                      defaultDate={formData.visitDate}
                      onChange={(selectedDates) => {
                        if (selectedDates && selectedDates.length > 0) {
                          handleFormChange('visitDate', selectedDates[0]);
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
                        onChange={(e) => handleFormChange('visitStartTime', e.target.value)}
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
                        onChange={(e) => handleFormChange('visitEndTime', e.target.value)}
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
                      placeholder={isLoadingStatus ? "Loading..." : "Select status"}
                      options={statusOptions}
                      value={formData.contactResult}
                      onChange={(option) => handleFormChange('contactResult', option)}
                    />
                    {errors.contactResult && <p className="text-sm text-red-500 mt-1">{errors.contactResult}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="quickSiteVisitPurpose">Purpose</Label>
                  <InputField
                    id="quickSiteVisitPurpose"
                    value={formData.purpose}
                    onChange={(e) => handleFormChange('purpose', e.target.value)}
                    placeholder="Enter visit purpose"
                  />
                </div>

                <div>
                  <Label htmlFor="quickSiteVisitFollowUpToggle">Follow-up Required</Label>
                  <div className="flex items-center">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        id="quickSiteVisitFollowUpToggle"
                        checked={formData.isFollowUp}
                        onChange={(e) => handleFormChange('isFollowUp', e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out ${
                        formData.isFollowUp ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'
                      }`}>
                        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${
                          formData.isFollowUp ? 'transform translate-x-5' : ''
                        }`}></div>
                      </div>
                    </label>
                  </div>
                  {errors.isFollowUp && <p className="text-sm text-red-500 mt-1">{errors.isFollowUp}</p>}
                </div>
                
                {formData.isFollowUp && (
                  <div>
                    <DatePicker
                      id="quick-site-visit-follow-up-date-picker"
                      label="Follow-up Date *"
                      placeholder="Select follow-up date"
                      defaultDate={formData.followUpDate || undefined}
                      onChange={(selectedDates) => {
                        if (selectedDates && selectedDates.length > 0) {
                          handleFormChange('followUpDate', selectedDates[0]);
                        }
                      }}
                    />
                    {errors.followUpDate && <p className="text-sm text-red-500 mt-1">{errors.followUpDate}</p>}
                  </div>
                )}
                
                <div>
                  <Label htmlFor="quickSiteVisitNotes">Notes/Remarks *</Label>
                  <TextArea
                    value={formData.notes}
                    onChange={(value) => handleFormChange('notes', value)}
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
                
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowQuickModal(false);
                      resetForm();
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleCreateSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : "Save Site Visit"}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">Failed to load pipeline information.</p>
            </div>
          )}
        </Modal>

        {/* Site Visit Statistics */}
        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Current Call Log ID Card */}
            <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="flex items-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                  <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <div>
                    <h4 className="text-lg font-bold text-black dark:text-white">
                      {currentCallLog ? currentCallLog.call_log_id : 'N/A'}
                    </h4>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Current Call Log ID
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Number of Site Visits Card */}
            <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="flex items-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                  <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <div>
                    <h4 className="text-lg font-bold text-black dark:text-white">
                      {totalItems}
                    </h4>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Total Site Visits
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sum of Duration Card */}
            <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="flex items-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
                  <svg className="h-5 w-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <div>
                    <h4 className="text-lg font-bold text-black dark:text-white">
                      {formatDuration(totalDuration)}
                    </h4>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Total Duration
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Lead Name and Phone Number Card */}
            <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="flex items-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/20">
                  <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="ml-4 min-w-0 flex-1">
                  <div>
                    <h4 className="text-lg font-bold text-black dark:text-white truncate">
                      {currentCallLog && currentCallLog.primary_contact_number ? formatPhoneNumber(currentCallLog.primary_contact_number) : 'No Primary Contact'}
                    </h4>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate block">
                      {currentCallLog ? currentCallLog.lead_name : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Site Visit History Table */}
        <ComponentCard title="Site Visit History">
          <div className="space-y-4">
            {/* Table Header with Title */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                  All Site Visit Details
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total {totalItems} site visit {totalItems === 1 ? 'entry' : 'entries'} found
                </p>
              </div>
            </div>

            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto mb-4"></div>
                  <p className="text-gray-500 dark:text-gray-400">Loading site visit history...</p>
                </div>
              </div>
            ) : siteVisitHistory.length === 0 ? (
              <div className="py-8 text-center bg-white dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.05]">
                <p className="text-gray-500 dark:text-gray-400">
                  No site visit history found for this pipeline. Add the first site visit entry above.
                </p>
              </div>
            ) : (
              <>
                {/* Table */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                  <div className="max-w-full overflow-x-auto">
                    <div className="min-w-[1000px]">
                      <Table>
                        <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                          <TableRow>
                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">
                              Visit ID
                            </TableCell>
                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                              Visit Date
                            </TableCell>
                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                              Time
                            </TableCell>
                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                              Duration
                            </TableCell>
                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                              Lead Name
                            </TableCell>
                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                              Site Visit Result
                            </TableCell>
                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                              Photos
                            </TableCell>
                            {/* <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                              Lead Phone
                            </TableCell> */}
                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                              Actions
                            </TableCell>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                          {currentHistory.map((visit: SiteVisitEntry) => {
                            // Calculate duration if both start and end times exist
                            let duration = 'N/A';
                            if (visit.start_datetime && visit.end_datetime) {
                              try {
                                const start = new Date(visit.start_datetime);
                                const end = new Date(visit.end_datetime);
                                const diffMinutes = Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
                                if (diffMinutes > 0) {
                                  duration = formatDuration(diffMinutes);
                                }
                              } catch {
                                duration = 'N/A';
                              }
                            }

                            return (
                              <TableRow key={visit.site_visit_id}>
                                {/* Visit ID */}
                                <TableCell className="px-5 py-4 text-center">
                                  <span className="font-mono text-sm text-gray-600 dark:text-gray-300">
                                    {visit.site_visit_id}
                                  </span>
                                </TableCell>
                                
                                {/* Visit Date */}
                                <TableCell className="px-5 py-4">
                                  <div className="font-medium text-gray-800 dark:text-white text-sm">
                                    {formatDate(visit.start_datetime)}
                                  </div>
                                </TableCell>
                                
                                {/* Time */}
                                <TableCell className="px-5 py-4">
                                  <div className="flex flex-col">
                                    <span className="font-medium text-sm text-gray-500 dark:text-gray-400">
                                      {formatTime(visit.start_datetime)} - {formatTime(visit.end_datetime)}
                                    </span>
                                  </div>
                                </TableCell>
                                
                                {/* Duration */}
                                <TableCell className="px-5 py-4">
                                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300">
                                    {duration}
                                  </span>
                                </TableCell>
                                
                                {/* Lead Name */}
                                <TableCell className="px-5 py-4 text-gray-800 text-sm dark:text-gray-300 font-medium">
                                  {visit.lead_name}
                                </TableCell>
                                
                                {/* Contact Result */}
                                <TableCell className="px-5 py-4">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getContactResultStyle(visit.contact_result_name)}`}>
                                    {visit.contact_result_name}
                                  </span>
                                </TableCell>
                                
                                {/* Photos */}
                                <TableCell className="px-5 py-4">
                                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    {getValidPhotoCount(visit.photo_url)}
                                  </div>
                                </TableCell>
                                
                                {/* Lead Phone */}
                                {/* <TableCell className="px-5 py-4 text-gray-800 text-sm dark:text-gray-300 font-medium">
                                  {formatPhoneNumber(pipelineInfo?.callerPhone || 'N/A')}
                                </TableCell> */}
                                
                                {/* Actions */}
                                <TableCell className="px-4 py-3 text-start">
                                  <ActionMenu visitLog={visit} onSelect={(action, visitLog) => {
                                    switch (action) {
                                      case 'view':
                                        handleViewVisit(visitLog);
                                        break;
                                      case 'edit':
                                        handleEditVisit(visitLog);
                                        break;
                                      case 'delete':
                                        handleDeleteVisit(visitLog);
                                        break;
                                    }
                                  }} />
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Showing{" "}
                        <span className="font-medium">{startIndex + 1}</span>
                        {" "}to{" "}
                        <span className="font-medium">
                          {Math.min(endIndex, siteVisitHistory.length)}
                        </span>
                        {" "}of{" "}
                        <span className="font-medium">{siteVisitHistory.length}</span>
                        {" "}entries
                      </span>
                    </div>
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                  </div>
                )}
              </>
            )}
          </div>
        </ComponentCard>

        {/* Success Modal */}
        <Modal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          className="max-w-md p-6"
        >
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Success!
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Site visit has been saved successfully.
                </p>
              </div>
            </div>
            <div className="mt-5">
              <Button
                type="button"
                variant="primary"
                onClick={() => setShowSuccessModal(false)}
                className="w-full"
              >
                Continue
              </Button>
            </div>
          </div>
        </Modal>

        {/* Edit Site Visit Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            resetEditForm();
          }}
          className="max-w-4xl p-6"
        >
          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white">
              ✏️ Edit Site Visit
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              {editingVisit ? `Edit site visit #${editingVisit.site_visit_id}` : 'Edit site visit details'}
            </p>
          </div>
          
          {editingVisit && (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 mb-6">
                <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-3 dark:border-gray-700 dark:from-blue-900/20 dark:to-indigo-900/20">
                  <div className="space-y-1">
                    <h3 className="text-xs font-semibold text-gray-900 dark:text-white">Visit ID</h3>
                    <p className="text-sm font-bold text-blue-800 dark:text-blue-200">#{editingVisit.site_visit_id}</p>
                  </div>
                </div>
                <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-gradient-to-br from-green-50 to-emerald-50 p-3 dark:border-gray-700 dark:from-green-900/20 dark:to-emerald-900/20">
                  <div className="space-y-1">
                    <h3 className="text-xs font-semibold text-gray-900 dark:text-white">Lead</h3>
                    <p className="text-sm font-bold text-green-800 dark:text-green-200">{editingVisit.lead_name}</p>
                  </div>
                </div>
                <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-gradient-to-br from-purple-50 to-pink-50 p-3 dark:border-gray-700 dark:from-purple-900/20 dark:to-pink-900/20">
                  <div className="space-y-1">
                    <h3 className="text-xs font-semibold text-gray-900 dark:text-white">Pipeline</h3>
                    <p className="text-sm font-bold text-purple-800 dark:text-purple-200">#{editingVisit.call_id}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-4">
                  <div>
                    <DatePicker
                      id="edit-site-visit-date-picker"
                      label="Visit Date *"
                      placeholder="Select visit date"
                      defaultDate={editFormData.visitDate}
                      onChange={(selectedDates) => {
                        if (selectedDates && selectedDates.length > 0) {
                          handleEditFormChange('visitDate', selectedDates[0]);
                        }
                      }}
                    />
                    {editErrors.visitDate && <p className="text-sm text-red-500 mt-1">{editErrors.visitDate}</p>}
                  </div>
                  
                  <div>
                    <Label htmlFor="editSiteVisitStartTime">Start Time *</Label>
                    <div className="relative">
                      <InputField
                        type="time"
                        id="editSiteVisitStartTime"
                        value={editFormData.visitStartTime}
                        onChange={(e) => handleEditFormChange('visitStartTime', e.target.value)}
                        error={!!editErrors.visitStartTime}
                      />
                      <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                        <TimeIcon />
                      </span>
                    </div>
                    {editErrors.visitStartTime && <p className="text-sm text-red-500 mt-1">{editErrors.visitStartTime}</p>}
                  </div>
                  
                  <div>
                    <Label htmlFor="editSiteVisitEndTime">End Time</Label>
                    <div className="relative">
                      <InputField
                        type="time"
                        id="editSiteVisitEndTime"
                        value={editFormData.visitEndTime}
                        onChange={(e) => handleEditFormChange('visitEndTime', e.target.value)}
                        error={!!editErrors.visitEndTime}
                      />
                      <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                        <TimeIcon />
                      </span>
                    </div>
                    {editErrors.visitEndTime && <p className="text-sm text-red-500 mt-1">{editErrors.visitEndTime}</p>}
                  </div>
                  
                  <div>
                    <Label htmlFor="editSiteVisitContactResult">Site Visit Result *</Label>
                    <Select
                      placeholder={isLoadingStatus ? "Loading..." : "Select status"}
                      options={statusOptions}
                      value={editFormData.contactResult}
                      onChange={(option) => handleEditFormChange('contactResult', option)}
                    />
                    {editErrors.contactResult && <p className="text-sm text-red-500 mt-1">{editErrors.contactResult}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="editSiteVisitPurpose">Purpose</Label>
                  <InputField
                    id="editSiteVisitPurpose"
                    value={editFormData.purpose}
                    onChange={(e) => handleEditFormChange('purpose', e.target.value)}
                    placeholder="Enter visit purpose"
                  />
                </div>

                <div>
                  <Label htmlFor="editSiteVisitFollowUpToggle">Follow-up Required</Label>
                  <div className="flex items-center">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        id="editSiteVisitFollowUpToggle"
                        checked={editFormData.isFollowUp}
                        onChange={(e) => handleEditFormChange('isFollowUp', e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out ${
                        editFormData.isFollowUp ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'
                      }`}>
                        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${
                          editFormData.isFollowUp ? 'transform translate-x-5' : ''
                        }`}></div>
                      </div>
                    </label>
                  </div>
                  {editErrors.isFollowUp && <p className="text-sm text-red-500 mt-1">{editErrors.isFollowUp}</p>}
                </div>
                
                {editFormData.isFollowUp && (
                  <div>
                    <DatePicker
                      id="edit-site-visit-follow-up-date-picker"
                      label="Follow-up Date *"
                      placeholder="Select follow-up date"
                      defaultDate={editFormData.followUpDate || undefined}
                      onChange={(selectedDates) => {
                        if (selectedDates && selectedDates.length > 0) {
                          handleEditFormChange('followUpDate', selectedDates[0]);
                        }
                      }}
                    />
                    {editErrors.followUpDate && <p className="text-sm text-red-500 mt-1">{editErrors.followUpDate}</p>}
                  </div>
                )}
                
                <div>
                  <Label htmlFor="editSiteVisitNotes">Notes/Remarks *</Label>
                  <TextArea
                    value={editFormData.notes}
                    onChange={(value) => handleEditFormChange('notes', value)}
                    placeholder="Enter notes or remarks about the site visit"
                    rows={4}
                    error={!!editErrors.notes}
                  />
                  {editErrors.notes && <p className="text-sm text-red-500 mt-1">{editErrors.notes}</p>}
                </div>
                
                <div>
                  <Label>Additional Photos</Label>
                  <PhotoUpload photos={editPhotos} onPhotosChange={setEditPhotos} />
                  <p className="text-xs text-gray-500 mt-1">Upload additional photos (existing photos will be preserved)</p>
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowEditModal(false);
                      resetEditForm();
                    }}
                    disabled={isEditingSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleEditSubmit}
                    disabled={isEditingSubmitting}
                  >
                    {isEditingSubmitting ? "Updating..." : "Update Site Visit"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </Modal>
      </div>
    </div>
  );
}

// Action Menu Component for site visit entries
const ActionMenu = ({ visitLog, onSelect }: { 
  visitLog: SiteVisitEntry; 
  onSelect: (action: 'view' | 'edit' | 'delete', visitLog: SiteVisitEntry) => void; 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors"
      >
        <EllipsisHorizontalIcon className="h-5 w-5 text-gray-500" />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-dark-800 border border-gray-200 dark:border-white/[0.05] rounded-lg shadow-lg z-10">
          <ul className="py-1">
            <li>
              <a 
                href="#" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  onSelect('view', visitLog); 
                  setIsOpen(false); 
                }} 
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.05]"
              >
                <EyeIcon className="h-4 w-4"/> 
                View
              </a>
            </li>
            <li>
              <a 
                href="#" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  onSelect('edit', visitLog); 
                  setIsOpen(false); 
                }} 
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.05]"
              >
                <PencilIcon className="h-4 w-4"/> 
                Edit
              </a>
            </li>
            <li><hr className="my-1 border-gray-200 dark:border-white/[0.05]" /></li>
            <li>
              <a 
                href="#" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  onSelect('delete', visitLog); 
                  setIsOpen(false); 
                }} 
                className="flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-white/[0.05]"
              >
                <TrashIcon className="h-4 w-4"/> 
                Delete
              </a>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};
