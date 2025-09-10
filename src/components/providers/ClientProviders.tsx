"use client";

import { ToastProvider } from '@/context/ToastContext';
import { ToastContainer } from '@/components/ui/toast/ToastContainer';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { ReactNode } from 'react';

interface ClientProvidersProps {
  children: ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <ErrorBoundary>
      <ToastProvider>
        {children}
        <ToastContainer />
      </ToastProvider>
    </ErrorBoundary>
  );
}
