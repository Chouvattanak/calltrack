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

// Interface for the property export data structure
interface ExportProperty {
  property_profile_id: number;
  property_type_id: number;
  property_type_name: string;
  project_id: number;
  project_name: string;
  project_owner_id: number;
  property_status_id: number;
  property_status_name: string;
  project_owner_name: string;
  province_id: number;
  province_name: string;
  district_id: number;
  district_name: string;
  commune_id: number;
  commune_name: string;
  village_id: number;
  village_name: string;
  property_profile_name: string;
  home_number: string;
  room_number: string;
  address: string;
  width: number;
  length: number;
  price: number;
  bedroom: number;
  bathroom: number;
  year_built: string;
  description: string;
  feature: string;
  photo_url: string[];
  photo_count: number; // Calculated field for photo count
  is_active: boolean;
  created_by: string;
  created_date: string;
  updated_by: string;
  last_update: string;
}

const breadcrumbs = [
  { name: "Home", href: "/" },
  { name: "Property", href: "/property" },
  { name: "Export Data", href: "/property/export" }
];

// Export functionality
const exportToCSV = (data: ExportProperty[], format: 'csv' | 'excel' = 'csv', fileName: string = 'property_export') => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // All available columns
  const allColumns: (keyof ExportProperty)[] = [
    'property_profile_id',
    'property_type_id',
    'property_type_name',
    'project_id',
    'project_name',
    'project_owner_id',
    'property_status_id',
    'property_status_name',
    'project_owner_name',
    'province_id',
    'province_name',
    'district_id',
    'district_name',
    'commune_id',
    'commune_name',
    'village_id',
    'village_name',
    'property_profile_name',
    'home_number',
    'room_number',
    'address',
    'width',
    'length',
    'price',
    'bedroom',
    'bathroom',
    'year_built',
    'description',
    'feature',
    'photo_count',
    'is_active',
    'created_by',
    'created_date',
    'updated_by',
    'last_update'
  ];

  // Get column labels
  const getColumnLabel = (key: keyof ExportProperty): string => {
    const columnConfig = [
      { key: 'property_profile_id', label: 'Property ID' },
      { key: 'property_type_id', label: 'Property Type ID' },
      { key: 'property_type_name', label: 'Property Type' },
      { key: 'project_id', label: 'Project ID' },
      { key: 'project_name', label: 'Project Name' },
      { key: 'project_owner_id', label: 'Owner ID' },
      { key: 'property_status_id', label: 'Status ID' },
      { key: 'property_status_name', label: 'Status' },
      { key: 'project_owner_name', label: 'Owner Name' },
      { key: 'province_id', label: 'Province ID' },
      { key: 'province_name', label: 'Province' },
      { key: 'district_id', label: 'District ID' },
      { key: 'district_name', label: 'District' },
      { key: 'commune_id', label: 'Commune ID' },
      { key: 'commune_name', label: 'Commune' },
      { key: 'village_id', label: 'Village ID' },
      { key: 'village_name', label: 'Village' },
      { key: 'property_profile_name', label: 'Property Name' },
      { key: 'home_number', label: 'Home Number' },
      { key: 'room_number', label: 'Room Number' },
      { key: 'address', label: 'Address' },
      { key: 'width', label: 'Width (m)' },
      { key: 'length', label: 'Length (m)' },
      { key: 'price', label: 'Price' },
      { key: 'bedroom', label: 'Bedrooms' },
      { key: 'bathroom', label: 'Bathrooms' },
      { key: 'year_built', label: 'Year Built' },
      { key: 'description', label: 'Description' },
      { key: 'feature', label: 'Features' },
      { key: 'photo_count', label: 'Photo Count' },
      { key: 'is_active', label: 'Is Active' },
      { key: 'created_by', label: 'Created By' },
      { key: 'created_date', label: 'Created Date' },
      { key: 'updated_by', label: 'Updated By' },
      { key: 'last_update', label: 'Last Update' }
    ];
    
    const config = columnConfig.find(col => col.key === key);
    return config ? config.label : String(key);
  };

  // Format value based on column type
  const formatValue = (value: unknown, key: keyof ExportProperty): string => {
    if (value === null || value === undefined) return '';
    
    if (key === 'price' && typeof value === 'number') {
      return `$${value.toLocaleString('en-US')}`;
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

export default function PropertyExportPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<ExportProperty[]>([]);
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel'>('csv');
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch all properties for export
  useEffect(() => {
    let isMounted = true;
    const fetchAllData = async () => {
      try {
        // Use the new export API endpoint
        const body = {
          search_type: "",
          query_search: ""
        };
        
        const response = await fetch(`${getApiBase()}/property-profile/export`, {
          method: 'POST',
          headers: getApiHeaders(),
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        console.log('Property Export API Response:', data);
        
        // Handle the expected API response structure: [{ message, status_code, total_row, data }]
        const apiResult = Array.isArray(data) ? data[0] : data;
        let processedProperties: ExportProperty[] = [];
        
        if (apiResult && apiResult.data && Array.isArray(apiResult.data)) {
          // Transform the data structure to match ExportProperty interface
          processedProperties = apiResult.data.map((item: Record<string, unknown>) => ({
            property_profile_id: Number(item.property_profile_id || 0),
            property_type_id: Number(item.property_type_id || 0),
            property_type_name: String(item.property_type_name || ''),
            project_id: Number(item.project_id || 0),
            project_name: String(item.project_name || ''),
            project_owner_id: Number(item.project_owner_id || 0),
            property_status_id: Number(item.property_status_id || 0),
            property_status_name: String(item.property_status_name || ''),
            project_owner_name: String(item.project_owner_name || ''),
            province_id: Number(item.province_id || 0),
            province_name: String(item.province_name || ''),
            district_id: Number(item.district_id || 0),
            district_name: String(item.district_name || ''),
            commune_id: Number(item.commune_id || 0),
            commune_name: String(item.commune_name || ''),
            village_id: Number(item.village_id || 0),
            village_name: String(item.village_name || ''),
            property_profile_name: String(item.property_profile_name || ''),
            home_number: String(item.home_number || ''),
            room_number: String(item.room_number || ''),
            address: String(item.address || ''),
            width: Number(item.width || 0),
            length: Number(item.length || 0),
            price: Number(item.price || 0),
            bedroom: Number(item.bedroom || 0),
            bathroom: Number(item.bathroom || 0),
            year_built: String(item.year_built || ''),
            description: String(item.description || ''),
            feature: String(item.feature || ''),
            photo_url: Array.isArray(item.photo_url) ? item.photo_url : [],
            photo_count: Array.isArray(item.photo_url) ? item.photo_url.length : 0, // Calculate photo count
            is_active: Boolean(item.is_active),
            created_by: String(item.created_by || ''),
            created_date: String(item.created_date || ''),
            updated_by: String(item.updated_by || ''),
            last_update: String(item.last_update || '')
          }));
        }
        
        if (isMounted) {
          setProperties(processedProperties);
        }
      } catch (error) {
        console.error('Error fetching data for export:', error);
        if (isMounted) {
          setProperties([]);
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
      exportToCSV(properties, exportFormat);
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
                  Back to Properties
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
                      Ready to Export Property Data
                    </h3>
                    <p className="text-blue-700 dark:text-blue-300 mt-1">
                      <span className="font-bold">{properties.length} records</span> are ready to be exported with all available columns.
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                      The export will include all data fields and properly formatted values including photo count.
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
                  disabled={isExporting || properties.length === 0}
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
                      Export {properties.length} Records
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
                <span className="font-medium">All 35 columns included</span>
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {[
                  'Property ID', 'Property Type ID', 'Property Type', 'Project ID', 'Project Name',
                  'Owner ID', 'Status ID', 'Status', 'Owner Name', 'Province ID', 'Province',
                  'District ID', 'District', 'Commune ID', 'Commune', 'Village ID', 'Village',
                  'Property Name', 'Home Number', 'Room Number', 'Address', 'Width (m)', 'Length (m)',
                  'Price', 'Bedrooms', 'Bathrooms', 'Year Built', 'Description', 'Features',
                  'Photo Count', 'Is Active', 'Created By', 'Created Date', 'Updated By', 'Last Update'
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
