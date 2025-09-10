import { Project } from "@/components/form/sample-data/projectData";
"use client";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ProjectTable, { ColumnSelector } from "@/components/tables/ProjectTable"; 
import React, { useState, useEffect } from "react";
import Button from "@/components/ui/button/Button";
import Link from "next/link";
import { 
  PlusIcon,
  BuildingOffice2Icon,
  CheckCircleIcon
} from "@heroicons/react/24/outline";


const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Project", href: "/project" }
];

export default function ProjectPage() {

  const [searchTerm, setSearchTerm] = useState("");
  const [visibleColumns, setVisibleColumns] = useState<(keyof Project)[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('projectTableVisibleColumns');
      return saved ? JSON.parse(saved) : ['project_id', 'project_description', 'province', 'district', 'commune', 'village', 'created_date', 'is_active'];
    }
    return ['project_id', 'project_description', 'province', 'district', 'commune', 'village', 'created_date', 'is_active'];
  });

  useEffect(() => {
    localStorage.setItem('projectTableVisibleColumns', JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  // Project statistics from API
  const [totalProjects, setTotalProjects] = useState(0);
  const [activeProjects, setActiveProjects] = useState(0);
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const body = {
          page_number: "1",
          page_size: "1000", // Large page size to get all for stats
          search_type: '',
          query_search: '',
        };
        const api = (await import('@/lib/api')).default;
        const response = await api.post('/project/pagination', body);
        const apiResult = response.data[0];
        if (apiResult && Array.isArray(apiResult.data)) {
          setTotalProjects(apiResult.total_row || apiResult.data.length);
          setActiveProjects(apiResult.data.filter((proj: { is_active: boolean }) => proj.is_active).length);
        } else {
          setTotalProjects(0);
          setActiveProjects(0);
        }
      } catch {
        setTotalProjects(0);
        setActiveProjects(0);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <PageBreadcrumb crumbs={breadcrumbs} />
      
      {/* Project Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-white/[0.05] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Projects</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalProjects}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-500/10">
              <BuildingOffice2Icon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-white/[0.05] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Projects</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeProjects}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-50 dark:bg-green-500/10">
              <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <ComponentCard title="Project Management">
          <div className="space-y-4">
            {/* Search Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4 flex-1">
                <Link href="/project/create">
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="flex items-center gap-2 whitespace-nowrap"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add Project
                  </Button>
                </Link>
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search projects..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              <ColumnSelector 
                visibleColumns={visibleColumns}
                setVisibleColumns={setVisibleColumns}
              />
            </div>

            {/* Table */}
            <ProjectTable 
              searchTerm={searchTerm}
              visibleColumns={visibleColumns}
            />
          </div>
        </ComponentCard>
      </div>
    </div>
  );
}
