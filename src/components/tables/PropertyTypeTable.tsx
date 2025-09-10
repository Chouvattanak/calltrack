"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import { 
    EyeIcon, PencilIcon, TrashIcon, EllipsisHorizontalIcon, 
    AdjustmentsHorizontalIcon, XMarkIcon, ChevronLeftIcon, 
    ChevronRightIcon, DocumentMagnifyingGlassIcon,
    TagIcon
} from "@heroicons/react/24/outline";
import Button from "../ui/button/Button";
import api from "@/lib/api";
import LoadingOverlay from "../ui/loading/LoadingOverlay";
import { useRouter } from "next/navigation";

interface ApiPropertyTypeData {
  property_type_id: string;
  property_type_name: string;
  property_type_description: string | null;
  is_active: boolean;
  created_date: string;
  updated_date: string | null;
}

export interface PropertyType {
  id: string;
  name: string;
  description: string;
  status: 'Active' | 'Inactive';
  createdDate: string;
  updatedDate: string;
  raw: ApiPropertyTypeData;
}

const allColumns: { key: keyof PropertyType; label: string }[] = [
    { key: 'id', label: 'Property Type ID' },
    { key: 'name', label: 'Property Type Name' },
    { key: 'description', label: 'Description' },
    { key: 'createdDate', label: 'Created Date' },
    { key: 'updatedDate', label: 'Updated Date' },
    { key: 'status', label: 'Status' },
];

const ActionMenu = ({ propertyType, onSelect }: { propertyType: PropertyType; onSelect: (action: 'view' | 'edit' | 'delete', propertyType: PropertyType) => void; }) => {
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
                <EllipsisHorizontalIcon className="h-5 w-5 text-gray-600 dark:text-white/70" />
            </button>
            {isOpen && (
                <div className="absolute right-0 top-8 bg-white dark:bg-boxdark rounded-lg shadow-lg border border-stroke dark:border-strokedark z-50 min-w-[150px]">
                    <button onClick={() => { onSelect('view', propertyType); setIsOpen(false); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/[0.05] rounded-t-lg">
                        <EyeIcon className="h-4 w-4" />
                        View
                    </button>
                    <button onClick={() => { onSelect('edit', propertyType); setIsOpen(false); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/[0.05]">
                        <PencilIcon className="h-4 w-4" />
                        Edit
                    </button>
                    <button onClick={() => { onSelect('delete', propertyType); setIsOpen(false); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-b-lg">
                        <TrashIcon className="h-4 w-4" />
                        Delete
                    </button>
                </div>
            )}
        </div>
    );
};

export const ColumnSelector = ({ availableColumns, visibleColumns, onToggleColumn }: {
    availableColumns: { key: keyof PropertyType; label: string }[];
    visibleColumns: (keyof PropertyType)[];
    onToggleColumn: (column: keyof PropertyType) => void;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={selectorRef}>
            <Button variant="outline" size="sm" onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2">
                <AdjustmentsHorizontalIcon className="h-4 w-4" />
                Columns
            </Button>
            {isOpen && (
                <div className="absolute right-0 top-10 bg-white dark:bg-boxdark rounded-lg shadow-lg border border-stroke dark:border-strokedark z-50 min-w-[200px] p-2">
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-stroke dark:border-strokedark">
                        <span className="text-sm font-medium text-black dark:text-white">Show Columns</span>
                        <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded">
                            <XMarkIcon className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="space-y-1">
                        {availableColumns.map(column => (
                            <label key={column.key} className="flex items-center gap-2 p-1 hover:bg-gray-50 dark:hover:bg-white/[0.05] rounded cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={visibleColumns.includes(column.key)}
                                    onChange={() => onToggleColumn(column.key)}
                                    className="rounded border-gray-300"
                                />
                                <span className="text-sm text-black dark:text-white">{column.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export const PropertyTypePagination = ({ currentPage, totalPages, onPageChange }: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}) => {
    const getVisiblePages = () => {
        const delta = 2;
        const range = [];
        const rangeWithDots = [];

        for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
            range.push(i);
        }

        if (currentPage - delta > 2) {
            rangeWithDots.push(1, '...');
        } else {
            rangeWithDots.push(1);
        }

        rangeWithDots.push(...range);

        if (currentPage + delta < totalPages - 1) {
            rangeWithDots.push('...', totalPages);
        } else {
            rangeWithDots.push(totalPages);
        }

        return rangeWithDots;
    };

    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-center gap-2 mt-4">
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-1"
            >
                <ChevronLeftIcon className="h-4 w-4" />
                Previous
            </Button>
            
            <div className="flex items-center gap-1">
                {getVisiblePages().map((page, index) => (
                    page === '...' ? (
                        <span key={index} className="px-3 py-1 text-gray-500">...</span>
                    ) : (
                        <Button
                            key={page}
                            variant={currentPage === page ? "primary" : "outline"}
                            size="sm"
                            onClick={() => onPageChange(page as number)}
                            className="min-w-[40px]"
                        >
                            {page}
                        </Button>
                    )
                ))}
            </div>

            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1"
            >
                Next
                <ChevronRightIcon className="h-4 w-4" />
            </Button>
        </div>
    );
};

interface PropertyTypeTableProps {
    externalPropertyTypes?: PropertyType[];
    externalIsLoading?: boolean;
    externalCurrentPage?: number;
    externalTotalPages?: number;
    externalOnPageChange?: (page: number) => void;
    visibleColumns?: (keyof PropertyType)[];
}

const PropertyTypeTable: React.FC<PropertyTypeTableProps> = ({
    externalPropertyTypes,
    externalIsLoading,
    externalCurrentPage,
    externalTotalPages,
    externalOnPageChange,
    visibleColumns: externalVisibleColumns
}) => {
    const [internalPropertyTypes, setInternalPropertyTypes] = useState<PropertyType[]>([]);
    const [internalIsLoading, setInternalIsLoading] = useState(true);
    const [internalCurrentPage, setInternalCurrentPage] = useState(1);
    const [internalTotalPages, setInternalTotalPages] = useState(0);
    const [internalPageSize] = useState(10);

    const router = useRouter();

    // Determine which values to use - ALWAYS prefer external props when provided
    const propertyTypes = Array.isArray(externalPropertyTypes) ? externalPropertyTypes : internalPropertyTypes;
    const isLoading = externalIsLoading !== undefined ? externalIsLoading : internalIsLoading;
    const currentPage = externalCurrentPage !== undefined ? externalCurrentPage : internalCurrentPage;
    const totalPages = externalTotalPages !== undefined ? externalTotalPages : internalTotalPages;
    const pageSize = internalPageSize;

    // Only fetch data internally if external property types array is not provided or is empty
    const shouldFetchInternally = !Array.isArray(externalPropertyTypes);

    useEffect(() => {
        // Don't fetch internally if we have external data
        if (!shouldFetchInternally) {
            return;
        }
        
        const fetchPropertyTypes = async () => {
            setInternalIsLoading(true);
            try {
                // External API call using api.post (same as StaffTable)
                const response = await api.post('/property-type/pagination', {
                    page_number: String(internalCurrentPage),
                    page_size: String(pageSize),
                    search_type: "",
                    query_search: ""
                });
                
                const apiResult = response.data[0];
                
                if (apiResult && apiResult.data) {
                    const formattedPropertyTypes: PropertyType[] = apiResult.data.map((propertyType: ApiPropertyTypeData) => ({
                        id: propertyType.property_type_id,
                        name: propertyType.property_type_name,
                        description: propertyType.property_type_description || 'N/A',
                        status: propertyType.is_active ? 'Active' : 'Inactive',
                        createdDate: new Date(propertyType.created_date).toLocaleDateString(),
                        updatedDate: propertyType.updated_date ? new Date(propertyType.updated_date).toLocaleDateString() : 'N/A',
                        raw: propertyType,
                    }));
                    
                    setInternalPropertyTypes(formattedPropertyTypes);
                    setInternalTotalPages(Math.ceil(apiResult.total_row / pageSize));
                } else {
                    setInternalPropertyTypes([]);
                    setInternalTotalPages(0);
                }
            } catch (error) {
                console.error("Failed to fetch property types from external API:", error);
                setInternalPropertyTypes([]);
                setInternalTotalPages(0);
            } finally {
                setInternalIsLoading(false);
            }
        };

        fetchPropertyTypes();
    }, [internalCurrentPage, pageSize, shouldFetchInternally]);


    // Only use the visibleColumns prop from parent
    const visibleColumns = externalVisibleColumns ?? ['name', 'description', 'status'];

    const handleActionSelect = (action: 'view' | 'edit' | 'delete', propertyType: PropertyType) => {
        if (action === 'view') {
            router.push(`/property-type/view/${propertyType.id}`);
        } else if (action === 'edit') {
            router.push(`/property-type/edit/${propertyType.id}`);
        } else if (action === 'delete') {
            console.log(`${action} property type ${propertyType.id}`);
        }
    };

    const handlePageChange = (page: number) => {
        if (externalOnPageChange) {
            externalOnPageChange(page);
        } else {
            setInternalCurrentPage(page);
        }
    };

    const renderCellContent = (propertyType: PropertyType, columnKey: keyof PropertyType) => {
        switch (columnKey) {
            case 'name':
                return (
                    <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <TagIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">{propertyType.name}</span>
                            <span className="block text-gray-500 text-theme-xs dark:text-gray-400">{propertyType.description}</span>
                        </div>
                    </div>
                );
            case 'status':
                return (
                    <Badge size="sm" color={propertyType.status === "Active" ? "success" : "error"}>
                        {propertyType.status}
                    </Badge>
                );
            default:
                const value = propertyType[columnKey];
                return <span className="text-gray-600 dark:text-gray-400">{typeof value === 'string' || typeof value === 'number' ? value : 'N/A'}</span>;
        }
    };

    const sortedVisibleColumns = allColumns.filter(col => visibleColumns.includes(col.key));

    return (
        <>
            <LoadingOverlay isLoading={isLoading} />
            {/* ColumnSelector is now only rendered in the parent page */}
            <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                <div className="overflow-x-auto">
                    <div className="min-w-[1000px]">
                        <Table>
                            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                                <TableRow>
                                    {sortedVisibleColumns.map(col => (
                                        <TableCell key={col.key} isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                            {col.label}
                                        </TableCell>
                                    ))}
                                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Action</TableCell>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                                {propertyTypes.length === 0 && !isLoading ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={sortedVisibleColumns.length + 1}
                                            className="h-[300px] px-5 py-4"
                                        >
                                            <div className="flex flex-col items-center justify-center h-full w-full text-center text-gray-400 gap-2">
                                                <DocumentMagnifyingGlassIcon className="h-12 w-12" />
                                                <span className="font-medium">No property types found.</span>
                                                <span className="text-sm">There might be a connection issue!!!</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    propertyTypes.map((propertyType) => (
                                        <TableRow key={propertyType.id} className="h-16">
                                            {sortedVisibleColumns.map(col => (
                                                <TableCell key={`${propertyType.id}-${col.key}`} className="px-5 py-4 text-start text-theme-sm h-16 overflow-hidden">
                                                    <div className="truncate max-w-xs">
                                                        {renderCellContent(propertyType, col.key)}
                                                    </div>
                                                </TableCell>
                                            ))}
                                            <TableCell className="px-4 py-3 text-center h-16">
                                                <ActionMenu propertyType={propertyType} onSelect={handleActionSelect} />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
            
            <div className="mt-4">
                <PropertyTypePagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
            </div>
        </>
    );
};

export default PropertyTypeTable;

// Export Pagination and utility functions for external use
export { PropertyTypePagination as Pagination };

export const usePropertyTypeData = (currentPage: number, pageSize: number = 10, searchQuery: string = "", searchType: string = "") => {
    const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalRows, setTotalRows] = useState(0);

    useEffect(() => {
        const fetchPropertyTypes = async () => {
            setIsLoading(true);
            try {
                console.log("Fetching property types with params:", { currentPage, pageSize, searchQuery, searchType });
                
                // External API call using api.post (same as StaffTable)
                const response = await api.post('/property-type/pagination', {
                    page_number: String(currentPage),
                    page_size: String(pageSize),
                    search_type: searchType,
                    query_search: searchQuery
                });
                
                console.log("External API Response:", response.data);
                
                const apiResult = response.data[0];
                if (apiResult && apiResult.data) {
                    const formattedPropertyTypes: PropertyType[] = apiResult.data.map((propertyType: ApiPropertyTypeData) => {
                        return {
                            id: propertyType.property_type_id,
                            name: propertyType.property_type_name,
                            description: propertyType.property_type_description || 'N/A',
                            status: propertyType.is_active ? 'Active' : 'Inactive',
                            createdDate: new Date(propertyType.created_date).toLocaleDateString(),
                            updatedDate: propertyType.updated_date ? new Date(propertyType.updated_date).toLocaleDateString() : 'N/A',
                            raw: propertyType,
                        };
                    });
                    
                    setPropertyTypes(formattedPropertyTypes);
                    setTotalRows(apiResult.total_row);
                } else {
                    console.warn("No data found in API response");
                    setPropertyTypes([]);
                    setTotalRows(0);
                }
            } catch (error) {
                console.error("Failed to fetch property types:", error);
                setPropertyTypes([]);
                setTotalRows(0);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPropertyTypes();
    }, [currentPage, pageSize, searchQuery, searchType]);

    return { propertyTypes, isLoading, totalRows };
};
