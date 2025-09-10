"use client";
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { CameraIcon, UserIcon} from '@heroicons/react/24/solid';

interface ImageUploadProps {
  value: File | null;
  onChange: (file: File | null) => void;
  initialPreviewUrl?: string | null;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ value, onChange, initialPreviewUrl }) => {
  const [preview, setPreview] = useState<string | null>(initialPreviewUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!value) {
      // If the file is cleared, but there was an initial URL, show the initial URL again.
      // If there was no initial URL, show nothing.
      setPreview(initialPreviewUrl || null);
      return;
    }
    // If a new file is selected, create a preview for it.
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(value);
  }, [value, initialPreviewUrl]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    onChange(file || null);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center">
        <div className="relative">
            <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden border-4 border-white dark:border-gray-800 shadow-md">
            {preview ? (
                <Image
                    src={preview}
                    alt="Lead photo"
                    width={128}
                    height={128}
                    className="object-cover w-full h-full"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }} // Hide broken image icon
                />
            ) : (
                <UserIcon className="h-20 w-20 text-gray-400 dark:text-gray-500" />
            )}
            </div>
            <button
                type="button"
                onClick={triggerFileSelect}
                className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full border-2 border-white dark:border-gray-900"
                aria-label="Upload photo"
            >
                <CameraIcon className="h-5 w-5" />
            </button>
            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/png, image/jpeg"
                onChange={handleFileChange}
            />
        </div>
    </div>
  );
};

export default ImageUpload;
