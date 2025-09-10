"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import api from "@/lib/api";
import Image from "next/image";

const breadcrumbs = [
  { name: "Home", href: "/" },
  { name: "Staff", href: "/staff" },
  { name: "View", href: "/staff/view" }
];

interface ApiStaffData {
  staff_id: string;
  first_name: string;
  last_name: string;
  gender_name: string;
  email: string | null;
  date_of_birth: string;
  created_date: string;
  updated_date: string;
  department: string;
  employment_type: string;
  position: string;
  staff_code: string | null;
  province_name: string | null;
  district_name: string | null;
  commune_name: string | null;
  village_name: string | null;
  current_address: string | null;
  is_active: boolean;
  photo_url: string | null;
  contact_data: {
      channel_type_name?: string;
      contact_values: {
          contact_number: string;
          is_primary: boolean;
          remark: string;
          user_name?: string;
      }[];
  }[];
}

interface Staff {
  id: string;
  fullName: string;
  avatar: string;
  gender: string;
  phone: string;
  dob: string;
  contactDate: string;
  email: string;
  department: string;
  employmentType: string;
  position: string;
  staffCode: string;
  address: string;
  status: 'Active' | 'Inactive';
  created_date: string;
  updated_date?: string;
  raw: ApiStaffData;
}

interface ApiStaffData {
  staff_id: string;
  first_name: string;
  last_name: string;
  gender_name: string;
  email: string | null;
  date_of_birth: string;
  created_date: string;
  updated_date: string;
  department: string;
  employment_type: string;
  position: string;
  staff_code: string | null;
  province_name: string | null;
  district_name: string | null;
  commune_name: string | null;
  village_name: string | null;
  home_address: string | null;
  street_address: string | null;
  is_active: boolean;
  photo_url: string | null;
  contact_data: {
      channel_type_name?: string;
      contact_values: {
          contact_number: string;
          is_primary: boolean;
          remark: string;
          user_name?: string;
      }[];
  }[];
}

export default function ViewStaffPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const staffId = searchParams.get('id');

  const [staff, setStaff] = useState<Staff | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [staffNotFound, setStaffNotFound] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch staff data from API
  useEffect(() => {
    if (!staffId) {
      setStaffNotFound(true);
      setIsLoading(false);
      return;
    }

    const fetchStaffData = async () => {
      try {
        const response = await api.post('/staff/pagination', {
          page_number: String('1'),
          page_size: String('10'),
          search_type: 'staff_id',
          query_search: String(staffId)
        });

        const apiResult = response.data[0];
        if (apiResult && apiResult.data && apiResult.data.length > 0) {
          const staffData = apiResult.data[0];
          const primaryContact = staffData.contact_data?.flatMap((cd: { contact_values: { contact_number: string; is_primary: boolean }[] }) => cd.contact_values).find((cv: { contact_number: string; is_primary: boolean }) => cv.is_primary);
          const fullAddress = [
            staffData.current_address,
            staffData.village_name,
            staffData.commune_name,
            staffData.district_name,
            staffData.province_name,
          ].filter(Boolean).join(', ');

          const formattedStaff: Staff = {
            id: staffData.staff_id || staffData.staff_code,
            fullName: `${staffData.first_name} ${staffData.last_name}`,
            avatar: (Array.isArray(staffData.photo_url) ? staffData.photo_url[0] : staffData.photo_url) || "/images/user/user-02.jpg",
            gender: staffData.gender_name,
            phone: primaryContact?.contact_number || 'N/A',
            dob: staffData.date_of_birth,
            contactDate: staffData.employment_start_date ? new Date(staffData.employment_start_date).toLocaleDateString() : 'N/A',
            email: staffData.email || 'N/A',
            department: staffData.department || 'N/A',
            employmentType: staffData.employment_type || 'N/A',
            position: staffData.position || 'N/A',
            staffCode: staffData.staff_code || 'N/A',
            address: fullAddress || 'N/A',
            status: staffData.is_active ? 'Active' : 'Inactive',
            created_date: staffData.created_date ? new Date(staffData.created_date).toLocaleDateString() : 'N/A',
            updated_date: staffData.updated_date ? new Date(staffData.updated_date).toLocaleDateString() : undefined,
            raw: staffData,
          };

          setStaff(formattedStaff);
          setStaffNotFound(false);
        } else {
          setStaffNotFound(true);
        }
      } catch (error) {
        console.error('Error fetching staff data:', error);
        setStaffNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStaffData();
  }, [staffId]);

  const handleEdit = () => {
    router.push(`/staff/edit/${staffId}`);
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push('/staff');
    } catch (error) {
      console.error('Error deleting staff:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleBack = () => {
    router.push('/staff');
  };

  const getStatusBadge = (status: 'Active' | 'Inactive') => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      status === 'Active'
        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
    }`}>
      {status}
    </span>
  );

  if (isLoading) {
    return (
      <div>
        <PageBreadcrumb crumbs={breadcrumbs} />
        <ComponentCard title="Lead Details">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading staff...</p>
            </div>
          </div>
        </ComponentCard>
      </div>
    );
  }

  if (staffNotFound || !staff) {
    return (
      <div>
        <PageBreadcrumb crumbs={breadcrumbs} />
        <ComponentCard title="Lead Details">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Lead Not Found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">The lead you&apos;re looking for doesn&apos;t exist or has been removed.</p>
              <Button onClick={handleBack}>Back to Lead List</Button>
            </div>
          </div>
        </ComponentCard>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb crumbs={breadcrumbs} />
      <ComponentCard title="Lead Details">
        <div className="space-y-8">
          {/* Header with Action Buttons */}
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              {/* Lead Photo */}
              <div className="flex-shrink-0">
                <Image
                  src={staff.avatar}
                  alt={staff.fullName}
                  width={80}
                  height={80}
                  className="rounded-full object-cover bg-gray-200"
                  onError={(e) => {
                    e.currentTarget.src = "/images/user/user-02.jpg";
                  }}
                />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-500/10">
                    <UserCircleIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {staff.fullName}
                  </h1>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(staff.status)}
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ID: {staff.id}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                    {staff.employmentType}
                  </span>
                </div>
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

          {/* Lead Information Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <UserCircleIcon className="h-5 w-5" />
                  Lead Information
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 pl-6">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Staff ID:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white font-mono">{staff.id}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pl-6">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">{staff.fullName}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pl-6">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Gender:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">{staff.gender}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pl-6">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Date of Birth:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">{staff.dob}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pl-6">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Address:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">{staff.address}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pl-6">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Department:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">{staff.department}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pl-6">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Employment Type:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">{staff.employmentType}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pl-6">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Position:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">{staff.position}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pl-6">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Staff Code:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">{staff.staffCode}</div>
                  </div>
                </div>
              </div>
              {/* Contact Information Section */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  Contact Information
                </h3>
                <div className="space-y-2">
                  <div className="pl-6">
                    {staff.raw.contact_data && staff.raw.contact_data.length > 0 ? (
                      staff.raw.contact_data.map((channel) => (
                        channel.contact_values.map((val, vIdx) => {
                          // Channel type and icon
                          const channelTypeName = channel.channel_type_name || 'Contact';
                          let channelIcon = null;
                          if (channelTypeName.toLowerCase().includes('phone')) {
                            channelIcon = <span className="mr-2">📞</span>;
                          } else if (channelTypeName.toLowerCase().includes('email')) {
                            channelIcon = <span className="mr-2">✉️</span>;
                          } else if (channelTypeName.toLowerCase().includes('telegram')) {
                            channelIcon = <span className="mr-2">💬</span>;
                          } else {
                            channelIcon = <span className="mr-2">🔗</span>;
                          }
                          return (
                            <div key={vIdx} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-800 p-3 flex items-center gap-4 shadow-sm mb-2">
                              {channelIcon}
                              <div className="flex flex-col gap-1 flex-1">
                                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{channelTypeName}</span>
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-200">
                                    {val.user_name ? val.user_name : 'No username'}
                                  </span>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-xs font-mono text-blue-800 dark:text-blue-300">
                                    {val.contact_number}
                                  </span>
                                </div>
                              </div>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${val.is_primary ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                                {val.is_primary ? 'Primary' : 'Secondary'}
                              </span>
                            </div>
                          );
                        })
                      ))
                    ) : (
                      <div className="text-sm text-gray-500">No contact information available.</div>
                    )}
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
                <div className="pl-6 space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Created Date:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">{staff.created_date}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Updated Date:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">{staff.updated_date || 'Not updated yet'}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Status:</div>
                    <div className="col-span-2">{getStatusBadge(staff.status)}</div>
                  </div>
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
            Delete Lead
          </h3>
          <p className="mb-6 text-center text-gray-600 dark:text-gray-400">
            Are you sure you want to delete staff &quot;{staff.fullName}&quot;? This action cannot be undone and may affect associated data.
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
              {isDeleting ? 'Deleting...' : 'Delete Lead'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
