"use client";
import React from "react";
import { GroupIcon, ArrowUpIcon, ArrowDownIcon } from "@/icons";

interface LeadSummary {
  total_lead: number;
  total_lead_current_month: number;
  total_lead_previous_month: number;
  lead_percentage_change: number;
}

interface LeadSummaryCardProps {
  leadSummary: LeadSummary;
}

export default function LeadSummaryCard({ leadSummary }: LeadSummaryCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Lead Summary
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Overview of lead generation performance
        </p>
      </div>

      {/* Main Metric */}
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-indigo-100 rounded-xl dark:bg-indigo-800/20">
          <GroupIcon className="text-indigo-600 size-8 dark:text-indigo-400" />
        </div>
        <h2 className="text-4xl font-bold text-gray-900 dark:text-white">
          {leadSummary.total_lead.toLocaleString()}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Total Leads
        </p>
      </div>

      {/* Monthly Comparison */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-4 bg-gray-50 rounded-xl dark:bg-gray-800/50">
          <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
            {leadSummary.total_lead_current_month.toLocaleString()}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Current Month
          </p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-xl dark:bg-gray-800/50">
          <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
            {leadSummary.total_lead_previous_month.toLocaleString()}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Previous Month
          </p>
        </div>
      </div>

      {/* Percentage Change */}
      <div className="text-center">
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          leadSummary.lead_percentage_change >= 0 
            ? 'bg-green-100 text-green-700 dark:bg-green-800/20 dark:text-green-400' 
            : 'bg-red-100 text-red-700 dark:bg-red-800/20 dark:text-red-400'
        }`}>
          {leadSummary.lead_percentage_change >= 0 ? (
            <ArrowUpIcon className="w-3 h-3 mr-1" />
          ) : (
            <ArrowDownIcon className="w-3 h-3 mr-1" />
          )}
          {leadSummary.lead_percentage_change >= 0 ? '+' : ''}{leadSummary.total_lead_current_month - leadSummary.total_lead_previous_month} ({Math.abs(leadSummary.lead_percentage_change)}%) vs Previous Month
        </div>
      </div>
    </div>
  );
}
