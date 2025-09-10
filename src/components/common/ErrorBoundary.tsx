"use client";

import React, { Component, ReactNode } from 'react';
import Link from 'next/link';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
    errorInfo?: React.ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log error to console in development
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        
        // Store error info for debugging
        this.setState({ errorInfo });
        
        // In production, you would send this to your error reporting service
        // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
    }

    render() {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default error UI
            return (
                <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
                    <div className="max-w-md w-full text-center">
                        <div className="mb-8">
                            <svg
                                className="mx-auto h-16 w-16 text-red-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                                />
                            </svg>
                        </div>
                        
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Oops! Something went wrong
                        </h1>
                        
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
                        </p>
                        
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="mb-6 text-left bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                                <summary className="cursor-pointer font-medium text-red-800 dark:text-red-400 mb-2">
                                    Error Details (Development Only)
                                </summary>
                                <pre className="text-xs text-red-700 dark:text-red-300 overflow-auto whitespace-pre-wrap">
                                    {this.state.error.message}
                                    {'\n\n'}
                                    {this.state.error.stack}
                                    {this.state.errorInfo && (
                                        '\n\nComponent Stack:\n' + this.state.errorInfo.componentStack
                                    )}
                                </pre>
                            </details>
                        )}
                        
                        <div className="space-y-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                                Refresh Page
                            </button>
                            
                            <Link
                                href="/dashboard"
                                className="block w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                            >
                                Go to Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
