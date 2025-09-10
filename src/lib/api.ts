import axios, { AxiosResponse, AxiosError } from 'axios';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
    user_id?: string;
    user_name?: string;
    email?: string;
    avatar?: string;
    exp?: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000, // 30 seconds timeout
});

// Utility to check if token is expired
export const isTokenExpired = (token: string): boolean => {
    try {
        const decoded: DecodedToken = jwtDecode(token);
        if (!decoded.exp) return true;
        
        // Add 5 minutes buffer to prevent token expiry during requests
        const currentTime = Math.floor(Date.now() / 1000);
        const bufferTime = 5 * 60; // 5 minutes
        
        return decoded.exp < (currentTime + bufferTime);
    } catch (error) {
        console.error('Error checking token expiration:', error);
        return true;
    }
};

// Handle authentication errors
export const handleAuthError = (showToast?: (toast: { type: string; title: string; message: string; duration: number }) => void) => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('staff');
        localStorage.removeItem('user');
        
        // Show toast notification if available
        if (showToast) {
            showToast({
                type: 'error',
                title: 'Session Expired',
                message: 'Your session has expired. Please log in again.',
                duration: 5000
            });
        }
        
        // Only redirect if not already on auth pages
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/signin') && !currentPath.includes('/signup')) {
            window.location.href = '/signin';
        }
    }
};

// Request interceptor with token validation
api.interceptors.request.use(
    (config) => {
        // Skip token validation for auth endpoints
        const isAuthEndpoint = config.url?.includes('/auth/') || 
                              config.url?.includes('/login') || 
                              config.url?.includes('/register');
        
        if (!isAuthEndpoint && typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            
            if (!token) {
                handleAuthError();
                return Promise.reject(new Error('No authentication token found'));
            }
            
            if (isTokenExpired(token)) {
                console.warn('Token expired, redirecting to signin');
                handleAuthError();
                return Promise.reject(new Error('Authentication token expired'));
            }
            
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for global error handling
api.interceptors.response.use(
    (response: AxiosResponse) => {
        return response;
    },
    (error: AxiosError) => {
        if (error.response) {
            const status = error.response.status;
            
            switch (status) {
                case 401:
                case 403:
                    console.error('Authentication error:', error.response.data);
                    handleAuthError();
                    break;
                    
                case 404:
                    console.error('Resource not found:', error.config?.url);
                    break;
                    
                case 500:
                    console.error('Server error:', error.response.data);
                    break;
                    
                case 422:
                    console.error('Validation error:', error.response.data);
                    break;
                    
                default:
                    console.error('API error:', error.response.data);
            }
        } else if (error.request) {
            console.error('Network error:', error.message);
        } else {
            console.error('Request setup error:', error.message);
        }
        
        return Promise.reject(error);
    }
);

export const getUserFromToken = (): DecodedToken | null => {
    try {
        const token = localStorage.getItem('token');
        if (!token) return null;
        
        if (isTokenExpired(token)) {
            handleAuthError();
            return null;
        }
        
        const decodedToken: DecodedToken = jwtDecode(token);
        return decodedToken;
    } catch (error) {
        console.error("Failed to decode token:", error);
        handleAuthError();
        return null;
    }
};

// Utility to check if user is authenticated
export const isAuthenticated = (): boolean => {
    if (typeof window === 'undefined') return false;
    
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    return !isTokenExpired(token);
};

export default api;
