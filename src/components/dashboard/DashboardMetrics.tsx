"use client";
import React from "react";
import Badge from "../ui/badge/Badge";
import { ArrowDownIcon, ArrowUpIcon, GroupIcon } from "@/icons";

interface DashboardSummary {
  total_project: number;
  total_developer: number;
  total_property: number;
  total_staff: number;
}

interface LeadSummary {
  total_lead: number;
  total_lead_current_month: number;
  total_lead_previous_month: number;
  lead_percentage_change: number;
}

interface CallSummary {
  total_call: number;
  total_success_call: number;
  total_follow_up_call: number;
  total_fail_call: number;
  total_call_current_month: number;
  total_call_previous_month: number;
  call_percentage_change: number;
}

interface DashboardMetricsProps {
  dashboardSummary: DashboardSummary;
  leadSummary: LeadSummary;
  callSummary: CallSummary;
}

export default function DashboardMetrics({ dashboardSummary, leadSummary, callSummary }: DashboardMetricsProps) {
  // Provide default values to handle undefined data
  const safePropertyCount = dashboardSummary?.total_property || 0;
  const safeLeadCount = leadSummary?.total_lead || 0;
  const safeLeadChange = leadSummary?.lead_percentage_change || 0;
  const safeCallCount = callSummary?.total_call || 0;
  const safeSuccessCallCount = callSummary?.total_success_call || 0;
  const safeFollowUpCallCount = callSummary?.total_follow_up_call || 0;
  const safeFailCallCount = callSummary?.total_fail_call || 0;
  const safeCallChange = callSummary?.call_percentage_change || 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 md:gap-6">
      {/* Total Calls */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-xl dark:bg-red-800/20">
          <svg className="text-red-600 size-6 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Calls
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {safeCallCount.toLocaleString()}
            </h4>
          </div>
          <Badge color={safeCallChange >= 0 ? "success" : "error"}>
            {safeCallChange >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
            {Math.abs(safeCallChange)}%
          </Badge>
        </div>
      </div>

      {/* Success Calls */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl dark:bg-green-800/20">
          <svg className="text-green-600 size-6 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Success Calls
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {safeSuccessCallCount.toLocaleString()}
            </h4>
          </div>
        </div>
      </div>

      {/* Follow Up Calls */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-xl dark:bg-yellow-800/20">
          <svg className="text-yellow-600 size-6 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Follow Up Calls
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {safeFollowUpCallCount.toLocaleString()}
            </h4>
          </div>
        </div>
      </div>

      {/* Fail Calls */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-xl dark:bg-red-800/20">
          <svg className="text-red-600 size-6 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Fail Calls
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {safeFailCallCount.toLocaleString()}
            </h4>
          </div>
        </div>
      </div>

      {/* Total Leads */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-xl dark:bg-indigo-800/20">
          <GroupIcon className="text-indigo-600 size-6 dark:text-indigo-400" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Leads
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {safeLeadCount.toLocaleString()}
            </h4>
          </div>
          <Badge color={safeLeadChange >= 0 ? "success" : "error"}>
            {safeLeadChange >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
            {Math.abs(safeLeadChange)}%
          </Badge>
        </div>
      </div>

      {/* Total Properties */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl dark:bg-purple-800/20">
          <svg className="text-purple-600 size-6 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div className="mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Properties
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {safePropertyCount.toLocaleString()}
            </h4>
          </div>
        </div>
      </div>
    </div>
  );
}
