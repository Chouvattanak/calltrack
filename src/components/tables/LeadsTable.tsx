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
import Image from "next/image";
import { 
    EyeIcon, PencilIcon, TrashIcon, EllipsisHorizontalIcon, 
    AdjustmentsHorizontalIcon, XMarkIcon, ChevronLeftIcon, 
    ChevronRightIcon, DocumentMagnifyingGlassIcon, UserCircleIcon, 
    CakeIcon, PhoneIcon, BriefcaseIcon, MapPinIcon, 
    TagIcon, BuildingOffice2Icon, CalendarDaysIcon, InformationCircleIcon
} from "@heroicons/react/24/outline";
import Button from "../ui/button/Button";
import api from "@/lib/api";
import LoadingOverlay from "../ui/loading/LoadingOverlay";
import { useRouter } from "next/navigation";

// Phone number formatting function for Cambodia
const formatPhoneNumber = (phoneNumber: string): string => {
    if (!phoneNumber || typeof phoneNumber !== 'string') return phoneNumber;
    
    // Remove all non-digit characters
    const digits = phoneNumber.replace(/\D/g, "");
    
    // Check if it has characters or length < 8, leave it as is
    if (phoneNumber !== digits || digits.length < 8) {
        return phoneNumber; // Contains characters or too short
    }
    
    // Handle different phone number formats
    if (digits.startsWith("855")) {
        // Already has country code
        const remaining = digits.slice(3);
        if (remaining.length >= 6) {
            const part1 = remaining.slice(0, 3);
            const part2 = remaining.slice(3, 6);
            const part3 = remaining.slice(6);
            return `(+855) ${part1}-${part2}-${part3}`;
        }
    } else if (digits.length >= 8) {
        // Assume it's a local number, add Cambodia country code
        const part1 = digits.slice(0, 3);
        const part2 = digits.slice(3, 6);
        const part3 = digits.slice(6);
        return `(+855) ${part1}-${part2}-${part3}`;
    }
    
    // If formatting fails, return original
    return phoneNumber;
};

// Date formatting function to yyyy-mm-dd format
const formatDateToYYYYMMDD = (dateString: string): string => {
    if (!dateString) return 'N/A';
    
    try {
        const date = new Date(dateString);
        // Check if date is valid
        if (isNaN(date.getTime())) return 'N/A';
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    } catch {
        return 'N/A';
    }
};

interface ApiLeadData {
  lead_id: string;
  first_name: string;
  last_name: string;
  gender_name: string;
  email: string | null;
  date_of_birth: string;
  created_date: string;
  lead_source_name: string;
  customer_type_name: string;
  business_name: string;
  occupation: string | null;
  province_name: string | null;
  district_name: string | null;
  commune_name: string | null;
  village_name: string | null;
  home_address: string | null;
  street_address: string | null;
  is_active: boolean;
  photo_url: string | null;
  contact_data: {
      contact_values: {
          contact_number: string;
          is_primary: boolean;
          remark: string;
      }[];
  }[];
}

export interface Lead {
  id: string;
  fullName: string;
  avatar: string;
  gender: string;
  phone: string;
  dob: string;
  contactDate: string;
  email: string;
  leadSource: string;
  customerType: string;
  business: string;
  occupation: string;
  address: string;
  status: 'Active' | 'Inactive';
  raw: ApiLeadData;
}

const allColumns: { key: keyof Lead; label: string }[] = [
    { key: 'id', label: 'Lead ID' },
    { key: 'fullName', label: 'Full Name' },
    { key: 'gender', label: 'Gender' },
    { key: 'phone', label: 'Primary Phone' },
    { key: 'dob', label: 'Date of Birth' },
    { key: 'contactDate', label: 'Contact Date' },
    { key: 'email', label: 'Email' },
    { key: 'occupation', label: 'Occupation' },
    { key: 'business', label: 'Business' },
    { key: 'address', label: 'Address' },
    { key: 'leadSource', label: 'Lead Source' },
    { key: 'customerType', label: 'Customer Type' },
    { key: 'status', label: 'Status' },
];

const ActionMenu = ({ lead, onSelect }: { lead: Lead; onSelect: (action: 'view' | 'edit' | 'delete', lead: Lead) => void; }) => {
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
                        <li><a href="#" onClick={(e) => { e.preventDefault(); onSelect('view', lead); setIsOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.05]"><EyeIcon className="h-4 w-4"/> View</a></li>
                        <li><a href="#" onClick={(e) => { e.preventDefault(); onSelect('edit', lead); setIsOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.05]"><PencilIcon className="h-4 w-4"/> Edit</a></li>
                        <li><a href="#" onClick={(e) => { e.preventDefault(); onSelect('delete', lead); setIsOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-white/[0.05]"><TrashIcon className="h-4 w-4"/> Delete</a></li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export const ColumnSelector = ({ visibleColumns, setVisibleColumns }: { visibleColumns: (keyof Lead)[], setVisibleColumns: React.Dispatch<React.SetStateAction<(keyof Lead)[]>> }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const toggleColumn = (columnKey: keyof Lead) => {
        setVisibleColumns(prev => 
            prev.includes(columnKey) 
                ? prev.filter(key => key !== columnKey) 
                : [...prev, columnKey]
        );
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
                    <div className="px-3 py-2">
                        <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Visible Columns</h4>
                        <div className="grid grid-cols-1 gap-1">
                            {allColumns.map(col => (
                                <label key={col.key} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded px-1 py-1 transition-colors">
                                    <input 
                                        type="checkbox" 
                                        checked={visibleColumns.includes(col.key)}
                                        onChange={() => toggleColumn(col.key)}
                                        className="form-checkbox h-4 w-4 rounded text-blue-600 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:ring-2"
                                    />
                                    <span className="text-gray-700 dark:text-gray-300">{col.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ViewLeadModal = ({ lead, onClose }: { lead: Lead | null; onClose: () => void; }) => {
    if (!lead) return null;

    const DetailItem = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) => (
        <div className="flex items-start gap-3">
            <Icon className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
                <p className="text-sm text-gray-800 dark:text-gray-100">{value}</p>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-dark-800 p-6 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Lead Information</h2>
                    <Button variant="outline" size="sm" onClick={onClose}>
                        <XMarkIcon className="h-6 w-6 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200" />
                    </Button>
                </div>
                
                <div className="flex-grow overflow-y-auto mt-6 pr-2">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1 lg:border-r lg:pr-6 border-gray-200 dark:border-gray-700">
                            <div className="flex flex-col items-center text-center">
                                <Image src={lead.avatar} alt={lead.fullName} width={128} height={128} className="rounded-full bg-gray-200 mb-4" onError={(e) => { e.currentTarget.src = "/images/user/user-02.jpg"; }}/>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white uppercase">{lead.fullName}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{lead.email}</p>
                                <div className="mt-2">
                                    <Badge size="md" color={lead.status === "Active" ? "success" : "error"}>{lead.status}</Badge>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-2 space-y-6">
                            <div>
                                <h4 className="font-semibold mb-3 text-gray-700 dark:text-gray-300">Personal Details</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <DetailItem icon={UserCircleIcon} label="Gender" value={lead.gender} />
                                    <DetailItem icon={PhoneIcon} label="Primary Phone" value={lead.phone} />
                                    <DetailItem icon={CakeIcon} label="Date of Birth" value={lead.dob} />
                                    <DetailItem icon={BriefcaseIcon} label="Occupation" value={lead.occupation} />
                                </div>
                            </div>
                             <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                <h4 className="font-semibold mb-3 text-gray-700 dark:text-gray-300">Lead Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <DetailItem icon={TagIcon} label="Lead Source" value={lead.leadSource} />
                                    <DetailItem icon={InformationCircleIcon} label="Customer Type" value={lead.customerType} />
                                    <DetailItem icon={BuildingOffice2Icon} label="Business" value={lead.business} />
                                    <DetailItem icon={CalendarDaysIcon} label="Contact Date" value={lead.contactDate} />
                                </div>
                            </div>
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                <DetailItem icon={MapPinIcon} label="Address" value={lead.address} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </div>
            </div>
        </div>
    );
};

const Pagination = ({ currentPage, totalPages, onPageChange }: { currentPage: number, totalPages: number, onPageChange: (page: number) => void }) => {
    const getPageNumbers = () => {
        const pages = [];
        const pageLimit = 2;
        
        if (totalPages <= 1) return [];

        pages.push(1);

        if (currentPage > pageLimit + 1) {
            pages.push('...');
        }

        const startPage = Math.max(2, currentPage - pageLimit);
        const endPage = Math.min(totalPages - 1, currentPage + pageLimit);

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        if (currentPage < totalPages - pageLimit -1) {
            pages.push('...');
        }

        if (totalPages > 1) {
            pages.push(totalPages);
        }
        
        return [...new Set(pages)];
    };

    return (
        <nav className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}><ChevronLeftIcon className="h-4 w-4" /></Button>
            {getPageNumbers().map((page, index) =>
                typeof page === 'number' ? (
                    <Button key={index} variant={currentPage === page ? 'primary' : 'outline'} size="sm" onClick={() => onPageChange(page)} className="w-9">{page}</Button>
                ) : (
                    <span key={index} className="px-2 py-1 text-sm">...</span>
                )
            )}
            <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}><ChevronRightIcon className="h-4 w-4" /></Button>
        </nav>
    );
};


interface LeadsTableProps {
    visibleColumns: (keyof Lead)[];
    currentPage?: number;
    leads?: Lead[];
    isLoading?: boolean;
}

const LeadsTable: React.FC<LeadsTableProps> = ({ 
    visibleColumns, 
    currentPage: externalCurrentPage, 
    leads: externalLeads, 
    isLoading: externalIsLoading 
}) => {
  const router = useRouter();
    // Use external props if provided, otherwise use internal state for backward compatibility
    const [internalLeads, setInternalLeads] = useState<Lead[]>([]);
    const [internalIsLoading, setInternalIsLoading] = useState(true);
    const [internalCurrentPage] = useState(1);
    const [internalPageSize] = useState(10);

    // Determine which values to use
    const leads = externalLeads !== undefined ? externalLeads : internalLeads;
    const isLoading = externalIsLoading !== undefined ? externalIsLoading : internalIsLoading;
    const currentPage = externalCurrentPage !== undefined ? externalCurrentPage : internalCurrentPage;
    const pageSize = internalPageSize;

    // Only fetch data internally if external props are not provided
    const shouldFetchInternally = externalLeads === undefined;

    useEffect(() => {
        if (!shouldFetchInternally) return;
        
        const fetchLeads = async () => {
            setInternalIsLoading(true);
            try {
                const response = await api.post('/lead/pagination', {
                    page_number: String(currentPage),
                    page_size: String(pageSize),
                    search_type: "",
                    query_search: ""
                });
                const apiResult = response.data[0];
                if (apiResult && apiResult.data) {
                    const formattedLeads: Lead[] = apiResult.data.map((lead: ApiLeadData) => {
                        const primaryContact = lead.contact_data?.flatMap(cd => cd.contact_values).find(cv => cv.is_primary);

                        return {
                            id: lead.lead_id,
                            fullName: `${lead.first_name} ${lead.last_name}`,
                            avatar: lead.photo_url || "/images/user/user-02.jpg",
                            gender: lead.gender_name,
                            phone: primaryContact?.contact_number || 'N/A',
                            dob: formatDateToYYYYMMDD(lead.date_of_birth),
                            contactDate: formatDateToYYYYMMDD(lead.created_date),
                            email: lead.email || 'N/A',
                            leadSource: lead.lead_source_name,
                            customerType: lead.customer_type_name,
                            business: lead.business_name,
                            occupation: lead.occupation || 'N/A',
                            address: [lead.district_name, lead.province_name].filter(Boolean).join(', ') || 'N/A',
                            status: lead.is_active ? 'Active' : 'Inactive',
                            raw: lead,
                        };
                    });
                    setInternalLeads(formattedLeads);
                } else {
                    setInternalLeads([]);
                }
            } catch (error) {
                console.error("Failed to fetch leads:", error);
                setInternalLeads([]);
            } finally {
                setInternalIsLoading(false);
            }
        };
        fetchLeads();
    }, [currentPage, pageSize, shouldFetchInternally]);

    const handleActionSelect = (action: 'view' | 'edit' | 'delete', lead: Lead) => {
        if (action === 'view') {
            router.push(`/lead/view?id=${lead.id}`);
        } else if (action === 'edit') {
            router.push(`/lead/edit/${lead.id}`);
        } else {
            console.log(`${action} lead ${lead.id}`);
        }
    };

    const renderCellContent = (lead: Lead, columnKey: keyof Lead) => {
        switch (columnKey) {
            case 'id':
                return (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                        {lead.id}
                    </span>
                );
            case 'fullName':
                return (
                    <div className="flex items-center gap-2">
                        <div>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">{lead.fullName}</span>
                        </div>
                    </div>
                );
            case 'status':
                return (
                    <Badge size="sm" color={lead.status === "Active" ? "success" : "error"}>
                        {lead.status}
                    </Badge>
                );
            case 'phone':
                const phoneValue = lead[columnKey];
                const formattedPhone = typeof phoneValue === 'string' ? formatPhoneNumber(phoneValue) : phoneValue;
                return (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                        {formattedPhone || 'N/A'}
                    </span>
                );
            case 'contactDate':
                const contactDateValue = lead[columnKey];
                return (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">
                        {typeof contactDateValue === 'string' || typeof contactDateValue === 'number' ? contactDateValue : 'N/A'}
                    </span>
                );
            default:
                const value = lead[columnKey];
                return <span className="text-gray-600 dark:text-gray-400">{typeof value === 'string' || typeof value === 'number' ? value : 'N/A'}</span>;
        }
    };

    const sortedVisibleColumns = allColumns.filter(col => visibleColumns.includes(col.key));

    return (
        <>
            <LoadingOverlay isLoading={isLoading} />
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
                                {leads.length === 0 && !isLoading ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={sortedVisibleColumns.length + 1}
                                            className="h-[300px] px-5 py-4"
                                        >
                                            <div className="flex flex-col items-center justify-center h-full w-full text-center text-gray-400 gap-2">
                                            <DocumentMagnifyingGlassIcon className="h-12 w-12" />
                                            <span className="font-medium">No leads found.</span>
                                            <span className="text-sm">There might be a connection issue!!!</span>
                                            </div>
                                        </TableCell>
                                        </TableRow>
                                ) : (
                                    leads.map((lead) => (
                                        <TableRow key={lead.id} className="h-12">
                                            {sortedVisibleColumns.map(col => (
                                                <TableCell key={`${lead.id}-${col.key}`} className="px-5 py-2 text-start text-theme-sm h-12 overflow-hidden">
                                                    <div className="truncate max-w-xs">
                                                        {renderCellContent(lead, col.key)}
                                                    </div>
                                                </TableCell>
                                            ))}
                                            <TableCell className="px-4 py-2 text-center h-12">
                                                <ActionMenu lead={lead} onSelect={handleActionSelect} />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </>
    );
};

export default LeadsTable;

// Export Pagination and utility functions for external use
export { Pagination };

export const useLeadData = (currentPage: number, pageSize: number = 10, searchQuery: string = "", searchType: string = "") => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalRows, setTotalRows] = useState(0);

    useEffect(() => {
        const fetchLeads = async () => {
            setIsLoading(true);
            try {
                console.log("Fetching leads with params:", { currentPage, pageSize, searchQuery, searchType });
                
                // Try external API first, then fall back to internal Next.js API
                let response;
                try {
                    response = await api.post('/lead/pagination', {
                        page_number: String(currentPage),
                        page_size: String(pageSize),
                        search_type: searchType,
                        query_search: searchQuery
                    });
                } catch (externalError) {
                    console.log("External API failed, trying internal API:", externalError);
                    // Fallback to internal Next.js API
                    response = await fetch('/api/lead/pagination', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            page_number: String(currentPage),
                            page_size: String(pageSize),
                            search_type: searchType,
                            query_search: searchQuery
                        })
                    });
                    
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    
                    const data = await response.json();
                    response = { data };
                }
                
                console.log("API Response:", response.data);
                const apiResult = response.data[0];
                if (apiResult && apiResult.data) {
                    const formattedLeads: Lead[] = apiResult.data.map((lead: ApiLeadData) => {
                        const primaryContact = lead.contact_data?.flatMap(cd => cd.contact_values).find(cv => cv.is_primary);

                        return {
                            id: lead.lead_id,
                            fullName: `${lead.first_name} ${lead.last_name}`,
                            avatar: lead.photo_url || "/images/user/user-02.jpg",
                            gender: lead.gender_name,
                            phone: primaryContact?.contact_number || 'N/A',
                            dob: formatDateToYYYYMMDD(lead.date_of_birth),
                            contactDate: formatDateToYYYYMMDD(lead.created_date),
                            email: lead.email || 'N/A',
                            leadSource: lead.lead_source_name,
                            customerType: lead.customer_type_name,
                            business: lead.business_name,
                            occupation: lead.occupation || 'N/A',
                            address: [lead.district_name, lead.province_name].filter(Boolean).join(', ') || 'N/A',
                            status: lead.is_active ? 'Active' : 'Inactive',
                            raw: lead,
                        };
                    });
                    
                    setLeads(formattedLeads);
                    setTotalRows(apiResult.total_row);
                } else {
                    console.warn("No data found in API response");
                    setLeads([]);
                    setTotalRows(0);
                }
            } catch (error) {
                console.error("Failed to fetch leads:", error);
                setLeads([]);
                setTotalRows(0);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLeads();
    }, [currentPage, pageSize, searchQuery, searchType]);

    return { leads, isLoading, totalRows };
};
