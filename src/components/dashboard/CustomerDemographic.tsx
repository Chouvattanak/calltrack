"use client";
import React from "react";
import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface CustomerDemographic {
  province: string;
  total_lead: number;
}

interface CustomerDemographicProps {
  data: CustomerDemographic[];
}

export default function CustomerDemographic({ data }: CustomerDemographicProps) {
  // Check if data exists and has valid structure
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Customer Demographics
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Distribution of customers by province (Top 10)
          </p>
        </div>
        <div className="flex items-center justify-center h-48">
          <p className="text-gray-500 dark:text-gray-400">No demographic data available</p>
        </div>
      </div>
    );
  }

  // Filter out invalid data and sort by total_lead descending and take top 10
  const validData = data.filter(item => 
    item && 
    typeof item.province === 'string' && 
    typeof item.total_lead === 'number' && 
    item.total_lead > 0
  );
  
  const sortedData = [...validData]
    .sort((a, b) => b.total_lead - a.total_lead)
    .slice(0, 10);

  if (sortedData.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Customer Demographics
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Distribution of customers by province (Top 10)
          </p>
        </div>
        <div className="flex items-center justify-center h-48">
          <p className="text-gray-500 dark:text-gray-400">No valid demographic data available</p>
        </div>
      </div>
    );
  }

  const chartOptions = {
    chart: {
      type: "donut" as const,
      height: 400,
      toolbar: {
        show: false,
      },
      fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
    },
    plotOptions: {
      pie: {
        donut: {
          size: "65%",
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: "16px",
              fontWeight: 700,
              fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
              color: "#374151",
              offsetY: -10,
            },
            value: {
              show: true,
              fontSize: "24px",
              fontWeight: 800,
              fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
              color: "#111827",
              offsetY: 10,
              formatter: function (val: string) {
                return parseInt(val).toLocaleString();
              },
            },
            total: {
              show: true,
              showAlways: true,
              label: "Total Leads",
              fontSize: "14px",
              fontWeight: 600,
              fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
              color: "#6B7280",
              formatter: function () {
                const total = sortedData.reduce((sum, item) => sum + item.total_lead, 0);
                return total.toLocaleString();
              },
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: function (val: number) {
        return val.toFixed(1) + "%";
      },
      style: {
        fontSize: "14px",
        fontWeight: 800,
        fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
        colors: ["#FFFFFF"],
      },
      textAnchor: "middle" as const,
      dropShadow: {
        enabled: true,
        top: 2,
        left: 2,
        blur: 3,
        color: "#000000",
        opacity: 0.9,
      },
    },
    labels: sortedData.map(item => item.province),
    colors: [
      "#10B981",
      "#3B82F6", 
      "#8B5CF6",
      "#F59E0B",
      "#EF4444",
      "#06B6D4",
      "#84CC16",
      "#F97316",
      "#EC4899",
      "#6366F1"
    ],
    legend: {
      position: "bottom" as const,
      fontSize: "12px",
      fontWeight: 500,
      fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
      labels: {
        colors: ["#6B7280"],
      },
      markers: {
        size: 6,
      },
      itemMargin: {
        horizontal: 8,
        vertical: 4,
      },
    },
    tooltip: {
      y: {
        formatter: function (val: number) {
          return val.toLocaleString() + " customers";
        },
      },
    },
    responsive: [
      {
        breakpoint: 768,
        options: {
          chart: {
            height: 300,
          },
          legend: {
            position: "bottom" as const,
            fontSize: "10px",
          },
        },
      },
    ],
  };

  const chartSeries = sortedData.map(item => item.total_lead);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Lead Demographics
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Distribution of leads by province (Top 10)
        </p>
      </div>

      <div className="h-96">
        <ReactApexChart
          options={chartOptions}
          series={chartSeries}
          type="donut"
          height="100%"
        />
      </div>

      {/* Statistics Table */}
      <div className="mt-6">
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Province
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Leads
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Percentage
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {sortedData.slice(0, 5).map((item, index) => {
                const total = sortedData.reduce((sum, item) => sum + item.total_lead, 0);
                const percentage = ((item.total_lead / total) * 100).toFixed(1);
                
                return (
                  <tr key={item.province} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-3"
                          style={{ 
                            backgroundColor: chartOptions.colors[index] 
                          }}
                        ></div>
                        {item.province}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-right">
                      {item.total_lead.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-right">
                      {percentage}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
