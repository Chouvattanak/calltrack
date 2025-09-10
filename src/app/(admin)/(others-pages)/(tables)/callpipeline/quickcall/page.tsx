"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";

// Components
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import DatePicker from "@/components/form/date-picker";
import TextArea from "@/components/form/input/TextArea";
import InputField from "@/components/form/input/InputField";
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

// Types and Interfaces
interface SelectOption {
  value: string;
  label: string;
  contact_result_description?: string;
}

interface CallLogDetail {
  call_log_detail_id: string;
  call_date: string;
  call_start_datetime: string;
  call_end_datetime: string;
  total_call_minute: number;
  contact_result_id: number;
  contact_result_name: string;
  lead_contact_id: number;
  contact_number: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
  caller_name: string;
  lead_name: string;
  primary_contact_number: string;
}

interface CallLogPaginationResponse {
  data: ApiCallLog[];
  current_page: number;
  total_pages: number;
  total_items: number;
  page_size: number;
}

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
  call_log_details: ApiCallLogDetail[];
}

interface ApiCallLogDetail {
  call_log_detail_id: string;
  call_date: string;
  call_start_datetime: string;
  call_end_datetime: string;
  total_call_minute: number;
  contact_result_id: number;
  contact_result_name: string;
  lead_contact_id: number;
  created_at: string;
  updated_at: string;
  created_by_name: string;
  contact_data: ContactData[];
}

interface ContactData {
  channel_type_id: number;
  channel_type_name: string;
  menu_id: string;
  contact_values: ContactValue[];
}

interface ContactValue {
  user_name: string;
  contact_number: string;
  remark: string;
  is_primary: boolean;
}

interface ActionMenuProps {
  callLog: CallLogDetail;
  onSelect: (action: 'view' | 'edit' | 'delete', callLog: CallLogDetail) => void;
}

interface FormData {
  callDate: Date;
  callStartTime: string;
  callEndTime: string;
  callStatus: SelectOption | null;
  notes: string;
  isFollowUp: boolean;
  followUpDate: Date | null;
}

// Constants
const CONTACT_RESULT_STYLES = {
  'Completed': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
  'No Answer': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
  'Voicemail': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
  'Busy': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
  'Failed': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
  'Interest': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
} as const;

const DEFAULT_FORM_DATA: FormData = {
  callDate: new Date(),
  callStartTime: '',
  callEndTime: '',
  callStatus: null,
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
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length >= 8) {
    if (cleaned.startsWith('855')) {
      const number = cleaned.substring(3);
      if (number.length >= 8) {
        return `(+855) ${number.slice(0, 3)}-${number.slice(3, 6)}-${number.slice(6)}`;
      }
    } else if (cleaned.length >= 8 && cleaned.length <= 9) {
      return `(+855) ${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length >= 10) {
      return `(+${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
    }
  }
  
  return phone;
};

const getContactResultStyle = (resultName: string): string => {
  return CONTACT_RESULT_STYLES[resultName as keyof typeof CONTACT_RESULT_STYLES] || 
         'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
};

const validateFormData = (data: FormData): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  if (!data.callDate) errors.callDate = 'Call date is required';
  if (!data.callStartTime) errors.callStartTime = 'Start time is required';
  if (!data.callStatus) errors.callStatus = 'Call status is required';
  if (!data.notes.trim()) errors.notes = 'Call notes are required';
  if (data.isFollowUp && !data.followUpDate) {
    errors.followUpDate = 'Follow-up date is required when follow-up is enabled';
  }
  
  return errors;
};

const extractTimeFromDatetime = (datetime?: string | null): string => {
  if (!datetime) return '';
  if (datetime.includes(' ')) {
    const timePart = datetime.split(' ')[1];
    if (timePart && timePart.length >= 5) {
      return timePart.substring(0, 5);
    }
  }
  if (datetime.length >= 5) {
    return datetime.substring(0, 5);
  }
  return '';
};

// Action Menu Component
const ActionMenu: React.FC<ActionMenuProps> = ({ callLog, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAction = (action: 'view' | 'edit' | 'delete') => {
    onSelect(action, callLog);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors"
        aria-label="Actions"
      >
        <EllipsisHorizontalIcon className="h-5 w-5 text-gray-500" />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-dark-800 border border-gray-200 dark:border-white/[0.05] rounded-lg shadow-lg z-10">
          <ul className="py-1">
            <li>
              <button 
                onClick={() => handleAction('view')} 
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.05] w-full text-left"
              >
                <EyeIcon className="h-4 w-4"/> 
                View
              </button>
            </li>
            <li>
              <button 
                onClick={() => handleAction('edit')} 
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.05] w-full text-left"
              >
                <PencilIcon className="h-4 w-4"/> 
                Edit
              </button>
            </li>
            <li><hr className="my-1 border-gray-200 dark:border-white/[0.05]" /></li>
            <li>
              <button 
                onClick={() => handleAction('delete')} 
                className="flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-white/[0.05] w-full text-left"
              >
                <TrashIcon className="h-4 w-4"/> 
                Delete
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

const QuickCallPage: React.FC = () => {
  // URL parameters
  const searchParams = useSearchParams();
  const callLogIdFromUrl = searchParams.get('pipelineId');
  
  // Call history state
  const [callHistory, setCallHistory] = useState<CallLogDetail[]>([]);
  const [currentCallLog, setCurrentCallLog] = useState<ApiCallLog | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  // Modal states
  const [showViewCallModal, setShowViewCallModal] = useState(false);
  const [showAddCallModal, setShowAddCallModal] = useState(false);
  const [showEditCallModal, setShowEditCallModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);
  
  // Current viewing/editing state
  const [viewingCallLog, setViewingCallLog] = useState<CallLogDetail | null>(null);
  const [editingCallLog, setEditingCallLog] = useState<CallLogDetail | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA);
  const [editFormData, setEditFormData] = useState<FormData>(DEFAULT_FORM_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  
  // Dropdown options state
  const [statusOptions, setStatusOptions] = useState<SelectOption[]>([]);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [contactResults, setContactResults] = useState<Record<string, string>>({});

  // Breadcrumb configuration
  const breadcrumbs = [
    { name: 'Call Pipeline', href: '/callpipeline' },
    { name: 'Quick Call', href: '' }
  ];

  // API helper functions
  const getApiHeaders = useCallback(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  }, []);

  const getApiBase = useCallback(() => process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "", []);

  // Form handling functions
  const handleFormChange = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleEditFormChange = (field: string, value: unknown) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
    if (editErrors[field]) {
      setEditErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const resetForm = () => {
    setFormData(DEFAULT_FORM_DATA);
    setErrors({});
  };

  const resetEditForm = () => {
    setEditFormData(DEFAULT_FORM_DATA);
    setEditErrors({});
  };

  // Load status options from API
  const loadStatusOptions = useCallback(async () => {
    setIsLoadingStatus(true);
    try {
      const response = await fetch(`${getApiBase()}/contact-result/pagination`, {
        method: "POST",
        headers: getApiHeaders(),
        body: JSON.stringify({ 
          page_number: "1", 
          page_size: "10",
          menu_id: "MU_02",
          search_type: "",
          query_search: ""
        })
      });

      if (response.ok) {
        const data = await response.json();
        const apiResult = data[0];
        if (apiResult?.data) {
          const options = apiResult.data.map((result: { contact_result_id: number, contact_result_name: string, contact_result_description?: string }) => ({ 
            value: result.contact_result_id.toString(), 
            label: result.contact_result_name,
            contact_result_description: result.contact_result_description || ""
          }));
          setStatusOptions(options);
          
          const resultsMap: Record<string, string> = {};
          apiResult.data.forEach((result: { contact_result_id: number, contact_result_name: string }) => {
            resultsMap[result.contact_result_id.toString()] = result.contact_result_name;
          });
          setContactResults(resultsMap);
        }
      }
    } catch (error) {
      console.error("Error loading status options:", error);
      setStatusOptions([]);
      setContactResults({});
    } finally {
      setIsLoadingStatus(false);
    }
  }, [getApiBase, getApiHeaders]);

  // Load call history using the specified API endpoint
  const loadCallHistory = useCallback(async (page: number = 1) => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch(`${getApiBase()}/call-log/pagination`, {
        method: "POST",
        headers: getApiHeaders(),
        body: JSON.stringify({
          page_number: page.toString(),
          page_size: "10",
          search_type: callLogIdFromUrl ? "call_log_id" : "",
          query_search: callLogIdFromUrl || ""
        }),
      });

      if (response.ok) {
        const data: CallLogPaginationResponse[] = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const paginationData = data[0];
          const allCallDetails: CallLogDetail[] = [];
          
          if (paginationData.data && Array.isArray(paginationData.data)) {
            // Store the first call log for card display
            if (paginationData.data.length > 0) {
              setCurrentCallLog(paginationData.data[0]);
            }
            
            paginationData.data.forEach((callLog: ApiCallLog) => {
              if (callLog.call_log_details && Array.isArray(callLog.call_log_details)) {
                callLog.call_log_details.forEach((detail: ApiCallLogDetail) => {
                  let contactNumber = 'N/A';
                  if (detail.contact_data && Array.isArray(detail.contact_data)) {
                    const phoneData = detail.contact_data.find(cd => cd.channel_type_id === 3);
                    if (phoneData && phoneData.contact_values && phoneData.contact_values.length > 0) {
                      const primaryContact = phoneData.contact_values.find(cv => cv.is_primary) || phoneData.contact_values[0];
                      contactNumber = primaryContact.contact_number;
                    }
                  }

                  const callerName = callLog.created_by_name || callLog.caller_name || 'System User';

                  allCallDetails.push({
                    call_log_detail_id: detail.call_log_detail_id || `detail-${Date.now()}`,
                    call_date: detail.call_date || callLog.call_date || 'N/A',
                    call_start_datetime: detail.call_start_datetime || 'N/A',
                    call_end_datetime: detail.call_end_datetime || 'N/A',
                    total_call_minute: detail.total_call_minute || 0,
                    contact_result_id: detail.contact_result_id || 0,
                    contact_result_name: (contactResults && contactResults[detail.contact_result_id?.toString()])
                      ? contactResults[detail.contact_result_id?.toString()]
                      : (detail.contact_result_name || 'Unknown'),
                    lead_contact_id: detail.lead_contact_id || 0,
                    contact_number: contactNumber,
                    is_primary: callLog.is_primary || false,
                    created_at: detail.created_at || callLog.created_at || 'N/A',
                    updated_at: detail.updated_at || callLog.updated_at || 'N/A',
                    caller_name: callerName,
                    lead_name: callLog.lead_name || 'Unknown Lead',
                    primary_contact_number: callLog.primary_contact_number || 'N/A',
                  });
                });
              }
            });
          }
          
          setCallHistory(allCallDetails);
          setCurrentPage(paginationData.current_page || 1);
          setTotalPages(paginationData.total_pages || 1);
          setTotalItems(paginationData.total_items || allCallDetails.length);
        }
      }
    } catch (error) {
      console.error("Error loading call history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [callLogIdFromUrl, contactResults, getApiBase, getApiHeaders]);

  // Function to fetch and populate full call log detail for editing
  const loadCallLogForEdit = async (callLog: CallLogDetail) => {
    if (Object.keys(contactResults).length === 0) {
      await loadStatusOptions();
    }
    
    setIsLoadingEdit(true);
    try {
      const response = await fetch(`${getApiBase()}/call-log/pagination`, {
        method: "POST",
        headers: getApiHeaders(),
        body: JSON.stringify({
          page_number: "1",
          page_size: "10",
          search_type: "call_log_id",
          query_search: callLogIdFromUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch call log details');
      }

      const responseData = await response.json();
      if (!Array.isArray(responseData) || responseData.length === 0 || 
          !responseData[0].data || !Array.isArray(responseData[0].data) || 
          responseData[0].data.length === 0) {
        throw new Error('No call log found');
      }

      const mainCallLog = responseData[0].data[0];
      let targetDetail = null;
      if (mainCallLog.call_log_details && mainCallLog.call_log_details.length > 0) {
        targetDetail = mainCallLog.call_log_details.find(
          (detail: ApiCallLogDetail) => detail.call_log_detail_id === callLog.call_log_detail_id
        );
      }
      
      if (!targetDetail) {
        throw new Error('Call log detail not found');
      }

      let callDate = new Date();
      if (targetDetail.call_date) {
        callDate = new Date(targetDetail.call_date);
      }

      setEditFormData({
        callDate,
        callStartTime: extractTimeFromDatetime(targetDetail.call_start_datetime),
        callEndTime: extractTimeFromDatetime(targetDetail.call_end_datetime),
        callStatus: statusOptions.find(opt => opt.value === String(targetDetail.contact_result_id)) || null,
        notes: targetDetail.remark || '',
        isFollowUp: mainCallLog.is_follow_up || false,
        followUpDate: mainCallLog.follow_up_date ? new Date(mainCallLog.follow_up_date) : null,
      });
      setEditingCallLog(callLog);
      setShowEditCallModal(true);
    } catch (error) {
      console.error('Error loading call log for edit:', error);
      alert('Failed to load call log for editing.');
    } finally {
      setIsLoadingEdit(false);
    }
  };

  // Handle edit save
  const handleEditSave = async () => {
    if (Object.keys(contactResults).length === 0) {
      await loadStatusOptions();
    }
    
    const validationErrors = validateFormData(editFormData);
    if (Object.keys(validationErrors).length > 0) {
      setEditErrors(validationErrors);
      return;
    }

    if (!editingCallLog || !callLogIdFromUrl) {
      alert('Missing required information for update');
      return;
    }

    setIsSubmitting(true);
    try {
      // Get current call log data to extract contact information
      const getCurrentCallLogResponse = await fetch(`${getApiBase()}/call-log/pagination`, {
        method: "POST",
        headers: getApiHeaders(),
        body: JSON.stringify({
          page_number: "1",
          page_size: "10",
          search_type: "call_log_id",
          query_search: callLogIdFromUrl,
        }),
      });

      if (!getCurrentCallLogResponse.ok) {
        throw new Error('Failed to get current call log data');
      }

      const currentCallLogData = await getCurrentCallLogResponse.json();
      if (!Array.isArray(currentCallLogData) || currentCallLogData.length === 0 || 
          !currentCallLogData[0].data || !Array.isArray(currentCallLogData[0].data) || 
          currentCallLogData[0].data.length === 0) {
        throw new Error('No call log found with the provided ID');
      }

      const currentLog = currentCallLogData[0].data[0];
      let targetDetail = null;
      if (currentLog.call_log_details && currentLog.call_log_details.length > 0) {
        targetDetail = currentLog.call_log_details.find(
          (detail: ApiCallLogDetail) => detail.call_log_detail_id === editingCallLog.call_log_detail_id
        );
      }

      if (!targetDetail) {
        throw new Error('Call log detail not found');
      }

      // Extract contact data from the target detail
      let contactData = [];
      if (targetDetail.contact_data && targetDetail.contact_data.length > 0) {
        contactData = targetDetail.contact_data.map((group: ContactData) => ({
          channel_type_id: String(group.channel_type_id),
          contact_values: group.contact_values.map((contact: ContactValue) => ({
            user_name: contact.user_name,
            contact_number: contact.contact_number,
            remark: contact.remark || "Mobile",
            is_primary: contact.is_primary
          }))
        }));
      }
      // If contactData is still empty, create it from primary_contact_number and lead_name
      if (contactData.length === 0 && currentLog.primary_contact_number && currentLog.lead_name) {
        contactData = [
          {
            channel_type_id: "3",
            contact_values: [
              {
                user_name: currentLog.lead_name,
                contact_number: currentLog.primary_contact_number,
                remark: "Mobile",
                is_primary: true
              }
            ]
          }
        ];
      }

      // Prepare dates and times
      const callDate = editFormData.callDate instanceof Date 
        ? editFormData.callDate.toISOString().split('T')[0]
        : editFormData.callDate;
      
      const callStartDatetime = `${callDate} ${editFormData.callStartTime}:00`;
      const callEndDatetime = editFormData.callEndTime 
        ? `${callDate} ${editFormData.callEndTime}:00`
        : "";

      const contactResultId = editFormData.callStatus?.value || "1";

      // Prepare the update request body
      const updateRequestBody = {
        call_log_id: callLogIdFromUrl,
        call_log_detail_id: editingCallLog.call_log_detail_id,
        contact_result_id: contactResultId,
        call_start_datetime: callStartDatetime,
        call_end_datetime: callEndDatetime,
        remark: editFormData.notes || null,
        is_active: true,
        menu_id: "MU_02",
        contact_data: contactData
      };
      
      // Call the API to update call log detail
      const updateResponse = await fetch(`${getApiBase()}/call-log-detail/update`, {
        method: "PUT",
        headers: getApiHeaders(),
        body: JSON.stringify(updateRequestBody),
      });
      
      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error("Update API Error:", errorText);
        throw new Error(`Call log detail update failed with status ${updateResponse.status}`);
      }

      // Map contact result id to parent status id using contact_result_description from statusOptions
      // Robust mapping: get contact_result_description for status_id based on selected contact_result_id
      let parentStatusId = "1";
      if (editFormData.callStatus && editFormData.callStatus.value && statusOptions.length > 0) {
        const selected = statusOptions.find(
          (item) => String(item.value) === String(editFormData.callStatus!.value)
        );
        if (selected && selected.contact_result_description && selected.contact_result_description.length > 0) {
          parentStatusId = selected.contact_result_description;
        } else {
          parentStatusId = String(editFormData.callStatus.value);
        }
      }

      // Handle follow-up update if necessary
      if (editFormData.isFollowUp && editFormData.followUpDate) {
        let followUpDate = null;
        if (editFormData.followUpDate instanceof Date) {
          const d = editFormData.followUpDate;
          followUpDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }

        const callLogUpdateRequestBody = {
          call_log_id: callLogIdFromUrl,
          lead_id: currentLog.lead_id,
          property_profile_id: String(currentLog.property_profile_id),
          status_id: parentStatusId,
          purpose: currentLog.purpose || "Call pipeline management",
          fail_reason: currentLog.fail_reason || null,
          follow_up_date: followUpDate,
          is_follow_up: editFormData.isFollowUp,
          is_active: currentLog.is_active !== undefined ? currentLog.is_active : true,
          updated_by: "1"
        };
        console.log('[QuickCall Edit] PUT /call-log/update body:', callLogUpdateRequestBody);

        const callLogUpdateResponse = await fetch(`${getApiBase()}/call-log/update`, {
          method: "PUT",
          headers: getApiHeaders(),
          body: JSON.stringify(callLogUpdateRequestBody),
        });
        
        if (!callLogUpdateResponse.ok) {
          const updateErrorText = await callLogUpdateResponse.text();
          console.warn("Follow-up update warning (non-critical):", updateErrorText);
        }
      }
      
      // Success - close modal and show success
      setShowEditCallModal(false);
      setShowSuccessModal(true);
      resetEditForm();
      setEditingCallLog(null);
      // Reload call history
      loadCallHistory(currentPage);
      
    } catch (error) {
      console.error("Error updating call log:", error);
      alert(`Failed to update call log: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };


  // Handle add call log
  const handleSave = async () => {
    const validationErrors = validateFormData(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!callLogIdFromUrl) {
      alert('No pipeline ID found. Please ensure you access this page with a valid pipeline ID.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Get current call log data to extract contact information
      const getCurrentCallLogResponse = await fetch(`${getApiBase()}/call-log/pagination`, {
        method: "POST",
        headers: getApiHeaders(),
        body: JSON.stringify({
          page_number: "1",
          page_size: "10",
          search_type: "call_log_id",
          query_search: callLogIdFromUrl,
        }),
      });

      if (!getCurrentCallLogResponse.ok) {
        throw new Error('Failed to get current call log data');
      }

      const currentCallLogData = await getCurrentCallLogResponse.json();
      if (!Array.isArray(currentCallLogData) || currentCallLogData.length === 0 || 
          !currentCallLogData[0].data || !Array.isArray(currentCallLogData[0].data) || 
          currentCallLogData[0].data.length === 0) {
        throw new Error('No call log found with the provided ID');
      }

      const currentLog = currentCallLogData[0].data[0];

      // Extract contact data from the current call log
      let contactData = [];
      if (currentLog.call_log_details && currentLog.call_log_details.length > 0) {
        const existingDetail = currentLog.call_log_details[0];
        if (existingDetail.contact_data && existingDetail.contact_data.length > 0) {
          contactData = existingDetail.contact_data.map((group: ContactData) => ({
            channel_type_id: String(group.channel_type_id),
            contact_values: group.contact_values.map((contact: ContactValue) => ({
              user_name: contact.user_name,
              contact_number: contact.contact_number,
              remark: contact.remark || "Mobile",
              is_primary: contact.is_primary
            }))
          }));
        }
      }
      // If contactData is still empty, create it from primary_contact_number and lead_name
      if (contactData.length === 0 && currentLog.primary_contact_number && currentLog.lead_name) {
        contactData = [
          {
            channel_type_id: "3",
            contact_values: [
              {
                user_name: currentLog.lead_name,
                contact_number: currentLog.primary_contact_number,
                remark: "Mobile",
                is_primary: true
              }
            ]
          }
        ];
      }

      if (contactData.length === 0) {
        alert('No contact data found for this call log. Please ensure the call log has contact information.');
        return;
      }

      // Prepare dates and times
      const callDate = formData.callDate instanceof Date 
        ? formData.callDate.toISOString().split('T')[0]
        : formData.callDate;
      
      const callStartDatetime = `${callDate} ${formData.callStartTime}:00`;
      const callEndDatetime = formData.callEndTime 
        ? `${callDate} ${formData.callEndTime}:00`
        : "";

      const contactResultId = formData.callStatus?.value || "1";

      // Create call log detail
      const callLogDetailRequestBody = {
        call_log_id: callLogIdFromUrl,
        contact_result_id: contactResultId,
        call_start_datetime: callStartDatetime,
        call_end_datetime: callEndDatetime,
        remark: formData.notes || null,
        menu_id: "MU_02",
        contact_data: contactData
      };
      console.log("Call Log Detail Request Body:", callLogDetailRequestBody);
      const callLogDetailResponse = await fetch(`${getApiBase()}/call-log-detail/create`, {
        method: "POST",
        headers: getApiHeaders(),
        body: JSON.stringify(callLogDetailRequestBody),
      });
      
      if (!callLogDetailResponse.ok) {
        const errorText = await callLogDetailResponse.text();
        console.error("API Error:", errorText);
        throw new Error(`Call log detail creation failed with status ${callLogDetailResponse.status}`);
      }

      // Update call log with follow-up information if needed
      // Always fetch the current call log to check for status change
      let followUpDate = null;
      if (formData.followUpDate instanceof Date) {
        const d = formData.followUpDate;
        followUpDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }

      // Map child status (MU_02) to parent status_id using contact_result_description
      let parentStatusId = "1";
      let selectedContactResultDescription: string | undefined = undefined;
      if (formData.callStatus && formData.callStatus.value) {
        try {
          const statusRes = await fetch(`${getApiBase()}/contact-result/pagination`, {
            method: "POST",
            headers: getApiHeaders(),
            body: JSON.stringify({ 
              page_number: "1", 
              page_size: "100",
              menu_id: "MU_02",
              search_type: "",
              query_search: ""
            })
          });
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            const allStatuses: unknown[] = statusData[0]?.data || [];
            const found = allStatuses.find((s): s is { contact_result_id: number|string, contact_result_description?: string } => {
              if (
                typeof s === 'object' &&
                s !== null &&
                'contact_result_id' in s &&
                (s as { contact_result_id: unknown }).contact_result_id !== undefined
              ) {
                return String((s as { contact_result_id: unknown }).contact_result_id) === formData.callStatus?.value;
              }
              return false;
            });
            if (found && found.contact_result_description) {
              selectedContactResultDescription = String(found.contact_result_description);
            }
          }
        } catch (err) {
          console.warn("Could not fetch MU_02 status for parent mapping", err);
        }
      }

      // Always fetch the current call log to check for status change
      let shouldUpdate = false;
      let currentParentStatusId = "1";
      let currentParentLog = null;
      try {
        const getCurrentCallLogResponse = await fetch(`${getApiBase()}/call-log/pagination`, {
          method: "POST",
          headers: getApiHeaders(),
          body: JSON.stringify({
            page_number: "1",
            page_size: "10",
            search_type: "call_log_id",
            query_search: callLogIdFromUrl,
          }),
        });
        if (getCurrentCallLogResponse.ok) {
          const currentCallLogData = await getCurrentCallLogResponse.json();
          if (Array.isArray(currentCallLogData) && currentCallLogData.length > 0 && currentCallLogData[0].data && Array.isArray(currentCallLogData[0].data) && currentCallLogData[0].data.length > 0) {
            currentParentLog = currentCallLogData[0].data[0];
            currentParentStatusId = String(currentParentLog.status_id);
            // Only update if follow-up is set OR status_id is changed
            if (
              (formData.isFollowUp && followUpDate) ||
              (typeof selectedContactResultDescription === 'string' && currentParentStatusId !== selectedContactResultDescription)
            ) {
              shouldUpdate = true;
              parentStatusId = selectedContactResultDescription || "1";
            }
          }
        }
      } catch (err) {
        console.warn("Could not fetch current call log for parent status check", err);
      }

      if (shouldUpdate && currentParentLog) {
        const callLogUpdateRequestBody = {
          call_log_id: callLogIdFromUrl,
          lead_id: currentParentLog.lead_id,
          property_profile_id: String(currentParentLog.property_profile_id),
          status_id: parentStatusId,
          purpose: currentParentLog.purpose || "Call pipeline management",
          fail_reason: currentParentLog.fail_reason || null,
          follow_up_date: followUpDate,
          is_follow_up: formData.isFollowUp,
          is_active: currentParentLog.is_active !== undefined ? currentParentLog.is_active : true,
          updated_by: "1"
        };
        const callLogUpdateResponse = await fetch(`${getApiBase()}/call-log/update`, {
          method: "PUT",
          headers: getApiHeaders(),
          body: JSON.stringify(callLogUpdateRequestBody),
        });
        if (!callLogUpdateResponse.ok) {
          const updateErrorText = await callLogUpdateResponse.text();
          console.warn("Follow-up update warning (non-critical):", updateErrorText);
        }
      }
      
      // Success
      setShowAddCallModal(false);
      setShowSuccessModal(true);
      resetForm();
      loadCallHistory(currentPage);
      
    } catch (error) {
      console.error("Error saving call log:", error);
      alert(`Failed to save call log: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success Modal OK handler - Navigate back to call pipeline page
  const handleSuccessOk = () => {
    setShowSuccessModal(false);
    // Refresh the current page and preserve the pipelineId filter
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const pipelineId = params.get('pipelineId');
      // If pipelineId exists, preserve it in the URL
      if (pipelineId) {
        window.location.replace(`/callpipeline/quickcall?pipelineId=${encodeURIComponent(pipelineId)}`);
      } else {
        window.location.replace('/callpipeline/quickcall');
      }
    }
  };

  // Handler for ActionMenu actions
  const handleActionSelect = (action: 'view' | 'edit' | 'delete', callLog: CallLogDetail) => {
    if (action === 'view') {
      setViewingCallLog(callLog);
      setShowViewCallModal(true);
    } else if (action === 'edit') {
      // Load the call log detail for editing
      loadCallLogForEdit(callLog);
    } else if (action === 'delete') {
      // TODO: Implement delete functionality
      console.log('Delete call log:', callLog);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadCallHistory(page);
  };

  // Load data on component mount and when dependencies change
  useEffect(() => {
    loadStatusOptions();
  }, [loadStatusOptions]);

  // Load call history when contact results are loaded
  useEffect(() => {
    if (Object.keys(contactResults).length > 0 || callLogIdFromUrl) {
      loadCallHistory(1);
    }
  }, [callLogIdFromUrl, contactResults, loadCallHistory]);

  // Calculate pagination for display
  const startIndex = (currentPage - 1) * 10 + 1;
  const endIndex = Math.min(currentPage * 10, totalItems);

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

  return (
    <div>
      <PageBreadcrumb crumbs={breadcrumbs} />
      
      <div className="space-y-6">
        {/* Header Section with Add Call Button */}
        <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary bg-opacity-10">
                <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-black dark:text-white">
                  Quick Call Management
                </h3>
                <p className="text-sm text-body dark:text-bodydark">
                  Manage call logs and add new call entries
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="primary"
              onClick={() => setShowAddCallModal(true)}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Call Log
            </Button>
          </div>
        </div>

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
                    {callLogIdFromUrl || 'N/A'}
                  </h4>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Current Call Log ID
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Total Number of Calls Card */}
          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="flex items-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div className="ml-4">
                <div>
                  <h4 className="text-lg font-bold text-black dark:text-white">
                    {callHistory.length}
                  </h4>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Total Calls
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
                    {callHistory.reduce((total, call) => total + (call.total_call_minute || 0), 0)} min
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

        {/* Call History Table */}
        <ComponentCard title="Call History">
          <div className="space-y-4">
            {/* Table Header with Title */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                  All Call Log Details
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total {totalItems} call log {totalItems === 1 ? 'entry' : 'entries'} found
                </p>
              </div>
            </div>

            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto mb-4"></div>
                  <p className="text-gray-500 dark:text-gray-400">Loading call history...</p>
                </div>
              </div>
            ) : callHistory.length === 0 ? (
              <div className="py-8 text-center bg-white dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.05]">
                <p className="text-gray-500 dark:text-gray-400">
                  No call history found. Add your first call log entry above.
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
                              Detail ID
                            </TableCell>
                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                              Call Date
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
                              Contact Result
                            </TableCell>
                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                              Contact Number
                            </TableCell>
                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                              Caller Name
                            </TableCell>
                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                              Actions
                            </TableCell>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                          {callHistory.map((log) => (
                            <TableRow key={log.call_log_detail_id}>
                              <TableCell className="px-5 py-4 text-center">
                                <span className="font-mono text-sm text-gray-600 dark:text-gray-300">
                                  {log.call_log_detail_id}
                                </span>
                              </TableCell>
                              <TableCell className="px-5 py-4">
                                <div className="font-medium text-gray-800 dark:text-white text-sm">
                                  {formatDate(log.call_date)}
                                </div>
                              </TableCell>
                              <TableCell className="px-5 py-4">
                                <div className="flex flex-col">
                                  <span className="font-medium text-sm text-gray-500 dark:text-gray-400">
                                    {formatTime(log.call_start_datetime)} - {formatTime(log.call_end_datetime)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="px-5 py-4">
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300">
                                  {formatDuration(log.total_call_minute)}
                                </span>
                              </TableCell>
                              <TableCell className="px-5 py-4 text-gray-800 text-sm dark:text-gray-300 font-medium">
                                {log.lead_name}
                              </TableCell>
                              <TableCell className="px-5 py-4">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getContactResultStyle(log.contact_result_name)}`}>
                                  {log.contact_result_name}
                                </span>
                              </TableCell>
                              <TableCell className="px-5 py-4">
                                <span className="font-mono text-sm text-gray-600 dark:text-gray-300">
                                  {formatPhoneNumber(log.contact_number)}
                                </span>
                              </TableCell>
                              <TableCell className="px-5 py-4 text-gray-500 text-sm dark:text-gray-400">
                                {log.caller_name}
                              </TableCell>
                              <TableCell className="px-4 py-3 text-start">
                                <ActionMenu callLog={log} onSelect={handleActionSelect} />
                              </TableCell>
                            </TableRow>
                          ))}
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
                        <span className="font-medium">{startIndex}</span>
                        {" "}to{" "}
                        <span className="font-medium">{endIndex}</span>
                        {" "}of{" "}
                        <span className="font-medium">{totalItems}</span>
                        {" "}entries
                      </span>
                    </div>
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                  </div>
                )}
              </>
            )}
          </div>
        </ComponentCard>
      </div>

      {/* View Call Log Modal */}
      <Modal
        isOpen={showViewCallModal}
        onClose={() => setShowViewCallModal(false)}
        className="max-w-3xl"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Call Log Details
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {viewingCallLog?.call_log_detail_id || 'Detail ID not available'}
              </p>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Call Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-white text-base border-b border-gray-200 dark:border-gray-700 pb-2">
                Call Information
              </h4>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Date:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatDate(viewingCallLog?.call_date || 'N/A')}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Start Time:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatTime(viewingCallLog?.call_start_datetime || 'N/A')}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">End Time:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatTime(viewingCallLog?.call_end_datetime || 'N/A')}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Duration:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatDuration(viewingCallLog?.total_call_minute || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-white text-base border-b border-gray-200 dark:border-gray-700 pb-2">
                Contact Details
              </h4>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Lead Name:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {viewingCallLog?.lead_name || 'N/A'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Contact Number:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatPhoneNumber(viewingCallLog?.contact_number || 'N/A')}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Result:</span>
                  <span className={`text-sm font-medium px-2 py-1 rounded ${
                    viewingCallLog?.contact_result_name === 'Completed'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                      : viewingCallLog?.contact_result_name === 'No Answer' || viewingCallLog?.contact_result_name === 'Voicemail'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                      : viewingCallLog?.contact_result_name === 'Busy' || viewingCallLog?.contact_result_name === 'Failed'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
                  }`}>
                    {viewingCallLog?.contact_result_name || 'Unknown'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Caller:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {viewingCallLog?.caller_name || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* System Info */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Detail ID: {viewingCallLog?.call_log_detail_id || 'N/A'}</span>
              <span>Created: {formatDate(viewingCallLog?.created_at || 'N/A')}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={() => setShowViewCallModal(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Call Modal - Based on Quick Call Modal from CallLogsTable */}
      <Modal 
        isOpen={showAddCallModal} 
        onClose={() => setShowAddCallModal(false)}
        className="max-w-4xl p-4 lg:p-11"
      >
        <div className="px-2 lg:pr-14">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Quick Call Entry
          </h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
            {callLogIdFromUrl ? `Add a call log entry for Pipeline #${callLogIdFromUrl}` : 'Add a new call log entry'}
          </p>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-4">
            
            {/* Call Date */}
            <div>
              <DatePicker
                id="quick-call-date-picker"
                label="Call Date *"
                placeholder="Select call date"
                defaultDate={formData.callDate}
                onChange={(selectedDates) => {
                  if (selectedDates && selectedDates.length > 0) {
                    handleFormChange('callDate', selectedDates[0]);
                  }
                }}
              />
              {errors.callDate && <p className="text-sm text-red-500 mt-1">{errors.callDate}</p>}
            </div>

            {/* Call Start Time */}
            <div>
              <Label htmlFor="quickCallStartTime">Start Time *</Label>
              <div className="relative">
                <InputField
                  type="time"
                  id="quickCallStartTime"
                  value={formData.callStartTime}
                  onChange={(e) => handleFormChange('callStartTime', e.target.value)}
                  error={!!errors.callStartTime}
                />
                <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                  <TimeIcon />
                </span>
              </div>
              {errors.callStartTime && <p className="text-sm text-red-500 mt-1">{errors.callStartTime}</p>}
            </div>

            {/* Call End Time */}
            <div>
              <Label htmlFor="quickCallEndTime">End Time</Label>
              <div className="relative">
                <InputField
                  type="time"
                  id="quickCallEndTime"
                  value={formData.callEndTime}
                  onChange={(e) => handleFormChange('callEndTime', e.target.value)}
                  error={!!errors.callEndTime}
                />
                <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                  <TimeIcon />
                </span>
              </div>
              {errors.callEndTime && <p className="text-sm text-red-500 mt-1">{errors.callEndTime}</p>}
            </div>

            {/* Call Status */}
            <div>
              <Label htmlFor="quickCallStatus">Call Result Status *</Label>
              <Select
                placeholder={isLoadingStatus ? "Loading..." : "Select status"}
                options={statusOptions}
                value={formData.callStatus}
                onChange={(option) => handleFormChange('callStatus', option)}
              />
              {errors.callStatus && <p className="text-sm text-red-500 mt-1">{errors.callStatus}</p>}
            </div>

            {/* Follow-up Section */}
            <div>
              <Label htmlFor="quickFollowUpToggle">Follow-up Required</Label>
              <div className="flex items-center">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="quickFollowUpToggle"
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

            {/* Follow-up Date - Show when toggle is on */}
            {formData.isFollowUp && (
              <div>
                <DatePicker
                  id="quick-follow-up-date-picker"
                  label="Follow-up Date *"
                  placeholder="Select date"
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
          </div>

          {/* Notes - Full width */}
          <div>
            <Label htmlFor="quickNotes">Call Notes *</Label>
            <TextArea
              placeholder="Enter detailed call notes..."
              value={formData.notes}
              onChange={(value) => handleFormChange("notes", value)}
              rows={4}
            />
            {errors.notes && <p className="text-sm text-red-500 mt-1">{errors.notes}</p>}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddCallModal(false);
                resetForm();
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Call Log"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Call Modal - Based on Add Call Modal with pre-populated data */}
      <Modal 
        isOpen={showEditCallModal} 
        onClose={() => {
          setShowEditCallModal(false);
          resetEditForm();
          setEditingCallLog(null);
        }}
        className="max-w-4xl p-4 lg:p-11"
      >
        <div className="px-2 lg:pr-14">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Edit Call Entry
          </h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
            {editingCallLog ? `Edit call log entry ${editingCallLog.call_log_detail_id}` : 'Edit call log entry'}
          </p>
        </div>

        {isLoadingEdit ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">Loading call details...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-4">
              
              {/* Call Date */}
              <div>
                <DatePicker
                  id="edit-call-date-picker"
                  label="Call Date *"
                  placeholder="Select call date"
                  defaultDate={editFormData.callDate}
                  onChange={(selectedDates) => {
                    if (selectedDates && selectedDates.length > 0) {
                      handleEditFormChange('callDate', selectedDates[0]);
                    }
                  }}
                />
                {editErrors.callDate && <p className="text-sm text-red-500 mt-1">{editErrors.callDate}</p>}
              </div>

              {/* Call Start Time */}
              <div>
                <Label htmlFor="editCallStartTime">Start Time *</Label>
                <div className="relative">
                  <InputField
                    type="time"
                    id="editCallStartTime"
                    value={editFormData.callStartTime}
                    onChange={(e) => handleEditFormChange('callStartTime', e.target.value)}
                    error={!!editErrors.callStartTime}
                  />
                  <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                    <TimeIcon />
                  </span>
                </div>
                {editErrors.callStartTime && <p className="text-sm text-red-500 mt-1">{editErrors.callStartTime}</p>}
              </div>

              {/* Call End Time */}
              <div>
                <Label htmlFor="editCallEndTime">End Time</Label>
                <div className="relative">
                  <InputField
                    type="time"
                    id="editCallEndTime"
                    value={editFormData.callEndTime}
                    onChange={(e) => handleEditFormChange('callEndTime', e.target.value)}
                    error={!!editErrors.callEndTime}
                  />
                  <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                    <TimeIcon />
                  </span>
                </div>
                {editErrors.callEndTime && <p className="text-sm text-red-500 mt-1">{editErrors.callEndTime}</p>}
              </div>

              {/* Call Status */}
              <div>
                <Label htmlFor="editCallStatus">Call Result Status *</Label>
                <Select
                  placeholder={isLoadingStatus ? "Loading..." : "Select status"}
                  options={statusOptions}
                  value={editFormData.callStatus}
                  onChange={(option) => handleEditFormChange('callStatus', option)}
                />
                {editErrors.callStatus && <p className="text-sm text-red-500 mt-1">{editErrors.callStatus}</p>}
              </div>

              {/* Follow-up Section */}
              <div>
                <Label htmlFor="editFollowUpToggle">Follow-up Required</Label>
                <div className="flex items-center">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id="editFollowUpToggle"
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

              {/* Follow-up Date - Show when toggle is on */}
              {editFormData.isFollowUp && (
                <div>
                  <DatePicker
                    id="edit-follow-up-date-picker"
                    label="Follow-up Date *"
                    placeholder="Select date"
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
            </div>

            {/* Notes - Full width */}
            <div>
              <Label htmlFor="editNotes">Call Notes *</Label>
              <TextArea
                placeholder="Enter detailed call notes..."
                value={editFormData.notes}
                onChange={(value) => handleEditFormChange("notes", value)}
                rows={4}
              />
              {editErrors.notes && <p className="text-sm text-red-500 mt-1">{editErrors.notes}</p>}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditCallModal(false);
                  resetEditForm();
                  setEditingCallLog(null);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleEditSave}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Updating..." : "Update Call Log"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Success Modal */}
      <Modal 
        isOpen={showSuccessModal} 
        onClose={handleSuccessOk}
        className="max-w-md p-6"
      >
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full dark:bg-green-900/20">
            <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
            Call Log Added Successfully!
          </h3>
          
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            The call log has been added successfully and you will be redirected to the call pipeline page.
          </p>
          
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowSuccessModal(false);
                resetForm();
                setShowAddCallModal(true);
              }}
              className="flex-1"
            >
              Add Another Call Log
            </Button>
            <Button
              variant="primary"
              onClick={handleSuccessOk}
              className="flex-1"
            >
              Continue
            </Button>
          </div>
        </div>
      </Modal>
    </div>

  );
};

export default QuickCallPage;
