"use client";
import React, { useState } from 'react';
import Select from '../form/Select';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface SearchProps {
  onSearch: (searchQuery: string, searchType: string) => void;
  searchOptions?: SearchOption[];
}

type SearchOption = {
  value: string;
  label: string;
};

const defaultSearchOptions: SearchOption[] = [
    { value: 'lead_id', label: 'Lead ID' },
    { value: 'lead_name', label: 'Lead Name' },
];

const SearchComponent: React.FC<SearchProps> = ({ onSearch, searchOptions = defaultSearchOptions }) => {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<SearchOption>(searchOptions[0]);

  const handleSearch = () => {
    try {
      onSearch(query.trim(), type.value);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handleClear = () => {
    try {
      setQuery('');
      onSearch('', type.value);
    } catch (error) {
      console.error('Clear error:', error);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSearch();
    }
  };

  const handleTypeChange = (option: SearchOption | null) => {
    try {
      if (option) {
        setType(option);
        // Trigger search when type changes if there's a query
        if (query.trim()) {
          onSearch(query.trim(), option.value);
        }
      }
    } catch (error) {
      console.error('Type change error:', error);
    }
  };

  return (
    <div className="flex items-center w-full max-w-lg gap-2">
      {/* Search Type Dropdown */}
      <div className="min-w-[120px]">
        <Select 
          options={searchOptions}
          value={type}
          onChange={handleTypeChange}
          className="h-11"
        />
      </div>
      
      {/* Search Input Container */}
      <div className="relative flex-1">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-11 w-full rounded-lg border border-gray-300 pl-10 pr-20 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 bg-white text-gray-800 placeholder:text-gray-400"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1">
            {query && (
              <button
                onClick={handleClear}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                title="Clear"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={handleSearch}
              className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
              title="Search"
            >
              <MagnifyingGlassIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchComponent;
