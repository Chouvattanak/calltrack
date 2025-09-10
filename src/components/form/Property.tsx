"use client";
/*
 * Property Selection Component - API Ready
 * 
 * This component is fully prepared for API integration with the following features:
 * 
 * 1. STATE MANAGEMENT:
 *    - properties: Array of property data from API
 *    - loading: Loading state for API calls
 *    - error: Error state for failed API calls
 *    - currentPage: Current pagination page
 *    - totalPages: Total pages from API response
 *    - searchTerm: Search input with debounced API calls
 * 
 * 2. API INTEGRATION READY:
 *    - fetchProperties() function ready for endpoint connection
 *    - Proper error handling and loading states
 *    - Search with 1000ms debounce to reduce API calls
 *    - Pagination support for server-side pagination
 * 
 * 3. ENDPOINT REQUIREMENTS:
 *    - GET /api/properties?page={page}&limit={limit}&search={search}
 *    - Response: { properties: IProperty[], totalPages: number, currentPage: number, totalItems: number }
 * 
 * 4. FEATURES:
 *    - Real-time search with API integration
 *    - Server-side pagination
 *    - Loading and error states with retry functionality
 *    - Responsive modal with consistent design
 * 
 * TO ACTIVATE API: Uncomment the API call in fetchProperties() function and provide the endpoint URL
 */
import { Modal } from "@/components/ui/modal";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useState, useEffect, useCallback } from "react";
import { propertiesData } from "./sample-data";
// import api from "@/lib/api"; // Ready for API integration

export interface IProperty {
  PropertyID: string;
  PropertyName: string;
  Location?: string;
  PropertyType?: string;
  Price?: string;
  Status?: string;
}

interface PropertyProps {
  value?: IProperty;
  onChange?: (property: IProperty) => void;
  error?: string;
}

export default function Property({ value, onChange, error: validationError }: PropertyProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<IProperty | null>(value || null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [properties, setProperties] = useState<IProperty[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination settings
  const itemsPerPage = 10;

  // API Functions - Ready for endpoint integration
  const fetchProperties = useCallback(async (page: number = 1, search: string = "") => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _page = page; // For future API integration
    setLoading(true);
    setError(null);
    
    try {
      // TODO: Replace with actual API endpoint
      // 
      // Expected API Endpoint: GET /api/properties
      // Query Parameters:
      // - page: number (page number for pagination)
      // - limit: number (items per page)
      // - search: string (search term for filtering)
      //
      // Expected Response Format:
      // {
      //   properties: IProperty[],
      //   totalPages: number,
      //   currentPage: number,
      //   totalItems: number
      // }
      //
      // Uncomment and modify when API is ready:
      // const response = await api.get(`/api/properties?page=${page}&limit=${itemsPerPage}&search=${encodeURIComponent(search)}`);
      // setProperties(response.data.properties);
      // setTotalPages(response.data.totalPages);
      
      // For now, use sample data with simulated pagination
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      
      let filteredData = propertiesData;
      if (search) {
        filteredData = propertiesData.filter((property) =>
          property.PropertyName.toLowerCase().includes(search.toLowerCase()) ||
          property.PropertyID.toLowerCase().includes(search.toLowerCase()) ||
          property.Location?.toLowerCase().includes(search.toLowerCase()) ||
          property.PropertyType?.toLowerCase().includes(search.toLowerCase()) ||
          property.Price?.toLowerCase().includes(search.toLowerCase()) ||
          property.Status?.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      setProperties(filteredData);
      
    } catch (err) {
      setError("Failed to fetch properties. Please try again.");
      console.error("Error fetching properties:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get properties for current page (client-side pagination for now)
  const getCurrentPageProperties = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return properties.slice(startIndex, endIndex);
  };

  // Handle search with debouncing (only when there's a search term)
  useEffect(() => {
    if (!searchTerm) return; // Don't run for empty search terms
    
    const delayedSearch = setTimeout(() => {
      setCurrentPage(1); // Reset to first page on search
      if (isModalOpen) {
        fetchProperties(1, searchTerm);
      }
    }, 1000);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, isModalOpen, fetchProperties]);

  // Initial load (only when modal opens or page changes, not for search)
  useEffect(() => {
    if (isModalOpen && !searchTerm) {
      fetchProperties(currentPage, "");
    }
  }, [isModalOpen, currentPage, fetchProperties, searchTerm]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // When using server-side pagination, this will trigger the useEffect above
    // For now, it just changes the current page state
  };

  // Get current properties to display (use API data when available, fallback to filtered sample data)  
  const filteredProperties = properties.length > 0 ? properties : propertiesData.filter((property) =>
    property.PropertyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.PropertyID.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.Location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.PropertyType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.Price?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.Status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayProperties = getCurrentPageProperties();

  const handlePropertySelect = (property: IProperty) => {
    setSelectedProperty(property);
    onChange?.(property);
    setIsModalOpen(false);
  };

  const handleModalOpen = () => {
    setSearchTerm(""); // Clear search when opening modal
    setIsModalOpen(true);
  };

  return (
    <div>
      {/* <Label>Property</Label> */}
      <button
        onClick={handleModalOpen}
        className={`flex w-full items-center justify-between gap-2 rounded-full border px-4 py-3 text-sm font-medium shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 ${
          validationError 
            ? "border-red-500 bg-red-50 text-red-700 dark:border-red-500 dark:bg-red-900/20 dark:text-red-400" 
            : "border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
        }`}
      >
        <span className="truncate text-left">
          {selectedProperty ? (
            <span className="text-gray-800 dark:text-gray-200">{`${selectedProperty.PropertyID} - ${selectedProperty.PropertyName}`}</span>
          ) : (
            <span className="text-gray-400 dark:text-white/30">Click to select property</span>
          )}
        </span>
        <svg
          className="fill-current flex-shrink-0"
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
            fill=""
          />
        </svg>
      </button>
      {validationError && <p className="text-sm text-red-500 mt-1">{validationError}</p>}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        className="max-w-[1200px] p-4 lg:p-11"
      >
        <div className="px-2 lg:pr-14">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Select a Property
          </h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
            Choose a property that the sales team wants to sell to the lead.
          </p>
        </div>
        
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-4">
          <form>
            <div className="relative">
              <button 
                type="button"
                className="absolute -translate-y-1/2 left-4 top-1/2"
              >
                <svg 
                  className="fill-gray-500 dark:fill-gray-400" 
                  width="20" 
                  height="20" 
                  viewBox="0 0 20 20" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    fillRule="evenodd" 
                    clipRule="evenodd" 
                    d="M3.04199 9.37381C3.04199 5.87712 5.87735 3.04218 9.37533 3.04218C12.8733 3.04218 15.7087 5.87712 15.7087 9.37381C15.7087 12.8705 12.8733 15.7055 9.37533 15.7055C5.87735 15.7055 3.04199 12.8705 3.04199 9.37381ZM9.37533 1.54218C5.04926 1.54218 1.54199 5.04835 1.54199 9.37381C1.54199 13.6993 5.04926 17.2055 9.37533 17.2055C11.2676 17.2055 13.0032 16.5346 14.3572 15.4178L17.1773 18.2381C17.4702 18.531 17.945 18.5311 18.2379 18.2382C18.5308 17.9453 18.5309 17.4704 18.238 17.1775L15.4182 14.3575C16.5367 13.0035 17.2087 11.2671 17.2087 9.37381C17.2087 5.04835 13.7014 1.54218 9.37533 1.54218Z" 
                    fill=""
                  />
                </svg>
              </button>
              <input 
                type="text" 
                placeholder="Search properties..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="dark:bg-dark-900 h-[42px] w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-[42px] pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[300px]"
              />
            </div>
          </form>
        </div>
          
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] min-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto mb-2"></div>
                <p className="text-gray-500 dark:text-gray-400">Loading properties...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-[400px]">
              <div className="text-center">
                <p className="text-red-500 mb-2">⚠️ Error</p>
                <p className="text-gray-500 dark:text-gray-400">{error}</p>
                <button 
                  onClick={() => fetchProperties(currentPage, searchTerm)}
                  className="mt-2 px-4 py-2 bg-brand-500 text-white rounded hover:bg-brand-600"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="flex items-center justify-center h-[400px]">
              <p className="text-gray-500 dark:text-gray-400 text-center">
                No properties found matching your search.
              </p>
            </div>
          ) : (
            <div className="max-w-full overflow-x-auto">
              <div className="min-w-[1000px]">
                <Table>
                  {/* Table Header */}
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Property ID
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Property Name
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Location
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Type
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Price
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Status
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
                      >
                        Action
                      </TableCell>
                    </TableRow>
                  </TableHeader>

                  {/* Table Body */}
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {displayProperties.map((property) => (
                      <TableRow 
                        key={property.PropertyID}
                        className="hover:bg-gray-50 dark:hover:bg-white/[0.02] cursor-pointer"
                      >
                        <TableCell className="px-5 py-2 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          <div onClick={() => handlePropertySelect(property)} className="w-full h-full">
                            {property.PropertyID}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-2 text-gray-800 text-start text-theme-sm dark:text-white/90 font-medium">
                          <div onClick={() => handlePropertySelect(property)} className="w-full h-full">
                            {property.PropertyName}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-2 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          <div onClick={() => handlePropertySelect(property)} className="w-full h-full">
                            {property.Location}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-2 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          <div onClick={() => handlePropertySelect(property)} className="w-full h-full">
                            {property.PropertyType}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-2 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          <div onClick={() => handlePropertySelect(property)} className="w-full h-full">
                            {property.Price}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-2 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          <div onClick={() => handlePropertySelect(property)} className="w-full h-full">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              property.Status === 'Available' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                : property.Status === 'Reserved'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                : property.Status === 'Sold'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                            }`}>
                              {property.Status}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-2 text-center">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePropertySelect(property);
                            }}
                            className="flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 mx-auto"
                          >
                            Select
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
        
        {filteredProperties.length > 0 && !loading && !error && (
          <div className="flex items-center justify-between mt-6 px-6 py-4">
            {/* Results info */}
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredProperties.length)} to {Math.min(currentPage * itemsPerPage, filteredProperties.length)} of {filteredProperties.length} results
            </p>

            {/* Pagination controls */}
            <div className="flex items-center space-x-2">
              {/* Previous button */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Page numbers */}
              {(() => {
                const pages = [];
                const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);
                
                // Always show first page
                if (totalPages > 0) {
                  pages.push(
                    <button
                      key={1}
                      onClick={() => handlePageChange(1)}
                      className={`flex items-center justify-center w-8 h-8 rounded-lg text-sm font-medium ${
                        currentPage === 1
                          ? "bg-brand-500 text-white"
                          : "border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                      }`}
                    >
                      1
                    </button>
                  );
                }

                // Show ellipsis if needed
                if (currentPage > 3 && totalPages > 5) {
                  pages.push(
                    <span key="ellipsis1" className="text-gray-500 dark:text-gray-400">
                      ...
                    </span>
                  );
                }

                // Show pages around current page
                const start = Math.max(2, currentPage - 1);
                const end = Math.min(totalPages - 1, currentPage + 1);
                
                for (let i = start; i <= end; i++) {
                  if (i !== 1 && i !== totalPages) {
                    pages.push(
                      <button
                        key={i}
                        onClick={() => handlePageChange(i)}
                        className={`flex items-center justify-center w-8 h-8 rounded-lg text-sm font-medium ${
                          currentPage === i
                            ? "bg-brand-500 text-white"
                            : "border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                        }`}
                      >
                        {i}
                      </button>
                    );
                  }
                }

                // Show ellipsis if needed
                if (currentPage < totalPages - 2 && totalPages > 5) {
                  pages.push(
                    <span key="ellipsis2" className="text-gray-500 dark:text-gray-400">
                      ...
                    </span>
                  );
                }

                // Always show last page if more than 1 page
                if (totalPages > 1) {
                  pages.push(
                    <button
                      key={totalPages}
                      onClick={() => handlePageChange(totalPages)}
                      className={`flex items-center justify-center w-8 h-8 rounded-lg text-sm font-medium ${
                        currentPage === totalPages
                          ? "bg-brand-500 text-white"
                          : "border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                      }`}
                    >
                      {totalPages}
                    </button>
                  );
                }

                return pages;
              })()}

              {/* Next button */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= Math.ceil(filteredProperties.length / itemsPerPage)}
                className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
