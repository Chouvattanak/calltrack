'use client';

import React, { useEffect, useState } from "react";
import { DashboardMetrics, CallsChart, LeadSummaryCard, CustomerDemographic } from "@/components/dashboard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

interface DashboardData {
  dashboard_summary: {
    total_project: number;
    total_developer: number;
    total_property: number;
    total_staff: number;
  };
  lead_summary: {
    total_lead: number;
    total_lead_current_month: number;
    total_lead_previous_month: number;
    lead_percentage_change: number;
  };
  call_log_summary: {
    total_call: number;
    total_success_call: number;
    total_follow_up_call: number;
    total_fail_call: number;
    total_call_current_month: number;
    total_call_previous_month: number;
    call_percentage_change: number;
  };
  call_log_by_month: Array<{
    month: string;
    month_number: number;
    total_call_pipeline: number;
  }>;
  call_log_detail_by_month: Array<{
    month: string;
    month_number: number;
    total_call_pipeline_detail: number;
  }>;
  customer_demographic: Array<{
    province: string;
    total_lead: number;
  }>;
}

const breadcrumbs = [
  { name: "Home", href: "/" },
  { name: "Dashboard", href: "/dashboard" }
];

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No authentication token found');
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}dashboard/summary`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result && result.length > 0 && result[0].data && result[0].data.length > 0) {
          setDashboardData(result[0].data[0]);
        } else {
          setError('No dashboard data available');
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [API_BASE_URL]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <>
        <PageBreadcrumb crumbs={breadcrumbs} />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!dashboardData) {
    return (
      <>
        <PageBreadcrumb crumbs={breadcrumbs} />
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-gray-500 dark:text-gray-400">No data available</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageBreadcrumb crumbs={breadcrumbs} />
      <div className="space-y-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Overview of your call tracker metrics</p>
        </div>

        {/* Dashboard Metrics */}
        <DashboardMetrics 
          dashboardSummary={dashboardData.dashboard_summary}
          leadSummary={dashboardData.lead_summary}
          callSummary={dashboardData.call_log_summary}
        />

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a href="/callpipeline" className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Call Pipeline</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Manage your call pipeline</p>
              </div>
            </a>
            
            <a href="/lead" className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Manage Leads</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Browse and manage leads</p>
              </div>
            </a>
            
            <a href="/property" className="flex items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Manage Property</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Browse and manage properties</p>
              </div>
            </a>
          </div>
        </div>

        {/* Charts and Additional Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lead Summary Card */}
          <LeadSummaryCard leadSummary={dashboardData.lead_summary} />
          
          {/* Calls Chart */}
          <CallsChart data={dashboardData.call_log_by_month} />
        </div>

        {/* Customer Demographics */}
        <CustomerDemographic data={dashboardData.customer_demographic} />
      </div>
    </>
  );
}
