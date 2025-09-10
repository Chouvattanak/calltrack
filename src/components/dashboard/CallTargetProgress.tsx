"use client";
import React from "react";
import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface CallSummary {
  total_call: number;
  total_success_call: number;
  total_follow_up_call: number;
  total_fail_call: number;
  total_call_current_month: number;
  total_call_previous_month: number;
  call_percentage_change: number;
}

interface CallTargetProgressProps {
  callSummary: CallSummary;
  target?: number; // Optional target, defaults to total_call * 1.2
}

export default function CallTargetProgress({ callSummary, target }: CallTargetProgressProps) {
  const callTarget = target || Math.round(callSummary.total_call * 1.2);
  const successRate = Math.round((callSummary.total_success_call / callSummary.total_call) * 100);
  const targetProgress = Math.round((callSummary.total_call / callTarget) * 100);

  const chartOptions = {
    chart: {
      type: "radialBar" as const,
      height: 350,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 270,
        hollow: {
          margin: 5,
          size: "30%",
          background: "transparent",
        },
        dataLabels: {
          name: {
            offsetY: -10,
            show: true,
            color: "#64748B",
            fontSize: "13px",
            fontWeight: 500,
          },
          value: {
            offsetY: 0,
            color: "#1F2937",
            fontSize: "22px",
            fontWeight: 700,
            show: true,
            formatter: function (val: number) {
              return val + "%";
            },
          },
        },
      },
    },
    colors: ["#10B981", "#F59E0B"],
    labels: ["Success Rate", "Target Progress"],
    legend: {
      show: true,
      floating: true,
      fontSize: "12px",
      position: "left" as const,
      offsetX: 10,
      offsetY: 15,
      labels: {
        useSeriesColors: true,
      },
      markers: {
        size: 0,
      },
      formatter: function (seriesName: string, opts: { w: { globals: { series: number[] } }; seriesIndex: number }) {
        return seriesName + ":  " + opts.w.globals.series[opts.seriesIndex] + "%";
      },
      itemMargin: {
        vertical: 3,
      },
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          legend: {
            show: false,
          },
        },
      },
    ],
  };

  const chartSeries = [successRate, targetProgress];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Call Performance
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Success rate and target progress
        </p>
      </div>

      <div className="h-80">
        <ReactApexChart
          options={chartOptions}
          series={chartSeries}
          type="radialBar"
          height="100%"
        />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {callSummary.total_success_call.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Successful Calls
          </p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {callTarget.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Target Calls
          </p>
        </div>
      </div>
    </div>
  );
}
