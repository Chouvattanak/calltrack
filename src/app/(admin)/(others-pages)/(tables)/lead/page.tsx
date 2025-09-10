"use client";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import SearchComponent from "@/components/common/SearchComponent";
import LeadsTable, { ColumnSelector, Lead, Pagination, useLeadData } from "@/components/tables/LeadsTable";
import React from "react";
import Button from "@/components/ui/button/Button";

import { UserGroupIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Lead", href: "/lead" }
  ];

export default function LeadsPage() {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchType, setSearchType] = React.useState("lead_id");
  const pageSize = 10;
  
  const { leads, isLoading, totalRows } = useLeadData(currentPage, pageSize, searchQuery, searchType);
  const totalPages = Math.ceil(totalRows / pageSize);

  const [visibleColumns, setVisibleColumns] = React.useState<(keyof Lead)[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('leadsTableVisibleColumns');
        return saved ? JSON.parse(saved) : ['id', 'fullName', 'phone', 'contactDate', 'status'];
      } catch {
        return ['id', 'fullName', 'phone', 'contactDate', 'status'];
      }
    }
    return ['id', 'fullName', 'phone', 'contactDate', 'status'];
  });

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('leadsTableVisibleColumns', JSON.stringify(visibleColumns));
      } catch (error) {
        console.error('Error saving visible columns:', error);
      }
    }
  }, [visibleColumns]);

  const handleSearch = (query: string, type: string) => {
    setSearchQuery(query);
    setSearchType(type);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Error boundary for safe rendering
  if (!leads && !isLoading) {
    return (
      <div className="space-y-6">
        <PageBreadcrumb crumbs={breadcrumbs} />
        <div className="space-y-6">
          <ComponentCard title="Leads">
            <div className="text-center py-8">
              <p className="text-gray-500">Unable to load leads. Please try again later.</p>
            </div>
          </ComponentCard>
        </div>
      </div>
    );
  }

  // Calculate active leads
  const activeLeads = leads ? leads.filter(l => l.status === "Active").length : 0;

  return (
    <div className="space-y-6">
      <PageBreadcrumb crumbs={breadcrumbs} />

      {/* Lead Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-white/[0.05] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Leads</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalRows}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-500/10">
              <UserGroupIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-white/[0.05] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Leads</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeLeads}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-50 dark:bg-green-500/10">
              <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <ComponentCard title="Leads Management">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <Link href="/lead/create">
                <Button size="md" variant="primary">
                  Add Lead +
                </Button>
              </Link>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1">
              <div className="flex-1 w-full sm:w-auto">
                <SearchComponent onSearch={handleSearch} />
              </div>
              <div className="flex items-center gap-2">
                <Link href="/lead/export">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-2"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Export
                  </Button>
                </Link>
                <ColumnSelector visibleColumns={visibleColumns} setVisibleColumns={setVisibleColumns} />
              </div>
            </div>
          </div>
          <LeadsTable 
            visibleColumns={visibleColumns} 
            currentPage={currentPage}
            leads={leads}
            isLoading={isLoading}
          />
        </ComponentCard>
        
        {/* Pagination - Outside the ComponentCard like in developer page */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Showing{" "}
                <span className="font-medium">{((currentPage - 1) * pageSize) + 1}</span>
                {" "}to{" "}
                <span className="font-medium">
                  {Math.min(currentPage * pageSize, totalRows)}
                </span>
                {" "}of{" "}
                <span className="font-medium">{totalRows}</span>
                {" "}results
              </span>
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        )}
      </div>
    </div>
  );
}
