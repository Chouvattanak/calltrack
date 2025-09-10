"use client";
import React, { useState, useEffect } from "react";
import LoadingOverlay from "@/components/ui/loading/LoadingOverlay";
import { useRouter } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { UserGroupIcon } from "@heroicons/react/24/outline";

const breadcrumbs = [
  { name: "Home", href: "/" },
  { name: "Call Pipeline", href: "/callpipeline" },
  { name: "View", href: "/callpipeline/view" }
];

interface PipelineInfo {
  call_log_id: string;
  lead_id: string;
  lead_name: string;
  property_profile_id: number;
  property_profile_name: string;
  total_call: number;
  total_site_visit: number;
  status_id: number;
  purpose: string;
  fail_reason: string | null;
  follow_up_date: string | null;
  is_follow_up: boolean;
  created_date: string;
  created_by_name: string;
  last_update: string | null;
  updated_by_name: string;
}

interface CallLogDetail {
  call_log_detail_id: string;
  contact_result_id: number;
  call_date: string;
  call_start_datetime: string;
  call_end_datetime: string;
  total_call_minute: number;
  remark: string | null;
  is_active: boolean;
  created_date: string;
  updated_by: number | null;
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

export default function ViewCallPipelinePage() {
  const router = useRouter();
  
  // Get call log ID from URL query parameter
  const [callLogId, setCallLogId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'quickcall' | 'sitevisit'>('quickcall');
  const [pipelineInfo, setPipelineInfo] = useState<PipelineInfo | null>(null);
  const [callLogDetails, setCallLogDetails] = useState<CallLogDetail[]>([]);
  const [siteVisitData, setSiteVisitData] = useState<SiteVisitData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pipelineNotFound, setPipelineNotFound] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Helper function to format date strings
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      // Check if it's a valid date
      if (isNaN(date.getTime())) return dateString;
      
      // If the original string includes time information (has a space or 'T')
      if (dateString.includes(' ') || dateString.includes('T')) {
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } else {
        // Just date, no time
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
    } catch {
      return dateString; // Return original if parsing fails
    }
  };

  // Helper function to format phone numbers
  const formatPhoneNumber = (phoneNumber: string): string => {
    if (!phoneNumber || phoneNumber === 'N/A') return phoneNumber;
    
    // Remove all non-digits
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Format based on length and patterns
    if (cleaned.length === 9 && cleaned.startsWith('0')) {
      // Cambodian format: 012345678 => (+855) 012 345 678
      return `(+855) ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    } else if (cleaned.length === 12 && cleaned.startsWith('855')) {
      // Already has 855 country code: 85512345678 => (+855) 012 345 678
      return `(+855) 0${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
    } else if (cleaned.length === 10) {
      // US format: (123) 456-7890
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      // US format with country code: +1 (123) 456-7890
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    } else if (cleaned.length >= 8) {
      // International format: +XXX XXX XXX XXX
      return `+${cleaned.slice(0, -6)} ${cleaned.slice(-6, -3)} ${cleaned.slice(-3)}`;
    }
    
    // Return original if it doesn't match common patterns
    return phoneNumber;
  };

  // Helper function to format time to 12-hour format with AM/PM
  const formatTime = (timeString: string): string => {
    if (!timeString) return 'N/A';
    try {
      // Parse time string (assuming format like "10:00:00" or "10:00")
      const [hours, minutes] = timeString.split(':');
      const hour24 = parseInt(hours, 10);
      const minute = parseInt(minutes, 10);
      
      if (isNaN(hour24) || isNaN(minute)) return timeString;
      
      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
      const ampm = hour24 >= 12 ? 'PM' : 'AM';
      const formattedMinute = minute.toString().padStart(2, '0');
      
      return `${hour12}:${formattedMinute} ${ampm}`;
    } catch {
      return timeString;
    }
  };

  // Helper function to format duration
  const formatDuration = (minutes: number): string => {
    if (minutes === 0) return '0 min';
    if (minutes < 60) return `${minutes} min`;
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${remainingMinutes}m`;
    }
  };

  // Extract call log ID from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id') || "";
    console.log("Extracted call log ID from URL query:", id);
    setCallLogId(id);
  }, []);

  // Fetch call log data from API
  useEffect(() => {
    if (!callLogId) return;
    
    const fetchCallLogData = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        let baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
        baseUrl = baseUrl.replace(/\/+$/, "");
        const endpoint = `${baseUrl}/call-log/pagination`;
        const body = {
          page_number: "1",
          page_size: "10",
          search_type: "call_log_id",
          query_search: callLogId,
        };
        
        console.log("Making API call to:", endpoint);
        console.log("Request body:", body);
        
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(body),
        });
        
        if (!res.ok) throw new Error("Failed to fetch call log data");
        
        const data = await res.json();
        console.log("API Response:", data);
        
        let logArr = [];
        if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0].data)) {
          logArr = data[0].data;
        } else if (Array.isArray(data?.data)) {
          logArr = data.data;
        } else if (Array.isArray(data?.results)) {
          logArr = data.results;
        }
        
        console.log("Parsed logArr:", logArr);
        
        if (logArr.length > 0) {
          const log = logArr[0];
          console.log("Raw log object:", log);
          
          // Set pipeline info directly from API response
          setPipelineInfo({
            call_log_id: log.call_log_id || "",
            lead_id: log.lead_id || "",
            lead_name: log.lead_name || "Unknown Lead",
            property_profile_id: log.property_profile_id || 0,
            property_profile_name: log.property_profile_name || "Unknown Property",
            total_call: log.total_call || 0,
            total_site_visit: log.total_site_visit || 0,
            status_id: log.status_id || 0,
            purpose: log.purpose || "N/A",
            fail_reason: log.fail_reason,
            follow_up_date: log.follow_up_date,
            is_follow_up: log.is_follow_up || false,
            created_date: log.created_date || "N/A",
            created_by_name: log.created_by_name || "Unknown Creator",
            last_update: log.last_update,
            updated_by_name: log.updated_by_name || ""
          });
          
          // Set call log details for Quick Call tab
          setCallLogDetails(log.call_log_details || []);
          
          setPipelineNotFound(false);
        } else {
          setPipelineNotFound(true);
        }
      } catch (err) {
        console.error("Call Log API error:", err);
        setPipelineNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCallLogData();
  }, [callLogId]);

  // Fetch site visit data from API
  useEffect(() => {
    if (!callLogId) return;
    
    const fetchSiteVisitData = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        let baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
        baseUrl = baseUrl.replace(/\/+$/, "");
        const endpoint = `${baseUrl}/site-visit/pagination`;
        const body = {
          page_number: "1",
          page_size: "50", // Get more records for site visits
          search_type: "call_log_id", 
          query_search: callLogId,
        };
        
        console.log("Making Site Visit API call to:", endpoint);
        console.log("Site Visit Request body:", body);
        
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify(body),
        });
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        console.log("Site Visit API Response:", data);
        
        // Parse the response - handle different possible response structures
        let siteVisitArr = [];
        if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0].data)) {
          siteVisitArr = data[0].data;
        } else if (Array.isArray(data?.data)) {
          siteVisitArr = data.data;
        } else if (Array.isArray(data?.results)) {
          siteVisitArr = data.results;
        }
        
        console.log("Parsed siteVisitArr:", siteVisitArr);
        setSiteVisitData(siteVisitArr);
        
      } catch (err) {
        console.error("Site Visit API error:", err);
        setSiteVisitData([]); // Set empty array on error
      }
    };
    
    fetchSiteVisitData();
  }, [callLogId]);

  const handleEdit = () => {
    router.push(`/callpipeline/edit?id=${callLogId}`);
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Deleting pipeline:', callLogId);
      router.push('/callpipeline');
    } catch (error) {
      console.error('Error deleting pipeline:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (isLoading) {
    return <LoadingOverlay isLoading={true} />;
  }

  if (pipelineNotFound || !pipelineInfo) {
    return (
      <div>
        <PageBreadcrumb crumbs={breadcrumbs} />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">Pipeline not found.</p>
            <Button variant="outline" onClick={() => router.push("/callpipeline")}>Back to Call Pipeline</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb crumbs={breadcrumbs} />
      <ComponentCard title="Pipeline Details">
        <div className="space-y-8">
          {/* Header with Action Buttons */}
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-500/10">
                  <UserGroupIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {`${pipelineInfo.lead_name} - ${pipelineInfo.property_profile_name}`}
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300`}>Status ID: {pipelineInfo.status_id}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">ID: {pipelineInfo.call_log_id}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => router.back()}>
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
              <Button variant="outline" onClick={handleDelete} className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-900/10">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </Button>
            </div>
          </div>
          {/* Pipeline Information Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <UserGroupIcon className="h-5 w-5" />
                  Pipeline Information
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Call Log ID:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">
                      <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-mono font-medium bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {pipelineInfo.call_log_id}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Lead ID:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">{pipelineInfo.lead_id}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Lead Name:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">{pipelineInfo.lead_name}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Property ID:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">{pipelineInfo.property_profile_id}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Property Name:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">{pipelineInfo.property_profile_name}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Calls:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                        {pipelineInfo.total_call} calls
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Site Visits:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300">
                        {pipelineInfo.total_site_visit} visits
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Purpose:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">{pipelineInfo.purpose}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Follow Up Date:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">{formatDate(pipelineInfo.follow_up_date)}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Is Follow Up:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                        pipelineInfo.is_follow_up 
                          ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
                      }`}>
                        {pipelineInfo.is_follow_up ? '✓ Yes' : '✗ No'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* System Information */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">System Information</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Created Date:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">{formatDate(pipelineInfo.created_date)}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Created By:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">{pipelineInfo.created_by_name}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Update:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">{formatDate(pipelineInfo.last_update)}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Updated By:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">{pipelineInfo.updated_by_name || 'N/A'}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Status ID:</div>
                    <div className="col-span-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300`}>{pipelineInfo.status_id}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ComponentCard>

      {/* Multi-page summary for Quick Call and Site Visit */}
      <ComponentCard title="Pipeline Activity Summary" className="mt-8">
        <div className="mb-4 flex gap-2 border-b border-gray-200 dark:border-white/[0.05]">
          <button className={`px-4 py-2 text-sm font-medium focus:outline-none ${activeTab === 'quickcall' ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'}`} onClick={() => setActiveTab('quickcall')}>Call History</button>
          <button className={`px-4 py-2 text-sm font-medium focus:outline-none ${activeTab === 'sitevisit' ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'}`} onClick={() => setActiveTab('sitevisit')}>Site Visit History</button>
        </div>
        {activeTab === 'quickcall' ? (
          <div>
            {callLogDetails && callLogDetails.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-white/[0.05]">
                  <thead className="bg-gray-50 dark:bg-white/[0.02]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Detail ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Call Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Duration (min)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contact Method</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contact Number</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Remark</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-white/[0.05]">
                    {callLogDetails.map((detail, index) => {
                      // Extract primary contact information
                      let primaryContactMethod = "N/A";
                      let primaryContactNumber = "N/A";
                      
                      if (detail.contact_data && detail.contact_data.length > 0) {
                        for (const contactGroup of detail.contact_data) {
                          if (contactGroup.contact_values && contactGroup.contact_values.length > 0) {
                            const primaryContact = contactGroup.contact_values.find(v => v.is_primary);
                            if (primaryContact) {
                              primaryContactMethod = contactGroup.channel_type_name;
                              primaryContactNumber = primaryContact.contact_number;
                              break;
                            }
                          }
                        }
                      }
                      
                      return (
                        <tr key={detail.call_log_detail_id || index} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {detail.call_log_detail_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(detail.call_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex flex-col">
                              <span className="font-medium">{formatTime(detail.call_start_datetime)} - {formatTime(detail.call_end_datetime)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300">
                              {formatDuration(detail.total_call_minute)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {primaryContactMethod}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {formatPhoneNumber(primaryContactNumber)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {detail.remark || 'No remark'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                No quick call records found for this pipeline.
              </div>
            )}
          </div>
        ) : (
          <div>
            {siteVisitData && siteVisitData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-white/[0.05]">
                  <thead className="bg-gray-50 dark:bg-white/[0.02]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Visit ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date & Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Staff</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contact Result</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Purpose</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Photos</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Remark</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-white/[0.05]">
                    {siteVisitData.map((visit, index) => {
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
                          // Keep 'N/A' if date parsing fails
                        }
                      }
                      
                      return (
                        <tr key={visit.site_visit_id || index} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-mono font-medium bg-indigo-50 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              {visit.site_visit_id}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex flex-col">
                              <span className="font-medium">{formatDate(visit.start_datetime)}</span>
                              {visit.end_datetime && (
                                <span className="text-xs text-gray-400">Duration: {duration}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8">
                                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                                  <span className="text-xs font-medium text-blue-800 dark:text-blue-300">
                                    {visit.staff_name?.charAt(0)?.toUpperCase() || 'S'}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{visit.staff_name || 'Unknown Staff'}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">ID: {visit.staff_id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              visit.contact_result_name === 'Completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                              visit.contact_result_name === 'Failed' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' :
                              visit.contact_result_name === 'Cancelled' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
                            }`}>
                              {visit.contact_result_name || 'Unknown'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                            <div className="truncate" title={visit.purpose || 'No purpose specified'}>
                              {visit.purpose || 'No purpose specified'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {visit.photo_url && visit.photo_url.length > 0 ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                                {visit.photo_url.length} photo{visit.photo_url.length !== 1 ? 's' : ''}
                              </span>
                            ) : (
                              <span className="text-gray-400">No photos</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                            <div className="truncate" title={visit.remark || 'No remark'}>
                              {visit.remark || 'No remark'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => router.push(`/callpipeline/sitevisit/edit?pipelineId=${callLogId}&siteVisitId=${visit.site_visit_id}`)}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => router.push(`/callpipeline/sitevisit/view?siteVisitId=${visit.site_visit_id}&pipelineId=${callLogId}`)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                <div className="flex flex-col items-center">
                  <svg className="w-12 h-12 mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <p className="text-lg font-medium mb-2">No site visits found</p>
                  <p className="text-sm mb-4">There are no site visit records for this pipeline yet.</p>
                  <button
                    onClick={() => router.push(`/callpipeline/sitevisit/create?pipelineId=${callLogId}`)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create First Site Visit
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </ComponentCard>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} className="max-w-md p-6">
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full dark:bg-red-900/20">
            <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">Delete Pipeline</h3>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">Are you sure you want to delete this pipeline? This action cannot be undone.</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-3">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)} className="flex-1">Cancel</Button>
            <Button variant="primary" onClick={confirmDelete} className="flex-1" disabled={isDeleting}>{isDeleting ? "Deleting..." : "Delete"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
