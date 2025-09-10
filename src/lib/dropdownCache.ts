// src/lib/dropdownCache.ts
// Utility to fetch and cache all dropdown data in localStorage on initial login

import api from "@/lib/api";

export type DropdownData = {
  projectOptions: any[];
  propertyTypeOptions: any[];
  statusOptions: any[];
  staffOptions: any[];
  contactResultOptions: any[];
  // Add more as needed
};

const DROPDOWN_CACHE_KEY = "dropdownData";

export async function fetchAndCacheDropdownData() {
  // Fetch all dropdown data in parallel (excluding address-related and project owner dropdowns)
  const [
    projectRes,
    propertyTypeRes,
    statusRes,
    staffRes,
    contactResultRes
  ] = await Promise.all([
    api.post("/project/pagination", { page_number: "1", page_size: "100" }),
    api.post("/property-type/pagination", { page_number: "1", page_size: "100" }),
    api.post("/property-status/pagination", { page_number: "1", page_size: "100" }),
    api.post("/staff/pagination", { page_number: "1", page_size: "100" }),
    api.post("/contact-result/pagination", { page_number: "1", page_size: "100" })
  ]);

  const dropdownData: DropdownData = {
    projectOptions: projectRes.data[0]?.data || [],
    propertyTypeOptions: propertyTypeRes.data[0]?.data || [],
    statusOptions: statusRes.data[0]?.data || [],
    staffOptions: staffRes.data[0]?.data || [],
    contactResultOptions: contactResultRes.data[0]?.data || []
  };

  // Save to localStorage
  localStorage.setItem(DROPDOWN_CACHE_KEY, JSON.stringify(dropdownData));
  console.log("[dropdownCache] All dropdown data:", dropdownData);
  return dropdownData;
}

export function getDropdownDataFromCache(): DropdownData | null {
  const raw = localStorage.getItem(DROPDOWN_CACHE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearDropdownCache() {
  localStorage.removeItem(DROPDOWN_CACHE_KEY);
}
