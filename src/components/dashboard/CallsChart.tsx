"use client";
import React from "react";
import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface CallLogByMonth {
  month: string;
  month_number: number;
  total_call_pipeline: number;
}

interface CallsChartProps {
  data: CallLogByMonth[];
}

export default function CallsChart({ data }: CallsChartProps) {
  // Check if data exists and has valid structure
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Calls Overview
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Monthly breakdown of call performance
          </p>
        </div>
        <div className="flex items-center justify-center h-48">
          <p className="text-gray-500 dark:text-gray-400">No call data available</p>
        </div>
      </div>
    );
  }

  // Filter out invalid data entries
  const validData = data.filter(item => 
    item && 
    typeof item.month === 'string' && 
    typeof item.month_number === 'number' &&
    typeof item.total_call_pipeline === 'number'
  );

  if (validData.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Calls Overview
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Monthly breakdown of call performance
          </p>
        </div>
        <div className="flex items-center justify-center h-48">
          <p className="text-gray-500 dark:text-gray-400">No valid call data available</p>
        </div>
      </div>
    );
  }

  // Process the data for the chart
  const processedData = validData.map(item => ({
    ...item,
    monthName: item.month, // Use the month name directly from API
  }));

  const chartOptions = {
    chart: {
      type: "bar" as const,
      height: 350,
      stacked: false,
      toolbar: {
        show: false,
      },
      fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "55%",
        borderRadius: 4,
        dataLabels: {
          position: "top",
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ["transparent"],
    },
    xaxis: {
      categories: processedData.map(item => item.monthName),
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        style: {
          fontSize: "12px",
          fontWeight: 500,
          fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
          colors: ["#64748B"],
        },
      },
    },
    yaxis: {
      title: {
        text: "Number of Calls",
        style: {
          fontSize: "12px",
          fontWeight: 600,
          fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
          color: "#64748B",
        },
      },
      labels: {
        style: {
          fontSize: "12px",
          fontWeight: 500,
          fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
          colors: ["#64748B"],
        },
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      y: {
        formatter: function (val: number) {
          return val.toString();
        },
      },
    },
    legend: {
      position: "top" as const,
      horizontalAlign: "left" as const,
      fontSize: "12px",
      fontWeight: 500,
      fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
      labels: {
        colors: ["#64748B"],
      },
      markers: {
        size: 4,
      },
    },
    colors: ["#10B981"], // Single green color
    grid: {
      borderColor: "#E2E8F0",
      strokeDashArray: 3,
    },
  };

  const chartSeries = [
    {
      name: "Total Calls",
      data: processedData.map(item => item.total_call_pipeline || 0),
    },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Calls Overview
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Monthly breakdown of call performance
        </p>
      </div>
      
      <div className="h-80">
        <ReactApexChart
          options={chartOptions}
          series={chartSeries}
          type="bar"
          height="100%"
        />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {processedData.reduce((sum, item) => sum + item.total_call_pipeline, 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total Calls
          </p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {processedData.length}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Active Months
          </p>
        </div>
      </div>
    </div>
  );
}
