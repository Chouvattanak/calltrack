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
import { callLogsData } from "@/components/tables/sample-data/callLogsData";

interface SelectOption {
  value: string;
  label: string;
}

interface PipelineInfo {
  pipelineId: string;
  pipelineName: string;
  leadName: string;
  leadCompany: string;
  propertyName: string;
  propertyLocation: string;
  callerName: string;
  callerPhone: string;
  leadPhone: string;
}

export default function QuickCallCreatePage() {
  // Add missing state for compatibility with CallLogsTable.tsx logic
  const [leadContactData, setLeadContactData] = useState<any[]>([]);
  const [contactOptions, setContactOptions] = useState<any[]>([]);
  // Generic handler for form field changes
  const handleChange = (field: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };
  // Handle Save Call Log
  const handleSave = async () => {
  console.log('--- Save Call Log button was clicked ---');
    if (!formData || !pipelineInfo) return;
    // You may want to add your own validate() function here for stricter validation
    // For now, just check required fields
    if (!formData.callDate || !formData.callStartTime || !formData.callStatus) {
      setErrors({ callDate: !formData.callDate ? 'Call date required' : '', callStartTime: !formData.callStartTime ? 'Start time required' : '', callStatus: !formData.callStatus ? 'Status required' : '' });
      return;
    }
    try {
      setIsSubmitting(true);

      // DEBUG: Log form data at the start
      console.log("=== QUICK CALL SAVE DEBUG ===");
      console.log("1. Form Data:", JSON.stringify(formData, null, 2));
      console.log("2. Pipeline Info:", JSON.stringify(pipelineInfo, null, 2));
      console.log("3. Contact Options Available:", contactOptions.length, contactOptions);
      console.log("4. Lead Contact Data:", JSON.stringify(leadContactData, null, 2));

      // DEBUG: Specific phone number values
      console.log("DEBUG - callerPhone value:", pipelineInfo.callerPhone);
      console.log("DEBUG - leadPhone value:", pipelineInfo.leadPhone);
      console.log("DEBUG - leadPhone type:", typeof pipelineInfo.leadPhone);
      console.log("DEBUG - leadPhone length:", pipelineInfo.leadPhone ? pipelineInfo.leadPhone.length : 'null/undefined');

      // Filter contact data to find contacts matching pipelineInfo.callerPhone or leadPhone
      const matchingContactData: any[] = [];
      const callerPhone = (pipelineInfo.callerPhone || '').replace(/\D/g, ''); // Remove non-digits
      const leadPhone = (pipelineInfo.leadPhone || '').replace(/\D/g, ''); // Remove non-digits
      console.log("5. Caller phone (cleaned):", callerPhone);
      console.log("5. Lead phone (cleaned):", leadPhone);

      if (leadContactData && leadContactData.length > 0) {
        console.log("6. Processing leadContactData to find matching contacts...");
        for (const contactGroup of leadContactData) {
          if (contactGroup.contact_values && Array.isArray(contactGroup.contact_values)) {
            const matchingContacts = contactGroup.contact_values.filter((contact: any) => {
              if (contact.contact_number) {
                const contactPhone = contact.contact_number.replace(/\D/g, ''); // Remove non-digits
                const isCallerMatch = contactPhone === callerPhone;
                const isLeadMatch = contactPhone === leadPhone;
                const isMatch = isCallerMatch || isLeadMatch;
                return isMatch;
              }
              return false;
            });
            if (matchingContacts.length > 0) {
              // Structure the contact data as required by the API
              matchingContactData.push({
                channel_type_id: String(contactGroup.channel_type_id),
                contact_values: matchingContacts.map((contact: any) => ({
                  user_name: contact.user_name,
                  contact_number: contact.contact_number,
                  remark: contact.remark || "Mobile",
                  is_primary: contact.is_primary
                }))
              });
            }
          }
        }
      }

      console.log("9. All matching contact data:", JSON.stringify(matchingContactData, null, 2));

      if (matchingContactData.length === 0) {
        alert(`No contact data found matching the caller phone (${pipelineInfo.callerPhone}) or lead phone (${pipelineInfo.leadPhone}). Please ensure the lead has the correct contact information.`);
        setIsSubmitting(false);
        return;
      }

      const callDate = formData.callDate instanceof Date 
        ? formData.callDate.toISOString().split('T')[0]
        : formData.callDate;
      console.log("11. Processed call date:", callDate);

      const callStartDatetime = `${callDate} ${formData.callStartTime}:00`;
      const callEndDatetime = formData.callEndTime 
        ? `${callDate} ${formData.callEndTime}:00`
        : "";
      console.log("10. Call datetime strings:");

      const getContactResultId = (status: string): string => {
        return status || "1";
      };
      const contactResultId = getContactResultId(formData.callStatus?.value || "");
      console.log("11. Contact Result ID:", contactResultId, "from status:", formData.callStatus);

      // Prepare follow-up date if enabled
      let followUpDate = null;
      if (formData.isFollowUp && formData.followUpDate instanceof Date) {
        const d = formData.followUpDate;
        followUpDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
      console.log("12. Follow-up processing:");

      // STEP 1: Create call log detail (without follow-up fields)
      const callLogDetailRequestBody = {
        call_log_id: pipelineInfo.pipelineId,
        contact_result_id: contactResultId,
        call_start_datetime: callStartDatetime,
        call_end_datetime: callEndDatetime,
        remark: formData.notes || null,
        menu_id: "MU_02",
        contact_data: matchingContactData
      };
      console.log("=== STEP 1: CALL LOG DETAIL API REQUEST ===");

      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      console.log("13. Step 1 API Details:");
      // Call the first API to create call log detail
      const callLogDetailResponse = await fetch(`${apiBase}/call-log-detail/create`, {
        method: "POST",
        headers,
        body: JSON.stringify(callLogDetailRequestBody),
      });
      console.log("📡 API CALL 1 COMPLETED");
      console.log("14. Step 1 API Response Status:", callLogDetailResponse.status, callLogDetailResponse.statusText);
      if (!callLogDetailResponse.ok) {
        throw new Error(`Call log detail creation failed with status ${callLogDetailResponse.status}`);
      }
      const callLogDetailResponseData = await callLogDetailResponse.json();

      // STEP 2: Update call log with follow-up information (if follow-up is enabled)
      if (formData.isFollowUp && followUpDate) {
        // We need to get the current call log data first to preserve existing details
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
            // Prepare the call log update request with the expected structure (no call log detail fetch)
            const callLogUpdateRequestBody = {
              call_log_id: pipelineInfo.pipelineId,
              lead_id: currentLog.lead_id,
              property_profile_id: String(currentLog.property_profile_id),
              status_id: String(currentLog.status_id || "1"),
              purpose: currentLog.purpose || "Call pipeline management",
              fail_reason: currentLog.fail_reason || null,
              follow_up_date: followUpDate, // Updated field
              is_follow_up: formData.isFollowUp, // Updated field
              is_active: currentLog.is_active !== undefined ? currentLog.is_active : true,
              updated_by: "1" // You might want to get this from user context
            };
            console.log("=== STEP 2: CALL LOG UPDATE API REQUEST ===");
            console.log("17. Step 2 API Details:", callLogUpdateRequestBody);
            // Call the second API to update call log with follow-up information
            const callLogUpdateResponse = await fetch(`${apiBase}/call-log/update`, {
              method: "PUT",
              headers,
              body: JSON.stringify(callLogUpdateRequestBody),
            });
            console.log("📡 API CALL 2 COMPLETED");
            console.log("18. Step 2 API Response Status:", callLogUpdateResponse.status, callLogUpdateResponse.statusText);
            if (!callLogUpdateResponse.ok) {
              await callLogUpdateResponse.json().catch(() => ({}));
              // Don't throw error here, as the call log detail was already created successfully
            } else {
              await callLogUpdateResponse.json();
            }
          }
        }
      }

      console.log("=== END QUICK CALL SAVE DEBUG ===");
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error saving call log:", error);
      alert("Failed to save call log. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  const router = useRouter();
  const searchParams = useSearchParams();
  const pipelineId = searchParams.get('pipelineId') || '';

  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Call Pipeline", href: "/callpipeline" },
    { name: "Quick Call" },
    { name: "Create Call Log" },
  ];

  const [pipelineInfo, setPipelineInfo] = useState<PipelineInfo | null>(null);
  const [isLoadingPipeline, setIsLoadingPipeline] = useState(true);
  const [showInputModal, setShowInputModal] = useState(false);

  // Load pipeline information by ID
  useEffect(() => {
    const loadPipelineInfo = async () => {
      if (!pipelineId) {
        setIsLoadingPipeline(false);
        return;
      }

      try {
        // For now, get from sample data
        const pipeline = callLogsData.find(log => {
          // Try to match by call_log_id (real API)
          if (log.call_log_id && log.call_log_id.toString() === pipelineId) return true;
          // For mock data, allow type assertion to any
          const anyLog = log as any;
          return anyLog.id && anyLog.id.toString() === pipelineId;
        });
        if (pipeline) {
          // Use type assertion for mock data fields
          const anyPipeline = pipeline as any;
          setPipelineInfo({
            pipelineId: pipeline.call_log_id ? pipeline.call_log_id.toString() : (anyPipeline.id?.toString() || ''),
            pipelineName: `${pipeline.lead_name || anyPipeline.lead?.name || 'Unknown Lead'} - ${pipeline.property_profile_name || anyPipeline.Property?.name || 'Unknown Property'}`,
            leadName: pipeline.lead_name || anyPipeline.lead?.name || '',
            leadCompany: anyPipeline.lead?.company || '',
            propertyName: pipeline.property_profile_name || anyPipeline.Property?.name || '',
            propertyLocation: pipeline.property_type_name || anyPipeline.Property?.Location || '',
            callerName: pipeline.created_by_name || anyPipeline.caller?.name || '',
            callerPhone: pipeline.phone_number || anyPipeline.caller?.phone || '',
            leadPhone: anyPipeline.lead?.phone || ''
          });
        }
      } catch (error) {
        console.error("Error loading pipeline information:", error);
      } finally {
        setIsLoadingPipeline(false);
      }
    };

    loadPipelineInfo();
  }, [pipelineId]);

  const [formData, setFormData] = useState({
    callDate: new Date(), // Use Date object for DatePicker
    callStartTime: "",
    callEndTime: "",
    callStatus: null as SelectOption | null,
    contactInfo: null as SelectOption | null,
    notes: "",
    isFollowUp: false,
    followUpDate: null as Date | null,
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [statusOptions, setStatusOptions] = useState<SelectOption[]>([]);

  // Helper function to get contact result name
  const getContactResultName = (contactResultId: number): string => {
    // First try to get from API-loaded options
    const option = statusOptions.find(opt => opt.value === contactResultId.toString());
    if (option) {
      return option.label;
    }
    
    // Fallback to static mapping if API data not loaded yet
    const staticMapping: { [key: number]: string } = {
      1: "No Answer",
      2: "Busy", 
      3: "Voicemail",
      4: "Answered",
      5: "Callback Requested",
      6: "Not Interested",
      7: "Follow-up Scheduled"
    };
    
    return staticMapping[contactResultId] || "Unknown";
  };

  // Load contact result options from API
  useEffect(() => {
    const loadContactResults = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        let baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
        baseUrl = baseUrl.replace(/\/+$/, "");
        const endpoint = `${baseUrl}/contact-result/pagination`;
        
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            page_number: "1",
            page_size: "50",
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          let contactResults = [];
          
          if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0].data)) {
            contactResults = data[0].data;
          } else if (Array.isArray(data?.data)) {
            contactResults = data.data;
          }
          
          const options = contactResults.map((result: any) => ({
            value: result.contact_result_id.toString(),
            label: result.contact_result_name
          }));
          setStatusOptions(options);
        }
      } catch (error) {
        console.error("Error loading contact results:", error);
      }
    };
    loadContactResults();
  }, []);

  const handleCloseModal = () => {
    setShowInputModal(false);
    // Reset form data
    setFormData({
      callDate: new Date(),
      callStartTime: "",
      callEndTime: "",
      callStatus: null,
      contactInfo: null,
      notes: "",
      isFollowUp: false,
      followUpDate: null,
    });
    setErrors({});
  };

  const handleAddCallLog = () => {
    setShowInputModal(true);
  };

  const handleCreateAnother = () => {
    setShowSuccessModal(false);
    setShowInputModal(true);
    // Reset form data
    setFormData({
      callDate: new Date(),
      callStartTime: "",
      callEndTime: "",
      callStatus: null,
      contactInfo: null,
      notes: "",
      isFollowUp: false,
      followUpDate: null,
    });
    setErrors({});
  };

  const handleGoToQuickCall = () => {
    setShowSuccessModal(false);
    setShowInputModal(false);
    router.push(`/callpipeline/quickcall?pipelineId=${pipelineId}`);
  };

  if (isLoadingPipeline) {
    return (
      <div>
        <PageBreadcrumb crumbs={breadcrumbs} />
        <div className="space-y-6">
          <ComponentCard title="Quick Call - Create Call Log">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Loading pipeline information...</span>
            </div>
          </ComponentCard>
        </div>
      </div>
    );
  }

  if (!pipelineInfo) {
    return (
      <div>
        <PageBreadcrumb crumbs={breadcrumbs} />
        <div className="space-y-6">
          <ComponentCard title="Quick Call - Create Call Log">
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400 mb-4">No pipeline information found.</p>
              <Button variant="outline" onClick={() => router.push('/callpipeline')}>
                Back to Call Pipeline
              </Button>
            </div>
          </ComponentCard>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb crumbs={breadcrumbs} />
      <div className="space-y-6">
        
        {/* Section 1: General Information */}
        <ComponentCard title="General Information">
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
            
            {/* Lead Information */}
            <div>
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-3">
                Lead Information
              </h4>
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Name:</span> {pipelineInfo.leadName}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Company:</span> {pipelineInfo.leadCompany}
                </p>
              </div>
            </div>

            {/* Property Information */}
            <div>
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-3">
                Property Information
              </h4>
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Property:</span> {pipelineInfo.propertyName}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Location:</span> {pipelineInfo.propertyLocation}
                </p>
              </div>
            </div>

            {/* Caller Information */}
            <div>
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-3">
                Caller Information
              </h4>
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Name:</span> {pipelineInfo.callerName}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Phone:</span> {pipelineInfo.callerPhone}
                </p>
              </div>
            </div>

            {/* Add Call Log Button */}
            <div className="flex items-end">
              <Button
                variant="primary"
                onClick={handleAddCallLog}
                className="w-full h-12"
              >
                Add Call Log
              </Button>
            </div>
          </div>
        </ComponentCard>

        {/* Call History Table (you can add this later if needed) */}
        <ComponentCard title="Call History">
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">
              Call history will be displayed here after creating call logs.
            </p>
          </div>
        </ComponentCard>
      </div>

      {/* Input Information Modal */}
      <Modal 
        isOpen={showInputModal} 
        onClose={handleCloseModal}
        className="max-w-4xl p-6"
      >
        <div className="mb-6">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Quick Call Entry
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Add a call log entry for Pipeline #{pipelineInfo.pipelineId}
          </p>
        </div>

        {/* Pipeline Summary */}
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
              {pipelineInfo.callerPhone && (
                <p className="text-xs text-green-600 dark:text-green-300">
                  {pipelineInfo.callerPhone}
                </p>
              )}
            </div>
          </div>
          
          <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-gradient-to-br from-purple-50 to-pink-50 p-3 dark:border-gray-700 dark:from-purple-900/20 dark:to-pink-900/20">
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-gray-900 dark:text-white">Property</h3>
              <p className="text-sm font-bold text-purple-800 dark:text-purple-200">{pipelineInfo.propertyName}</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-4">
          
          {/* Call Date */}
          <div>
            <DatePicker
              id="call-date-picker"
              label="Call Date *"
              placeholder="Select call date"
              value={formData.callDate}
              onChange={(dates) => handleChange('callDate', dates[0])}
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
              placeholder="Select status"
              options={statusOptions}
              value={formData.callStatus}
              onChange={(option) => handleChange('callStatus', option)}
            />
            {errors.callStatus && <p className="text-sm text-red-500 mt-1">{errors.callStatus}</p>}
          </div>

          {/* Follow-up Section */}
          <div>
            <Label htmlFor="followUpToggle">Follow-up Required</Label>
            <div className="flex items-center">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="followUpToggle"
                  checked={formData.isFollowUp}
                  onChange={(e) => handleChange('isFollowUp', e.target.checked)}
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
                id="follow-up-date-picker"
                label="Follow-up Date *"
                placeholder="Select date"
                value={formData.followUpDate || undefined}
                onChange={(selectedDates) => {
                  if (selectedDates && selectedDates.length > 0) {
                    handleChange('followUpDate', selectedDates[0]);
                  }
                }}
              />
              {errors.followUpDate && <p className="text-sm text-red-500 mt-1">{errors.followUpDate}</p>}
            </div>
          )}
        </div>

        {/* Notes - Full width */}
        <div className="mt-5">
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
        <div className="flex justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleCloseModal}
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
      </Modal>

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
            Call Log Created Successfully!
          </h3>
          
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            Your call log has been saved. What would you like to do next?
          </p>
          
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-3">
            <Button
              variant="outline"
              onClick={handleCreateAnother}
              className="flex-1"
            >
              Add Another Call Log
            </Button>
            <Button
              variant="primary"
              onClick={handleGoToQuickCall}
              className="flex-1"
            >
              Back to Quick Call
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}