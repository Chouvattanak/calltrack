"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getUserFromToken, isAuthenticated, handleAuthError } from '@/lib/api';

interface User {
    user_id?: string;
    user_name?: string;
    email?: string;
    avatar?: string;
}

interface UseAuthReturn {
    user: User | null;
    isLoading: boolean;
    isAuth: boolean;
    login: (token: string) => void;
    logout: () => void;
    checkAuth: () => boolean;
}

export const useAuth = (): UseAuthReturn => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuth, setIsAuth] = useState(false);
    const router = useRouter();

    // Check authentication status
    const checkAuth = useCallback((): boolean => {
        if (typeof window === 'undefined') return false;
        
        try {
            const authenticated = isAuthenticated();
            
            if (authenticated) {
                const userData = getUserFromToken();
                if (userData) {
                    setUser(userData);
                    setIsAuth(true);
                    return true;
                } else {
                    setUser(null);
                    setIsAuth(false);
                    return false;
                }
            } else {
                setUser(null);
                setIsAuth(false);
                return false;
            }
        } catch (error) {
            console.error('Error checking authentication:', error);
            setUser(null);
            setIsAuth(false);
            return false;
        }
    }, []);

    // Login function
    const login = useCallback((token: string) => {
        try {
            console.log('useAuth: Setting token in localStorage and cookie');
            localStorage.setItem('token', token);
            
            // Set cookie for middleware (without secure flag for localhost)
            const isHttps = window.location.protocol === 'https:';
            const cookieString = isHttps 
                ? `token=${token}; path=/; secure; samesite=strict`
                : `token=${token}; path=/; samesite=strict`;
            document.cookie = cookieString;
            
            const userData = getUserFromToken();
            
            console.log('useAuth: User data from token:', userData);
            
            if (userData) {
                setUser(userData);
                setIsAuth(true);
                console.log('useAuth: Login successful, auth state updated');
                // Force a small delay to ensure state is updated before redirect
                setTimeout(() => {
                    console.log('useAuth: Ready for redirect');
                }, 100);
            } else {
                throw new Error('Invalid token received');
            }
        } catch (error) {
            console.error('Login error:', error);
            // Clear invalid token and redirect
            localStorage.removeItem('token');
            document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            setUser(null);
            setIsAuth(false);
            router.push('/signin');
        }
    }, [router]);

    // Logout function
    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('staff');
        localStorage.removeItem('user');
        
        // Clear cookie as well
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        
        setUser(null);
        setIsAuth(false);
        router.push('/signin');
    }, [router]);

    // Check auth on mount and set up periodic validation
    useEffect(() => {
        const initialCheck = () => {
            const authenticated = checkAuth();
            setIsLoading(false);
            
            // If not authenticated and not on auth pages, redirect
            if (!authenticated) {
                const currentPath = window.location.pathname;
                if (!currentPath.includes('/signin') && 
                    !currentPath.includes('/signup') && 
                    !currentPath.includes('/not-found')) {
                    router.push('/signin');
                }
            }
        };

        initialCheck();

        // Set up periodic token validation (every 5 minutes)
        const interval = setInterval(() => {
            if (isAuth) {
                const stillAuthenticated = checkAuth();
                if (!stillAuthenticated) {
                    console.warn('Token expired during session, logging out');
                    handleAuthError();
                }
            }
        }, 5 * 60 * 1000); // 5 minutes

        // Listen for storage changes (logout from another tab)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'token' && !e.newValue) {
                // Token was removed in another tab
                setUser(null);
                setIsAuth(false);
                router.push('/signin');
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            clearInterval(interval);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [checkAuth, isAuth, router]);

    return {
        user,
        isLoading,
        isAuth,
        login,
        logout,
        checkAuth
    };
};
