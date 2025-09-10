"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import TextArea from "@/components/form/input/TextArea";
import Switch from "@/components/form/switch/Switch";
import LoadingOverlay from "@/components/ui/loading/LoadingOverlay";
import SuccessModal from "@/components/ui/modal/SuccessModal";



const EditPropertyTypePage: React.FC<{ params: Promise<{ id: string }> }> = ({ params }) => {
  const router = useRouter();
  const { id: propertyTypeId } = React.use(params);

  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Property Type", href: "/property-type" },
    { name: "Edit" },
  ];

  const [formData, setFormData] = useState({
    propertyTypeName: "",
    description: "",
    isActive: true,
  });

  type PropertyTypeFormErrors = {
    propertyTypeName?: string; 
    description?: string;
  };

  const [errors, setErrors] = useState<PropertyTypeFormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [propertyTypeNotFound, setPropertyTypeNotFound] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorModal, setErrorModal] = useState<{ open: boolean; statusCode?: number; message?: string }>({ open: false });

  // Load property type data
  useEffect(() => {
    const fetchPropertyType = async () => {
      if (!propertyTypeId) {
        setPropertyTypeNotFound(true);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        // Query the API by property_type_id using correct API contract
        const requestUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL || ''}property-type/pagination`;
        const requestBody = {
          page_number: "1",
          page_size: "10",
          search_type: "property_type_id",
          query_search: String(propertyTypeId)
        };
        const jwtToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        console.log('JWT token:', jwtToken);
        console.log('PropertyType API request body:', requestBody);
        const response = await api.post(requestUrl, requestBody);
        console.log('PropertyType API response:', response);

        // Adjust response structure if needed
        const apiResult = response.data[0];
        if (apiResult && apiResult.data && apiResult.data.length > 0) {
          const propertyType = apiResult.data[0];
          setFormData({
            propertyTypeName: propertyType.property_type_name,
            description: propertyType.property_type_description,
            isActive: propertyType.is_active,
          });
        } else {
          setPropertyTypeNotFound(true);
        }
      } catch (error) {
        console.error('Error fetching property type:', error);
        setErrorModal({
          open: true,
          statusCode: 500,
          message: 'Failed to load property type data.'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPropertyType();
  }, [propertyTypeId]);

  const handleChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (typeof value === 'string' && errors[field as keyof PropertyTypeFormErrors]) {
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
      const propertyTypeData = {
        property_type_id: String(propertyTypeId),
        property_type_name: formData.propertyTypeName,
        property_type_description: formData.description,
        is_active: formData.isActive
      };
      const requestUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL || ''}property-type/update`;
      console.log('PropertyType Update API request body:', propertyTypeData);
      const response = await api.post(requestUrl, propertyTypeData);
      console.log('PropertyType Update API response:', response);
      if (response.data) {
  setShowSuccessModal(true);
      }
    } catch (error: unknown) {
      console.error('Error updating property type:', error);
      setErrorModal({
        open: true,
        statusCode: 500,
        message: 'Failed to update property type. Please try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingOverlay isLoading={true} />;
  }

  if (propertyTypeNotFound) {
    return (
      <div>
        <PageBreadcrumb crumbs={breadcrumbs} />
        <div className="space-y-6">
          <ComponentCard title="Property Type Not Found">
            <div className="text-center py-8">
              <p className="text-gray-500">The property type you&apos;re looking for could not be found.</p>
              <Button 
                className="mt-4" 
                onClick={() => router.push('/property-type')}
              >
                Back to Property Types
              </Button>
            </div>
          </ComponentCard>
        </div>
      </div>
    );
  }

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
        message="Property type updated successfully."
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
          <ComponentCard title={`Edit Property Type - ID: ${propertyTypeId}`}>
            <div className="relative">
              {/* Header Status Bar */}
              <div className="mb-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-l-4 border-blue-500 p-3 rounded-r-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Editing Property Type</p>
                    <p className="text-xs text-blue-600 dark:text-blue-300">Update the property type information below</p>
                  </div>
                </div>
              </div>

              {/* Ribbon Style Badge */}
              <div className="absolute top-0 left-0 z-10">
                <div className="bg-blue-500 text-white px-4 py-1 text-sm font-semibold shadow-lg transform -rotate-45 -translate-x-8 -translate-y-4">
                  EDIT
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

                    <div className="lg:col-span-1">
                      <Label>Status</Label>
                      <div className="mt-2">
                        <Switch
                          checked={formData.isActive}
                          onChange={(checked) => handleChange("isActive", checked)}
                          label={formData.isActive ? "Active" : "Inactive"}
                        />
                      </div>
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
                  {isSaving ? 'Updating...' : 'Update Property Type'}
                </Button>
              </div>
            </form>
          </ComponentCard>
        </div>
      </div>
    </>
  );
};

export default EditPropertyTypePage;
