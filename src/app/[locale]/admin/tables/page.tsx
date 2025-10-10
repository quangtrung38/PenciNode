import type { Metadata } from "next";
import BasicTableOne from "@/components/admin/tables/BasicTableOne";
import React from "react";

export const metadata: Metadata = {
  title: "Tables | Admin Dashboard",
  description: "Admin tables with data management functionality",
};

export default function TablesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Data Tables
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage and view data with interactive tables
        </p>
      </div>
      
      <BasicTableOne />
    </div>
  );
}