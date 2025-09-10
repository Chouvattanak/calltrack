import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

interface PaginatedSelectionModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: T) => void;
  title: string;
  data: T[];
  columns: { key: string; label: string }[];
  searchPlaceholder: string;
  isLoading?: boolean;
  extraActions?: React.ReactNode;
  currentPage: number;
  totalRows: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSearch: (query: string, searchType: string) => void;
  searchQuery: string;
  searchType: string;
}

function PaginatedSelectionModal<T>({
  isOpen,
  onClose,
  onSelect,
  title,
  data,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  columns,
  searchPlaceholder,
  isLoading,
  extraActions,
  currentPage,
  totalRows,
  pageSize,
  onPageChange,
  onSearch,
  searchQuery,
  searchType,
}: PaginatedSelectionModalProps<T>) {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchQuery);

  const totalPages = Math.ceil(totalRows / pageSize);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (localSearchTerm !== searchQuery) {
        onSearch(localSearchTerm, searchType);
        onPageChange(1); // Reset to first page when searching
      }
    }, 500); // 500ms debounce
    
    return () => {
      clearTimeout(timeout);
    };
  }, [localSearchTerm, searchQuery, searchType, onSearch, onPageChange]);

  const handleSelect = (item: T) => {
    onSelect(item);
    onClose();
    setLocalSearchTerm("");
  };

  const handleClose = () => {
    onClose();
    setLocalSearchTerm("");
  };

  const handlePageChange = (page: number) => {
    onPageChange(page);
  };

  if (!isOpen) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      className="max-w-5xl w-[95vw] mx-4 p-0 overflow-hidden"
    >
      <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
              title.toLowerCase().includes('lead') ? 'bg-gradient-to-r from-blue-500 to-indigo-600' :
              title.toLowerCase().includes('property') ? 'bg-gradient-to-r from-emerald-500 to-teal-600' :
              'bg-gradient-to-r from-purple-500 to-pink-600'
            }`}>
              {title.toLowerCase().includes('lead') ? (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              ) : title.toLowerCase().includes('property') ? (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </div>
            <div>
              <h4 className="text-2xl font-bold text-gray-900 dark:text-white">
                {title}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Select from {totalRows} available options
              </p>
            </div>
          </div>
          
          {/* Search and Actions */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input 
                type="text" 
                placeholder={searchPlaceholder} 
                value={localSearchTerm}
                onChange={(e) => setLocalSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl bg-white/70 backdrop-blur-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all dark:bg-gray-800/70 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 dark:focus:ring-blue-400"
              />
            </div>
            {extraActions && (
              <div className="flex items-center gap-2">
                {extraActions}
              </div>
            )}
          </div>
        </div>
        
        {/* Results info bar */}
        <div className="px-6 py-2 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Showing {data.length > 0 ? ((currentPage - 1) * pageSize) + 1 : 0} to {Math.min(currentPage * pageSize, totalRows)} of {totalRows} results
            </span>
            <span className="text-gray-500 dark:text-gray-500 text-xs">
              Page {currentPage} of {totalPages}
            </span>
          </div>
        </div>
      </div>
      
      {/* Content Area */}
      <div className="bg-white dark:bg-gray-900 max-h-[60vh] overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-r-blue-400 rounded-full animate-spin animation-delay-150"></div>
            </div>
            <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading {title.toLowerCase()}...</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">Please wait while we fetch the data</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.5-1.068-5.908-2.709A8.016 8.016 0 013 12c0-3.314 2.686-6 6-6h6c3.314 0 6 2.686 6 6 0 1.513-.422 2.928-1.152 4.137" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No {title.toLowerCase()} found</h3>
            <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm">
              We couldn&apos;t find any {title.toLowerCase()} matching your search criteria. Try adjusting your search terms{title.toLowerCase().includes('lead') ? ' or create a new lead' : ''}.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.map((item, index) => {
              const itemData = item as Record<string, unknown>;
              
              // Detect if this is a lead or property based on available fields
              const isLead = 'full_name' in itemData && 'primary_contact' in itemData;
              const isProperty = 'property_profile_id' in itemData && 'property_type_name' in itemData;
              
              if (isLead) {
                return (
                  <div 
                    key={index} 
                    className="group relative p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-gray-800 dark:hover:to-gray-750 transition-all duration-200 cursor-pointer border-l-4 border-transparent hover:border-blue-500"
                    onClick={() => handleSelect(item)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        {/* Lead Avatar */}
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-md group-hover:shadow-lg transition-shadow">
                          {itemData.full_name ? String(itemData.full_name).charAt(0).toUpperCase() : 'L'}
                        </div>
                        
                        {/* Lead Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                              {String(itemData.full_name || 'Unnamed Lead')}
                            </h3>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              ID: {String(itemData.lead_id || '')}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1.5">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              <span className="font-medium">{String(itemData.primary_contact || 'No contact')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Select Button */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(item);
                        }}
                        className="mr-8 inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm group-hover:shadow-md dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:border-gray-500"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Select
                      </button>
                    </div>
                    
                    {/* Hover indicator */}
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                );
              } else if (isProperty) {
                // Format price for display
                const formatPrice = (price: unknown): string => {
                  const numPrice = Number(price);
                  if (!numPrice) return "Price not available";
                  return `$${numPrice.toLocaleString()}`;
                };
                
                return (
                  <div 
                    key={index} 
                    className="group relative p-4 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 dark:hover:from-gray-800 dark:hover:to-gray-750 transition-all duration-200 cursor-pointer border-l-4 border-transparent hover:border-emerald-500"
                    onClick={() => handleSelect(item)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        {/* Property Icon */}
                        <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white shadow-md group-hover:shadow-lg transition-shadow">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        
                        {/* Property Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                              {String(itemData.property_profile_name || itemData.project_name || `Property #${itemData.property_profile_id}` || 'Unknown Property')}
                            </h3>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                              {String(itemData.property_type_name || 'Unknown Type')}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1.5">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              <span className="font-medium">{String(itemData.project_name || 'Unknown Project')}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                              </svg>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatPrice(itemData.price)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Select Button */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(item);
                        }}
                        className="mr-8 inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-sm group-hover:shadow-md dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:border-gray-500"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Select
                      </button>
                    </div>
                    
                    {/* Hover indicator */}
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                );
              } else {
                // Generic fallback for other data types or staff
                const displayName = String(itemData.name || itemData.full_name || itemData.username || 'Unknown Item');
                const displayId = String(itemData.id || itemData.user_id || itemData.staff_id || '');
                const displayInfo = String(itemData.email || itemData.role || itemData.department || 'No additional info');
                
                return (
                  <div 
                    key={index} 
                    className="group relative p-4 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-gray-800 dark:hover:to-gray-750 transition-all duration-200 cursor-pointer border-l-4 border-transparent hover:border-purple-500"
                    onClick={() => handleSelect(item)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        {/* Generic Avatar */}
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-md group-hover:shadow-lg transition-shadow">
                          {displayName ? displayName.charAt(0).toUpperCase() : 'S'}
                        </div>
                        
                        {/* Generic Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                              {displayName}
                            </h3>
                            {displayId && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                ID: {displayId}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1.5">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <span className="font-medium">{displayInfo}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Select Button */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(item);
                        }}
                        className="mr-8 inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm group-hover:shadow-md dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:border-gray-500"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Select
                      </button>
                    </div>
                    
                    {/* Hover indicator */}
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        )}
      </div>
      
      {/* Pagination Footer */}
      {totalRows > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing <span className="font-medium text-gray-900 dark:text-white">{data.length > 0 ? ((currentPage - 1) * pageSize) + 1 : 0}</span> to{' '}
              <span className="font-medium text-gray-900 dark:text-white">{Math.min(currentPage * pageSize, totalRows)}</span> of{' '}
              <span className="font-medium text-gray-900 dark:text-white">{totalRows}</span> results
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Previous Button */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              >
                <ChevronLeftIcon className="w-4 h-4" />
                <span className="ml-1 hidden sm:inline">Previous</span>
              </button>
              
              {/* Page Numbers */}
              <div className="hidden sm:flex items-center space-x-1">
                {(() => {
                  const pages = [];
                  const showEllipsis = totalPages > 7;
                  
                  if (showEllipsis) {
                    // Always show first page
                    pages.push(
                      <button
                        key={1}
                        onClick={() => handlePageChange(1)}
                        className={`relative inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === 1
                            ? "bg-blue-600 text-white shadow-md"
                            : "bg-white border border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                        }`}
                      >
                        1
                      </button>
                    );
                    
                    // Show ellipsis if needed
                    if (currentPage > 4) {
                      pages.push(
                        <span key="ellipsis1" className="text-gray-500 dark:text-gray-400 px-2">...</span>
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
                            className={`relative inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              currentPage === i
                                ? "bg-blue-600 text-white shadow-md"
                                : "bg-white border border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                            }`}
                          >
                            {i}
                          </button>
                        );
                      }
                    }
                    
                    // Show ellipsis if needed
                    if (currentPage < totalPages - 3) {
                      pages.push(
                        <span key="ellipsis2" className="text-gray-500 dark:text-gray-400 px-2">...</span>
                      );
                    }
                    
                    // Always show last page if more than 1 page
                    if (totalPages > 1) {
                      pages.push(
                        <button
                          key={totalPages}
                          onClick={() => handlePageChange(totalPages)}
                          className={`relative inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === totalPages
                              ? "bg-blue-600 text-white shadow-md"
                              : "bg-white border border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                          }`}
                        >
                          {totalPages}
                        </button>
                      );
                    }
                  } else {
                    // Show all pages if 7 or fewer
                    for (let i = 1; i <= totalPages; i++) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => handlePageChange(i)}
                          className={`relative inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === i
                              ? "bg-blue-600 text-white shadow-md"
                              : "bg-white border border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                          }`}
                        >
                          {i}
                        </button>
                      );
                    }
                  }
                  
                  return pages;
                })()}
              </div>
              
              {/* Next Button */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="relative inline-flex items-center px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              >
                <span className="mr-1 hidden sm:inline">Next</span>
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default PaginatedSelectionModal;
