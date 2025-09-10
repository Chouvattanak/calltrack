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

// Interface for the lead export data structure
interface ExportLead {
  lead_id: string;
  gender_id: number;
  gender_name: string;
  customer_type_id: number;
  customer_type_name: string;
  lead_source_id: number;
  lead_source_name: string;
  province_id: number;
  province_name: string;
  district_id: number;
  district_name: string;
  commune_id: number;
  commune_name: string;
  village_id: number;
  village_name: string;
  business_id: number;
  business_name: string;
  initial_staff_id: number;
  initial_staff_name: string;
  current_staff_id: number;
  current_staff_name: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  email: string;
  occupation: string;
  home_address: string;
  street_address: string;
  biz_description: string | null;
  relationship_date: string;
  remark: string;
  photo_url: string;
  is_active: boolean;
  created_date: string;
  created_by: number;
  created_by_name: string;
  last_update: string;
  updated_by: number;
  updated_by_name: string;
  // Extracted contact fields
  contact_number: string;
  channel_type_name: string;
}

const breadcrumbs = [
  { name: "Home", href: "/" },
  { name: "Lead", href: "/lead" },
  { name: "Export Data", href: "/lead/export" }
];

// Export functionality
const exportToCSV = (data: ExportLead[], format: 'csv' | 'excel' = 'csv', fileName: string = 'lead_export') => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // All available columns
  const allColumns: (keyof ExportLead)[] = [
    'lead_id',
    'gender_id',
    'gender_name',
    'customer_type_id',
    'customer_type_name',
    'lead_source_id',
    'lead_source_name',
    'province_id',
    'province_name',
    'district_id',
    'district_name',
    'commune_id',
    'commune_name',
    'village_id',
    'village_name',
    'business_id',
    'business_name',
    'initial_staff_id',
    'initial_staff_name',
    'current_staff_id',
    'current_staff_name',
    'first_name',
    'last_name',
    'date_of_birth',
    'email',
    'occupation',
    'home_address',
    'street_address',
    'biz_description',
    'relationship_date',
    'remark',
    'photo_url',
    'is_active',
    'created_date',
    'created_by',
    'created_by_name',
    'last_update',
    'updated_by',
    'updated_by_name',
    'contact_number',
    'channel_type_name'
  ];

  // Get column labels
  const getColumnLabel = (key: keyof ExportLead): string => {
    const columnConfig = [
      { key: 'lead_id', label: 'Lead ID' },
      { key: 'gender_id', label: 'Gender ID' },
      { key: 'gender_name', label: 'Gender' },
      { key: 'customer_type_id', label: 'Customer Type ID' },
      { key: 'customer_type_name', label: 'Customer Type' },
      { key: 'lead_source_id', label: 'Lead Source ID' },
      { key: 'lead_source_name', label: 'Lead Source' },
      { key: 'province_id', label: 'Province ID' },
      { key: 'province_name', label: 'Province' },
      { key: 'district_id', label: 'District ID' },
      { key: 'district_name', label: 'District' },
      { key: 'commune_id', label: 'Commune ID' },
      { key: 'commune_name', label: 'Commune' },
      { key: 'village_id', label: 'Village ID' },
      { key: 'village_name', label: 'Village' },
      { key: 'business_id', label: 'Business ID' },
      { key: 'business_name', label: 'Business Name' },
      { key: 'initial_staff_id', label: 'Initial Staff ID' },
      { key: 'initial_staff_name', label: 'Initial Staff' },
      { key: 'current_staff_id', label: 'Current Staff ID' },
      { key: 'current_staff_name', label: 'Current Staff' },
      { key: 'first_name', label: 'First Name' },
      { key: 'last_name', label: 'Last Name' },
      { key: 'date_of_birth', label: 'Date of Birth' },
      { key: 'email', label: 'Email' },
      { key: 'occupation', label: 'Occupation' },
      { key: 'home_address', label: 'Home Address' },
      { key: 'street_address', label: 'Street Address' },
      { key: 'biz_description', label: 'Business Description' },
      { key: 'relationship_date', label: 'Relationship Date' },
      { key: 'remark', label: 'Remark' },
      { key: 'photo_url', label: 'Photo URL' },
      { key: 'is_active', label: 'Is Active' },
      { key: 'created_date', label: 'Created Date' },
      { key: 'created_by', label: 'Created By ID' },
      { key: 'created_by_name', label: 'Created By' },
      { key: 'last_update', label: 'Last Update' },
      { key: 'updated_by', label: 'Updated By ID' },
      { key: 'updated_by_name', label: 'Updated By' },
      { key: 'contact_number', label: 'Contact Number' },
      { key: 'channel_type_name', label: 'Contact Type' }
    ];
    
    const config = columnConfig.find(col => col.key === key);
    return config ? config.label : String(key);
  };

  // Format value based on column type
  const formatValue = (value: unknown, key: keyof ExportLead): string => {
    if (value === null || value === undefined) return '';
    
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

export default function LeadExportPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<ExportLead[]>([]);
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel'>('csv');
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch all leads for export
  useEffect(() => {
    let isMounted = true;
    const fetchAllData = async () => {
      try {
        // Use the new export API endpoint
        const body = {
          search_type: "",
          query_search: ""
        };
        
        const response = await fetch(`${getApiBase()}/lead/export`, {
          method: 'POST',
          headers: getApiHeaders(),
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        console.log('Lead Export API Response:', data);
        
        // Handle the expected API response structure: [{ message, status_code, total_row, data }]
        const apiResult = Array.isArray(data) ? data[0] : data;
        let processedLeads: ExportLead[] = [];
        
        if (apiResult && apiResult.data && Array.isArray(apiResult.data)) {
          // Transform the data structure to match ExportLead interface
          processedLeads = apiResult.data.map((item: Record<string, unknown>) => {
            // Extract contact information from contact_data
            let contactNumber = '';
            let channelTypeName = '';
            
            if (Array.isArray(item.contact_data) && item.contact_data.length > 0) {
              const contactData = item.contact_data[0] as Record<string, unknown>;
              
              // Get channel type name (assuming it's available in the contact_data structure)
              if (contactData.channel_type_id === 3) {
                channelTypeName = 'Phone Number';
              } else {
                channelTypeName = 'Other';
              }
              
              // Extract contact number from contact_values
              if (Array.isArray(contactData.contact_values) && contactData.contact_values.length > 0) {
                const contactValue = contactData.contact_values[0] as Record<string, unknown>;
                contactNumber = String(contactValue.contact_number || '');
              }
            }

            return {
              lead_id: String(item.lead_id || ''),
              gender_id: Number(item.gender_id || 0),
              gender_name: String(item.gender_name || ''),
              customer_type_id: Number(item.customer_type_id || 0),
              customer_type_name: String(item.customer_type_name || ''),
              lead_source_id: Number(item.lead_source_id || 0),
              lead_source_name: String(item.lead_source_name || ''),
              province_id: Number(item.province_id || 0),
              province_name: String(item.province_name || ''),
              district_id: Number(item.district_id || 0),
              district_name: String(item.district_name || ''),
              commune_id: Number(item.commune_id || 0),
              commune_name: String(item.commune_name || ''),
              village_id: Number(item.village_id || 0),
              village_name: String(item.village_name || ''),
              business_id: Number(item.business_id || 0),
              business_name: String(item.business_name || ''),
              initial_staff_id: Number(item.initial_staff_id || 0),
              initial_staff_name: String(item.initial_staff_name || ''),
              current_staff_id: Number(item.current_staff_id || 0),
              current_staff_name: String(item.current_staff_name || ''),
              first_name: String(item.first_name || ''),
              last_name: String(item.last_name || ''),
              date_of_birth: String(item.date_of_birth || ''),
              email: String(item.email || ''),
              occupation: String(item.occupation || ''),
              home_address: String(item.home_address || ''),
              street_address: String(item.street_address || ''),
              biz_description: item.biz_description ? String(item.biz_description) : null,
              relationship_date: String(item.relationship_date || ''),
              remark: String(item.remark || ''),
              photo_url: String(item.photo_url || ''),
              is_active: Boolean(item.is_active),
              created_date: String(item.created_date || ''),
              created_by: Number(item.created_by || 0),
              created_by_name: String(item.created_by_name || ''),
              last_update: String(item.last_update || ''),
              updated_by: Number(item.updated_by || 0),
              updated_by_name: String(item.updated_by_name || ''),
              // Extracted contact fields
              contact_number: contactNumber,
              channel_type_name: channelTypeName
            };
          });
        }
        
        if (isMounted) {
          setLeads(processedLeads);
        }
      } catch (error) {
        console.error('Error fetching data for export:', error);
        if (isMounted) {
          setLeads([]);
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
      exportToCSV(leads, exportFormat);
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
                  Back to Leads
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
                      Ready to Export Lead Data
                    </h3>
                    <p className="text-blue-700 dark:text-blue-300 mt-1">
                      <span className="font-bold">{leads.length} records</span> are ready to be exported with all available columns.
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                      The export will include all data fields and properly formatted values including extracted contact information.
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
                  disabled={isExporting || leads.length === 0}
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
                      Export {leads.length} Records
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
                <span className="font-medium">All 41 columns included</span>
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {[
                  'Lead ID', 'Gender ID', 'Gender', 'Customer Type ID', 'Customer Type',
                  'Lead Source ID', 'Lead Source', 'Province ID', 'Province', 'District ID', 
                  'District', 'Commune ID', 'Commune', 'Village ID', 'Village', 'Business ID',
                  'Business Name', 'Initial Staff ID', 'Initial Staff', 'Current Staff ID',
                  'Current Staff', 'First Name', 'Last Name', 'Date of Birth', 'Email',
                  'Occupation', 'Home Address', 'Street Address', 'Business Description',
                  'Relationship Date', 'Remark', 'Photo URL', 'Is Active', 'Created Date',
                  'Created By ID', 'Created By', 'Last Update', 'Updated By ID', 'Updated By',
                  'Contact Number', 'Contact Type'
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
