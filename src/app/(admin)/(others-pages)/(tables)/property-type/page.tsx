"use client";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import SearchComponent from "@/components/common/SearchComponent";
import PropertyTypeTable, { ColumnSelector, usePropertyTypeData, Pagination, PropertyType } from "@/components/tables/PropertyTypeTable";
// Columns definition for ColumnSelector
const propertyTypeColumns: { key: keyof PropertyType; label: string }[] = [
  { key: 'id', label: 'Property Type ID' },
  { key: 'name', label: 'Property Type Name' },
  { key: 'description', label: 'Description' },
  { key: 'createdDate', label: 'Created Date' },
  { key: 'updatedDate', label: 'Updated Date' },
  { key: 'status', label: 'Status' },
];
import React from "react";
import Button from "@/components/ui/button/Button";
import Link from "next/link";

const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Property Type", href: "/property-type" }
  ];

const propertyTypeSearchOptions = [
  { value: 'property_type_id', label: 'Property Type ID' },
  { value: 'property_type_name', label: 'Property Type Name' },
  { value: 'description', label: 'Description' },
];

export default function PropertyTypePage() {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchType, setSearchType] = React.useState("");
  const pageSize = 10;
  
  const { propertyTypes, isLoading, totalRows } = usePropertyTypeData(currentPage, pageSize, searchQuery, searchType);
  const totalPages = Math.ceil(totalRows / pageSize);

  const handleSearch = (query: string, type: string) => {
    setSearchQuery(query);
    setSearchType(type);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Manage visibleColumns state in the page (persist to localStorage)
  const [visibleColumns, setVisibleColumns] = React.useState<(keyof PropertyType)[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('propertyTypeTableVisibleColumns');
        return saved ? (JSON.parse(saved) as (keyof PropertyType)[]) : ['name', 'description', 'status'];
      } catch {
        return ['name', 'description', 'status'];
      }
    }
    return ['name', 'description', 'status'];
  });

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('propertyTypeTableVisibleColumns', JSON.stringify(visibleColumns));
      } catch (error) {
        console.error('Error saving visible columns:', error);
      }
    }
  }, [visibleColumns]);

  // Error boundary for safe rendering
  if (!propertyTypes && !isLoading) {
    return (
      <div className="space-y-6">
        <PageBreadcrumb crumbs={breadcrumbs} />
        <div className="space-y-6">
          <ComponentCard title="Property Types">
            <div className="text-center py-8">
              <p className="text-gray-500">Unable to load property types. Please try again later.</p>
            </div>
          </ComponentCard>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageBreadcrumb crumbs={breadcrumbs} />
      <div className="space-y-6">
        <ComponentCard title="Property Types">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <Link href="/property-type/create">
                <Button size="md" variant="primary">
                  Add Property Type +
                </Button>
              </Link>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1">
              <div className="flex-1 w-full sm:w-auto">
                <SearchComponent onSearch={handleSearch} searchOptions={propertyTypeSearchOptions} />
              </div>
              <div>
                <ColumnSelector
                  availableColumns={propertyTypeColumns}
                  visibleColumns={visibleColumns}
                  onToggleColumn={(column) => {
                    setVisibleColumns((prev) =>
                      prev.includes(column)
                        ? prev.filter((col) => col !== column)
                        : [...prev, column]
                    );
                  }}
                />
              </div>
            </div>
          </div>
          <PropertyTypeTable
            externalPropertyTypes={propertyTypes}
            externalIsLoading={isLoading}
            externalCurrentPage={currentPage}
            externalTotalPages={totalPages}
            externalOnPageChange={setCurrentPage}
            visibleColumns={visibleColumns}
          />
        </ComponentCard>
        {/* Pagination - Outside the ComponentCard like in staff page */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Showing{" "}
                <span className="font-medium">{((currentPage - 1) * pageSize) + 1}</span>
                {" "}to{" "}
                <span className="font-medium">
                  {Math.min(currentPage * pageSize, totalRows)}
                </span>
                {" "}of{" "}
                <span className="font-medium">{totalRows}</span>
                {" "}results
              </span>
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        )}
      </div>
    </div>
  );
}
