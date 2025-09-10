"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { EyeIcon, PencilIcon, TrashIcon, EllipsisHorizontalIcon } from "@heroicons/react/24/outline";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Button from "@/components/ui/button/Button";
import api from "@/lib/api";


interface ApiPropertyData {
  property_profile_id: number;
  property_profile_name: string;
  address: string;
  province_name: string;
  commune_name: string;
  district_name: string;
  village_name: string;
  project_name: string;
  property_type_name: string;
  property_status_name: string;
  room_number: string;
  home_number: string;
  width: number;
  length: number;
  photo_url?: string[];
  is_active: boolean;
  created_by: string;
  created_date: string;
  updated_by: string;
  last_update: string;
  remark: string;
  // ...add more fields as needed
}


export interface Property {
  id: number;
  name: string;
  address: string;
  project: string;
  type: string;
  status: string;
  room: string;
  home: string;
  width: number;
  length: number;
  price: number;
  photoCount: number;
  is_active: boolean;
  created_by: string;
  created_date: string;
  updated_by: string;
  last_update: string;
  remark: string;
  raw: ApiPropertyData;
}


// Column configuration for Property table and column selector
export const propertyColumnConfig: { key: keyof Property; label: string }[] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Property Name' },
  { key: 'address', label: 'Address' },
  { key: 'project', label: 'Project' },
  { key: 'type', label: 'Property Type' },
  { key: 'status', label: 'Status' },
  { key: 'room', label: 'Room Number' },
  { key: 'home', label: 'Home Number' },
  { key: 'width', label: 'Width' },
  { key: 'length', label: 'Length' },
  { key: 'price', label: 'Price' },
  { key: 'photoCount', label: 'Photos' },
  { key: 'is_active', label: 'Active' },
  { key: 'created_by', label: 'Created By' },
  { key: 'created_date', label: 'Created Date' },
  { key: 'updated_by', label: 'Updated By' },
  { key: 'last_update', label: 'Last Update' },
  { key: 'remark', label: 'Remark' },
];

interface PropertyTableProps {
  searchTerm?: string;
  visibleColumns?: (keyof Property)[];
}

// ColumnSelector removed; should be implemented in parent page like StaffTable

// ActionMenu component for property actions
const ActionMenu = ({ property, onSelect }: { property: Property; onSelect: (action: 'view' | 'edit' | 'delete', property: Property) => void; }) => {
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
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors">
                <EllipsisHorizontalIcon className="h-5 w-5 text-gray-500" />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-dark-800 border border-gray-200 dark:border-white/[0.05] rounded-lg shadow-lg z-10">
                    <ul className="py-1">
                        <li><a href="#" onClick={(e) => { e.preventDefault(); onSelect('view', property); setIsOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.05]"><EyeIcon className="h-4 w-4"/> View</a></li>
                        <li><a href="#" onClick={(e) => { e.preventDefault(); onSelect('edit', property); setIsOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.05]"><PencilIcon className="h-4 w-4"/> Edit</a></li>
                        <li><a href="#" onClick={(e) => { e.preventDefault(); onSelect('delete', property); setIsOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-white/[0.05]"><TrashIcon className="h-4 w-4"/> Delete</a></li>
                    </ul>
                </div>
            )}
        </div>
    );
};


export default function PropertyTable({ searchTerm = "", visibleColumns }: PropertyTableProps) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalRows, setTotalRows] = useState(0);
  const pageLimit = 10;

  useEffect(() => {
    const fetchProperties = async () => {
      setIsLoading(true);
      try {
        const body = {
          page_number: String(currentPage),
          page_size: String(pageLimit),
          search_type: '',
          query_search: searchTerm || '',
        };
        // Log the body with a clear prefix for property table pagination
        console.log("[PropertyTable] property-profile/pagination POST body", body);
        const response = await api.post('/property-profile/pagination', body);
        console.log('API response for /property-profile/pagination:', response.data);
        const apiResult = response.data[0];
        if (apiResult && apiResult.data) {
          const formattedProperties: Property[] = apiResult.data.map((property: ApiPropertyData & { price?: number }) => ({
            id: property.property_profile_id,
            name: property.property_profile_name,
            address: [property.province_name, property.commune_name].filter(Boolean).join(', '),
            project: property.project_name,
            type: property.property_type_name,
            status: property.property_status_name || 'Unknown',
            room: property.room_number,
            home: property.home_number,
            width: property.width,
            length: property.length,
            price: property.price ?? 0,
            photoCount: property.photo_url ? property.photo_url.filter(url => url && url.trim() !== '').length : 0,
            is_active: property.is_active,
            created_by: property.created_by,
            created_date: property.created_date,
            updated_by: property.updated_by,
            last_update: property.last_update,
            remark: property.remark,
            raw: property,
          }));
          console.log('Formatted properties:', formattedProperties);
          setProperties(formattedProperties);
          setTotalRows(apiResult.total_row);
        } else {
          setProperties([]);
          setTotalRows(0);
        }
      } catch (error) {
        console.error('Failed to fetch properties:', error);
        setProperties([]);
        setTotalRows(0);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProperties();
  }, [currentPage, searchTerm]);

  const totalPages = Math.ceil(totalRows / pageLimit);
  const columnsToShow: (keyof Property)[] = visibleColumns || ['id', 'name', 'address', 'project', 'type', 'status', 'photoCount', 'room', 'home', 'width', 'length'];

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (status?.toLowerCase()) {
      case 'available':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400`;
      case 'reserved':
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400`;
      case 'sold':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400`;
    }
  };

  // Format price with $ and commas
  const formatPrice = (price: number) => {
    return `$${price.toLocaleString()}`;
  };

  // Format Property ID to display property_profile_id directly
  const formatPropertyId = (property: Property): string => {
    return String(property.raw.property_profile_id);
  };

  // Format datetime with AM/PM
  const formatDateTime = (dateString: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateString;
    }
  };

  // Styled component for highlighted fields - more subtle version
  const HighlightedCell = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`inline-flex items-center px-2 py-1 rounded-md bg-gray-50 dark:bg-gray-800/30 font-medium text-sm ${className}`}>
      {children}
    </div>
  );

  const handleActionSelect = (action: 'view' | 'edit' | 'delete', property: Property) => {
    if (action === 'view') {
      router.push(`/property/view?id=${property.id}`);
    } else if (action === 'edit') {
      router.push(`/property/edit?id=${property.id}`);
    } else if (action === 'delete') {
      if (confirm('Are you sure you want to delete this property?')) {
        console.log('Delete property:', property.id);
        // Handle delete logic here
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading properties...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoading && properties.length === 0) {
    return (
      <div className="space-y-4">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 dark:bg-gray-800">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Properties Found</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm ? `No properties match "${searchTerm}"` : "No properties available."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[800px]">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  {propertyColumnConfig
                    .filter(col => columnsToShow.includes(col.key))
                    .map((column) => (
                      <TableCell
                        key={column.key}
                        isHeader
                        className="px-5 py-2 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400"
                      >
                        {column.label}
                      </TableCell>
                  ))}
                  <TableCell isHeader className="px-5 py-2 text-center">
                    <span className="font-medium text-gray-500 text-theme-xs dark:text-gray-400">
                      Actions
                    </span>
                  </TableCell>
                </TableRow>
              </TableHeader>
              
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {properties.map((property, rowIdx) => (
                  <TableRow 
                    key={property.id || rowIdx} 
                    className="hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                  >
                    {propertyColumnConfig
                      .filter(col => columnsToShow.includes(col.key))
                      .map((column) => {
                        const value = property[column.key];
                        
                        // Format specific columns with subtle emphasis
                        if (column.key === 'id') {
                          return (
                            <TableCell key={`${property.id || rowIdx}-col-${column.key}`} className="px-5 py-3 text-gray-800 text-theme-sm dark:text-white/90">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                                {formatPropertyId(property)}
                              </span>
                            </TableCell>
                          );
                        } else if (column.key === 'name' && typeof value === 'string') {
                          return (
                            <TableCell key={`${property.id || rowIdx}-col-${column.key}`} className="px-5 py-3 text-gray-800 text-theme-sm dark:text-white/90">
                              <HighlightedCell className="text-gray-900 dark:text-white">
                                {value}
                              </HighlightedCell>
                            </TableCell>
                          );
                        } else if (column.key === 'room' && value) {
                          return (
                            <TableCell key={`${property.id || rowIdx}-col-${column.key}`} className="px-5 py-3 text-gray-800 text-theme-sm dark:text-white/90">
                              <HighlightedCell className="text-gray-800 dark:text-gray-200">
                                {String(value)}
                              </HighlightedCell>
                            </TableCell>
                          );
                        } else if (column.key === 'width' && typeof value === 'number') {
                          return (
                            <TableCell key={`${property.id || rowIdx}-col-${column.key}`} className="px-5 py-3 text-gray-800 text-theme-sm dark:text-white/90">
                              <HighlightedCell className="text-gray-800 dark:text-gray-200">
                                {value}m
                              </HighlightedCell>
                            </TableCell>
                          );
                        } else if (column.key === 'length' && typeof value === 'number') {
                          return (
                            <TableCell key={`${property.id || rowIdx}-col-${column.key}`} className="px-5 py-3 text-gray-800 text-theme-sm dark:text-white/90">
                              <HighlightedCell className="text-gray-800 dark:text-gray-200">
                                {value}m
                              </HighlightedCell>
                            </TableCell>
                          );
                        } else if (column.key === 'price' && typeof value === 'number') {
                          return (
                            <TableCell key={`${property.id || rowIdx}-col-${column.key}`} className="px-5 py-3 text-gray-800 text-theme-sm dark:text-white/90">
                              <HighlightedCell className="text-green-600 dark:text-green-400 font-semibold">
                                {formatPrice(value)}
                              </HighlightedCell>
                            </TableCell>
                          );
                        } else if (column.key === 'photoCount' && typeof value === 'number') {
                          return (
                            <TableCell key={`${property.id || rowIdx}-col-${column.key}`} className="px-5 py-3 text-gray-800 text-theme-sm dark:text-white/90">
                              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="font-medium">{value}</span>
                              </div>
                            </TableCell>
                          );
                        } else if (column.key === 'status' && typeof value === 'string') {
                          return (
                            <TableCell key={`${property.id || rowIdx}-col-${column.key}`} className="px-5 py-3 text-gray-800 text-theme-sm dark:text-white/90">
                              <span className={getStatusBadge(value)}>
                                {value}
                              </span>
                            </TableCell>
                          );
                        } else if (column.key === 'created_date' || column.key === 'last_update') {
                          return (
                            <TableCell key={`${property.id || rowIdx}-col-${column.key}`} className="px-5 py-3 text-gray-800 text-theme-sm dark:text-white/90">
                              {formatDateTime(value as string)}
                            </TableCell>
                          );
                        } else if (column.key === 'is_active') {
                          return (
                            <TableCell key={`${property.id || rowIdx}-col-${column.key}`} className="px-5 py-3 text-gray-800 text-theme-sm dark:text-white/90">
                              <span className={value ? 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'}>
                                {value ? 'Active' : 'Inactive'}
                              </span>
                            </TableCell>
                          );
                        } else {
                          return (
                            <TableCell key={`${property.id || rowIdx}-col-${column.key}`} className="px-5 py-3 text-gray-800 text-theme-sm dark:text-white/90">
                              {typeof value === 'string' || typeof value === 'number' ? value : '-'}
                            </TableCell>
                          );
                        }
                      })}
                    <TableCell className="px-5 py-3">
                      <div className="flex items-center justify-center">
                        <ActionMenu property={property} onSelect={handleActionSelect} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {(currentPage - 1) * pageLimit + 1} to {Math.min(currentPage * pageLimit, totalRows)} of {totalRows} properties
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "primary" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className="w-10 h-10"
              >
                {page}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1"
          >
            Next
            <ChevronRightIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
