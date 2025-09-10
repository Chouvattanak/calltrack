"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
// import Image from "next/image";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Switch from "@/components/form/switch/Switch";
import Address from "@/components/form/Address";

import SuccessModal from "@/components/ui/modal/SuccessModal";

import api from "@/lib/api";
// import { developerData } from "@/components/form/sample-data/developerData";

interface ProjectApi {
  project_id: number;
  developer_id: number;
  developer_name: string;
  village_id: number;
  village_name: string;
  project_name: string;
  project_description: string;
  is_active: boolean;
}

interface FormData {
  project_name: string;
  project_description: string;
  address: IAddress;
  is_active: boolean;
}

interface FormErrors {
  project_name?: string;
  project_description?: string;
  address?: string;
}

const breadcrumbs = [
  { name: "Home", href: "/" },
  { name: "Project", href: "/project" },
  { name: "Edit", href: "/project/edit" }
];

export default function ProjectEditPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('id');
  const [formData, setFormData] = useState<FormData>({
    project_name: "",
    project_description: "",
    address: {
      province: null,
      district: null,
      commune: null,
      village: null,
      homeAddress: "",
      streetAddress: "",
    },
    is_active: true,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorModal, setErrorModal] = useState<{ open: boolean; statusCode?: number; message?: string }>({ open: false });

  useEffect(() => {
    let isMounted = true;
    const fetchProject = async () => {
      setIsLoading(true);
      setNotFound(false);
      const paginationBody = {
        page_number: '1',
        page_size: '10',
        search_type: 'project_id',
        query_search: projectId,
      };
      console.log('Project pagination body:', paginationBody);
      try {
        const response = await api.post('/project/pagination', paginationBody);
        const apiResult = response.data[0];
        if (!apiResult || !apiResult.data || !apiResult.data[0]) {
          if (isMounted) {
            setNotFound(true);
            setIsLoading(false);
          }
          return;
        }
        const project = apiResult.data[0];
        if (isMounted) {
          setFormData({
            project_name: project.project_name || '',
            project_description: project.project_description || '',
            address: {
              province: null,
              district: null,
              commune: null,
              village: project.village_id ? { value: String(project.village_id), label: project.village_name } : null,
              homeAddress: '',
              streetAddress: '',
            },
            is_active: project.is_active,
          });
          setIsLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          setNotFound(true);
          setIsLoading(false);
        }
      }
    };
    if (projectId) fetchProject();
    return () => { isMounted = false; };
  }, [projectId]);

  const handleChange = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field in errors) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.project_name.trim()) newErrors.project_name = "Project name is required";
    if (!formData.project_description.trim()) newErrors.project_description = "Description is required";
    if (!formData.address.province || !formData.address.district) newErrors.address = "Complete address information is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSaving(true);
    try {
      // Prepare payload for PUT request
      const payload = {
        project_id: projectId,
        developer_id: "20", // You may want to fetch/set this if needed
        village_id: formData.address.village?.value || '',
        project_name: formData.project_name,
        project_description: formData.project_description,
        is_active: formData.is_active,
      };
      await api.put('/project/update', payload);
      setShowSuccessModal(true);
    } catch (error: any) {
      let message = 'Failed to update project.';
      let statusCode = undefined;
      if (error?.response) {
        statusCode = error.response.status;
        message = error.response.data?.message || message;
      } else if (error?.message) {
        message = error.message;
      }
      setErrorModal({ open: true, statusCode, message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    router.push("/project");
  };

  // DeveloperModal removed

  return (
    <>
      <PageBreadcrumb crumbs={breadcrumbs} />
      <ComponentCard title={`Edit Project - ${projectId}`} desc="Update the project details below">
        <form onSubmit={handleSubmit} className="space-y-6">
          {isLoading && <p>Loading...</p>}
          {notFound && <p>Project not found</p>}
          {!isLoading && !notFound && (
            <>
              {/* Address Section */}
              <div className="border-t pt-6">
                <Address
                  value={formData.address}
                  onSave={(address) => handleChange("address", address)}
                  error={errors.address}
                  label="Address Information *"
                />
              </div>

              {/* Project Name */}
              <div className="grid grid-cols-1 gap-6 border-t pt-6">
                <div>
                  <Label htmlFor="project_name">
                    Project Name *
                  </Label>
                  <Input
                    type="text"
                    value={formData.project_name}
                    onChange={(e) => handleChange("project_name", e.target.value)}
                    placeholder="Enter project name"
                    error={!!errors.project_name}
                  />
                  {errors.project_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.project_name}</p>
                  )}
                </div>
              </div>

              {/* Project Description */}
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <Label htmlFor="project_description">
                    Project Description *
                  </Label>
                  <TextArea
                    value={formData.project_description}
                    onChange={(value) => handleChange("project_description", value)}
                    placeholder="Enter project description"
                    rows={4}
                    error={!!errors.project_description}
                  />
                  {errors.project_description && (
                    <p className="mt-1 text-sm text-red-600">{errors.project_description}</p>
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="is_active">Status</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Enable or disable this project
                    </p>
                  </div>
                  <Switch
                    label="Active"
                    checked={formData.is_active}
                    onChange={(checked) => handleChange("is_active", checked)}
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/project")}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                >
                  {isSaving ? "Updating..." : "Update Project"}
                </Button>
              </div>
            </>
          )}
        </form>
      </ComponentCard>
      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessClose}
        statusCode={200}
        message="Project has been updated successfully!"
        buttonText="Go to Projects"
      />
      {/* Error Modal */}
      <SuccessModal
        isOpen={errorModal.open}
        onClose={() => setErrorModal({ open: false })}
        statusCode={errorModal.statusCode}
        message={errorModal.message}
        buttonText="Okay, Got It"
      />
    </>
  );
}
