/**
 * API Helper Functions
 * 
 * These helper functions provide a consistent way to get API base URL and headers
 * across all components and pages to ensure standardized API calls.
 */

/**
 * Get the API base URL with trailing slash removed
 * @returns The API base URL string
 */
export const getApiBase = (): string => {
  return process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
};

/**
 * Get standard API headers including authorization token if available
 * @returns Object containing standard API headers
 */
export const getApiHeaders = (): Record<string, string> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  return headers;
};