import type { Metadata } from "next";
import DefaultInputs from "@/components/admin/form/form-elements/DefaultInputs";
import CheckboxComponents from "@/components/admin/form/form-elements/CheckboxComponents";
import SelectInputs from "@/components/admin/form/form-elements/SelectInputs";
import React from "react";

export const metadata: Metadata = {
  title: "Forms | Admin Dashboard",
  description: "Form elements and validation components",
};

export default function FormsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Form Elements
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Interactive form components with validation
        </p>
      </div>
      
      <div className="space-y-8">
        <DefaultInputs />
        <CheckboxComponents />
        <SelectInputs />
      </div>
    </div>
  );
}