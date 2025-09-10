import React, { useState } from "react";
// Simple inline spinner
function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full py-20">
      <svg className="animate-spin h-8 w-8 text-blue-600 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      <span className="text-gray-500 dark:text-gray-400 text-center">Loading...</span>
    </div>
  );
}
import { Modal } from "@/components/ui/modal";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SelectionModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: T) => void;
  title: string;
  data: T[];
  columns: { key: string; label: string }[];
  searchPlaceholder: string;
  isLoading?: boolean;
  extraActions?: React.ReactNode;
}

function SelectionModal<T>({
  isOpen,
  onClose,
  onSelect,
  title,
  data,
  columns,
  searchPlaceholder,
  isLoading,
  extraActions,
}: SelectionModalProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredData = searchTerm.trim() === ''
    ? data
    : data.filter((item) => {
        return columns.some(col => {
          const value = (item as Record<string, unknown>)[col.key];
          return value && String(value).toLowerCase().includes(searchTerm.toLowerCase());
        });
      });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  const handleSelect = (item: T) => {
    onSelect(item);
    onClose();
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handleClose = () => {
    onClose();
    setSearchTerm("");
    setCurrentPage(1);
  };

  if (!isOpen) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      className="max-w-[900px] p-4 lg:p-11"
    >
      <div className="px-2 lg:pr-14">
        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
          {title}
        </h4>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
          Choose an item from the list below.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
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
              placeholder={searchPlaceholder} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="dark:bg-dark-900 h-[42px] w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-[42px] pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[300px]"
            />
          </div>
        </form>
        {extraActions && (
          <div className="flex items-center">
            {extraActions}
          </div>
        )}
      </div>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] min-h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-[400px]">
            <Spinner />
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex items-center justify-center h-[400px]">
            <p className="text-gray-500 dark:text-gray-400 text-center">
              No results found matching your search.
            </p>
          </div>
        ) : (
          <div className="max-w-full overflow-x-auto">
            <div className="min-w-[800px]">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    {columns.map((col) => (
                      <TableCell
                        key={col.key}
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        {col.label}
                      </TableCell>
                    ))}
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Action
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {currentData.map((item, index) => (
                    <TableRow 
                      key={index} 
                      className="hover:bg-gray-50 dark:hover:bg-white/[0.02] cursor-pointer"
                    >
                      {columns.map((col) => (
                        <TableCell 
                          key={col.key} 
                          className="px-5 py-2 text-gray-800 text-start text-theme-sm dark:text-white/90"
                        >
                          <div onClick={() => handleSelect(item)} className="w-full h-full">
                            {(item as Record<string, unknown>)[col.key] as string}
                          </div>
                        </TableCell>
                      ))}
                      <TableCell className="px-4 py-2 text-start">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelect(item);
                          }}
                          className="flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
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
      {/* Pagination */}
      {filteredData.length > 0 && (
        <div className="flex items-center justify-between mt-6 px-6 py-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredData.length)} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} results
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            {(() => {
              const pages = [];
              if (totalPages > 0) {
                pages.push(
                  <button
                    key={1}
                    onClick={() => setCurrentPage(1)}
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
              if (currentPage > 3 && totalPages > 5) {
                pages.push(
                  <span key="ellipsis1" className="text-gray-500 dark:text-gray-400">
                    ...
                  </span>
                );
              }
              const start = Math.max(2, currentPage - 1);
              const end = Math.min(totalPages - 1, currentPage + 1);
              for (let i = start; i <= end; i++) {
                if (i !== 1 && i !== totalPages) {
                  pages.push(
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i)}
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
              if (currentPage < totalPages - 2 && totalPages > 5) {
                pages.push(
                  <span key="ellipsis2" className="text-gray-500 dark:text-gray-400">
                    ...
                  </span>
                );
              }
              if (totalPages > 1) {
                pages.push(
                  <button
                    key={totalPages}
                    onClick={() => setCurrentPage(totalPages)}
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
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default SelectionModal;
