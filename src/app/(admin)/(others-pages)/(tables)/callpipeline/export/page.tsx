"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import LoadingOverlay from "@/components/ui/loading/LoadingOverlay";
import Button from "@/components/ui/button/Button";
import Select from "@/components/form/Select";
import { getApiBase, getApiHeaders } from "@/lib/apiHelpers";
import { 
  DocumentArrowDownIcon,
  ArrowLeftIcon,
  CheckCircleIcon
} from "@heroicons/react/24/outline";

// Extended interface for the flattened export data structure
interface ExportCallLog {
  // Base call log fields
  call_log_id: string;
  lead_id: string;
  lead_name: string;
  property_profile_id: number;
  property_profile_name: string;
  property_profile_price: number;
  property_type_id: number;
  property_type_name: string;
  total_call: number;
  total_site_visit: number;
  status_id: number;
  status: string;
  purpose: string;
  fail_reason: string | null;
  follow_up_date: string;
  is_follow_up: boolean;
  is_active: boolean;
  created_date: string;
  created_by_id: string;
  created_by_name: string;
  last_update: string;
  updated_by_id: string;
  updated_by_name: string;
  
  // Flattened call log detail fields
  call_log_detail_id?: string;
  contact_result_id?: number;
  call_date?: string;
  call_start_datetime?: string;
  call_end_datetime?: string;
  total_call_minute?: number;
  remark?: string;
  updated_by?: number;
  contact_number?: string; // Extracted from contact_data with channel_type_id = 3
  
  // Flattened site visit detail fields
  site_visit_id?: string;
  call_id?: string;
  staff_id?: number;
  staff_name?: string;
  contact_result_name?: string;
  start_datetime?: string;
  end_datetime?: string;
}

const breadcrumbs = [
  { name: "Home", href: "/" },
  { name: "Call Pipeline", href: "/callpipeline" },
  { name: "Export Data", href: "/callpipeline/export" }
];

// Export functionality
const exportToCSV = (data: ExportCallLog[], format: 'csv' | 'excel' = 'csv', fileName: string = 'call_pipeline_export') => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // All available columns (updated for flattened structure)
  const allColumns: (keyof ExportCallLog)[] = [
    'call_log_id',
    'lead_id',
    'lead_name', 
    'contact_number', // This is the phone number field from the flattened structure
    'property_profile_id',
    'property_profile_name',
    'property_profile_price',
    'property_type_id',
    'property_type_name',
    'total_call',
    'total_site_visit',
    'status_id',
    'status',
    'purpose',
    'fail_reason',
    'follow_up_date',
    'is_follow_up',
    'is_active',
    'created_date',
    'created_by_id',
    'created_by_name',
    'last_update',
    'updated_by_id',
    'updated_by_name',
    // Call log detail fields (now flattened)
    'call_log_detail_id',
    'contact_result_id',
    'call_date',
    'call_start_datetime',
    'call_end_datetime',
    'total_call_minute',
    'remark',
    'updated_by',
    // Site visit detail fields (now flattened)
    'site_visit_id',
    'call_id',
    'staff_id',
    'staff_name',
    'contact_result_name',
    'start_datetime',
    'end_datetime'
  ];

  // Get column labels
  const getColumnLabel = (key: keyof ExportCallLog): string => {
    const columnConfig = [
      { key: 'call_log_id', label: 'Call Log ID' },
      { key: 'lead_id', label: 'Lead ID' },
      { key: 'lead_name', label: 'Lead Full Name' },
      { key: 'contact_number', label: 'Phone Number' },
      { key: 'property_profile_id', label: 'Property Profile ID' },
      { key: 'property_profile_name', label: 'Property Name' },
      { key: 'property_profile_price', label: 'Property Price' },
      { key: 'property_type_id', label: 'Property Type ID' },
      { key: 'property_type_name', label: 'Property Type' },
      { key: 'total_call', label: 'Total Call' },
      { key: 'total_site_visit', label: 'Total Site Visit' },
      { key: 'status_id', label: 'Status ID' },
      { key: 'status', label: 'Status' },
      { key: 'purpose', label: 'Purpose' },
      { key: 'fail_reason', label: 'Fail Reason' },
      { key: 'follow_up_date', label: 'Follow Up Date' },
      { key: 'is_follow_up', label: 'Is Follow Up' },
      { key: 'is_active', label: 'Is Active' },
      { key: 'created_date', label: 'Created Date' },
      { key: 'created_by_id', label: 'Created By ID' },
      { key: 'created_by_name', label: 'Created By' },
      { key: 'last_update', label: 'Last Update' },
      { key: 'updated_by_id', label: 'Updated By ID' },
      { key: 'updated_by_name', label: 'Updated By' },
      // Call log detail fields
      { key: 'call_log_detail_id', label: 'Call Detail ID' },
      { key: 'contact_result_id', label: 'Contact Result ID' },
      { key: 'call_date', label: 'Call Date' },
      { key: 'call_start_datetime', label: 'Call Start Time' },
      { key: 'call_end_datetime', label: 'Call End Time' },
      { key: 'total_call_minute', label: 'Call Duration (minutes)' },
      { key: 'remark', label: 'Remark' },
      { key: 'updated_by', label: 'Updated By User ID' },
      // Site visit detail fields
      { key: 'site_visit_id', label: 'Site Visit ID' },
      { key: 'call_id', label: 'Related Call ID' },
      { key: 'staff_id', label: 'Staff ID' },
      { key: 'staff_name', label: 'Staff Name' },
      { key: 'contact_result_name', label: 'Contact Result' },
      { key: 'start_datetime', label: 'Visit Start Time' },
      { key: 'end_datetime', label: 'Visit End Time' }
    ];
    
    const config = columnConfig.find(col => col.key === key);
    return config ? config.label : String(key);
  };

  // Format value based on column type
  const formatValue = (value: unknown, key: keyof ExportCallLog): string => {
    if (value === null || value === undefined) return '';
    
    if (key === 'property_profile_price' && typeof value === 'number') {
      return `$${value.toLocaleString('en-US')}`;
    }
    
    if (key === 'contact_number' && typeof value === 'string') {
      const cleaned = value.replace(/\D/g, "");
      if (cleaned.startsWith("855") && cleaned.length >= 9) {
        const remaining = cleaned.substring(3);
        if (remaining.length >= 8) {
          const part1 = remaining.substring(0, 3);
          const part2 = remaining.substring(3, 6);
          const part3 = remaining.substring(6, 10);
          return `(+855) ${part1}-${part2}-${part3}`;
        }
      }
      return value;
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    if (typeof value === 'string' && value.includes(',')) {
      return `"${value}"`;
    }
    
    return String(value);
  };

  // Create CSV headers and rows
  const headers = allColumns.map(getColumnLabel);
  const rows = data.map(row => 
    allColumns.map(column => formatValue(row[column], column))
  );

  // Combine headers and rows
  const csvContent = [headers, ...rows]
    .map(row => row.join(','))
    .join('\n');

  // Create and download file
  const mimeType = format === 'excel' ? 'application/vnd.ms-excel' : 'text/csv;charset=utf-8;';
  const fileExtension = format === 'excel' ? 'xls' : 'csv';
  
  const blob = new Blob([csvContent], { type: mimeType });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}_${new Date().toISOString().split('T')[0]}.${fileExtension}`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function ExportPage() {
  const router = useRouter();
  const [callLogs, setCallLogs] = useState<ExportCallLog[]>([]);
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel'>('csv');
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch all call logs for export
  useEffect(() => {
    let isMounted = true;
    const fetchAllData = async () => {
      try {
        // Use the new export API endpoint
        const body = {
          search_type: "",
          query_search: ""
        };
        
        const response = await fetch(`${getApiBase()}/call-log/export`, {
          method: 'POST',
          headers: getApiHeaders(),
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        console.log('Export API Response:', data);
        
        // Handle the expected API response structure: [{ message, status_code, total_row, data }]
        const apiResult = Array.isArray(data) ? data[0] : data;
        let processedLogs: ExportCallLog[] = [];
        
        if (apiResult && apiResult.data && Array.isArray(apiResult.data)) {
          // Transform the flattened data structure to match ExportCallLog interface
          processedLogs = apiResult.data.map((item: Record<string, unknown>) => ({
            call_log_id: item.call_log_id || '',
            lead_id: item.lead_id || '',
            lead_name: item.lead_name || '',
            contact_number: item.contact_number || '', // Extract contact_number from flattened structure
            property_profile_id: item.property_profile_id || 0,
            property_profile_name: item.property_profile_name || '',
            property_profile_price: item.property_profile_price || 0,
            property_type_id: item.property_type_id || 0,
            property_type_name: item.property_type_name || '',
            total_call: item.total_call || 0,
            total_site_visit: item.total_site_visit || 0,
            status_id: item.status_id || 0,
            status: item.status || '',
            purpose: item.purpose || '',
            fail_reason: item.fail_reason || '',
            follow_up_date: item.follow_up_date || '',
            is_follow_up: item.is_follow_up || false,
            is_active: item.is_active || true,
            created_date: item.created_date || '',
            created_by_id: item.created_by_id || '',
            created_by_name: item.created_by_name || '',
            last_update: item.last_update || '',
            updated_by_id: item.updated_by_id || '',
            updated_by_name: item.updated_by_name || '',
            // Add call log detail fields if they exist in the flattened structure
            call_log_detail_id: item.call_log_detail_id || '',
            contact_result_id: item.contact_result_id || 0,
            call_date: item.call_date || '',
            call_start_datetime: item.call_start_datetime || '',
            call_end_datetime: item.call_end_datetime || '',
            total_call_minute: item.total_call_minute || 0,
            remark: item.remark || '',
            updated_by: item.updated_by || 0,
            // Add site visit detail fields if they exist in the flattened structure
            site_visit_id: item.site_visit_id || '',
            call_id: item.call_id || '',
            staff_id: item.staff_id || 0,
            staff_name: item.staff_name || '',
            contact_result_name: item.contact_result_name || '',
            start_datetime: item.start_datetime || '',
            end_datetime: item.end_datetime || ''
          }));
        }
        
        if (isMounted) {
          setCallLogs(processedLogs);
        }
      } catch (error) {
        console.error('Error fetching data for export:', error);
        if (isMounted) {
          setCallLogs([]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    
    fetchAllData();
    return () => { isMounted = false; };
  }, []);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Small delay for UX
      exportToCSV(callLogs, exportFormat);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return <LoadingOverlay isLoading={true} />;
  }

  return (
    <div className="space-y-6">
      <PageBreadcrumb crumbs={breadcrumbs} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Export Configuration */}
        <div className="lg:col-span-2">
          <ComponentCard title="Export Configuration">
            <div className="space-y-6">
              {/* Back Button */}
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.back()}
                  className="flex items-center gap-2"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  Back to Call Pipeline
                </Button>
              </div>

              {/* Export Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-800/50">
                    <DocumentArrowDownIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                      Ready to Export Call Pipeline Data
                    </h3>
                    <p className="text-blue-700 dark:text-blue-300 mt-1">
                      <span className="font-bold">{callLogs.length} records</span> are ready to be exported with all available columns.
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                      The export will include all data fields and properly formatted values.
                    </p>
                  </div>
                </div>
              </div>

              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Export Format
                </label>
                <Select
                  options={[
                    { value: 'csv', label: 'CSV File (.csv) - Recommended' },
                    { value: 'excel', label: 'Excel File (.xls)' }
                  ]}
                  value={exportFormat === 'csv' ? 
                    { value: 'csv', label: 'CSV File (.csv) - Recommended' } : 
                    { value: 'excel', label: 'Excel File (.xls)' }
                  }
                  onChange={(option) => setExportFormat(option?.value as 'csv' | 'excel' || 'csv')}
                  placeholder="Select export format"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  CSV format is recommended for better compatibility with spreadsheet applications.
                </p>
              </div>

              {/* Export Button */}
              <div className="pt-4">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleExport}
                  disabled={isExporting || callLogs.length === 0}
                  className="w-full sm:w-auto flex items-center justify-center gap-3"
                >
                  {isExporting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <DocumentArrowDownIcon className="h-5 w-5" />
                      Export {callLogs.length} Records
                    </>
                  )}
                </Button>
              </div>
            </div>
          </ComponentCard>
        </div>

        {/* Included Columns */}
        <div className="lg:col-span-1">
          <ComponentCard title="Included Columns">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <CheckCircleIcon className="h-4 w-4" />
                <span className="font-medium">All {38} columns included</span>
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {[
                  'Call Log ID', 'Lead ID', 'Lead Full Name', 'Phone Number', 'Property Profile ID',
                  'Property Name', 'Property Price', 'Property Type ID', 'Property Type', 'Total Call',
                  'Total Site Visit', 'Status ID', 'Status', 'Purpose', 'Fail Reason', 'Follow Up Date',
                  'Is Follow Up', 'Is Active', 'Created Date', 'Created By ID', 'Created By',
                  'Last Update', 'Updated By ID', 'Updated By', 'Call Detail ID', 'Contact Result ID',
                  'Call Date', 'Call Start Time', 'Call End Time', 'Call Duration (minutes)', 'Remark',
                  'Updated By User ID', 'Site Visit ID', 'Related Call ID', 'Staff ID', 'Staff Name',
                  'Contact Result', 'Visit Start Time', 'Visit End Time'
                ].map((column, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{column}</span>
                  </div>
                ))}
              </div>
            </div>
          </ComponentCard>
        </div>
      </div>
    </div>
  );
}
