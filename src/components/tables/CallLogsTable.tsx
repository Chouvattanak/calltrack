"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import { 
  EllipsisHorizontalIcon, 
  AdjustmentsHorizontalIcon,
  EyeIcon,
  PencilIcon,
  PhoneIcon,
  CalendarIcon,
  TrashIcon,
  ClockIcon,
  MapPinIcon,
  CurrencyDollarIcon
} from "@heroicons/react/24/outline";
import Button from "../ui/button/Button";
import { CallLog } from "./sample-data/callLogsData";
import { Modal } from "../ui/modal";
import Label from "../form/Label";
import Select from "../form/Select";
import DatePicker from "../form/date-picker";
import TextArea from "../form/input/TextArea";
import InputField from "../form/input/InputField";
import PhotoUpload, { PhotoFile } from "@/components/form/PhotoUpload";
import { TimeIcon } from "@/icons";

// Format phone number to (+855) 000-000-0000 format
const formatPhoneNumber = (phone: string): string => {
  if (!phone) return "";
  
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, "");
  
  // If it starts with 855, format as (+855) 000-000-0000
  if (cleaned.startsWith("855") && cleaned.length >= 9) {
    const remaining = cleaned.substring(3);
    if (remaining.length >= 8) {
      const part1 = remaining.substring(0, 3);
      const part2 = remaining.substring(3, 6);
      const part3 = remaining.substring(6, 10);
      return `(+855) ${part1}-${part2}-${part3}`;
    }
  }
  
  // If it doesn't start with 855, assume it needs 855 prefix
  if (cleaned.length >= 8) {
    const part1 = cleaned.substring(0, 3);
    const part2 = cleaned.substring(3, 6);
    const part3 = cleaned.substring(6, 10);
    return `(+855) ${part1}-${part2}-${part3}`;
  }
  
  // Return original if can't format
  return phone;
};

// Format property value to $000,000 format
const formatPropertyValue = (value: number): string => {
  if (!value && value !== 0) return "";
  // Return "-" for values 0 or 1
  if (value === 0 || value === 1) return "-";
  return `$${value.toLocaleString('en-US')}`;
};

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
  propertyPrice?: number;  // Added for property price
  callerName: string;
  callerPhone: string;
  leadPhone: string;  // Added for lead phone number
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

export const callLogColumnConfig: { key: keyof CallLog; label: string; highlight?: boolean }[] = [
  { key: 'call_log_id', label: 'Call Log ID' },
  { key: 'lead_name', label: 'Lead Full Name', highlight: true },
  { key: 'phone_number', label: 'Phone Number', highlight: true },
  { key: 'property_profile_name', label: 'Property Name' },
  { key: 'property_profile_price', label: 'Property Price', highlight: true },
  { key: 'property_type_name', label: 'Property Type', highlight: true },
  { key: 'total_call', label: 'Total Call', highlight: true },
  { key: 'total_site_visit', label: 'Total Site Visit', highlight: true },
  { key: 'pipeline_status', label: 'Pipeline Status', highlight: true },
  { key: 'latest_status_id', label: 'Latest Status ID' },
  { key: 'latest_status_name', label: 'Latest Status Name' },
  // Additional columns available in column selector
  { key: 'lead_id', label: 'Lead ID' },
  { key: 'property_profile_id', label: 'Property Profile ID' },
  { key: 'purpose', label: 'Purpose' },
  { key: 'is_follow_up', label: 'Is Follow Up' },
  { key: 'follow_up_date', label: 'Follow Up Date' },
  { key: 'fail_reason', label: 'Fail Reason' },
  { key: 'created_by_name', label: 'Created By' },
  { key: 'created_date', label: 'Created Date' },
  { key: 'updated_by_name', label: 'Updated By' },
  { key: 'last_update', label: 'Last Update' },
  { key: 'is_active', label: 'Is Active' },
];

// Default visible columns (your requested columns)
export const defaultVisibleColumns: (keyof CallLog)[] = [
  'call_log_id',
  'lead_name',
  'phone_number',
  'property_profile_name',
  'property_profile_price',
  'property_type_name',
  'total_call',
  'total_site_visit',
  'pipeline_status',
  'latest_status_id',
  'latest_status_name',
];
// Utility to get latest status from call_log_details and site_visit_details
function getLatestStatusInfo(callLog: CallLog): { latest_status_id?: number, latest_status_name?: string } {
  let latest: { date: string, contact_result_id?: number, contact_result_name?: string } | null = null;
  // Helper to parse date+time or fallback to created_date
  function getDateTime(obj: any, dateKey: string, timeKey?: string) {
    if (obj[dateKey]) {
      if (timeKey && obj[timeKey]) {
        return `${obj[dateKey]} ${obj[timeKey]}`;
      }
      return obj[dateKey];
    }
    return obj.created_date || '';
  }
  // Check call_log_details
  if (Array.isArray(callLog.call_log_details)) {
    for (const d of callLog.call_log_details) {
      const dateStr = getDateTime(d, 'call_date', 'call_end_datetime');
      if (!latest || (dateStr > latest.date)) {
        latest = {
          date: dateStr,
          contact_result_id: d.contact_result_id,
          contact_result_name: d.contact_result_name,
        };
      }
    }
  }
  // Check site_visit_details
  if (Array.isArray(callLog.site_visit_details)) {
    for (const d of callLog.site_visit_details) {
      const dateStr = getDateTime(d, 'start_datetime');
      if (!latest || (dateStr > latest.date)) {
        latest = {
          date: dateStr,
          contact_result_id: d.contact_result_id,
          contact_result_name: d.contact_result_name,
        };
      }
    }
  }
  return {
    latest_status_id: latest?.contact_result_id,
    latest_status_name: latest?.contact_result_name,
  };
}

// Primary Actions Menu: View, Edit, Quick Call, Quick Site Visit, Delete
const PrimaryActionsMenu = ({ callLog, onSelect }: { callLog: CallLog; onSelect: (action: 'view' | 'edit' | 'delete' | 'quickCall' | 'quickSiteVisit' | 'siteVisit' | 'viewCallHistory' | 'loanPaymentSchedule', callLog: CallLog) => void; }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="p-1.5 rounded-md bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 transition-colors border border-blue-200 dark:border-blue-700"
        title="Primary Actions"
      >
        <EllipsisHorizontalIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-800 border border-gray-200 dark:border-white/[0.05] rounded-lg shadow-lg z-10">
          <ul className="py-1">
            <li><a href="#" onClick={e => { e.preventDefault(); onSelect('view', callLog); setIsOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.05]"><EyeIcon className="h-4 w-4" />View</a></li>
            <li><a href="#" onClick={e => { e.preventDefault(); onSelect('edit', callLog); setIsOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.05]"><PencilIcon className="h-4 w-4" />Edit</a></li>
            <li><hr className="my-1 border-gray-200 dark:border-white/[0.05]" /></li>
            <li><a href="#" onClick={e => { e.preventDefault(); onSelect('quickCall', callLog); setIsOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-white/[0.05]"><PhoneIcon className="h-4 w-4" />Quick Call</a></li>
            <li><a href="#" onClick={e => { e.preventDefault(); onSelect('quickSiteVisit', callLog); setIsOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-gray-100 dark:hover:bg-white/[0.05]"><MapPinIcon className="h-4 w-4" />Quick Site Visit</a></li>
            <li><hr className="my-1 border-gray-200 dark:border-white/[0.05]" /></li>
            <li><a href="#" onClick={e => { e.preventDefault(); onSelect('delete', callLog); setIsOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-white/[0.05]"><TrashIcon className="h-4 w-4" />Delete</a></li>
          </ul>
        </div>
      )}
    </div>
  );
};

// History Actions Menu: Call Log History, Site Visit History, Payment Schedule
const HistoryActionsMenu = ({ callLog, onSelect }: { callLog: CallLog; onSelect: (action: 'view' | 'edit' | 'delete' | 'quickCall' | 'quickSiteVisit' | 'siteVisit' | 'viewCallHistory' | 'loanPaymentSchedule', callLog: CallLog) => void; }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="p-1.5 rounded-md bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 transition-colors border border-green-200 dark:border-green-700"
        title="History & Reports"
      >
        <ClockIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-800 border border-gray-200 dark:border-white/[0.05] rounded-lg shadow-lg z-10">
          <ul className="py-1">
            <li><a href="#" onClick={e => { e.preventDefault(); onSelect('viewCallHistory', callLog); setIsOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-gray-100 dark:hover:bg-white/[0.05]"><ClockIcon className="h-4 w-4" />Call History</a></li>
            <li><a href="#" onClick={e => { e.preventDefault(); onSelect('siteVisit', callLog); setIsOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-white/[0.05]"><CalendarIcon className="h-4 w-4" />Site Visit History</a></li>
            <li><hr className="my-1 border-gray-200 dark:border-white/[0.05]" /></li>
            <li><a href="#" onClick={e => { e.preventDefault(); onSelect('loanPaymentSchedule', callLog); setIsOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-orange-600 dark:text-orange-400 hover:bg-gray-100 dark:hover:bg-white/[0.05]"><CurrencyDollarIcon className="h-4 w-4" />Payment Schedule</a></li>
          </ul>
        </div>
      )}
    </div>
  );
};

export const ColumnSelector = ({ visibleColumns, setVisibleColumns }: { visibleColumns: (keyof CallLog)[], setVisibleColumns: React.Dispatch<React.SetStateAction<(keyof CallLog)[]>> }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleColumn = (columnKey: keyof CallLog) => {
    setVisibleColumns(prev => prev.includes(columnKey) ? prev.filter(key => key !== columnKey) : [...prev, columnKey]);
  };
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  return (
    <div className="relative" ref={menuRef}>
      <Button variant="outline" size="sm" onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2">
        <AdjustmentsHorizontalIcon className="h-4 w-4" />
        Columns
      </Button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-dark-800 border border-gray-200 dark:border-white/[0.05] rounded-lg shadow-lg z-10">
          <div className="p-4">
            <h4 className="font-semibold mb-2">Visible Columns</h4>
            <div className="flex flex-col gap-2">
              {callLogColumnConfig.map(col => (
                <label key={col.key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={visibleColumns.includes(col.key)} onChange={() => toggleColumn(col.key)} className="form-checkbox h-4 w-4 rounded text-blue-600" />
                  {col.label}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function CallLogsTable({ 
  data = [], 
  visibleColumns = defaultVisibleColumns,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setVisibleColumns 
}: {
  data: CallLog[];
  visibleColumns: (keyof CallLog)[];
  setVisibleColumns?: (columns: (keyof CallLog)[]) => void;
}) {
  const router = useRouter();
  // Precompute latest status for each row (move outside JSX)
  const dataWithLatest = React.useMemo(() => {
    return data.map((row) => {
      const latest = getLatestStatusInfo(row);
      // Always map pipeline_status from the 'status' field in the API response
      const pipeline_status = row.status || row.pipeline_status || '';
      return { ...row, pipeline_status, ...latest };
    });
  }, [data]);
  
  // Quick Call Modal State
  const [showQuickCallModal, setShowQuickCallModal] = useState(false);
  const [selectedCallLog, setSelectedCallLog] = useState<CallLog | null>(null);
  const [pipelineInfo, setPipelineInfo] = useState<PipelineInfo | null>(null);
  const [isLoadingPipeline, setIsLoadingPipeline] = useState(false);
  
  // Quick Site Visit Modal State
  const [showQuickSiteVisitModal, setShowQuickSiteVisitModal] = useState(false);
  
  // Quick Call Form State
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
  
  // Quick Site Visit Form State
  const [siteVisitFormData, setSiteVisitFormData] = useState({
  visitDate: "",
  visitStartTime: "",
  visitEndTime: "",
  contactResult: null as SelectOption | null,
  purpose: "",
  notes: "",
  is_follow_up: false,
  follow_up_date: null as Date | null,
  });
  const [siteVisitPhotos, setSiteVisitPhotos] = useState<PhotoFile[]>([]);
  
  const [errors, setErrors] = useState<CallLogFormErrors>({});
  const [siteVisitErrors, setSiteVisitErrors] = useState<{
    visitDate?: string;
    visitStartTime?: string;
    visitEndTime?: string;
    contactResult?: string;
    purpose?: string;
    notes?: string;
    is_follow_up?: string;
    follow_up_date?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Contact options state
  const [contactOptions, setContactOptions] = useState<SelectOption[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [leadContactData, setLeadContactData] = useState<ContactData[]>([]);

  // Call status options - fetched from API (Quick Call)
  const [statusOptions, setStatusOptions] = useState<SelectOption[]>([]);
  // Site Visit status options - fetched from API (menu_id: 'MU_03')
  const [siteVisitStatusOptions, setSiteVisitStatusOptions] = useState<SelectOption[]>([]);
  // Define type for contact result data
  interface ContactResultData {
    contact_result_id: number;
    contact_result_name: string;
    contact_result_description?: string;
    // Add other known fields if needed
  }
  // Store full contact result API data for mapping (Quick Call)
  const [contactResultList, setContactResultList] = useState<ContactResultData[]>([]);
  // Store full contact result API data for mapping (Site Visit)
  const [siteVisitContactResultList, setSiteVisitContactResultList] = useState<ContactResultData[]>([]);

  // Fetch contact result options for Quick Call (menu_id: 'MU_02')
  useEffect(() => {
    async function fetchContactResults() {
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
          setContactResultList(apiResult.data);
          setStatusOptions(apiResult.data.map((result: { contact_result_id: number, contact_result_name: string }) => ({ 
            value: result.contact_result_id.toString(), 
            label: result.contact_result_name 
          })));
        }
      } catch {
        setStatusOptions([]);
        setContactResultList([]);
      }
    }
    fetchContactResults();
  }, []);

  // Fetch contact result options for Site Visit (menu_id: 'MU_03')
  useEffect(() => {
    async function fetchSiteVisitContactResults() {
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
            menu_id: "MU_03",
            search_type: "",
            query_search: ""
          })
        });
        const data = await response.json();
        const apiResult = data[0];
        if (apiResult && apiResult.data) {
          setSiteVisitContactResultList(apiResult.data);
          setSiteVisitStatusOptions(apiResult.data.map((result: { contact_result_id: number, contact_result_name: string }) => ({ 
            value: result.contact_result_id.toString(), 
            label: result.contact_result_name 
          })));
        }
      } catch {
        setSiteVisitStatusOptions([]);
        setSiteVisitContactResultList([]);
      }
    }
    fetchSiteVisitContactResults();
  }, []);



  // Quick Call functionality
  const handleQuickCall = async (callLog: CallLog) => {
    setSelectedCallLog(callLog);
    setIsLoadingPipeline(true);
    
    try {
      // Load pipeline information
      await loadPipelineInfo(callLog.call_log_id || '');
      setShowQuickCallModal(true);
    } catch {
      alert("Failed to load pipeline information. Please try again.");
    } finally {
      setIsLoadingPipeline(false);
    }
  };

  // Quick Site Visit functionality
  const handleQuickSiteVisit = async (callLog: CallLog) => {
    setSelectedCallLog(callLog);
    setIsLoadingPipeline(true);
    
    try {
      // Load pipeline information
      await loadPipelineInfo(callLog.call_log_id || '');
      setShowQuickSiteVisitModal(true);
    } catch {
      alert("Failed to load pipeline information. Please try again.");
    } finally {
      setIsLoadingPipeline(false);
    }
  };

  // Load pipeline information by ID
  const loadPipelineInfo = React.useCallback(async (pipelineId: string) => {
    if (!pipelineId) return;

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
      const res = await fetch(`${apiBase}/call-log/pagination`, {
        method: "POST",
        headers,
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
        const extractedCallerPhone = log.primary_contact_number || "N/A";
        const extractedLeadPhone = log.primary_contact_number || "N/A";
        setPipelineInfo({
          pipelineId: log.call_log_id || "",
          pipelineName: `${log.lead_name || 'Unknown Lead'} - ${(log.property_profile_name === 'NA' || log.property_profile_name === 'N/A' || !log.property_profile_name) ? 'Not Set' : log.property_profile_name}`,
          leadId: log.lead_id || "",
          leadName: log.lead_name || "Unknown Lead",
          leadCompany: "N/A",
          propertyName: (log.property_profile_name === 'NA' || log.property_profile_name === 'N/A' || !log.property_profile_name) ? 'Not Set' : log.property_profile_name,
          propertyLocation: "N/A",
          propertyProfileId: log.property_profile_id || "",
          propertyPrice: log.property_profile_price || undefined,
          callerName: log.created_by_name || "Unknown Creator",
          callerPhone: extractedCallerPhone,
          leadPhone: extractedLeadPhone,
          callerId: log.current_staff_id || ""
        });
      }
    } catch (error) {
      throw error;
    }
  }, []);

  // Fetch contact data for dropdown
  React.useEffect(() => {
    const fetchContactOptions = async () => {
      if (!pipelineInfo || !showQuickCallModal) return;

  // ...

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

        const res = await fetch(`${apiBase}/lead/pagination`, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        });

        if (!res.ok) throw new Error("Failed to fetch lead contact data");

        const data = await res.json();

        const options: SelectOption[] = [];
        
        if (Array.isArray(data) && data.length > 0 && data[0].data && Array.isArray(data[0].data)) {
          const leadData = data[0].data[0];
    // ...
          if (leadData.contact_data && Array.isArray(leadData.contact_data)) {
            setLeadContactData(leadData.contact_data);
            
            leadData.contact_data.forEach((contactGroup: ContactData, groupIndex: number) => {
              if (contactGroup.contact_values && Array.isArray(contactGroup.contact_values)) {
                contactGroup.contact_values.forEach((contact: ContactValue, contactIndex: number) => {
                  if (contact.contact_number) {
                    // Filter contact data to only show contacts matching pipelineInfo.callerPhone or leadPhone
                    const contactPhone = contact.contact_number.replace(/\D/g, ''); // Remove non-digits
                    const callerPhone = (pipelineInfo.callerPhone || '').replace(/\D/g, ''); // Remove non-digits
                    const leadPhone = (pipelineInfo.leadPhone || '').replace(/\D/g, ''); // Remove non-digits
                    
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
          }
        }

        setContactOptions(options);

      } catch (error) {
        console.error("Error fetching contact options:", error);
        setContactOptions([]);
      } finally {
        setIsLoadingContacts(false);
      }
    };

    fetchContactOptions();
  }, [pipelineInfo, showQuickCallModal]);

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
    // Contact info validation removed since it's hidden
    if (!formData.notes.trim()) newErrors.notes = "Notes are required.";
    
    // Follow-up validation
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
      const matchingContactData = [];
      const callerPhone = (pipelineInfo.callerPhone || '').replace(/\D/g, ''); // Remove non-digits
      const leadPhone = (pipelineInfo.leadPhone || '').replace(/\D/g, ''); // Remove non-digits
      console.log("5. Caller phone (cleaned):", callerPhone);
      console.log("5. Lead phone (cleaned):", leadPhone);

      if (leadContactData && leadContactData.length > 0) {
        console.log("6. Processing leadContactData to find matching contacts...");
        
        for (const contactGroup of leadContactData) {
          if (contactGroup.contact_values && Array.isArray(contactGroup.contact_values)) {
            const matchingContacts = contactGroup.contact_values.filter(contact => {
              if (contact.contact_number) {
                const contactPhone = contact.contact_number.replace(/\D/g, ''); // Remove non-digits
                const isCallerMatch = contactPhone === callerPhone;
                const isLeadMatch = contactPhone === leadPhone;
                const isMatch = isCallerMatch || isLeadMatch;
                    // ...
                return isMatch;
              }
              return false;
            });

            if (matchingContacts.length > 0) {
              // Structure the contact data as required by the API
              matchingContactData.push({
                channel_type_id: String(contactGroup.channel_type_id),
                contact_values: matchingContacts.map(contact => ({
                  user_name: pipelineInfo.leadName,
                  contact_number: contact.contact_number,
                  remark: contact.remark || "Mobile",
                  is_primary: contact.is_primary
                }))
              });
              // ...
            }
          }
        }
      }

      console.log("9. All matching contact data:", JSON.stringify(matchingContactData, null, 2));
  // ...

      if (matchingContactData.length === 0) {
        // Fallback: create contact_data from pipelineInfo.leadName (from call-log/pagination parent level) and pipelineInfo.leadPhone
        const parentLeadName = pipelineInfo.leadName || '';
        if (pipelineInfo.leadPhone && parentLeadName) {
          matchingContactData.push({
            channel_type_id: "3",
            contact_values: [
              {
                user_name: pipelineInfo.leadName,
                contact_number: pipelineInfo.leadPhone,
                remark: "Mobile",
                is_primary: true
              }
            ]
          });
        } else {
          alert(`No contact data found matching the caller phone (${pipelineInfo.callerPhone}) or lead phone (${pipelineInfo.leadPhone}). Please ensure the lead has the correct contact information.`);
          return;
        }
      }

      const callDate = formData.callDate instanceof Date 
        ? formData.callDate.toISOString().split('T')[0]
        : formData.callDate;
      
      console.log("11. Processed call date:", callDate);
  // ...
      
      const callStartDatetime = `${callDate} ${formData.callStartTime}:00`;
      const callEndDatetime = formData.callEndTime 
        ? `${callDate} ${formData.callEndTime}:00`
        : "";

      console.log("10. Call datetime strings:");
  // ...

      const getContactResultId = (status: string): string => {
        // Since we're now using the API contact_result_id directly as the value,
        // we can just return the status value as it's already the correct ID
        return status || "1"; // Default to "1" (No Answer) if no status provided
      };

      const contactResultId = getContactResultId(formData.callStatus?.value || "");
      console.log("11. Contact Result ID:", contactResultId, "from status:", formData.callStatus);
  // ...

      // Prepare follow-up date if enabled
      // Format follow-up date as local date (YYYY-MM-DD) if enabled
      let followUpDate = null;
      if (formData.isFollowUp && formData.followUpDate instanceof Date) {
        const d = formData.followUpDate;
        followUpDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }

      console.log("12. Follow-up processing:");
  // ...

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
  // ...
      
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      console.log("13. Step 1 API Details:");
      console.log("13. Step 1 API Details: ", JSON.stringify(callLogDetailRequestBody));
  // ...
      // Call the first API to create call log detail
      const callLogDetailResponse = await fetch(`${apiBase}/call-log-detail/create`, {
        method: "POST",
        headers,
        body: JSON.stringify(callLogDetailRequestBody),
      });
      console.log("📡 API CALL 1 COMPLETED");
  // ...

      console.log("14. Step 1 API Response Status:", callLogDetailResponse.status, callLogDetailResponse.statusText);
  // ...
      
      if (!callLogDetailResponse.ok) {
  throw new Error(`Call log detail creation failed with status ${callLogDetailResponse.status}`);
      }
      
      await callLogDetailResponse.json();
  // ...

  // STEP 2: Update call log with follow-up information or status update
  // Find the selected contact_result_description from quick call dropdown
  let selectedContactResultDescription: string | undefined = undefined;
  if (formData.callStatus && formData.callStatus.value && contactResultList.length > 0) {
    const selected = contactResultList.find(
      (item) => item.contact_result_id === parseInt(formData.callStatus!.value, 10)
    );
    if (selected && typeof selected.contact_result_description === 'string') {
      selectedContactResultDescription = selected.contact_result_description;
    }
  }

  // Always fetch the current call log to check for status change
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
    if (
      Array.isArray(currentCallLogData) &&
      currentCallLogData.length > 0 &&
      currentCallLogData[0].data &&
      Array.isArray(currentCallLogData[0].data) &&
      currentCallLogData[0].data.length > 0
    ) {
      const currentLog = currentCallLogData[0].data[0];
      const parentStatusId = String(currentLog.status_id);
      // Only update if follow-up is set OR status_id is changed
      if (
        (formData.isFollowUp && followUpDate) ||
        (typeof selectedContactResultDescription === 'string' && parentStatusId !== selectedContactResultDescription)
      ) {
        // Map contact_result_id (from quick call) to contact_result_description for status_id
        let statusId = "1";
        let selected: ContactResultData | undefined = undefined;
        if (formData.callStatus && formData.callStatus.value && contactResultList.length > 0) {
          selected = contactResultList.find(
            (item) => item.contact_result_id === parseInt(formData.callStatus!.value, 10)
          );
          if (selected && typeof selected.contact_result_description === 'string') {
            statusId = selected.contact_result_description;
          } else {
            // fallback: use value
            statusId = String(formData.callStatus.value);
          }
        }
        // Debug log for mapping
        console.log('[DEBUG] statusId for call-log/update:', statusId, 'selected:', selected, 'formData.callStatus:', formData.callStatus, 'contactResultList:', contactResultList);
        // Prepare the call log update request with the expected structure (no call log detail fetch)
        const callLogUpdateRequestBody = {
          call_log_id: pipelineInfo.pipelineId,
          lead_id: currentLog.lead_id,
          property_profile_id: String(currentLog.property_profile_id),
          status_id: statusId,
          purpose: currentLog.purpose || "Call pipeline management",
          fail_reason: currentLog.fail_reason || null,
          follow_up_date: followUpDate, // Updated field
          is_follow_up: formData.isFollowUp, // Updated field
          is_active: currentLog.is_active !== undefined ? currentLog.is_active : true,
          updated_by: "1" // You might want to get this from user context
        };
        console.log("=== STEP 2: CALL LOG UPDATE API REQUEST ===");
        console.log("[DEBUG] 17. Step 2 API Details:", callLogUpdateRequestBody);
        // Call the second API to update call log with follow-up information or status
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
  // ...
      
  setShowQuickCallModal(false);
  resetForm();
  setShowSuccessModal(true);
      
    } catch (error) {
  alert(`Failed to save quick call log: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success Modal OK handler for both Quick Call and Quick Site Visit
  const handleSuccessOk = () => {
    setShowSuccessModal(false);
    // Always navigate to /callpipeline to ensure refresh
    // Force a hard reload to /callpipeline to ensure the page is fully refreshed
    if (typeof window !== 'undefined') {
      window.location.replace('/callpipeline');
    } else if (router && typeof router.replace === 'function') {
      router.replace('/callpipeline');
    }
  };
  // Site Visit Form Handlers
  const handleSiteVisitChange = (
    field: keyof typeof siteVisitFormData,
    value: string | SelectOption | null | boolean | Date
  ) => {
    setSiteVisitFormData((prev) => ({ ...prev, [field]: value }));
    if (siteVisitErrors[field]) {
      setSiteVisitErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateSiteVisit = () => {
    const newErrors: typeof siteVisitErrors = {};
    if (!siteVisitFormData.visitDate) newErrors.visitDate = "Visit date is required.";
    if (!siteVisitFormData.visitStartTime) newErrors.visitStartTime = "Start time is required.";
    if (!siteVisitFormData.contactResult) newErrors.contactResult = "Contact result is required.";
  // Purpose validation removed as input is not shown
  if (!siteVisitFormData.notes.trim()) newErrors.notes = "Notes/Remarks are required.";
    // Validate end time is after start time if both are provided
    if (siteVisitFormData.visitStartTime && siteVisitFormData.visitEndTime) {
      const startTime = new Date(`2000-01-01T${siteVisitFormData.visitStartTime}`);
      const endTime = new Date(`2000-01-01T${siteVisitFormData.visitEndTime}`);
      if (endTime <= startTime) {
        newErrors.visitEndTime = "End time must be after start time.";
      }
    }
    if (siteVisitFormData.is_follow_up && !siteVisitFormData.follow_up_date) {
      newErrors.follow_up_date = "Follow-up date is required if follow-up is needed.";
    }
    setSiteVisitErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetSiteVisitForm = () => {
    setSiteVisitFormData({
      visitDate: "",
      visitStartTime: "",
      visitEndTime: "",
      contactResult: null,
      purpose: "", // keep for type safety, not used in UI
      notes: "",
      is_follow_up: false,
      follow_up_date: null,
    });
    setSiteVisitPhotos([]);
    setSiteVisitErrors({});
  };


  // Upload multiple photos for site visit (batch, like working page)
  const uploadMultipleSiteVisitPhotos = async (photoFiles: PhotoFile[], siteVisitId: string): Promise<string[]> => {
    if (photoFiles.length === 0) return [];
    const photoFormData = new FormData();
    photoFiles.forEach((photo) => {
      if (photo.file) {
        photoFormData.append('photo', photo.file);
      }
    });
    photoFormData.append('menu', 'site_visit');
    photoFormData.append('photoId', String(siteVisitId));
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    // Do not set Content-Type, let browser set it for multipart/form-data
    const uploadResponse = await fetch(`${apiBase}/files/upload-multiple-photos`, {
      method: 'POST',
      headers,
      body: photoFormData,
    });
    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json().catch(() => ({}));
      throw new Error(errorData.message || `Photo upload failed with status ${uploadResponse.status}`);
    }
    const uploadData = await uploadResponse.json();
    const imageUrls = uploadData.imageUrls;
    if (!imageUrls || !Array.isArray(imageUrls)) {
      throw new Error('No imageUrls array returned from upload response');
    }
    return imageUrls;
  };

  const handleSiteVisitSave = async () => {
    if (!validateSiteVisit() || !pipelineInfo) return;
    try {
      setIsSubmitting(true);
      // Upload photos first (batch, like working page)
      let photoUrls: string[] = [];
      if (siteVisitPhotos.length > 0) {
        try {
          const tempSiteVisitId = `SV-${Date.now()}`;
          photoUrls = await uploadMultipleSiteVisitPhotos(siteVisitPhotos, tempSiteVisitId);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          alert(`Error uploading photos: ${errorMessage}`);
          setIsSubmitting(false);
          return;
        }
      }
      // Format datetime strings for API
      const startDatetime = `${siteVisitFormData.visitDate} ${siteVisitFormData.visitStartTime}:00`;
      const endDatetime = siteVisitFormData.visitEndTime
        ? `${siteVisitFormData.visitDate} ${siteVisitFormData.visitEndTime}:00`
        : "";
      // Prepare API request body (purpose is handled at parent, not here)
      // Use purpose from selectedCallLog if available, fallback to default
      const apiRequestBody = {
        call_id: pipelineInfo.pipelineId,
        property_profile_id: String(pipelineInfo.propertyProfileId),
        staff_id: String(pipelineInfo.callerId || "000001"),
        lead_id: pipelineInfo.leadId,
        contact_result_id: siteVisitFormData.contactResult?.value || "1",
        purpose: (selectedCallLog && selectedCallLog.purpose) ? selectedCallLog.purpose : "Site visit scheduled.",
        start_datetime: startDatetime,
        end_datetime: endDatetime,
        photo_url: photoUrls,
        remark: siteVisitFormData.notes
      };
      console.log('[Quick Site Visit] POST /site-visit/create body:', apiRequestBody);
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
      // After successful site visit creation, update call log follow-up info or status if needed
      // Only send follow-up fields if is_follow_up is true or status_id is changed
      // Map selected contact result to contact_result_description for status_id (like quick call)
      // Find the selected contact_result_description from site visit dropdown
      let selectedSiteVisitContactResultDescription: string | undefined = undefined;
      if (siteVisitFormData.contactResult && siteVisitFormData.contactResult.value && siteVisitContactResultList.length > 0) {
        const selected = siteVisitContactResultList.find(
          (item) => item.contact_result_id === parseInt(siteVisitFormData.contactResult!.value, 10)
        );
        if (selected && typeof selected.contact_result_description === 'string') {
          selectedSiteVisitContactResultDescription = selected.contact_result_description;
        }
      }

      // Always fetch the current call log to check for status change
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
          const parentStatusId = String(currentLog.status_id);
          // Only update if follow-up is set OR status_id is changed
          if (
            (siteVisitFormData.is_follow_up && siteVisitFormData.follow_up_date) ||
            (typeof selectedSiteVisitContactResultDescription === 'string' && parentStatusId !== selectedSiteVisitContactResultDescription)
          ) {
            // Map contact_result_id (from site visit) to contact_result_description for status_id
            let statusId = "1";
            let selected: ContactResultData | undefined = undefined;
            if (siteVisitFormData.contactResult && siteVisitFormData.contactResult.value && siteVisitContactResultList.length > 0) {
              selected = siteVisitContactResultList.find(
                (item) => item.contact_result_id === parseInt(siteVisitFormData.contactResult!.value, 10)
              );
              if (selected && typeof selected.contact_result_description === 'string') {
                statusId = selected.contact_result_description;
              } else {
                // fallback: use value
                statusId = String(siteVisitFormData.contactResult.value);
              }
            }
            // Prepare the call log update request with the expected structure
            const callLogUpdateRequestBody = {
              call_log_id: pipelineInfo.pipelineId,
              lead_id: currentLog.lead_id,
              property_profile_id: String(currentLog.property_profile_id),
              status_id: statusId,
              purpose: currentLog.purpose || "Call pipeline management",
              fail_reason: currentLog.fail_reason || null,
              follow_up_date: siteVisitFormData.follow_up_date
                ? `${siteVisitFormData.follow_up_date.getFullYear()}-${String(siteVisitFormData.follow_up_date.getMonth() + 1).padStart(2, '0')}-${String(siteVisitFormData.follow_up_date.getDate()).padStart(2, '0')}`
                : null,
              is_follow_up: siteVisitFormData.is_follow_up,
              is_active: currentLog.is_active !== undefined ? currentLog.is_active : true,
              updated_by: "1"
            };
            console.log('[Quick Site Visit] PUT /call-log/update-info body:', callLogUpdateRequestBody);
            await fetch(`${apiBase}/call-log/update-info`, {
              method: "PUT",
              headers,
              body: JSON.stringify(callLogUpdateRequestBody),
            });
          }
        }
      }
  setShowQuickSiteVisitModal(false);
  resetSiteVisitForm();
  setShowSuccessModal(true);
    } catch (error) {
      alert(`Failed to save quick site visit: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // (Removed unused handleAddAnother and handleViewHistory for cleanup)
  const handleActionSelect = (action: 'view' | 'edit' | 'delete' | 'quickCall' | 'quickSiteVisit' | 'siteVisit' | 'viewCallHistory' | 'loanPaymentSchedule', callLog: CallLog) => {
  // ...
    
    if (action === 'view') {
      if (!callLog.call_log_id) {
        alert('Error: Call Log ID is missing. Cannot view this record.');
        return;
      }
      router.push(`/callpipeline/view?id=${callLog.call_log_id}`);
    } else if (action === 'edit') {
      if (!callLog.call_log_id) {
        alert('Error: Call Log ID is missing. Cannot edit this record.');
        return;
      }
      router.push(`/callpipeline/edit?id=${callLog.call_log_id}`);
    } else if (action === 'quickCall') {
      handleQuickCall(callLog);
    } else if (action === 'quickSiteVisit') {
      handleQuickSiteVisit(callLog);
    } else if (action === 'viewCallHistory') {
      if (!callLog.call_log_id) {
        alert('Error: Call Log ID is missing. Cannot view call history.');
        return;
      }
      router.push(`/callpipeline/quickcall?pipelineId=${callLog.call_log_id}`);
    } else if (action === 'siteVisit') {
      if (!callLog.call_log_id) {
        alert('Error: Call Log ID is missing. Cannot access site visit.');
        return;
      }
      // Pass callLogId, leadName, and contactNumber as URL parameters
  const leadName = encodeURIComponent(callLog.lead_name || '');
  const contactNumber = encodeURIComponent(callLog.primary_contact_number || '');
  router.push(`/callpipeline/sitevisit?pipelineId=${callLog.call_log_id}&callLogId=${callLog.call_log_id}&leadName=${leadName}&contactNumber=${contactNumber}`);
    } else if (action === 'loanPaymentSchedule') {
      if (!callLog.call_log_id) {
        alert('Error: Call Log ID is missing. Cannot access loan payment schedule.');
        return;
      }
      // Navigate to loan payment schedule with property price and call pipeline ID
      const propertyPrice = callLog.property_profile_price || 0;
      const params = new URLSearchParams({
        propertyPrice: String(propertyPrice),
        callPipelineId: callLog.call_log_id
      });
      router.push(`/callpipeline/payment_schedule?${params.toString()}`);
    }
    // You can add other actions here as needed
  };
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[1000px]">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  {callLogColumnConfig.filter(col => visibleColumns.includes(col.key)).map(col => (
                    <TableCell key={col.key} isHeader className="px-5 py-2 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400">{col.label}</TableCell>
                  ))}
                  <TableCell isHeader className="px-5 py-2 text-center"><span className="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Actions</span></TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {dataWithLatest.map((callLog, rowIdx) => (
                  <TableRow key={callLog.call_log_id || rowIdx} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                    {callLogColumnConfig.filter(col => visibleColumns.includes(col.key)).map((column) => {
                      const value = callLog[column.key];
                      let displayValue: React.ReactNode;
                      
                      // Extract and format phone number directly from call log data
                      if (column.key === 'phone_number') {
                        const phoneNumber = callLog.primary_contact_number;
                        if (!phoneNumber) {
                          displayValue = 'Unknown Number';
                        } else {
                          displayValue = formatPhoneNumber(phoneNumber);
                        }
                      } else {
                        // Handle complex nested objects by converting to string or showing empty
                        if (typeof value === 'object' && value !== null) {
                          displayValue = '';
                        } else {
                          displayValue = value;
                        }
                      }
                      
                      // Replace "NA" with "Not Set" for Property Name and Property Type columns
                      if ((column.key === 'property_profile_name' || column.key === 'property_type_name') && 
                          (displayValue === 'NA' || displayValue === 'na' || displayValue === 'N/A')) {
                        displayValue = 'Not Set';
                      }
                      
                      // Format property price as currency
                      if (column.key === 'property_profile_price' && typeof value === 'number') {
                        displayValue = formatPropertyValue(value);
                      }
                      
                      // Handle boolean values
                      if (typeof value === 'boolean') {
                        displayValue = (
                          <span className={value ? 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'}>
            {value ? 'Yes' : 'No'}
          </span>
                        );
                      }
                      
                      // Apply 5-color pill highlighting for pipeline_status column
                      if (column.key === 'pipeline_status' && (displayValue !== null && displayValue !== undefined && displayValue !== '')) {
                        const statusValue = String(displayValue).toLowerCase();
                        let statusClass = '';
                        if (statusValue.includes('new')) {
                          statusClass = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
                        } else if (statusValue.includes('in-progress')) {
                          statusClass = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
                        } else if (statusValue.includes('site visit')) {
                          statusClass = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
                        } else if (statusValue.includes('success') || statusValue.includes('won')) {
                          statusClass = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
                        } else if (statusValue.includes('fail') || statusValue.includes('failed') || statusValue.includes('lost') || statusValue.includes('closed lost')) {
                          statusClass = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
                        } else {
                          // Default: gray
                          statusClass = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
                        }
                        displayValue = (
                          <span className={statusClass}>
                            {displayValue}
                          </span>
                        );
                      }
                      // Format and color code latest_status_name as a pill
                      else if (column.key === 'latest_status_name' && displayValue) {
                        const statusStr = String(displayValue).toLowerCase();
                        let statusClass = '';
                        if (
                          statusStr === 'schedule site visit' ||
                          statusStr === 'reschedule site visit'
                        ) {
                          // Purpose (purple)
                          statusClass = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
                        } else {
                          // All other statuses: yellow
                          statusClass = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
                        }
                        displayValue = (
                          <span className={statusClass}>{displayValue}</span>
                        );
                      }
                      // Apply unique color highlighting for each column (except pipeline_status and latest_status_name)
                      else if (column.highlight && column.key !== 'pipeline_status' && column.key !== 'latest_status_name' && (displayValue !== null && displayValue !== undefined && displayValue !== '') && (typeof displayValue === 'string' || typeof displayValue === 'number')) {
                        let columnClass = '';
                        
                        switch (column.key) {
                          case 'lead_name':
                            columnClass = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
                            break;
                          case 'phone_number':
                            columnClass = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400';
                            break;
                          case 'property_profile_price':
                            columnClass = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400';
                            break;
                          case 'property_type_name':
                            columnClass = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
                            break;
                          case 'total_call':
                            columnClass = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400';
                            break;
                          case 'total_site_visit':
                            columnClass = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400';
                            break;
                          default:
                            columnClass = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
                        }
                        
                        displayValue = (
                          <span className={columnClass}>
                            {displayValue}
                          </span>
                        );
                      }
                      
                      return (
                        <TableCell key={`${callLog.call_log_id || rowIdx}-col-${column.key}`} className="px-5 py-3 text-gray-800 text-theme-sm dark:text-white/90">
                          {typeof displayValue === 'string' || typeof displayValue === 'number' ? displayValue : displayValue || '-'}
                        </TableCell>
                      );
                    })}
                    <TableCell className="px-5 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <PrimaryActionsMenu callLog={callLog} onSelect={handleActionSelect} />
                        <HistoryActionsMenu callLog={callLog} onSelect={handleActionSelect} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      {!data.length && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 dark:bg-gray-800">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Call Logs Found</h3>
              <p className="text-gray-600 dark:text-gray-400">No call logs available.</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Call Modal */}
      <Modal 
        isOpen={showQuickCallModal} 
        onClose={() => {
          setShowQuickCallModal(false);
          resetForm();
          setPipelineInfo(null);
          setSelectedCallLog(null);
        }}
        className="max-w-4xl p-4 lg:p-11"
      >
        <div className="px-2 lg:pr-14">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Quick Call Entry
          </h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
            {pipelineInfo ? `Add a call log entry for Pipeline #${pipelineInfo.pipelineId}` : 'Add a new call log entry'}
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
                      {formatPhoneNumber(pipelineInfo.callerPhone)}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-gradient-to-br from-purple-50 to-pink-50 p-3 dark:border-gray-700 dark:from-purple-900/20 dark:to-pink-900/20">
                <div className="space-y-1">
                  <h3 className="text-xs font-semibold text-gray-900 dark:text-white">Property</h3>
                  <p className="text-sm font-bold text-purple-800 dark:text-purple-200">{pipelineInfo.propertyName}</p>
                  {pipelineInfo.propertyPrice && (
                    <p className="text-xs text-purple-600 dark:text-purple-300">
                      {formatPropertyValue(pipelineInfo.propertyPrice)}
                    </p>
                  )}
                </div>
              </div>
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
                        handleChange('callDate', selectedDates[0]);
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

                {/* Call Status */}
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

{/* Follow-up Section */}
              <div>
                <Label htmlFor="quickFollowUpToggle">Follow-up Required</Label>
                <span>
                  {/* Follow-up Toggle */}
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
                      {/* <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {formData.isFollowUp ? 'Follow-up required' : 'No follow-up needed'}
                      </span> */}
                    </label>
                  </div>
                  {errors.isFollowUp && <p className="text-sm text-red-500 mt-1">{errors.isFollowUp}</p>}


                </span>
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
                            handleChange('followUpDate', selectedDates[0]);
                          }
                        }}
                      />
                      {errors.followUpDate && <p className="text-sm text-red-500 mt-1">{errors.followUpDate}</p>}
                    </div>
                  )}
              </div>
                        
              

              {/* Contact Information - Hidden for now, but kept for API data fetching */}
              <div style={{ display: 'none' }}>
                <Label htmlFor="quickContactInfo">Contact Information *</Label>
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
                <Label htmlFor="quickNotes">Call Notes *</Label>
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
                  onClick={() => {
                    setShowQuickCallModal(false);
                    resetForm();
                    setPipelineInfo(null);
                    setSelectedCallLog(null);
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
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">Failed to load pipeline information.</p>
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
            Success!
          </h3>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            The action was completed successfully. Click OK to refresh and see the latest info.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-3">
            <Button
              variant="primary"
              onClick={handleSuccessOk}
              className="flex-1"
            >
              OK
            </Button>
          </div>
        </div>
      </Modal>

      {/* Quick Site Visit Modal */}
      <Modal 
        isOpen={showQuickSiteVisitModal} 
        onClose={() => {
          setShowQuickSiteVisitModal(false);
          resetSiteVisitForm();
          setPipelineInfo(null);
          setSelectedCallLog(null);
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
                      {formatPhoneNumber(pipelineInfo.callerPhone)}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-gradient-to-br from-purple-50 to-pink-50 p-3 dark:border-gray-700 dark:from-purple-900/20 dark:to-pink-900/20">
                <div className="space-y-1">
                  <h3 className="text-xs font-semibold text-gray-900 dark:text-white">Property</h3>
                  <p className="text-sm font-bold text-purple-800 dark:text-purple-200">{pipelineInfo.propertyName}</p>
                  {pipelineInfo.propertyPrice && (
                    <p className="text-xs text-purple-600 dark:text-purple-300">
                      {formatPropertyValue(pipelineInfo.propertyPrice)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-4">
                
                {/* Visit Date */}
                <div>
                  <DatePicker
                    id="quick-site-visit-date-picker"
                    label="Visit Date *"
                    placeholder="Select visit date"
                    defaultDate={siteVisitFormData.visitDate}
                    onChange={(selectedDates) => {
                      if (selectedDates && selectedDates.length > 0) {
                        const dateStr = selectedDates[0].toISOString().split('T')[0];
                        handleSiteVisitChange('visitDate', dateStr);
                      }
                    }}
                  />
                  {siteVisitErrors.visitDate && <p className="text-sm text-red-500 mt-1">{siteVisitErrors.visitDate}</p>}
                </div>

                {/* Visit Start Time */}
                <div>
                  <Label htmlFor="quickSiteVisitStartTime">Start Time *</Label>
                  <div className="relative">
                    <InputField
                      type="time"
                      id="quickSiteVisitStartTime"
                      value={siteVisitFormData.visitStartTime}
                      onChange={(e) => handleSiteVisitChange('visitStartTime', e.target.value)}
                      error={!!siteVisitErrors.visitStartTime}
                    />
                    <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                      <TimeIcon />
                    </span>
                  </div>
                  {siteVisitErrors.visitStartTime && <p className="text-sm text-red-500 mt-1">{siteVisitErrors.visitStartTime}</p>}
                </div>

                {/* Visit End Time */}
                <div>
                  <Label htmlFor="quickSiteVisitEndTime">End Time</Label>
                  <div className="relative">
                    <InputField
                      type="time"
                      id="quickSiteVisitEndTime"
                      value={siteVisitFormData.visitEndTime}
                      onChange={(e) => handleSiteVisitChange('visitEndTime', e.target.value)}
                      error={!!siteVisitErrors.visitEndTime}
                    />
                    <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                      <TimeIcon />
                    </span>
                  </div>
                  {siteVisitErrors.visitEndTime && <p className="text-sm text-red-500 mt-1">{siteVisitErrors.visitEndTime}</p>}
                </div>

                {/* Contact Result */}
                <div>
                  <Label htmlFor="quickSiteVisitContactResult">Site Visit Result *</Label>
                  <Select
                    options={siteVisitStatusOptions}
                    value={siteVisitFormData.contactResult}
                    onChange={(option) => handleSiteVisitChange('contactResult', option)}
                    placeholder="Select contact result"
                  />
                  {siteVisitErrors.contactResult && <p className="text-sm text-red-500 mt-1">{siteVisitErrors.contactResult}</p>}
                </div>
              </div>


              {/* Purpose input removed as per requirements. Purpose is handled at parent level. */}

              {/* Follow-up Section */}
              <div>
                <Label htmlFor="quickSiteVisitFollowUpToggle">Follow-up Required</Label>
                <span>
                  <div className="flex items-center">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        id="quickSiteVisitFollowUpToggle"
                        checked={siteVisitFormData.is_follow_up}
                        onChange={(e) => handleSiteVisitChange('is_follow_up', e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out ${
                        siteVisitFormData.is_follow_up ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'
                      }`}>
                        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${
                          siteVisitFormData.is_follow_up ? 'transform translate-x-5' : ''
                        }`}></div>
                      </div>
                    </label>
                  </div>
                  {siteVisitErrors.is_follow_up && <p className="text-sm text-red-500 mt-1">{siteVisitErrors.is_follow_up}</p>}
                </span>
              </div>

              {/* Follow-up Date - Show when toggle is on */}
              {siteVisitFormData.is_follow_up && (
                <div>
                  <DatePicker
                    id="quick-site-visit-follow-up-date-picker"
                    label="Follow-up Date *"
                    placeholder="Select follow-up date"
                    defaultDate={siteVisitFormData.follow_up_date || undefined}
                    onChange={(selectedDates) => {
                      if (selectedDates && selectedDates.length > 0) {
                        handleSiteVisitChange('follow_up_date', selectedDates[0]);
                      }
                    }}
                  />
                  {siteVisitErrors.follow_up_date && <p className="text-sm text-red-500 mt-1">{siteVisitErrors.follow_up_date}</p>}
                </div>
              )}

              {/* Notes/Remarks */}
              <div>
                <Label htmlFor="quickSiteVisitNotes">Notes/Remarks *</Label>
                <TextArea
                  value={siteVisitFormData.notes}
                  onChange={(value) => handleSiteVisitChange('notes', value)}
                  placeholder="Enter notes or remarks about the site visit"
                  rows={4}
                  error={!!siteVisitErrors.notes}
                />
                {siteVisitErrors.notes && <p className="text-sm text-red-500 mt-1">{siteVisitErrors.notes}</p>}
              </div>

              {/* Photos */}
              <div>
                <Label>Photos</Label>
                <PhotoUpload photos={siteVisitPhotos} onPhotosChange={setSiteVisitPhotos} />
                <p className="text-xs text-gray-500 mt-1">Upload up to 10 photos (5MB each)</p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowQuickSiteVisitModal(false);
                    resetSiteVisitForm();
                    setPipelineInfo(null);
                    setSelectedCallLog(null);
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleSiteVisitSave}
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

    </div>
  );
}
