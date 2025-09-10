"use client";
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

interface LoadingOverlayProps {
  isLoading: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isLoading }) => {
  const [isBrowser, setIsBrowser] = useState(false);

  useEffect(() => {
    setIsBrowser(true);
  }, []);

  if (!isLoading || !isBrowser) {
    return null;
  }

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/10 dark:bg-black/10 backdrop-blur-xs">
      <div className="grid grid-cols-3 gap-2">
        {[...Array(9)].map((_, i) => (
          <div 
            key={i} 
            className="w-5 h-5 bg-blue-600 rounded-md animate-modern-fade" 
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes modern-fade {
          0%, 100% {
            opacity: 0.3;
            transform: scale(0.9);
          }
          50% {
            opacity: 1;
            transform: scale(1.15);
          }
        }

        .animate-modern-fade {
          animation: modern-fade 1.2s infinite ease-in-out;
        }
      `}</style>
    </div>,
    document.body
  );
};

export default LoadingOverlay;
