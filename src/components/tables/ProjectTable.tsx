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
    ChevronRightIcon, UserCircleIcon, 
    CalendarDaysIcon, InformationCircleIcon 
} from "@heroicons/react/24/outline";
import Button from "../ui/button/Button";
// import { projectData, Project } from "../form/sample-data/projectData";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

// Column definitions
const allColumns = [
    { key: 'project_id', label: 'Project ID' },
    { key: 'developer_id', label: 'Developer ID' },
    { key: 'developer_name', label: 'Developer Name' },
    { key: 'village_id', label: 'Village ID' },
    { key: 'village_name', label: 'Village Name' },
    { key: 'project_name', label: 'Project Name' },
    { key: 'project_description', label: 'Description' },
    { key: 'is_active', label: 'Status' },
    { key: 'created_by', label: 'Created By' },
    { key: 'created_date', label: 'Created Date' },
    { key: 'updated_by', label: 'Updated By' },
    { key: 'last_update', label: 'Last Update' },
] as const;

// Project type (should match API response)
interface Project {
    project_id: number;
    developer_id: number;
    developer_name: string;
    village_id: number;
    village_name: string;
    project_name: string;
    project_description: string;
    is_active: boolean;
    created_by: string;
    created_date: string;
    updated_by: string;
    last_update: string | null;
}

// Custom Pagination Component




const ActionMenu = ({ project, onSelect }: { project: Project; onSelect: (action: 'view' | 'edit' | 'delete', project: Project) => void; }) => {
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
                        <li><a href="#" onClick={(e) => { e.preventDefault(); onSelect('view', project); setIsOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.05]"><EyeIcon className="h-4 w-4"/> View</a></li>
                        <li><a href="#" onClick={(e) => { e.preventDefault(); onSelect('edit', project); setIsOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.05]"><PencilIcon className="h-4 w-4"/> Edit</a></li>
                        <li><a href="#" onClick={(e) => { e.preventDefault(); onSelect('delete', project); setIsOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-white/[0.05]"><TrashIcon className="h-4 w-4"/> Delete</a></li>
                    </ul>
                </div>
            )}
        </div>
    );
};

const ColumnSelector = ({ visibleColumns, setVisibleColumns }: { visibleColumns: (keyof Project)[], setVisibleColumns: React.Dispatch<React.SetStateAction<(keyof Project)[]>> }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const toggleColumn = (columnKey: keyof Project) => {
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
                    <div className="p-4">
                        <h4 className="font-semibold mb-2">Visible Columns</h4>
                        <div className="grid grid-cols-2 gap-2">
                            {allColumns.map(col => (
                                <label key={col.key} className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={visibleColumns.includes(col.key)}
                                        onChange={() => toggleColumn(col.key)}
                                        className="form-checkbox h-4 w-4 rounded text-blue-600"
                                    />
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

const ViewProjectModal = ({ project, onClose }: { project: Project | null; onClose: () => void; }) => {
    if (!project) return null;

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
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Project Information</h2>
                    <Button variant="outline" size="sm" onClick={onClose}>
                        <XMarkIcon className="h-6 w-6 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200" />
                    </Button>
                </div>
                
                <div className="flex-grow overflow-y-auto mt-6 pr-2">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1 lg:border-r lg:pr-6 border-gray-200 dark:border-gray-700">
                            <div className="flex flex-col items-center text-center">
                                <Image 
                                    src={"/images/user/user-02.jpg"} 
                                    alt={`Project ${project.project_id}`} 
                                    width={128} 
                                    height={128} 
                                    className="rounded-full bg-gray-200 mb-4" 
                                />
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white uppercase">{project.project_name}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{project.village_name}</p>
                                <div className="mt-2">
                                    <Badge color={project.is_active ? "success" : "error"}>
                                        {project.is_active ? "Active" : "Inactive"}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        
                        <div className="lg:col-span-2">
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Project Details</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <DetailItem icon={UserCircleIcon} label="Project ID" value={project.project_id} />
                                <DetailItem icon={UserCircleIcon} label="Developer Name" value={project.developer_name} />
                                <DetailItem icon={UserCircleIcon} label="Project Name" value={project.project_name} />
                                <DetailItem icon={UserCircleIcon} label="Village Name" value={project.village_name} />
                                <DetailItem icon={UserCircleIcon} label="Created By" value={project.created_by} />
                                <DetailItem icon={CalendarDaysIcon} label="Created Date" value={project.created_date} />
                                <DetailItem icon={UserCircleIcon} label="Updated By" value={project.updated_by} />
                                <DetailItem icon={CalendarDaysIcon} label="Last Update" value={project.last_update || 'N/A'} />
                                <DetailItem icon={InformationCircleIcon} label="Status" value={
                                    <Badge color={project.is_active ? "success" : "error"}>
                                        {project.is_active ? "Active" : "Inactive"}
                                    </Badge>
                                } />
                            </div>
                            
                            {project.project_description && (
                                <div className="mt-6">
                                    <h5 className="text-md font-semibold text-gray-900 dark:text-white mb-2">Description</h5>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                        {project.project_description}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface ProjectTableProps {
    searchTerm?: string;
    visibleColumns?: (keyof Project)[];
}

const ProjectTable = ({ searchTerm = "", visibleColumns: propVisibleColumns }: ProjectTableProps) => {
    const router = useRouter();
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState(searchTerm);
    const visibleColumns = propVisibleColumns || [
        'project_id',
        'developer_name',
        'project_name',
        'project_description',
        'village_name',
        'is_active',
        'created_by',
        'created_date',
        'updated_by',
        'last_update',
    ];
    const [viewProject, setViewProject] = useState<Project | null>(null);
    const itemsPerPage = 10;
    const [projects, setProjects] = useState<Project[]>([]);
    const [totalRows, setTotalRows] = useState(0);
    const [isLoading, setIsLoading] = useState(true);


    // Update search query when searchTerm prop changes
    useEffect(() => {
        setSearchQuery(searchTerm);
    }, [searchTerm]);

    // Define the expected API project type
    interface ApiProject {
        project_id: number;
        developer_id: number;
        developer_name: string;
        village_id: number;
        village_name: string;
        project_name: string;
        project_description: string;
        is_active: boolean;
        created_by: string;
        created_date: string;
        updated_by: string;
        last_update: string | null;
    }

    useEffect(() => {
        const fetchProjects = async () => {
            setIsLoading(true);
            try {
                const body = {
                    page_number: String(currentPage),
                    page_size: String(itemsPerPage),
                    search_type: '',
                    query_search: searchQuery || '',
                };
                // Log the body for debugging
                console.log("[ProjectTable] /project/pagination POST body", body);
                const response = await api.post('/project/pagination', body);
                console.log('API response for /project/pagination:', response.data);
                const apiResult = response.data[0];
                if (apiResult && apiResult.data) {
                    // Map API data to Project[]
                    const formattedProjects: Project[] = apiResult.data.map((project: ApiProject) => ({
                        project_id: project.project_id,
                        developer_id: project.developer_id,
                        developer_name: project.developer_name,
                        village_id: project.village_id,
                        village_name: project.village_name,
                        project_name: project.project_name,
                        project_description: project.project_description,
                        is_active: project.is_active,
                        created_by: project.created_by,
                        created_date: project.created_date,
                        updated_by: project.updated_by,
                        last_update: project.last_update,
                    }));
                    setProjects(formattedProjects);
                    setTotalRows(apiResult.total_row);
                } else {
                    setProjects([]);
                    setTotalRows(0);
                }
            } catch (err: unknown) {
                console.error('Failed to fetch projects:', err);
                setProjects([]);
                setTotalRows(0);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProjects();
    }, [currentPage, searchQuery]);

    const totalPages = Math.ceil(totalRows / itemsPerPage);
    const pageSize = itemsPerPage;
    const startIndex = (currentPage - 1) * pageSize;



    const handleAction = (action: 'view' | 'edit' | 'delete', project: Project) => {
        switch (action) {
            case 'view':
                router.push(`/project/view?id=${project.project_id}`);
                break;
            case 'edit':
                router.push(`/project/edit?id=${project.project_id}`);
                break;
            case 'delete':
                if (confirm(`Are you sure you want to delete project ${project.project_id}?`)) {
                    // TODO: Call delete API
                    // For now, reload the page to refresh the table
                    window.location.reload();
                }
                break;
        }
    };

    const renderCellContent = (project: Project, columnKey: keyof Project) => {
        const value = project[columnKey];
        const formatDateTime = (dateString: string | null | undefined) => {
            if (!dateString) return <span className="text-gray-400">N/A</span>;
            const date = new Date(dateString.replace(' ', 'T'));
            if (isNaN(date.getTime())) return <span className="text-gray-400">N/A</span>;
            return date.toLocaleString();
        };
        switch (columnKey) {
            case 'project_id':
            case 'developer_id':
            case 'village_id':
                return <span className="text-xs text-gray-700 dark:text-gray-200">{value}</span>;
            case 'developer_name':
            case 'village_name':
            case 'created_by':
            case 'updated_by':
                return <span className="text-sm text-gray-900 dark:text-white">{value}</span>;
            case 'project_name':
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-50 text-green-800 text-sm font-semibold dark:bg-green-900/10 dark:text-green-300">
                        <span className="font-bold">{value || 'No name'}</span>
                    </span>
                );
            case 'project_description':
                return <span className="text-sm text-gray-900 dark:text-white">{value || 'No description'}</span>;
            case 'is_active':
                return (
                    <Badge color={value ? "success" : "error"}>
                        {value ? "Active" : "Inactive"}
                    </Badge>
                );
            case 'created_date':
                return (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDateTime(typeof value === 'string' ? value : null)}
                    </span>
                );
            case 'last_update':
                return (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDateTime(typeof value === 'string' ? value : null)}
                    </span>
                );
            default:
                return value || <span className="text-gray-400">N/A</span>;
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
                            <p className="text-gray-600 dark:text-gray-400">Loading projects...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!isLoading && projects.length === 0) {
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
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Projects Found</h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                {searchQuery ? `No projects match "${searchQuery}"` : "No projects available."}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                <div className="max-w-full overflow-x-auto">
                    <div className="min-w-[1000px]">
                        <Table>
                            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                                <TableRow>
                                    {allColumns
                                        .filter(col => visibleColumns.includes(col.key))
                                        .map(col => (
                                            <TableCell key={col.key} isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                                {col.label}
                                            </TableCell>
                                        ))
                                    }
                                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Actions</TableCell>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                                {projects.map((project) => (
                                    <TableRow key={project.project_id}>
                                        {allColumns
                                            .filter(col => visibleColumns.includes(col.key))
                                            .map(col => (
                                                <TableCell key={`${project.project_id}-${col.key}`} className="px-5 py-4 text-start text-theme-sm">
                                                    {renderCellContent(project, col.key)}
                                                </TableCell>
                                            ))
                                        }
                                        <TableCell className="px-4 py-3 text-center">
                                            <ActionMenu project={project} onSelect={handleAction} />
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
                    Showing {startIndex + 1} to {Math.min(startIndex + pageSize, totalRows)} of {totalRows} projects
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

            <ViewProjectModal project={viewProject} onClose={() => setViewProject(null)} />
        </div>
    );
};

export { ColumnSelector };
export default ProjectTable;
