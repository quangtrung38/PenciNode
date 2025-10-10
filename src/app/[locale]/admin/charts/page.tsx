import type { Metadata } from "next";
import BarChartOne from "@/components/admin/charts/bar/BarChartOne";
import LineChartOne from "@/components/admin/charts/line/LineChartOne";
import React from "react";

export const metadata: Metadata = {
  title: "Charts | Admin Dashboard",
  description: "Data visualization with interactive charts",
};

export default function ChartsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Charts & Analytics
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Visualize your data with interactive charts
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChartOne />
        <LineChartOne />
      </div>
    </div>
  );
}