'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { formatApiDataForSelect } from '@/lib/utils';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import DatePicker from '@/components/form/date-picker';
import TextArea from '@/components/form/input/TextArea';
import { EnvelopeIcon } from '@/icons';
import Address, { IAddress } from '@/components/form/Address';
import ContactInfo, {
  IContactChannel,
} from '@/components/form/ContactInfo';
import ImageUpload from '@/components/form/ImageUpload';
import LoadingOverlay from '@/components/ui/loading/LoadingOverlay';
import SuccessModal from '@/components/ui/modal/SuccessModal';
import { formatDateForAPI } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string;
}

export default function UpdateLeadPage() {
  const router = useRouter();
  const params = useParams();
  const leadId = params.id as string;

  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'Lead', href: '/lead' },
    { name: 'Edit' },
  ];

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: null as SelectOption | null,
    dob: null as string | null,
    email: '',
    occupation: '',
    leadSource: null as SelectOption | null,
    contactDate: null as string | null,
    customerType: null as SelectOption | null,
    business: null as SelectOption | null,
    address: {
      province: null,
      district: null,
      commune: null,
      village: null,
      homeAddress: '',
      streetAddress: '',
    } as IAddress,
    remark: '',
    contact_data: [] as IContactChannel[],
    photo: null as File | null,
    existingPhotoUrl: null as string | null,
    initialStaffId: '',
    currentStaffId: '',
  });

  type LeadFormErrors = {
    firstName?: string;
    lastName?: string;
    gender?: string;
    dob?: string;
    email?: string;
    phone?: string;
    occupation?: string;
    leadSource?: string;
    contactDate?: string;
    customerType?: string;
    business?: string;
    address?: string;
    remark?: string;
    contact_data?: string;
    photo?: File;
  };

  const [errors, setErrors] = useState<LeadFormErrors>({});
  const [dropdownOptions, setDropdownOptions] = useState({
    gender: [],
    business: [],
    leadSource: [],
    customerType: [],
    channelType: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  // Removed alertInfo, now using errorModal for all error feedback
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorModal, setErrorModal] = useState<{ open: boolean; statusCode?: number; message?: string }>({ open: false });

  useEffect(() => {
    if (!leadId) {
      setIsLoading(false);
      return;
    }

    const fetchInitialData = async () => {
      try {
        const [gender, business, leadSource, customerType, channelType] =
          await Promise.all([
            api.get('common/gender'),
            api.get('common/business'),
            api.get('lead-source/lead-source'),
            api.get('customer-type/customer-type'),
            api.get('channel-type/channel-type'),
          ]);

        const leadRes = await api.post('/lead/pagination', {
          page_number: String('1'),
          page_size: String('10'),
          search_type: 'lead_id',
          query_search: String(`${leadId}`),
        });

        const leadData = leadRes.data[0];
        const allChannelTypes = formatApiDataForSelect(
          channelType.data,
          'channel_type_id',
          'channel_type_name'
        );
        
        // Helper to format date string as 'YYYY-MM-DD' for flatpickr
        const formatDateYMD = (dateStr: string | null | undefined) => {
          if (!dateStr) return '';
          const d = new Date(dateStr);
          if (isNaN(d.getTime())) return '';
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };

        setFormData({
          firstName: leadData.data[0].first_name || '',
          lastName: leadData.data[0].last_name || '',
          gender: leadData.data[0].gender_id ? {
            value: String(leadData.data[0].gender_id),
            label: leadData.data[0].gender_name,
          } : null,
          dob: formatDateYMD(leadData.data[0].date_of_birth),
          email: leadData.data[0].email || '',
          occupation: leadData.data[0].occupation || '',
          leadSource: leadData.data[0].lead_source_id ? {
            value: String(leadData.data[0].lead_source_id),
            label: leadData.data[0].lead_source_name,
          } : null,
          contactDate: formatDateYMD(leadData.data[0].relationship_date),
          customerType: leadData.data[0].customer_type_id ? {
            value: String(leadData.data[0].customer_type_id),
            label: leadData.data[0].customer_type_name,
          } : null,
          business: leadData.data[0].business_id ? {
            value: String(leadData.data[0].business_id),
            label: leadData.data[0].business_name,
          } : null,
          address: {
            province: leadData.data[0].province_id
              ? {
                  value: String(leadData.data[0].province_id),
                  label: leadData.data[0].province_name,
                }
              : null,
            district: leadData.data[0].district_id
              ? {
                  value: String(leadData.data[0].district_id),
                  label: leadData.data[0].district_name,
                }
              : null,
            commune: leadData.data[0].commune_id
              ? {
                  value: String(leadData.data[0].commune_id),
                  label: leadData.data[0].commune_name,
                }
              : null,
            village: leadData.data[0].village_id
              ? {
                  value: String(leadData.data[0].village_id),
                  label: leadData.data[0].village_name,
                }
              : null,
            homeAddress: leadData.data[0].home_address || '',
            streetAddress: leadData.data[0].street_address || '',
          },
          contact_data: (leadData.data[0].contact_data || []).map(
            (channel: unknown) => {
              const ch = channel as Record<string, unknown>;
              return {
                id: Math.random(),
                channel_type:
                  allChannelTypes.find(
                    (ct) => ct.value === String(ch.channel_type_id)
                  ) || null,
                contact_values: ((ch.contact_values as unknown[]) || []).map(
                  (val: unknown) => ({ ...(val as Record<string, unknown>), id: Math.random() })
                ),
              };
            }
          ),
          photo: null,
          existingPhotoUrl: leadData.data[0].photo_url || '',
          remark: leadData.data[0].remark || '',
          initialStaffId: leadData.data[0].initial_staff_id,
          currentStaffId: leadData.data[0].current_staff_id,
        });

        const formattedGenders = gender.data.map((item: unknown) => {
          const g = item as Record<string, unknown>;
          return {
            value: String(g.gender_id),
            label: g.gender_name as string,
          };
        });

        const formattedBusinesses = business.data.map((item: unknown) => {
          const b = item as Record<string, unknown>;
          return {
            value: String(b.business_id),
            label: b.business_name as string,
          };
        });

        const formattedLeadSources = leadSource.data.map((item: unknown) => {
          const ls = item as Record<string, unknown>;
          return {
            value: String(ls.lead_source_id),
            label: ls.lead_source_name as string,
          };
        });

        const formattedCustomerTypes = customerType.data.map((item: unknown) => {
          const ct = item as Record<string, unknown>;
          return {
            value: String(ct.customer_type_id),
            label: ct.customer_type_name as string,
          };
        });

        const formattedChannelTypes = channelType.data.map((item: unknown) => {
          const ch = item as Record<string, unknown>;
          return {
            value: String(ch.channel_type_id),
            label: ch.channel_type_name as string,
          };
        });

        setDropdownOptions({
          gender: formattedGenders,
          business: formattedBusinesses,
          leadSource: formattedLeadSources,
          customerType: formattedCustomerTypes,
          channelType: formattedChannelTypes,
        });
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [leadId]);

  const handleChange = (field: keyof typeof formData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof LeadFormErrors]) {
      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        delete newErrors[field as keyof LeadFormErrors];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors: LeadFormErrors = {};
    if (!formData.firstName.trim())
      newErrors.firstName = 'First name is required.';
    if (!formData.lastName.trim())
      newErrors.lastName = 'Last name is required.';
    if (!formData.gender) newErrors.gender = 'Please select a gender.';
    if (!formData.dob) newErrors.dob = 'Date of birth is required.';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email address is invalid.';
    }
    if (!formData.occupation.trim())
      newErrors.occupation = 'Occupation is required.';
    if (!formData.leadSource)
      newErrors.leadSource = 'Please select a lead source.';
    if (!formData.contactDate)
      newErrors.contactDate = 'Contact Date is required.';
    if (!formData.customerType)
      newErrors.customerType = 'Please select a customer type.';
    if (!formData.business) newErrors.business = 'Please select a business.';
    if (!formData.address.province) {
      newErrors.address = 'A complete address with province is required.';
    }
    if (
      formData.contact_data.length === 0 ||
      !formData.contact_data.some((c) => c.contact_values.length > 0)
    ) {
      newErrors.contact_data = 'Contact is required.';
    } else {
      const isInvalid = formData.contact_data.some(
        (c) =>
          !c.channel_type ||
          c.contact_values.some((v) => !v.contact_number.trim())
      );
      if (isInvalid) {
        newErrors.contact_data =
          'Each contact group must have a channel and each contact must have a number/ID.';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async () => {
      if (!validate() || !formData.currentStaffId.toString()) {
        if (!formData.currentStaffId.toString()) {
          setErrorModal({
            open: true,
            statusCode: 401,
            message: 'Could not find user information. Please log in again.'
          });
          setTimeout(() => {
            router.push("/signin");
          }, 2000);
        }
        return;
      }

    setIsSaving(true);
    try {
      let photoUrl = formData.existingPhotoUrl;
      if (formData.photo) {
        const photoFormData = new FormData();
        photoFormData.append('photo', formData.photo);
        photoFormData.append('menu', 'lead');
        photoFormData.append('photoId', String(`${leadId}`));
        const uploadResponse = await api.post(
          '/files/upload-one-photo',
          photoFormData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
          }
        );
        photoUrl = uploadResponse.data.imageUrl;
      }

      const contactDataGrouped = formData.contact_data.map((channel) => ({
        channel_type_id: channel.channel_type?.value,
        contact_values: channel.contact_values.map((val) => ({
          user_name: val.user_name,
          contact_number: val.contact_number,
          remark: val.remark,
          is_primary: val.is_primary,
        })),
      }));

      const leadPayload = {
        lead_id: String(`${leadId}`),
        first_name: formData.firstName,
        last_name: formData.lastName,
        gender_id: formData.gender?.value,
        customer_type_id: formData.customerType?.value,
        lead_source_id: formData.leadSource?.value,
        village_id: formData.address.village?.value,
        business_id: formData.business?.value,
        current_staff_id: formData.currentStaffId.toString(),
        initial_staff_id: formData.initialStaffId.toString(),
        date_of_birth: formatDateForAPI(formData.dob),
        email: formData.email,
        occupation: formData.occupation,
        home_address: formData.address.homeAddress,
        street_address: formData.address.streetAddress,
        biz_description: null,
        relationship_date: formatDateForAPI(formData.contactDate),
        remark: formData.remark,
        photo_url: photoUrl,
        contact_data: contactDataGrouped,
        is_active: true,
      };

      const createLead = await api.put(`/lead/update`, leadPayload);
      if (createLead.data[0].statusCode === 200) {
        setShowSuccess(true);
      } else {
        setErrorModal({
          open: true,
          statusCode: createLead.data[0].statusCode,
          message: createLead.data[0].message || 'Failed to update lead',
        });
      }
    } catch (err) {
      console.error('Failed to update lead:', err);
      setErrorModal({
        open: true,
        statusCode: 500,
        message: 'An error occurred while updating the lead. Please try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/lead');
  };

  return (
    <>
      <LoadingOverlay isLoading={isLoading || isSaving} />
      {/* Universal Success Modal */}
      <SuccessModal
        isOpen={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          router.push('/lead');
        }}
        statusCode={200}
        message="The lead has been updated successfully."
        buttonText="Go to Lead List"
      />
      {/* Error Modal */}
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
          <ComponentCard title="Edit Lead">
            <div className="relative">
              {/* Header Status Bar */}
              <div className="mb-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-l-4 border-orange-500 p-3 rounded-r-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-orange-800 dark:text-orange-200">Editing Lead</p>
                    <p className="text-xs text-orange-600 dark:text-orange-300">Update the information below to modify the lead record</p>
                  </div>
                </div>
              </div>
              
              {/* Ribbon Style Badge */}
              <div className="absolute top-0 left-0 z-10">
                <div className="bg-orange-500 text-white px-4 py-1 text-sm font-semibold shadow-lg transform -rotate-45 -translate-x-8 -translate-y-4">
                  EDIT
                </div>
              </div>
            </div>
            
            <form className="flex flex-col" noValidate onSubmit={(e) => { e.preventDefault(); handleUpdate(); }}>
              <div className="px-2 pb-3">
                {/* Photo Upload Section */}
                <div className="col-span-2 lg:col-span-3 pb-6">
                  <ImageUpload
                    value={formData.photo}
                    onChange={(file) => handleChange('photo', file)}
                    initialPreviewUrl={formData.existingPhotoUrl}
                  />
                  <p className="text-center text-xs text-gray-500 dark:text-gray-500 mt-2 font-normal">
                    Upload Profile Picture
                  </p>
                </div>
                
                {/* Personal Information */}
                <div className="mb-8 p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                  <h3 className="text-base font-medium mb-4 text-gray-800 dark:text-gray-200">Personal Information</h3>
                  <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-3">
                    <div className="col-span-2 lg:col-span-1">
                      <Label>First Name</Label>
                      <Input
                        type="text"
                        placeholder="Enter first name"
                        value={formData.firstName}
                        onChange={(e) => handleChange('firstName', e.target.value)}
                      />
                      {errors.firstName && <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>}
                    </div>

                    <div className="col-span-2 lg:col-span-1">
                      <Label>Last Name</Label>
                      <Input
                        type="text"
                        placeholder="Enter last name"
                        value={formData.lastName}
                        onChange={(e) => handleChange('lastName', e.target.value)}
                      />
                      {errors.lastName && <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>}
                    </div>

                    <div className="col-span-2 lg:col-span-1">
                      <Label>Gender</Label>
                      <Select
                        options={dropdownOptions.gender}
                        value={formData.gender || undefined}
                        onChange={(selectedOption) => handleChange('gender', selectedOption)}
                        placeholder="Select gender"
                      />
                      {errors.gender && <p className="text-sm text-red-500 mt-1">{errors.gender}</p>}
                    </div>

                    <div className="col-span-2 lg:col-span-1">
                      <DatePicker
                        id="date-picker-dob"
                        label="Date of Birth"
                        placeholder="Select a date"
                        defaultDate={formData.dob || undefined}
                        onChange={(dates) => handleChange('dob', dates[0])}
                      />
                      {errors.dob && <p className="text-sm text-red-500 mt-1">{errors.dob}</p>}
                    </div>

                    <div className="col-span-2 lg:col-span-1">
                      <Label>Email</Label>
                      <div className="relative">
                        <Input
                          placeholder="info@gmail.com"
                          type="email"
                          className="pl-[62px]"
                          value={formData.email}
                          onChange={(e) => handleChange('email', e.target.value)}
                        />
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 border-r border-gray-200 px-3.5 py-3 text-gray-500 dark:border-gray-800 dark:text-gray-400">
                          <EnvelopeIcon />
                        </span>
                      </div>
                      {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                    </div>

                    <div className="col-span-2 lg:col-span-1">
                      <Label>Occupation</Label>
                      <Input
                        type="text"
                        placeholder="Enter occupation"
                        value={formData.occupation}
                        onChange={(e) => handleChange('occupation', e.target.value)}
                      />
                      {errors.occupation && <p className="text-sm text-red-500 mt-1">{errors.occupation}</p>}
                    </div>
                  </div>
                </div>

                {/* Business Information */}
                <div className="mb-8 p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                  <h3 className="text-base font-medium mb-4 text-gray-800 dark:text-gray-200">Business Information</h3>
                  <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-3">
                    <div className="col-span-2 lg:col-span-1">
                      <Label>Lead Source</Label>
                      <Select
                        options={dropdownOptions.leadSource}
                        value={formData.leadSource || undefined}
                        onChange={(selectedOption) => handleChange('leadSource', selectedOption)}
                        className="dark:bg-dark-900"
                      />
                      {errors.leadSource && <p className="text-sm text-red-500 mt-1">{errors.leadSource}</p>}
                    </div>

                    <div className="col-span-2 lg:col-span-1">
                      <Label>Customer Type</Label>
                      <Select
                        options={dropdownOptions.customerType}
                        value={formData.customerType || undefined}
                        onChange={(selectedOption) => handleChange('customerType', selectedOption)}
                        className="dark:bg-dark-900"
                      />
                      {errors.customerType && <p className="text-sm text-red-500 mt-1">{errors.customerType}</p>}
                    </div>

                    <div className="col-span-2 lg:col-span-1">
                      <Label>Business</Label>
                      <Select
                        options={dropdownOptions.business}
                        value={formData.business || undefined}
                        onChange={(selectedOption) => handleChange('business', selectedOption)}
                        className="dark:bg-dark-900"
                      />
                      {errors.business && <p className="text-sm text-red-500 mt-1">{errors.business}</p>}
                    </div>

                    <div className="col-span-2 lg:col-span-1">
                      <DatePicker
                        id="date-picker-contactDate"
                        label="Contact Date"
                        placeholder="Select a date"
                        defaultDate={formData.contactDate || undefined}
                        onChange={(dates) => handleChange('contactDate', dates[0])}
                      />
                      {errors.contactDate && <p className="text-sm text-red-500 mt-1">{errors.contactDate}</p>}
                    </div>
                  </div>
                </div>

                {/* Contact & Address Information */}
                <div className="mb-8 p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                  <h3 className="text-base font-medium mb-4 text-gray-800 dark:text-gray-200">Contact & Address Information</h3>
                  <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-1">
                    <div>
                      <ContactInfo
                        value={formData.contact_data}
                        onChange={(newcontact_data) => handleChange('contact_data', newcontact_data)}
                        error={errors.contact_data}
                      />
                    </div>

                    <div>
                      <Address
                        value={formData.address}
                        onSave={(newAddress) => handleChange('address', newAddress)}
                        error={errors.address}
                      />
                    </div>

                    <div>
                      <Label>Remark</Label>
                      <TextArea
                        value={formData.remark}
                        onChange={(value) => handleChange('remark', value)}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6 justify-end">
                <Button size="md" variant="outline" type="button" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button size="md" type="submit" disabled={isSaving}>
                  {isSaving ? 'Updating...' : 'Update Lead'}
                </Button>
              </div>
            </form>
          </ComponentCard>
        </div>
      </div>
    </>
  );
}
