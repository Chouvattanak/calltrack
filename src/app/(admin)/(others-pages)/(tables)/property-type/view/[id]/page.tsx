"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import { 
    BuildingOfficeIcon, CalendarDaysIcon, 
    InformationCircleIcon, TagIcon 
} from "@heroicons/react/24/outline";

interface PropertyTypeData {
  property_type_id: number;
  property_type_name: string;
  property_type_description: string;
  is_active: boolean;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

const ViewPropertyTypePage: React.FC<{ params: Promise<{ id: string }> }> = ({ params }) => {
  const router = useRouter();
  const { id: propertyTypeId } = React.use(params);

  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Property Type", href: "/property-type" },
    { name: "View" },
  ];

  const [propertyType, setPropertyType] = useState<PropertyTypeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [propertyTypeNotFound, setPropertyTypeNotFound] = useState(false);

  // Load property type data
  useEffect(() => {
    const fetchPropertyType = async () => {
      if (!propertyTypeId) {
        setPropertyTypeNotFound(true);
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        // Use the same API contract as the edit page
        const requestUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL || ''}property-type/pagination`;
        const requestBody = {
          page_number: "1",
          page_size: "10",
          search_type: "property_type_id",
          query_search: String(propertyTypeId),
        };
        const response = await api.post(requestUrl, requestBody);
        const apiResult = response.data[0];
        if (apiResult && apiResult.data && apiResult.data.length > 0) {
          setPropertyType(apiResult.data[0]);
        } else {
          setPropertyTypeNotFound(true);
        }
      } catch (error) {
        console.error('Error fetching property type:', error);
        setPropertyTypeNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPropertyType();
  }, [propertyTypeId]);

  if (isLoading) {
    return (
      <div>
        <PageBreadcrumb crumbs={breadcrumbs} />
        <ComponentCard title="Property Type Details">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading property type...</p>
            </div>
          </div>
        </ComponentCard>
      </div>
    );
  }

  if (propertyTypeNotFound || !propertyType) {
    return (
      <div>
        <PageBreadcrumb crumbs={breadcrumbs} />
        <ComponentCard title="Property Type Details">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Property Type Not Found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">The property type you&apos;re looking for doesn&apos;t exist or has been removed.</p>
              <Button onClick={() => router.push('/property-type')}>Back to Property Type List</Button>
            </div>
          </div>
        </ComponentCard>
      </div>
    );
  }

  // Design inspired by leads view page with section lines
  return (
    <div>
      <PageBreadcrumb crumbs={breadcrumbs} />
      <ComponentCard title="Property Type Details">
        <div className="space-y-8">
          {/* Header with Action Buttons */}
          <div className="flex justify-between items-start pb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              {/* Property Type Icon */}
              <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                  <BuildingOfficeIcon className="h-10 w-10 text-blue-600" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-500/10">
                    <TagIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {propertyType.property_type_name}
                  </h1>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${propertyType.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'}`}>
                    {propertyType.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ID: {propertyType.property_type_id}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => router.push('/property-type')}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </Button>
              <Button variant="outline" onClick={() => router.push(`/property-type/edit/${propertyType.property_type_id}`)}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </Button>
            </div>
          </div>

          {/* Property Type Information Section */}
          <div className="py-8 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <InformationCircleIcon className="h-5 w-5" />
              Property Type Information
            </h3>
            <div className="grid grid-cols-3 gap-4 pl-6">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Property Type ID:</div>
              <div className="col-span-2 text-gray-900 dark:text-white">{propertyType.property_type_id}</div>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Name:</div>
              <div className="col-span-2 text-gray-900 dark:text-white">{propertyType.property_type_name}</div>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Status:</div>
              <div className="col-span-2">{propertyType.is_active ? 'Active' : 'Inactive'}</div>
            </div>
          </div>

          {/* Description Section */}
          <div className="py-8 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <InformationCircleIcon className="h-5 w-5" />
              Description
            </h3>
            <div className="text-gray-800 dark:text-gray-200 whitespace-pre-line pl-6">{propertyType.property_type_description || '-'}</div>
          </div>

          {/* System Information Section */}
          <div className="py-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <CalendarDaysIcon className="h-5 w-5" />
              System Information
            </h3>
            <div className="grid grid-cols-3 gap-4 pl-6">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Created By:</div>
              <div className="col-span-2 text-gray-900 dark:text-white">{propertyType.created_by || 'System'}</div>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Created At:</div>
              <div className="col-span-2 text-gray-900 dark:text-white">{propertyType.created_at ? new Date(propertyType.created_at).toLocaleDateString() : 'N/A'}</div>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Updated At:</div>
              <div className="col-span-2 text-gray-900 dark:text-white">{propertyType.updated_at ? new Date(propertyType.updated_at).toLocaleDateString() : 'N/A'}</div>
            </div>
          </div>
        </div>
      </ComponentCard>
    </div>
  );
};

export default ViewPropertyTypePage;
