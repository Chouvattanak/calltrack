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
    BuildingOffice2Icon, CalendarDaysIcon, InformationCircleIcon
} from "@heroicons/react/24/outline";
import Button from "../ui/button/Button";
import api from "@/lib/api";
import LoadingOverlay from "../ui/loading/LoadingOverlay";
import { useRouter } from "next/navigation";

interface ApiStaffData {
    staff_id: number;
    staff_code: string;
    first_name: string;
    last_name: string;
    gender_name: string;
    email: string | null;
    date_of_birth: string;
    created_date: string;
    created_by: string;
    last_update: string;
    updated_by: string;
    position: string;
    department: string | null;
    employment_type: string;
    employment_start_date: string;
    employment_end_date: string | null;
    employment_level: string | null;
    current_address: string | null;
    photo_url: string[] | null;
    is_active: boolean;
    contact_data: {
            contact_values: {
                    contact_number: string;
                    is_primary: boolean;
                    remark: string;
            }[];
    }[];
    province_name?: string;
    district_name?: string;
    commune_name?: string;
    village_name?: string;
}

export interface Staff {
  id: string;
  staffCode: string;
  fullName: string;
  avatar: string;
  gender: string;
  phone: string;
  dob: string;
  position: string;
  department: string;
  employment_type: string;
  employment_start_date: string;
  employment_end_date: string | null;
  employment_level: string | null;
  current_address: string | null;
  email: string;
  status: 'Active' | 'Inactive';
  raw: ApiStaffData;
}

const allColumns: { key: keyof Staff; label: string }[] = [
    { key: 'fullName', label: 'Staff Name' },
    { key: 'staffCode', label: 'Staff Code' },
    { key: 'gender', label: 'Gender' },
    { key: 'phone', label: 'Primary Phone' },
    { key: 'dob', label: 'Date of Birth' },
    { key: 'position', label: 'Position' },
    { key: 'department', label: 'Department' },
    { key: 'employment_type', label: 'Employment Type' },
    { key: 'employment_level', label: 'Employment Level' },
    { key: 'employment_start_date', label: 'Start Date' },
    { key: 'email', label: 'Email' },
    { key: 'status', label: 'Status' },
];

// Phone number formatting function
const formatPhoneNumber = (phone: string): string => {
    if (!phone || phone === 'N/A') return phone;
    
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Handle different cases
    if (digits.length === 0) return phone;
    
    // If it starts with 855 (Cambodia country code)
    if (digits.startsWith('855')) {
        if (digits.length === 12) {
            // Format: 855XXXXXXXXX -> (+855) XXX-XXX-XXXX
            return `(+855) ${digits.slice(3, 6)}-${digits.slice(6, 9)}-${digits.slice(9)}`;
        }
    }
    
    // If it starts with 0 (local format)
    if (digits.startsWith('0')) {
        if (digits.length === 10) {
            // Format: 0XXXXXXXXX -> (+855) XXX-XXX-XXXX
            return `(+855) ${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
        }
    }
    
    // If it's 9 digits (without country code or leading 0)
    if (digits.length === 9) {
        // Format: XXXXXXXXX -> (+855) XXX-XXX-XXX
        return `(+855) ${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    
    // If it's 8 digits
    if (digits.length === 8) {
        // Format: XXXXXXXX -> (+855) XX-XXX-XXX
        return `(+855) ${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
    }
    
    // For any other format, just return as is
    return phone;
};

const ActionMenu = ({ staff, onSelect }: { staff: Staff; onSelect: (action: 'view' | 'edit' | 'delete', staff: Staff) => void; }) => {
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
                        <li><a href="#" onClick={(e) => { e.preventDefault(); onSelect('view', staff); setIsOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.05]"><EyeIcon className="h-4 w-4"/> View</a></li>
                        <li><a href="#" onClick={(e) => { e.preventDefault(); onSelect('edit', staff); setIsOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.05]"><PencilIcon className="h-4 w-4"/> Edit</a></li>
                        <li><a href="#" onClick={(e) => { e.preventDefault(); onSelect('delete', staff); setIsOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-white/[0.05]"><TrashIcon className="h-4 w-4"/> Delete</a></li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export const ColumnSelector = ({ visibleColumns, setVisibleColumns }: { visibleColumns: (keyof Staff)[], setVisibleColumns: React.Dispatch<React.SetStateAction<(keyof Staff)[]>> }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const toggleColumn = (columnKey: keyof Staff) => {
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
const ViewStaffModal = ({ staff, onClose }: { staff: Staff | null; onClose: () => void; }) => {
    if (!staff) return null;

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
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Staff Information</h2>
                    <Button variant="outline" size="sm" onClick={onClose}>
                        <XMarkIcon className="h-6 w-6 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200" />
                    </Button>
                </div>
                
                <div className="flex-grow overflow-y-auto mt-6 pr-2">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1 lg:border-r lg:pr-6 border-gray-200 dark:border-gray-700">
                            <div className="flex flex-col items-center text-center">
                                {/* Removed user avatar image as requested */}
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white uppercase">{staff.fullName}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{staff.staffCode}</p>
                                <div className="mt-2">
                                    <Badge size="md" color={staff.status === "Active" ? "success" : "error"}>{staff.status}</Badge>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-2 space-y-6">
                            <div>
                                <h4 className="font-semibold mb-3 text-gray-700 dark:text-gray-300">Personal Details</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <DetailItem icon={UserCircleIcon} label="Gender" value={staff.gender} />
                                    <DetailItem icon={PhoneIcon} label="Primary Phone" value={staff.phone} />
                                    <DetailItem icon={CakeIcon} label="Date of Birth" value={staff.dob} />
                                    <DetailItem icon={BriefcaseIcon} label="Position" value={staff.position} />
                                </div>
                            </div>
                             <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                <h4 className="font-semibold mb-3 text-gray-700 dark:text-gray-300">Employment Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <DetailItem icon={BuildingOffice2Icon} label="Department" value={staff.department} />
                                    <DetailItem icon={InformationCircleIcon} label="Employment Type" value={staff.employment_type} />
                                    <DetailItem icon={CalendarDaysIcon} label="Employment Level" value={staff.employment_level || 'N/A'} />
                                    <DetailItem icon={CalendarDaysIcon} label="Start Date" value={staff.employment_start_date} />
                                </div>
                            </div>
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                <DetailItem icon={MapPinIcon} label="Address" value={staff.current_address || 'N/A'} />
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
                    <Button key={index} variant={currentPage === page ? 'outline' : 'primary'} size="sm" onClick={() => onPageChange(page)} className="w-9">{page}</Button>
                ) : (
                    <span key={index} className="px-2 py-1 text-sm">...</span>
                )
            )}
            <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}><ChevronRightIcon className="h-4 w-4" /></Button>
        </nav>
    );
};


interface StaffTableProps {
    visibleColumns: (keyof Staff)[];
    currentPage?: number;
    staff?: Staff[];
    isLoading?: boolean;
}

const StaffTable: React.FC<StaffTableProps> = ({ 
    visibleColumns, 
    currentPage: externalCurrentPage, 
    staff: externalStaff, 
    isLoading: externalIsLoading 
}) => {
  const router = useRouter();
    // Use external props if provided, otherwise use internal state for backward compatibility
    const [internalStaff, setInternalStaff] = useState<Staff[]>([]);
    const [internalIsLoading, setInternalIsLoading] = useState(true);
    const [internalCurrentPage] = useState(1);
    const [internalPageSize] = useState(10);

    // Determine which values to use - ALWAYS prefer external props when provided
    const staff = Array.isArray(externalStaff) ? externalStaff : internalStaff;
    const isLoading = externalIsLoading !== undefined ? externalIsLoading : internalIsLoading;
    const currentPage = externalCurrentPage !== undefined ? externalCurrentPage : internalCurrentPage;
    const pageSize = internalPageSize;

    // Only fetch data internally if external staff array is not provided or is empty
    const shouldFetchInternally = !Array.isArray(externalStaff);

    useEffect(() => {
        // Don't fetch internally if we have external data
        if (!shouldFetchInternally) {
            return;
        }
        
        const fetchStaff = async () => {
            setInternalIsLoading(true);
            try {
                const response = await api.post('/staff/pagination', {
                    page_number: String(currentPage),
                    page_size: String(pageSize),
                    search_type: "",
                    query_search: ""
                });
                const apiResult = response.data[0];
                if (apiResult && apiResult.data) {
                    const formattedStaff: Staff[] = apiResult.data.map((staffMember: ApiStaffData) => {
                        const primaryContact = staffMember.contact_data?.flatMap(cd => cd.contact_values).find(cv => cv.is_primary);

                        // Debug logging for name fields
                        console.log("Staff member data:", {
                            staff_id: staffMember.staff_id,
                            first_name: staffMember.first_name,
                            last_name: staffMember.last_name,
                            fullName: `${staffMember.first_name || ''} ${staffMember.last_name || ''}`.trim()
                        });

                        return {
                            id: String(staffMember.staff_id),
                            staffCode: staffMember.staff_code,
                            fullName: `${staffMember.first_name || ''} ${staffMember.last_name || ''}`.trim(),
                            avatar: staffMember.photo_url?.[0] || "/images/user/user-02.jpg",
                            gender: staffMember.gender_name,
                            phone: primaryContact?.contact_number || 'N/A',
                            dob: staffMember.date_of_birth,
                            position: staffMember.position,
                            department: staffMember.department || 'N/A',
                            employment_type: staffMember.employment_type,
                            employment_start_date: staffMember.employment_start_date,
                            employment_end_date: staffMember.employment_end_date,
                            employment_level: staffMember.employment_level,
                            current_address: staffMember.current_address,
                            email: staffMember.email || 'N/A',
                            status: staffMember.is_active ? 'Active' : 'Inactive',
                            raw: staffMember,
                        };
                    });
                    setInternalStaff(formattedStaff);
                } else {
                    setInternalStaff([]);
                }
            } catch (error) {
                console.error("Failed to fetch staff:", error);
                setInternalStaff([]);
            } finally {
                setInternalIsLoading(false);
            }
        };
        fetchStaff();
    }, [currentPage, pageSize, shouldFetchInternally]);

    const handleActionSelect = (action: 'view' | 'edit' | 'delete', staff: Staff) => {
        if (action === 'view') {
            router.push(`/staff/view?id=${staff.id}`);
        } else if (action === 'edit') {
            router.push(`/staff/edit/${staff.id}`);
        } else {
            console.log(`${action} staff ${staff.id}`);
        }
    };

    // const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
    // const [showModal, setShowModal] = useState(false);

    const renderCellContent = (staffMember: Staff, columnKey: keyof Staff) => {
        switch (columnKey) {
            case 'fullName':
                return (
                    <Badge size="sm" color="primary" className="bg-violet-50 text-violet-700 font-medium px-3 py-1 rounded-full">
                        {staffMember.fullName}
                    </Badge>
                );
            case 'status':
                return (
                    <Badge size="sm" color={staffMember.status === "Active" ? "success" : "error"}>
                        {staffMember.status}
                    </Badge>
                );
            case 'phone':
                return (
                    <Badge size="sm" color="primary" className="bg-violet-50 text-violet-700 font-medium px-3 py-1 rounded-full">
                        {formatPhoneNumber(String(staffMember[columnKey] || 'N/A'))}
                    </Badge>
                );
            default:
                const value = staffMember[columnKey];
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
                                {staff.length === 0 && !isLoading ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={sortedVisibleColumns.length + 1}
                                            className="h-[300px] px-5 py-4"
                                        >
                                            <div className="flex flex-col items-center justify-center h-full w-full text-center text-gray-400 gap-2">
                                            <DocumentMagnifyingGlassIcon className="h-12 w-12" />
                                            <span className="font-medium">No staff found.</span>
                                            <span className="text-sm">There might be a connection issue!!!</span>
                                            </div>
                                        </TableCell>
                                        </TableRow>
                                ) : (
                                    staff.map((staffMember) => (
                                        <TableRow key={staffMember.id} className="h-16">
                                            {sortedVisibleColumns.map(col => (
                                                <TableCell key={`${staffMember.id}-${String(col.key)}`} className="px-5 py-4 text-start text-theme-sm h-16 overflow-hidden">
                                                    <div className="truncate max-w-xs">
                                                        {renderCellContent(staffMember, col.key)}
                                                    </div>
                                                </TableCell>
                                            ))}
                                            <TableCell className="px-4 py-3 text-center h-16">
                                                <ActionMenu staff={staffMember} onSelect={handleActionSelect} />
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

export default StaffTable;

// Export Pagination and utility functions for external use
export { Pagination };

export const useStaffData = (currentPage: number, pageSize: number = 10, searchQuery: string = "", searchType: string = "") => {
    const [staff, setStaff] = useState<Staff[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalRows, setTotalRows] = useState(0);

    useEffect(() => {
        const fetchStaff = async () => {
            setIsLoading(true);
            try {
                console.log("Fetching staff with params:", { currentPage, pageSize, searchQuery, searchType });
                
                // Try external API first, then fall back to internal Next.js API
                let response;
                
                try {
                    console.log("Trying external API first...");
                    response = await api.post('/staff/pagination', {
                        page_number: String(currentPage),
                        page_size: String(pageSize),
                        search_type: searchType,
                        query_search: searchQuery
                    });
                    console.log("External API response:", response.data);
                } catch (error) {
                    console.log("External API failed, trying internal API:", error);
                    
                    // Fallback to internal Next.js API
                    const fetchResponse = await fetch('/api/staff/pagination', {
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
                    
                    if (!fetchResponse.ok) {
                        throw new Error(`HTTP error! status: ${fetchResponse.status}`);
                    }
                    
                    const data = await fetchResponse.json();
                    response = { data };
                }
                
                console.log("API Response:", response.data);
                const apiResult = response.data[0];
                if (apiResult && apiResult.data) {
                    const formattedStaff: Staff[] = apiResult.data.map((staffMember: unknown) => {
                        const member = staffMember as Record<string, unknown>;
                        const staff = staffMember as ApiStaffData;
                        const contactData = member.contact_data as Array<Record<string, unknown>> | undefined;
                        const primaryContact = contactData?.flatMap((cd) => (cd.contact_values as Array<Record<string, unknown>>) || []).find((cv) => cv.is_primary);

                        // Smart mapping to handle different API data structures
                        const mapStaffData = (memberData: Record<string, unknown>) => {
                            // Try different possible field name combinations
                            const firstName = memberData.first_name || memberData.firstName || memberData.fname || '';
                            const lastName = memberData.last_name || memberData.lastName || memberData.lname || '';
                            const fullName = memberData.full_name || memberData.fullName || memberData.name || `${firstName} ${lastName}`.trim();
                            // If we still don't have a name, try other possibilities
                            const finalName = fullName || member.staff_name || member.staffName || `Staff ${member.staff_id || member.id || ''}`;
                            console.log("useStaffData - Mapping staff member:", {
                                staff_id: member.staff_id || member.id,
                                first_name: firstName,
                                last_name: lastName,
                                full_name: fullName,
                                finalName: finalName
                            });
                            return finalName;
                        };

                        return {
                            id: String((staff.staff_id ?? member.staff_id) || member.id || ''),
                            staffCode: staff.staff_code || member.staffCode || member.code || `STF-${(staff.staff_id ?? member.staff_id) || member.id || ''}`,
                            fullName: mapStaffData(member),
                            avatar: staff.photo_url?.[0] || member.photoUrl || member.avatar || "/images/user/user-02.jpg",
                            gender: staff.gender_name || member.gender || 'N/A',
                            phone: primaryContact?.contact_number || member.phone || member.phoneNumber || 'N/A',
                            dob: staff.date_of_birth || member.dateOfBirth || member.dob || 'N/A',
                            position: staff.position || member.jobTitle || member.title || 'N/A',
                            department: staff.department || member.dept || 'N/A',
                            employment_type: staff.employment_type || member.employmentType || member.type || 'N/A',
                            employment_start_date: staff.employment_start_date || member.startDate || member.hireDate || 'N/A',
                            employment_end_date: staff.employment_end_date || member.endDate || null,
                            employment_level: staff.employment_level || member.level || null,
                            current_address: staff.current_address || member.address || null,
                            email: staff.email || (typeof primaryContact?.contact_number === 'string' && primaryContact.contact_number.includes('@') ? primaryContact.contact_number : 'N/A'),
                            status: staff.is_active !== undefined ? (staff.is_active ? 'Active' : 'Inactive') : 
                                   member.status === 'active' || member.status === 'Active' ? 'Active' : 
                                   member.status === 'inactive' || member.status === 'Inactive' ? 'Inactive' : 'Active',
                            raw: staff,
                        };
                    });
                    setStaff(formattedStaff);
                    setTotalRows(apiResult.total_row || apiResult.total_rows || 0);
                } else {
                    console.warn("No data found in API response");
                    setStaff([]);
                    setTotalRows(0);
                }
            } catch (error) {
                console.error("Failed to fetch staff:", error);
                setStaff([]);
                setTotalRows(0);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStaff();
    }, [currentPage, pageSize, searchQuery, searchType]);

    return { staff, isLoading, totalRows };
};
