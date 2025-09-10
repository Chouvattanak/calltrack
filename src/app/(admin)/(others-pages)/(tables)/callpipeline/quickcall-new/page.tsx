"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import DatePicker from "@/components/form/date-picker";
import TextArea from "@/components/form/input/TextArea";
import InputField from "@/components/form/input/InputField";
import { TimeIcon } from "@/icons";
import { Modal } from "@/components/ui/modal";

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

export default function QuickCallNewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pipelineId = searchParams.get('pipelineId') || '';

  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Call Pipeline", href: "/callpipeline" },
    { name: "Quick Call" },
  ];

  const [pipelineInfo, setPipelineInfo] = useState<PipelineInfo | null>(null);
  const [isLoadingPipeline, setIsLoadingPipeline] = useState(true);

  const [formData, setFormData] = useState({
    callDate: new Date(),
    callStartTime: "",
    callEndTime: "",
    callStatus: null as SelectOption | null,
    contactInfo: null as SelectOption | null,
    notes: "",
  });

  type CallLogFormErrors = {
    callDate?: string;
    callStartTime?: string;
    callEndTime?: string;
    callStatus?: string;
    contactInfo?: string;
    notes?: string;
  };

  const [errors, setErrors] = useState<CallLogFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Contact options state
  const [contactOptions, setContactOptions] = useState<SelectOption[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [leadContactData, setLeadContactData] = useState<ContactData[]>([]);

  // Call status options state
  const [statusOptions, setStatusOptions] = useState<SelectOption[]>([]);
  const [isLoadingStatusOptions, setIsLoadingStatusOptions] = useState(false);

  // Load pipeline information by ID
  const loadPipelineInfo = React.useCallback(async () => {
    if (!pipelineId) {
      setIsLoadingPipeline(false);
      return;
    }

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      
      const body = {
        page_number: "1",
        page_size: "10",
        search_type: "call_log_id",
        query_search: pipelineId,
      };
      
      console.log("Loading pipeline info for Quick Call:", pipelineId);
      
      const res = await fetch(`${apiBase}/call-log/pagination`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      
      if (!res.ok) throw new Error("Failed to fetch call log data");
      
      const data = await res.json();
      console.log("Pipeline API Response:", data);
      
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
          pipelineName: `${log.lead_name || 'Unknown Lead'} - ${log.property_profile_name || 'Unknown Property'}`,
          leadId: log.lead_id || "",
          leadName: log.lead_name || "Unknown Lead",
          leadCompany: "N/A",
          propertyName: log.property_profile_name || "Unknown Property",
          propertyLocation: "N/A",
          propertyProfileId: log.property_profile_id || "",
          callerName: log.created_by_name || "Unknown Creator",
          callerPhone: "N/A",
          callerId: log.current_staff_id || ""
        });
      }
    } catch (error) {
      console.error("Error loading pipeline information:", error);
    } finally {
      setIsLoadingPipeline(false);
    }
  }, [pipelineId]);

  // Fetch contact data for dropdown
  useEffect(() => {
    const fetchContactOptions = async () => {
      if (!pipelineInfo) return;

      try {
        setIsLoadingContacts(true);
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        
        const leadId = pipelineInfo.leadId || pipelineInfo.pipelineId;
        
        const body = {
          page_number: "1",
          page_size: "10",
          search_type: "lead_id",
          query_search: leadId,
        };

        console.log("Fetching contacts for lead:", leadId);

        const res = await fetch(`${apiBase}/lead/pagination`, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        });

        if (!res.ok) throw new Error("Failed to fetch lead contact data");

        const data = await res.json();
        console.log("Lead contact API Response:", data);

        const options: SelectOption[] = [];
        
        if (Array.isArray(data) && data.length > 0 && data[0].data && Array.isArray(data[0].data)) {
          const leadData = data[0].data[0];
          if (leadData.contact_data && Array.isArray(leadData.contact_data)) {
            setLeadContactData(leadData.contact_data);
            
            leadData.contact_data.forEach((contactGroup: ContactData, groupIndex: number) => {
              if (contactGroup.contact_values && Array.isArray(contactGroup.contact_values)) {
                contactGroup.contact_values.forEach((contact: ContactValue, contactIndex: number) => {
                  if (contact.contact_number) {
                    const label = `${contact.contact_number}${contact.user_name ? ` (${contact.user_name})` : ''} - Channel: ${contactGroup.channel_type_id}${contact.is_primary ? ' [Primary]' : ''}`;
                    options.push({
                      value: `${groupIndex}-${contactIndex}`,
                      label: label
                    });
                  }
                });
              }
            });
          }
        }

        console.log("Parsed contact options:", options);
        setContactOptions(options);

      } catch (error) {
        console.error("Error fetching contact options:", error);
        setContactOptions([]);
      } finally {
        setIsLoadingContacts(false);
      }
    };

    fetchContactOptions();
  }, [pipelineInfo]);

  useEffect(() => {
    loadPipelineInfo();
  }, [loadPipelineInfo]);

  // Fetch contact result options from API
  useEffect(() => {
    const fetchContactResultOptions = async () => {
      try {
        console.log("=== FETCHING CONTACT RESULT OPTIONS ===");
        setIsLoadingStatusOptions(true);
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        console.log("API Base URL:", apiBase);
        console.log("Token available:", !!token);

        // Try contact result endpoint first
        const response = await fetch(`${apiBase}/contact-result`, {
          method: "GET",
          headers,
        });

        console.log("Contact result API response status:", response.status);

        if (response.ok) {
          const data = await response.json();
          console.log("Contact Result API Response:", data);
          
          let resultArray = [];
          if (Array.isArray(data)) {
            resultArray = data;
          } else if (Array.isArray(data?.data)) {
            resultArray = data.data;
          } else if (Array.isArray(data?.results)) {
            resultArray = data.results;
          }

          console.log("Parsed result array:", resultArray);

          const formattedOptions = resultArray.map((item: unknown) => {
            const result = item as Record<string, unknown>;
            console.log("Processing result item:", result);
            return {
              value: String(result.contact_result_id || result.id),
              label: String(result.contact_result_name || result.name),
            };
          });

          console.log("Formatted contact result options:", formattedOptions);
          setStatusOptions(formattedOptions);
        } else {
          throw new Error(`Contact result API failed with status ${response.status}`);
        }
      } catch (error) {
        console.warn("Failed to fetch contact results from API, using fallback options:", error);
        // Fallback to hardcoded options if API fails
        const fallbackOptions = [
          { value: "1", label: "Completed" },
          { value: "2", label: "No Answer" },
          { value: "3", label: "Busy" },
          { value: "4", label: "Voicemail" },
          { value: "5", label: "Cancelled" },
          { value: "6", label: "Failed" },
        ];
        console.log("Using fallback status options:", fallbackOptions);
        setStatusOptions(fallbackOptions);
      } finally {
        setIsLoadingStatusOptions(false);
        console.log("=== CONTACT RESULT OPTIONS FETCH COMPLETE ===");
      }
    };

    fetchContactResultOptions();
  }, []);

  const handleChange = (field: keyof typeof formData, value: string | SelectOption | null | Date) => {
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
    const newErrors: CallLogFormErrors = {};
    
    if (!formData.callDate) newErrors.callDate = "Call date is required.";
    if (!formData.callStartTime) newErrors.callStartTime = "Start time is required.";
    if (!formData.callStatus) newErrors.callStatus = "Call status is required.";
    if (!formData.contactInfo) newErrors.contactInfo = "Contact information is required.";
    if (!formData.notes.trim()) newErrors.notes = "Notes are required.";
    
    if (formData.callStartTime && formData.callEndTime) {
      const startTime = new Date(`2000-01-01T${formData.callStartTime}`);
      const endTime = new Date(`2000-01-01T${formData.callEndTime}`);
      if (endTime <= startTime) {
        newErrors.callEndTime = "End time must be after start time.";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      callDate: new Date(),
      callStartTime: "",
      callEndTime: "",
      callStatus: null,
      contactInfo: null,
      notes: "",
    });
    setErrors({});
  };

  const handleSave = async () => { 
    if (!validate() || !pipelineInfo) return;
    
    try {
      setIsSubmitting(true);
      
      if (!formData.contactInfo?.value) {
        alert("Please select a contact.");
        return;
      }

      const contactIndices = formData.contactInfo.value.split('-');
      if (contactIndices.length !== 2) {
        alert("Invalid contact selection. Please refresh and try again.");
        return;
      }

      const [groupIndex, contactIndex] = contactIndices.map(Number);
      
      if (isNaN(groupIndex) || isNaN(contactIndex)) {
        alert("Invalid contact selection format. Please refresh and try again.");
        return;
      }
      
      if (!leadContactData || leadContactData.length === 0) {
        alert("Contact data not loaded. Please refresh the page and try again.");
        return;
      }
      
      const selectedContactGroup = leadContactData[groupIndex];
      const selectedContact = selectedContactGroup?.contact_values?.[contactIndex];
      
      if (!selectedContact || !selectedContactGroup) {
        alert("Selected contact data not found. Please refresh and try again.");
        return;
      }

      const callDate = formData.callDate instanceof Date 
        ? formData.callDate.toISOString().split('T')[0]
        : formData.callDate;
      
      const callStartDatetime = `${callDate} ${formData.callStartTime}:00`;
      const callEndDatetime = formData.callEndTime 
        ? `${callDate} ${formData.callEndTime}:00`
        : "";

      const getContactResultId = (status: string): string => {
        console.log("=== GET CONTACT RESULT ID ===");
        console.log("Input status:", status);
        console.log("Available status options:", statusOptions);
        
        // If statusOptions are loaded from API, find the matching option
        if (statusOptions.length > 0) {
          const matchingOption = statusOptions.find(option => 
            option.label === status || option.value === status
          );
          console.log("Matching option found:", matchingOption);
          if (matchingOption) {
            console.log("Returning API-based ID:", matchingOption.value);
            return matchingOption.value;
          }
        }
        
        // Fallback to hardcoded mapping if API options not available
        console.log("Using fallback mapping for status:", status);
        const fallbackMap: Record<string, string> = {
          "Completed": "1",
          "No Answer": "2",
          "Busy": "3",
          "Voicemail": "4",
          "Cancelled": "5",
          "Failed": "6"
        };
        
        const fallbackId = fallbackMap[status] || "1";
        console.log("Fallback ID:", fallbackId);
        return fallbackId;
      };

      const singleContactData = {
        channel_type_id: "2",
        contact_values: [
          {
            user_name: pipelineInfo.leadName,
            contact_number: selectedContact.contact_number,
            remark: selectedContact.remark || "Mobile",
            is_primary: selectedContact.is_primary
          }
        ]
      };

      console.log("=== CONTACT DATA STRUCTURE ===");
      console.log("Selected Contact (from dropdown):", selectedContact);
      console.log("Pipeline Lead Name:", pipelineInfo.leadName);
      console.log("Final Contact Data Structure:", singleContactData);
      console.log("===========================");

      const apiRequestBody = {
        call_log_id: pipelineInfo.pipelineId,
        contact_result_id: getContactResultId(formData.callStatus?.value || ""),
        call_start_datetime: callStartDatetime,
        call_end_datetime: callEndDatetime,
        remark: formData.notes || null,
        menu_id: "MU_02",
        contact_data: [singleContactData]
      };
      
      console.log("=== FINAL API REQUEST BODY ===");
      console.log("Full API Request Body:", JSON.stringify(apiRequestBody, null, 2));
      console.log("========================");
      
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      
      const response = await fetch(`${apiBase}/call-log-detail/create`, {
        method: "POST",
        headers,
        body: JSON.stringify(apiRequestBody),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API request failed with status ${response.status}`);
      }
      
      const responseData = await response.json();
      console.log("Quick Call API Response:", responseData);
      
      resetForm();
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error("Error saving quick call log:", error);
      alert(`Failed to save quick call log: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddAnother = () => {
    setShowSuccessModal(false);
    resetForm();
  };

  const handleGoToHistory = () => {
    setShowSuccessModal(false);
    router.push(`/callpipeline/quickcall?pipelineId=${pipelineId}`);
  };

  // Show loading state
  if (isLoadingPipeline) {
    return (
      <div>
        <PageBreadcrumb crumbs={breadcrumbs} />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading pipeline information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!pipelineId || !pipelineInfo) {
    return (
      <div>
        <PageBreadcrumb crumbs={breadcrumbs} />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {!pipelineId ? "No pipeline ID provided." : "Pipeline not found."}
            </p>
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
        {/* Pipeline Information Summary */}
        <ComponentCard title="Quick Call Entry">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                Quick Call Entry
              </h4>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Add a new call log entry for Pipeline #{pipelineInfo.pipelineId}
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
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => router.push(`/callpipeline/quickcall?pipelineId=${pipelineInfo.pipelineId}`)}
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                View History
              </Button>
            </div>
          </div>

          {/* Pipeline Summary Cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 dark:border-gray-700 dark:from-blue-900/20 dark:to-indigo-900/20">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Pipeline</h3>
                <p className="text-lg font-bold text-blue-800 dark:text-blue-200">#{pipelineInfo.pipelineId}</p>
              </div>
            </div>
            
            <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-gradient-to-br from-green-50 to-emerald-50 p-4 dark:border-gray-700 dark:from-green-900/20 dark:to-emerald-900/20">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Lead</h3>
                <p className="text-lg font-bold text-green-800 dark:text-green-200">{pipelineInfo.leadName}</p>
              </div>
            </div>
            
            <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-gradient-to-br from-purple-50 to-pink-50 p-4 dark:border-gray-700 dark:from-purple-900/20 dark:to-pink-900/20">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Property</h3>
                <p className="text-lg font-bold text-purple-800 dark:text-purple-200">{pipelineInfo.propertyName}</p>
              </div>
            </div>
          </div>

          {/* Call Entry Form */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-4">
              
              {/* Call Date */}
              <div>
                <DatePicker
                  id="call-date-picker"
                  label="Call Date *"
                  placeholder="Select call date"
                  defaultDate={formData.callDate}
                  onChange={(selectedDates) => {
                    if (selectedDates && selectedDates.length > 0) {
                      handleChange('callDate', selectedDates[0]);
                    }
                  }}
                />
                {errors.callDate && <p className="text-sm text-red-500 mt-1">{errors.callDate}</p>}
              </div>

              {/* Call Start Time */}
              <div>
                <Label htmlFor="callStartTime">Start Time *</Label>
                <div className="relative">
                  <InputField
                    type="time"
                    id="callStartTime"
                    value={formData.callStartTime}
                    onChange={(e) => handleChange('callStartTime', e.target.value)}
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
                <Label htmlFor="callEndTime">End Time</Label>
                <div className="relative">
                  <InputField
                    type="time"
                    id="callEndTime"
                    value={formData.callEndTime}
                    onChange={(e) => handleChange('callEndTime', e.target.value)}
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
                <Label htmlFor="callStatus">Call Status *</Label>
                <Select
                  placeholder={isLoadingStatusOptions ? "Loading statuses..." : "Select status"}
                  options={statusOptions}
                  value={formData.callStatus}
                  onChange={(option) => handleChange('callStatus', option)}
                />
                {errors.callStatus && <p className="text-sm text-red-500 mt-1">{errors.callStatus}</p>}
                {statusOptions.length === 0 && !isLoadingStatusOptions && (
                  <p className="text-sm text-gray-500 mt-1">Failed to load status options. Please refresh the page.</p>
                )}
              </div>
            </div>

            {/* Contact Information - Full width row */}
            <div>
              <Label htmlFor="contactInfo">Contact Information *</Label>
              <Select
                placeholder={isLoadingContacts ? "Loading contacts..." : "Select contact"}
                options={contactOptions}
                value={formData.contactInfo}
                onChange={(option) => handleChange('contactInfo', option)}
              />
              {errors.contactInfo && <p className="text-sm text-red-500 mt-1">{errors.contactInfo}</p>}
              {contactOptions.length === 0 && !isLoadingContacts && (
                <p className="text-sm text-gray-500 mt-1">No contacts found for this lead. Please add contacts to the lead first.</p>
              )}
            </div>

            {/* Notes - Full width */}
            <div>
              <Label htmlFor="notes">Call Notes *</Label>
              <TextArea
                placeholder="Enter detailed call notes..."
                value={formData.notes}
                onChange={(value) => handleChange("notes", value)}
                rows={4}
              />
              {errors.notes && <p className="text-sm text-red-500 mt-1">{errors.notes}</p>}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
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
        </ComponentCard>
      </div>

      {/* Success Modal */}
      <Modal 
        isOpen={showSuccessModal} 
        onClose={() => setShowSuccessModal(false)}
        className="max-w-md p-6"
      >
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full dark:bg-green-900/20">
            <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
            Call Log Saved Successfully!
          </h3>
          
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            The call log has been added to pipeline #{pipelineInfo.pipelineId}. What would you like to do next?
          </p>
          
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-3">
            <Button
              variant="outline"
              onClick={handleAddAnother}
              className="flex-1"
            >
              Add Another Call
            </Button>
            <Button
              variant="primary"
              onClick={handleGoToHistory}
              className="flex-1"
            >
              View Call History
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
