"use client";
import React, { useState, useRef, useEffect } from "react";
import Button from "@/components/ui/button/Button";
import { AdjustmentsHorizontalIcon } from "@heroicons/react/24/outline";
import { Property, propertyColumnConfig } from "./PropertyTable";

export const PropertyColumnSelector = ({ visibleColumns, setVisibleColumns }: {
  visibleColumns: (keyof Property)[],
  setVisibleColumns: React.Dispatch<React.SetStateAction<(keyof Property)[]>>
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleColumn = (columnKey: keyof Property) => {
    setVisibleColumns(prev =>
      prev.includes(columnKey)
        ? prev.filter(key => key !== columnKey)
        : [...prev, columnKey]
    );
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <Button variant="outline" size="sm" onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2">
        <AdjustmentsHorizontalIcon className="h-4 w-4" />
        Columns
      </Button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-dark-800 border border-gray-200 dark:border-white/[0.05] rounded-lg shadow-lg z-10">
          <div className="px-3 py-2">
            <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Visible Columns</h4>
            <div className="grid grid-cols-1 gap-1">
              {propertyColumnConfig.map(col => (
                <label key={col.key} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded px-1 py-1 transition-colors">
                  <input
                    type="checkbox"
                    checked={visibleColumns.includes(col.key)}
                    onChange={() => toggleColumn(col.key)}
                    className="form-checkbox h-4 w-4 rounded text-blue-600 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-gray-700 dark:text-gray-300">{col.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
