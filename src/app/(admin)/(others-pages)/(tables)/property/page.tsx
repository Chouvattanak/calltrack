"use client";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PropertyTable from "@/components/tables/PropertyTable";
import { PropertyColumnSelector } from "@/components/tables/PropertyColumnSelector";
import LoadingOverlay from "@/components/ui/loading/LoadingOverlay";
import React, { useState, useEffect } from "react";
import Button from "@/components/ui/button/Button";
import Link from "next/link";
import { 
  PlusIcon,
  HomeIcon,
  CheckCircleIcon,
  CurrencyDollarIcon 
} from "@heroicons/react/24/outline";


const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Property", href: "/property" }
  ];

export default function PropertyPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const defaultColumns = ['id', 'name', 'address', 'project', 'type', 'status', 'room', 'home', 'width', 'length', 'price'];
  const [visibleColumns, setVisibleColumns] = useState<(keyof import("@/components/tables/PropertyTable").Property)[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('propertyTableVisibleColumns');
      if (saved) {
        try {
          const savedColumns = JSON.parse(saved);
          // Remove 'is_active' and 'created_by' if they exist in saved columns and update localStorage
          const updatedColumns = savedColumns.filter((col: string) => col !== 'is_active' && col !== 'created_by');
          if (updatedColumns.length === 0) {
            // If no columns left after filtering, use default
            localStorage.setItem('propertyTableVisibleColumns', JSON.stringify(defaultColumns));
            return defaultColumns;
          }
          if (updatedColumns.length !== savedColumns.length) {
            // Columns were removed, update localStorage
            localStorage.setItem('propertyTableVisibleColumns', JSON.stringify(updatedColumns));
            return updatedColumns;
          }
          return savedColumns;
        } catch {
          // If parsing fails, use default
          localStorage.setItem('propertyTableVisibleColumns', JSON.stringify(defaultColumns));
          return defaultColumns;
        }
      }
      // No saved columns, set default
      localStorage.setItem('propertyTableVisibleColumns', JSON.stringify(defaultColumns));
      return defaultColumns;
    }
    return defaultColumns;
  });

  // Real total properties from API
  const [totalProperties, setTotalProperties] = useState(0);
  const [availableProperties, setAvailableProperties] = useState(0);
  const [totalValuation, setTotalValuation] = useState(0);

  useEffect(() => {
    localStorage.setItem('propertyTableVisibleColumns', JSON.stringify(visibleColumns));
  }, [visibleColumns]);


  // Fetch property statistics from summary API
  useEffect(() => {
    let isMounted = true;
    setIsStatsLoading(true);
    
    async function fetchStats() {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
        const url = `${apiBase}/property-profile/summary`;
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        console.log("Property summary API request", { url, headers });
        const response = await fetch(url, {
          method: "GET",
          headers
        });
        const data = await response.json();
        console.log("Property summary API response", data);
        const apiResult = data[0]?.data?.[0];
        
        if (isMounted) {
          setTotalProperties(apiResult?.total_property_profile || 0);
          setAvailableProperties(apiResult?.active_property_profile || 0);
          setTotalValuation(apiResult?.total_property_profile_price || 0);
        }
      } catch {
        if (isMounted) {
          setTotalProperties(0);
          setAvailableProperties(0);
          setTotalValuation(0);
        }
      } finally {
        if (isMounted) setIsStatsLoading(false);
      }
    }
    
    fetchStats();
    return () => { isMounted = false; };
  }, []);

  if (isStatsLoading) {
    return <LoadingOverlay isLoading={true} />;
  }

  return (
    <div className="space-y-6">
      <PageBreadcrumb crumbs={breadcrumbs} />
      
      {/* Property Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-white/[0.05] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Properties</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalProperties}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-500/10">
              <HomeIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-white/[0.05] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Available Properties</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{availableProperties}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-500/10">
              <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-white/[0.05] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Property Valuation</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalValuation.toLocaleString()}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-500/10">
              <CurrencyDollarIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <ComponentCard title="Property Management">
          <div className="space-y-4">
            {/* Search Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4 flex-1">
                <Link href="/property/create">
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="flex items-center gap-2 whitespace-nowrap"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add Property
                  </Button>
                </Link>
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <span className="absolute -translate-y-1/2 left-4 top-1/2 pointer-events-none">
                      <svg
                        className="fill-gray-500 dark:fill-gray-400"
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
                          fill=""
                        />
                      </svg>
                    </span>
                    <input
                      type="text"
                      placeholder="Search properties..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/property/export">
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
                <PropertyColumnSelector visibleColumns={visibleColumns} setVisibleColumns={setVisibleColumns} />
              </div>
            </div>
            
            <PropertyTable 
              searchTerm={searchTerm}
              visibleColumns={visibleColumns}
            />
          </div>
        </ComponentCard>
      </div>
    </div>
  );
}
