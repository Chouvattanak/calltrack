"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "../ui/button/Button";
import Label from "../form/Label";
import Select from "../form/Select";
import DatePicker from "../form/date-picker";
import TextArea from "../form/input/TextArea";
import InputField from "../form/input/InputField";
import { TimeIcon } from "@/icons";

interface SelectOption {
  value: string;
  label: string;
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

type CallLogFormErrors = {
  callDate?: string;
  callStartTime?: string;
  callEndTime?: string;
  callStatus?: string;
  contactInfo?: string;
  notes?: string;
  isFollowUp?: string;
  followUpDate?: string;
};

export default function QuickCallCreate() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pipelineId = searchParams.get("pipelineId") || "";

  // Form state
  const [formData, setFormData] = useState({
    callDate: new Date(),
    callStartTime: "",
    callEndTime: "",
    callStatus: null as SelectOption | null,
    contactInfo: null as SelectOption | null,
    notes: "",
    isFollowUp: false,
    followUpDate: null as Date | null,
  });
  const [errors, setErrors] = useState<CallLogFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Data state
  const [pipelineInfo, setPipelineInfo] = useState<any>(null);
  const [statusOptions, setStatusOptions] = useState<SelectOption[]>([]);
  const [contactOptions, setContactOptions] = useState<SelectOption[]>([]);
  const [leadContactData, setLeadContactData] = useState<ContactData[]>([]);
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
            callerId: log.current_staff_id || ""
          });
        }
      } catch (e) {
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

  // Fetch contact options
  useEffect(() => {
    if (!pipelineInfo) return;
    const fetchContacts = async () => {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      try {
        const res = await fetch(`${apiBase}/lead/pagination`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            page_number: "1",
            page_size: "10",
            search_type: "lead_id",
            query_search: pipelineInfo.leadId,
          })
        });
        if (!res.ok) throw new Error("Failed to fetch lead contact data");
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0 && data[0].data && Array.isArray(data[0].data)) {
          const leadData = data[0].data[0];
          if (leadData.contact_data && Array.isArray(leadData.contact_data)) {
            setLeadContactData(leadData.contact_data);
            // Only show contacts matching pipelineInfo.callerPhone or leadPhone
            const options: SelectOption[] = [];
            leadData.contact_data.forEach((contactGroup: ContactData, groupIndex: number) => {
              if (contactGroup.contact_values && Array.isArray(contactGroup.contact_values)) {
                contactGroup.contact_values.forEach((contact: ContactValue, contactIndex: number) => {
                  if (contact.contact_number) {
                    const contactPhone = contact.contact_number.replace(/\D/g, '');
                    const callerPhone = (pipelineInfo.callerPhone || '').replace(/\D/g, '');
                    const leadPhone = (pipelineInfo.leadPhone || '').replace(/\D/g, '');
                    if (contactPhone === callerPhone || contactPhone === leadPhone || (!pipelineInfo.callerPhone && !pipelineInfo.leadPhone)) {
                      const label = `${contact.contact_number}${contact.user_name ? ` (${contact.user_name})` : ''} - Channel: ${contactGroup.channel_type_id}${contact.is_primary ? ' [Primary]' : ''}`;
                      options.push({
                        value: `${groupIndex}-${contactIndex}`,
                        label: label
                      });
                    }
                  }
                });
              }
            });
            setContactOptions(options);
          }
        }
      } catch {
        setContactOptions([]);
      }
    };
    fetchContacts();
  }, [pipelineInfo]);

  const handleChange = (field: keyof typeof formData, value: string | SelectOption | null | Date | boolean) => {
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
    if (!formData.notes.trim()) newErrors.notes = "Notes are required.";
    if (formData.isFollowUp && !formData.followUpDate) {
      newErrors.followUpDate = "Follow-up date is required when follow-up is enabled.";
    }
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
      isFollowUp: false,
      followUpDate: null,
    });
    setErrors({});
  };

  const handleSave = async () => {
    if (!validate() || !pipelineInfo) return;
    try {
      setIsSubmitting(true);
      // Filter contact data to find contacts matching pipelineInfo.callerPhone or leadPhone
      const matchingContactData = [];
      const callerPhone = (pipelineInfo.callerPhone || '').replace(/\D/g, '');
      const leadPhone = (pipelineInfo.leadPhone || '').replace(/\D/g, '');
      if (leadContactData && leadContactData.length > 0) {
        for (const contactGroup of leadContactData) {
          if (contactGroup.contact_values && Array.isArray(contactGroup.contact_values)) {
            const matchingContacts = contactGroup.contact_values.filter(contact => {
              if (contact.contact_number) {
                const contactPhone = contact.contact_number.replace(/\D/g, '');
                return contactPhone === callerPhone || contactPhone === leadPhone;
              }
              return false;
            });
            if (matchingContacts.length > 0) {
              matchingContactData.push({
                channel_type_id: String(contactGroup.channel_type_id),
                contact_values: matchingContacts.map(contact => ({
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
      if (matchingContactData.length === 0) {
        alert(`No contact data found matching the caller phone (${pipelineInfo.callerPhone}) or lead phone (${pipelineInfo.leadPhone}). Please ensure the lead has the correct contact information.`);
        return;
      }
      const callDate = formData.callDate instanceof Date 
        ? formData.callDate.toISOString().split('T')[0]
        : formData.callDate;
      const callStartDatetime = `${callDate} ${formData.callStartTime}:00`;
      const callEndDatetime = formData.callEndTime 
        ? `${callDate} ${formData.callEndTime}:00`
        : "";
      const contactResultId = formData.callStatus?.value || "1";
      let followUpDate = null;
      if (formData.isFollowUp && formData.followUpDate instanceof Date) {
        const d = formData.followUpDate;
        followUpDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
      // STEP 1: Create call log detail
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const callLogDetailRequestBody = {
        call_log_id: pipelineInfo.pipelineId,
        contact_result_id: contactResultId,
        call_start_datetime: callStartDatetime,
        call_end_datetime: callEndDatetime,
        remark: formData.notes || null,
        menu_id: "MU_02",
        contact_data: matchingContactData
      };
      const callLogDetailResponse = await fetch(`${apiBase}/call-log-detail/create`, {
        method: "POST",
        headers,
        body: JSON.stringify(callLogDetailRequestBody),
      });
      if (!callLogDetailResponse.ok) {
        throw new Error(`Call log detail creation failed with status ${callLogDetailResponse.status}`);
      }
      // STEP 2: Update call log with follow-up info if needed
      if (formData.isFollowUp && followUpDate) {
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
              follow_up_date: followUpDate,
              is_follow_up: formData.isFollowUp,
              is_active: currentLog.is_active !== undefined ? currentLog.is_active : true,
              updated_by: "1"
            };
            await fetch(`${apiBase}/call-log/update`, {
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
      alert(`Failed to save quick call log: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      <h2 className="text-2xl font-bold mb-4">Quick Call Entry</h2>
      {isLoading || !pipelineInfo ? (
        <div className="text-center py-8 text-gray-500">Loading pipeline information...</div>
      ) : (
        <form className="space-y-6" onSubmit={e => { e.preventDefault(); handleSave(); }}>
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-4">
            <div>
              <DatePicker
                id="quick-call-date-picker"
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
            <div>
              <Label htmlFor="quickCallStartTime">Start Time *</Label>
              <div className="relative">
                <InputField
                  type="time"
                  id="quickCallStartTime"
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
            <div>
              <Label htmlFor="quickCallEndTime">End Time</Label>
              <div className="relative">
                <InputField
                  type="time"
                  id="quickCallEndTime"
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
            <div>
              <Label htmlFor="quickCallStatus">Call Result Status *</Label>
              <Select
                placeholder="Select status"
                options={statusOptions}
                value={formData.callStatus}
                onChange={(option) => handleChange('callStatus', option)}
              />
              {errors.callStatus && <p className="text-sm text-red-500 mt-1">{errors.callStatus}</p>}
            </div>
            <div>
              <Label htmlFor="quickFollowUpToggle">Follow-up Required</Label>
              <div className="flex items-center">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="quickFollowUpToggle"
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
            {formData.isFollowUp && (
              <div>
                <DatePicker
                  id="quick-follow-up-date-picker"
                  label="Follow-up Date *"
                  placeholder="Select date"
                  defaultDate={formData.followUpDate || undefined}
                  onChange={(selectedDates) => {
                    if (selectedDates && selectedDates.length > 0) {
                      handleChange('followUpDate', selectedDates[0]);
                    }
                  }}
                />
                {errors.followUpDate && <p className="text-sm text-red-500 mt-1">{errors.followUpDate}</p>}
              </div>
            )}
            {/* Contact Info - hidden, but kept for API data fetching */}
            <div style={{ display: 'none' }}>
              <Label htmlFor="quickContactInfo">Contact Information *</Label>
              <Select
                placeholder="Select contact"
                options={contactOptions}
                value={formData.contactInfo}
                onChange={(option) => handleChange('contactInfo', option)}
              />
              {errors.contactInfo && <p className="text-sm text-red-500 mt-1">{errors.contactInfo}</p>}
            </div>
            <div>
              <Label htmlFor="quickNotes">Call Notes *</Label>
              <TextArea
                placeholder="Enter detailed call notes..."
                value={formData.notes}
                onChange={(value) => handleChange("notes", value)}
                rows={4}
              />
              {errors.notes && <p className="text-sm text-red-500 mt-1">{errors.notes}</p>}
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
              {isSubmitting ? "Saving..." : "Save Call Log"}
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
