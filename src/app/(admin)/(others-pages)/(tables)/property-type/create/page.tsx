"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import api, { getUserFromToken } from "@/lib/api";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import TextArea from "@/components/form/input/TextArea";
import LoadingOverlay from "@/components/ui/loading/LoadingOverlay";
import SuccessModal from "@/components/ui/modal/SuccessModal";



const CreatePropertyTypePage: React.FC = () => {
  const router = useRouter();

  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Property Type", href: "/property-type" },
    { name: "Create" },
  ];

  const [formData, setFormData] = useState({
    propertyTypeName: "",
    description: "",
  });

  type PropertyTypeFormErrors = {
    propertyTypeName?: string; 
    description?: string;
  };

  const [errors, setErrors] = useState<PropertyTypeFormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorModal, setErrorModal] = useState<{ open: boolean; statusCode?: number; message?: string }>({ open: false });

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof PropertyTypeFormErrors]) {
      const newErrors = { ...errors };
      delete newErrors[field as keyof PropertyTypeFormErrors];
      setErrors(newErrors);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: PropertyTypeFormErrors = {};
    if (!formData.propertyTypeName.trim()) newErrors.propertyTypeName = "Property type name is required.";
    if (!formData.description.trim()) newErrors.description = "Description is required.";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSaving(true);

    try {
      const user = getUserFromToken();
      const propertyTypeData = {
        property_type_name: formData.propertyTypeName,
        property_type_description: formData.description
      };

      console.log("Property Type API Request:");
      console.log("Endpoint: /property-type/create");
      console.log("Request Body:", propertyTypeData);
      console.log("Request Body (JSON):", JSON.stringify(propertyTypeData, null, 2));

      const response = await api.post('/property-type/create', propertyTypeData);
      
      console.log("Property Type API Response:", response.data);
      
      if (response.data) {
        setShowSuccessModal(true);
      }
    } catch (error: unknown) {
      console.error('Error creating property type:', error);
      setErrorModal({
        open: true,
        statusCode: 500,
        message: 'Failed to create property type. Please try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <LoadingOverlay isLoading={isSaving} />
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          router.push('/property-type');
        }}
        statusCode={200}
        message="Property type created successfully."
        buttonText="Go to Property Type List"
      />
      <SuccessModal
        isOpen={errorModal.open}
        onClose={() => setErrorModal({ open: false })}
        statusCode={errorModal.statusCode}
        message={errorModal.message}
        buttonText="Okay, Got It"
      />
      <div>
        <PageBreadcrumb crumbs={breadcrumbs} />
        <div className="space-y-6">
          <ComponentCard title="Create Property Type">
            <div className="relative">
              {/* Header Status Bar */}
              <div className="mb-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-l-4 border-green-500 p-3 rounded-r-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">Creating New Property Type</p>
                    <p className="text-xs text-green-600 dark:text-green-300">Fill in the information below to create a new property type</p>
                  </div>
                </div>
              </div>

              {/* Ribbon Style Badge */}
              <div className="absolute top-0 left-0 z-10">
                <div className="bg-green-500 text-white px-4 py-1 text-sm font-semibold shadow-lg transform -rotate-45 -translate-x-8 -translate-y-4">
                  NEW
                </div>
              </div>
            </div>

            <form className="flex flex-col" noValidate onSubmit={handleSubmit}>
              <div className="px-2 pb-3">
                {/* Property Type Information */}
                <div className="mb-8 p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                  <h3 className="text-base font-medium mb-4 text-gray-800 dark:text-gray-200">Property Type Information</h3>
                  <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                    <div className="lg:col-span-1">
                      <Label>Property Type Name *</Label>
                      <Input
                        type="text"
                        placeholder="Enter property type name (e.g., Apartment, House, Condo)"
                        value={formData.propertyTypeName}
                        onChange={(e) => handleChange("propertyTypeName", e.target.value)}
                      />
                      {errors.propertyTypeName && <p className="text-sm text-red-500 mt-1">{errors.propertyTypeName}</p>}
                    </div>

                    <div className="lg:col-span-2">
                      <Label>Description *</Label>
                      <TextArea
                        placeholder="Enter detailed description of the property type..."
                        value={formData.description}
                        onChange={(value) => handleChange("description", value)}
                        rows={4}
                      />
                      {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6 justify-end">
                <Button size="md" variant="outline" type="button" onClick={() => router.push('/property-type')}>
                  Cancel
                </Button>
                <Button size="md" type="submit" disabled={isSaving}>
                  {isSaving ? 'Creating...' : 'Create Property Type'}
                </Button>
              </div>
            </form>
          </ComponentCard>
        </div>
      </div>
    </>
  );
};

export default CreatePropertyTypePage;
