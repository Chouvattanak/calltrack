"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import LoadingOverlay from "@/components/ui/loading/LoadingOverlay";
import api from "@/lib/api";
import Image from "next/image";

const breadcrumbs = [
  { name: "Home", href: "/" },
  { name: "Lead", href: "/lead" },
  { name: "View", href: "/lead/view" }
];

interface ApiLeadData {
  lead_id: string;
  first_name: string;
  last_name: string;
  gender_name: string;
  email: string | null;
  date_of_birth: string;
  created_date: string;
  updated_date: string;
  lead_source_name: string;
  customer_type_name: string;
  business_name: string;
  occupation: string | null;
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

interface Lead {
  id: string;
  fullName: string;
  avatar: string;
  gender: string;
  phone: string;
  dob: string;
  contactDate: string;
  email: string;
  leadSource: string;
  customerType: string;
  business: string;
  occupation: string;
  address: string;
  status: 'Active' | 'Inactive';
  created_date?: string;
  updated_date?: string;
  raw: ApiLeadData;
}

export default function ViewLeadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leadId = searchParams.get('id');

  const [lead, setLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [leadNotFound, setLeadNotFound] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch lead data from API
  useEffect(() => {
    if (!leadId) {
      setLeadNotFound(true);
      setIsLoading(false);
      return;
    }

    const fetchLeadData = async () => {
      setIsLoading(true);
      try {
        const response = await api.post('/lead/pagination', {
          page_number: String('1'),
          page_size: String('10'),
          search_type: 'lead_id',
          query_search: String(leadId)
        });

        const apiResult = response.data[0];
        if (apiResult && apiResult.data && apiResult.data.length > 0) {
          const leadData: ApiLeadData = apiResult.data[0];
          const primaryContact = leadData.contact_data?.flatMap(cd => cd.contact_values).find(cv => cv.is_primary);
          const fullAddress = [
            leadData.home_address,
            leadData.street_address,
            leadData.village_name,
            leadData.commune_name,
            leadData.district_name,
            leadData.province_name,
          ].filter(Boolean).join(', ');

          const formattedLead: Lead = {
            id: leadData.lead_id,
            fullName: `${leadData.first_name} ${leadData.last_name}`,
            avatar: leadData.photo_url || "/images/user/user-02.jpg",
            gender: leadData.gender_name,
            phone: primaryContact?.contact_number || 'N/A',
            dob: leadData.date_of_birth,
            contactDate: new Date(leadData.created_date).toLocaleDateString(),
            email: leadData.email || 'N/A',
            leadSource: leadData.lead_source_name,
            customerType: leadData.customer_type_name,
            business: leadData.business_name,
            occupation: leadData.occupation || 'N/A',
            address: fullAddress || 'N/A',
            status: leadData.is_active ? 'Active' : 'Inactive',
            created_date: new Date(leadData.created_date).toLocaleDateString(),
            updated_date: leadData.updated_date ? new Date(leadData.updated_date).toLocaleDateString() : undefined,
            raw: leadData,
          };

          setLead(formattedLead);
          setLeadNotFound(false);
        } else {
          setLeadNotFound(true);
        }
      } catch (error) {
        console.error('Error fetching lead data:', error);
        setLeadNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeadData();
  }, [leadId]);

  const handleEdit = () => {
    router.push(`/lead/edit/${leadId}`);
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push('/lead');
    } catch (error) {
      console.error('Error deleting lead:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleBack = () => {
    router.push('/lead');
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
    return <LoadingOverlay isLoading={true} />;
  }

  if (leadNotFound || !lead) {
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
                  src={lead.avatar}
                  alt={lead.fullName}
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
                    {lead.fullName}
                  </h1>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(lead.status)}
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ID: {lead.id}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                    {lead.customerType}
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
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Lead ID:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white font-mono">{lead.id}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pl-6">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">{lead.fullName}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pl-6">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Gender:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">{lead.gender}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pl-6">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Date of Birth:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">{lead.dob}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pl-6">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Address:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">{lead.address}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pl-6">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Lead Source:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">{lead.leadSource}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pl-6">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Customer Type:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">{lead.customerType}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pl-6">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Business:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">{lead.business}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pl-6">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Occupation:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">{lead.occupation}</div>
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
                    {lead.raw.contact_data && lead.raw.contact_data.length > 0 ? (
                      lead.raw.contact_data.map((channel) => (
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
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">{lead.created_date}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Updated Date:</div>
                    <div className="col-span-2 text-sm text-gray-900 dark:text-white">{lead.updated_date || 'Not updated yet'}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Status:</div>
                    <div className="col-span-2">{getStatusBadge(lead.status)}</div>
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
            Are you sure you want to delete lead &quot;{lead.fullName}&quot;? This action cannot be undone and may affect associated data.
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
