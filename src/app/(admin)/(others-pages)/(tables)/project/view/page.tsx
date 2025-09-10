"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { projectData } from "@/components/form/sample-data/projectData";
import { BuildingOffice2Icon, MapPinIcon } from "@heroicons/react/24/outline";

const breadcrumbs = [
  { name: "Home", href: "/" },
  { name: "Project", href: "/project" },
  { name: "View", href: "/project/view" }
];

interface Project {
  project_id: string;
  project_name?: string;
  project_description: string;
  is_active: boolean;
  created_date: string;
  updated_date?: string;
  province?: string;
  district?: string;
  commune?: string;
  village?: string;
  properties?: number;
}

export default function ViewProjectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('id');
  
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [projectNotFound, setProjectNotFound] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load project data
  useEffect(() => {
    if (projectId) {
      // Simulate loading project data
      const foundProject = projectData.find(p => p.project_id === projectId);
      
      if (foundProject) {
        // Enhanced project data for view
        const enhancedProject: Project = {
          ...foundProject,
          project_name: `${foundProject.project_description.split(' ').slice(0, 3).join(' ')} Project`
        };
        setProject(enhancedProject);
        setIsLoading(false);
      } else {
        setProjectNotFound(true);
        setIsLoading(false);
      }
    } else {
      setProjectNotFound(true);
      setIsLoading(false);
    }
  }, [projectId]);

  const handleEdit = () => {
    router.push(`/project/edit?id=${projectId}`);
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Deleting project:', projectId);
      router.push('/project');
    } catch (error) {
      console.error('Error deleting project:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleBack = () => {
    router.push('/project');
  };

  const getActiveBadge = (isActive: boolean) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isActive 
          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
      }`}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  const getLocationPath = () => {
    if (!project) return '';
    const path = [project.province, project.district, project.commune, project.village]
      .filter(Boolean)
      .join(' → ');
    return path || 'Location Not Specified';
  };

  if (isLoading) {
    return (
      <div>
        <PageBreadcrumb crumbs={breadcrumbs} />
        <ComponentCard title="Project Details">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading project...</p>
            </div>
          </div>
        </ComponentCard>
      </div>
    );
  }

  if (projectNotFound || !project) {
    return (
      <div>
        <PageBreadcrumb crumbs={breadcrumbs} />
        <ComponentCard title="Project Details">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Project Not Found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">The project you&apos;re looking for doesn&apos;t exist or has been removed.</p>
              <Button onClick={handleBack}>Back to Project List</Button>
            </div>
          </div>
        </ComponentCard>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb crumbs={breadcrumbs} />
      
      <ComponentCard title="Project Details">
        <div className="space-y-8">
          {/* Header with Action Buttons */}
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-500/10">
                  <BuildingOffice2Icon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {project.project_name || 'Project'}
                </h1>
              </div>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-3">
                <MapPinIcon className="h-5 w-5 inline mr-2" />
                {getLocationPath()}
              </p>
              <div className="flex items-center gap-3">
                {getActiveBadge(project.is_active)}
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ID: {project.project_id}
                </span>
                {project.properties && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                    {project.properties} Properties
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleBack}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </Button>
              <Button variant="outline" onClick={handleEdit}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </Button>
              <Button 
                variant="outline" 
                onClick={handleDelete}
                className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-900/10"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </Button>
            </div>
          </div>

          {/* Project Information Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <BuildingOffice2Icon className="h-5 w-5" />
                  Project Information
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Project ID:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white font-mono">{project.project_id}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Project Name:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">{project.project_name || 'N/A'}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Status:</div>
                    <div className="col-span-2">{getActiveBadge(project.is_active)}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Created Date:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">{project.created_date}</div>
                  </div>
                  {project.properties && (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Properties:</div>
                      <div className="col-span-2 text-sm font-semibold text-blue-600 dark:text-blue-400">{project.properties} Units</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Location Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <MapPinIcon className="h-5 w-5" />
                  Location Details
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Province/City:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">{project.province || 'N/A'}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">District:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">{project.district || 'N/A'}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Commune:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">{project.commune || 'N/A'}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Village:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">{project.village || 'N/A'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description and Location */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Project Description</h3>
                <div className="bg-gray-50 dark:bg-white/[0.02] rounded-lg p-4">
                  <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {project.project_description || 'No description available for this project.'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* System Information */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">System Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Project ID:</div>
                  <div className="col-span-2 text-sm text-gray-900 dark:text-white font-mono">{project.project_id}</div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Created Date:</div>
                  <div className="col-span-2 text-sm text-gray-900 dark:text-white">{project.created_date}</div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Updated Date:</div>
                  <div className="col-span-2 text-sm text-gray-900 dark:text-white">{project.updated_date || 'Not updated yet'}</div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Status:</div>
                  <div className="col-span-2">{getActiveBadge(project.is_active)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ComponentCard>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full dark:bg-red-900/20">
            <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-center text-gray-900 dark:text-white">
            Delete Project
          </h3>
          <p className="mb-6 text-center text-gray-600 dark:text-gray-400">
            Are you sure you want to delete project &quot;{project.project_name || project.project_id}&quot;? This action cannot be undone.
          </p>
          <div className="flex justify-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-900/10"
            >
              {isDeleting ? 'Deleting...' : 'Delete Project'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
