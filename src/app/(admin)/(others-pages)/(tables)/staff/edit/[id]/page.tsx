'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { formatApiDataForSelect, parseDateString } from '@/lib/utils';
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
import { formatDateForAPI } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string;
}

export default function UpdateStaffPage() {
  const router = useRouter();
  const params = useParams();
  const staffId = params.id as string;

  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'Staff', href: '/staff' },
    { name: 'Edit' },
  ];

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: null as SelectOption | null,
    dob: null as Date | string | null,
    staffCode: '',
    position: '',
    department: null as SelectOption | null,
    employmentType: null as SelectOption | null,
    employmentLevel: null as SelectOption | null,
    employmentStartDate: null as Date | string | null,
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
  });

  type StaffFormErrors = {
    firstName?: string;
    lastName?: string;
    gender?: string;
    dob?: string;
    email?: string;
    staffCode?: string;
    position?: string;
    department?: string;
    employmentType?: string;
    employmentLevel?: string;
    employmentStartDate?: string;
    address?: string;
    remark?: string;
    contact_data?: string;
    photo?: File;
  };

  const [errors, setErrors] = useState<StaffFormErrors>({});
  const [dropdownOptions, setDropdownOptions] = useState<{
    gender: SelectOption[];
    department: SelectOption[];
    employmentType: SelectOption[];
    employmentLevel: SelectOption[];
    channelType: SelectOption[];
  }>({
    gender: [],
    department: [],
    employmentType: [],
    employmentLevel: [],
    channelType: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{
    variant: 'success' | 'error';
    title: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!staffId) {
      setIsLoading(false);
      return;
    }

    console.log('🔍 Edit Staff Page - Staff ID from URL:', staffId);

    const fetchInitialData = async () => {
      try {
        const [gender, channelType] = await Promise.all([
          api.get('common/gender'),
          api.get('channel-type/channel-type'),
        ]);

        // Try direct staff endpoint first, then fallback to pagination
        let staffRecord = null;
        
        console.log('🔍 Making API call with:', {
          search_type: 'staff_id',
          query_search: staffId,
        });
        
        const staffRes = await api.post('/staff/pagination', {
          page_number: String('1'),
          page_size: String('10'),
          search_type: 'staff_id',
          query_search: String(`${staffId}`),
        });

        console.log('📋 API Response:', staffRes.data);
        
        const staffData = staffRes.data[0];
        staffRecord = staffData.data[0];
        
        console.log('👤 Found staff record:', staffRecord);
        
        if (!staffRecord) {
          console.error('Could not find staff record in any API response');
          throw new Error('Staff data not found in API response');
        }
        
        console.log('Found staff record:', staffRecord);

        // Use the staff record directly
        const staff = staffRecord;
        console.log('Date of birth from API:', staff.date_of_birth);
        console.log('Employment start date from API:', staff.employment_start_date);
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
          firstName: staff.first_name || '',
          lastName: staff.last_name || '',
          gender: staff.gender_id ? {
            value: String(staff.gender_id),
            label: staff.gender_name || 'Unknown',
          } : null,
          dob: formatDateYMD(staff.date_of_birth),
          staffCode: staff.staff_code || '',
          position: staff.position || '',
          department: staff.department ? {
            value: String(staff.department),
            label: staff.department,
          } : null,
          employmentType: staff.employment_type ? {
            value: String(staff.employment_type),
            label: staff.employment_type,
          } : null,
          employmentLevel: staff.employment_level ? {
            value: String(staff.employment_level),
            label: staff.employment_level,
          } : null,
          employmentStartDate: formatDateYMD(staff.employment_start_date),
          address: {
            province: staff.province_id
              ? {
                  value: String(staff.province_id),
                  label: staff.province_name || 'Unknown',
                }
              : null,
            district: staff.district_id
              ? {
                  value: String(staff.district_id),
                  label: staff.district_name || 'Unknown',
                }
              : null,
            commune: staff.commune_id
              ? {
                  value: String(staff.commune_id),
                  label: staff.commune_name || 'Unknown',
                }
              : null,
            village: staff.village_id
              ? {
                  value: String(staff.village_id),
                  label: staff.village_name || 'Unknown',
                }
              : null,
            homeAddress: staff.current_address || '',
            streetAddress: staff.street_address || '', // Map from API if available
          },
          contact_data: (staff.contact_data || []).map(
            (channel: { channel_type_id: string; contact_values: { contact_number: string; is_primary: boolean; remark?: string }[] }) => ({
              id: Math.random(),
              channel_type:
                allChannelTypes.find(
                  (ct) => ct.value === String(channel.channel_type_id)
                ) || null,
              contact_values: (channel.contact_values || []).map(
                (val: { contact_number: string; is_primary: boolean; remark?: string }) => ({ ...val, id: Math.random() })
              ),
            })
          ),
          photo: null,
          existingPhotoUrl: (Array.isArray(staff.photo_url) ? staff.photo_url[0] : staff.photo_url) || '',
          remark: staff.remark || '',
        });

        console.log('Parsed DOB:', parseDateString(staff.date_of_birth));
        console.log('Parsed Employment Start Date:', parseDateString(staff.employment_start_date));

        setDropdownOptions({
          gender: formatApiDataForSelect(gender.data, 'gender_id', 'gender_name'),
          department: [
            { value: 'IT', label: 'IT' },
            { value: 'HR', label: 'HR' },
            { value: 'Finance', label: 'Finance' },
            { value: 'Operations', label: 'Operations' },
            { value: 'Marketing', label: 'Marketing' },
            { value: 'Sales', label: 'Sales' },
          ],
          employmentType: [
            { value: 'Full-time', label: 'Full-time' },
            { value: 'Part-time', label: 'Part-time' },
            { value: 'Contract', label: 'Contract' },
            { value: 'Intern', label: 'Intern' },
          ],
          employmentLevel: [
            { value: 'Entry', label: 'Entry Level' },
            { value: 'Junior', label: 'Junior' },
            { value: 'Senior', label: 'Senior' },
            { value: 'Lead', label: 'Lead' },
            { value: 'Manager', label: 'Manager' },
            { value: 'Director', label: 'Director' },
          ],
          channelType: allChannelTypes,
        });
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
        setAlertInfo({
          variant: 'error',
          title: 'Load Failed',
          message: 'Failed to load staff data. Please try again.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [staffId]);

  const handleChange = (field: keyof typeof formData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof StaffFormErrors]) {
      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        delete newErrors[field as keyof StaffFormErrors];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors: StaffFormErrors = {};
    
    if (!formData.firstName.trim())
      newErrors.firstName = 'First name is required.';
    if (!formData.lastName.trim())
      newErrors.lastName = 'Last name is required.';
    if (!formData.gender)
      newErrors.gender = 'Please select a gender.';
    if (!formData.dob)
      newErrors.dob = 'Date of birth is required.';
    if (!formData.staffCode.trim())
      newErrors.staffCode = 'Staff code is required.';
    if (!formData.position.trim())
      newErrors.position = 'Position is required.';
    if (!formData.department)
      newErrors.department = 'Please select a department.';
    if (!formData.employmentType)
      newErrors.employmentType = 'Please select employment type.';
    if (!formData.employmentStartDate)
      newErrors.employmentStartDate = 'Employment start date is required.';


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async () => {
    if (!validate()) return;

    setIsSaving(true);
    try {
      let photoUrl = formData.existingPhotoUrl;

      // Upload photo if new one is selected
      if (formData.photo) {
        const photoFormData = new FormData();
        photoFormData.append('file', formData.photo);

        const photoUpload = await api.post('/file/upload', photoFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (photoUpload.data?.file_url) {
          photoUrl = photoUpload.data.file_url;
        }
      }

      // Group contact data by channel type according to new API structure
      const contactDataGrouped = formData.contact_data.reduce(
        (acc: { channel_type_id: string; contact_values: { user_name: string; contact_number: string; remark: string; is_primary: boolean }[] }[], channel: IContactChannel) => {
          if (channel.channel_type && channel.contact_values.length > 0) {
            acc.push({
              channel_type_id: channel.channel_type.value,
              contact_values: channel.contact_values.map((val: { contact_number: string; is_primary: boolean; remark?: string }) => ({
                user_name: `${formData.firstName}.${formData.lastName}`.toLowerCase().replace(/\s+/g, '.'),
                contact_number: val.contact_number,
                remark: val.remark || '',
                is_primary: val.is_primary,
              })),
            });
          }
          return acc;
        },
        []
      );

      const staffPayload = {
        staff_id: staffId,
        staff_code: formData.staffCode,
        first_name: formData.firstName,
        last_name: formData.lastName,
        gender_id: formData.gender?.value,
        village_id: formData.address.village?.value,
        manager_id: "1", // Default manager ID as shown in the sample
        date_of_birth: formatDateForAPI(formData.dob),
        position: formData.position,
        department: formData.department?.label || null,
        employment_type: formData.employmentType?.label || null,
        employment_start_date: formatDateForAPI(formData.employmentStartDate),
        employment_end_date: null,
        employment_level: formData.employmentLevel?.label || null,
        current_address: formData.address.homeAddress || null,
        street_address: formData.address.streetAddress || null,
        photo_url: photoUrl ? [photoUrl] : [],
        is_active: true,
        menu_id: "MU_05", // Default menu ID as shown in the sample
        contact_data: contactDataGrouped,
      };

      console.log('Staff payload before API call:', JSON.stringify(staffPayload, null, 2));
      console.log('Date of birth:', formData.dob, '-> formatted:', formatDateForAPI(formData.dob));
      console.log('Employment start date:', formData.employmentStartDate, '-> formatted:', formatDateForAPI(formData.employmentStartDate));
      console.log('Street address:', formData.address.streetAddress);

      const updateStaff = await api.put('/staff/update', staffPayload);
      if (updateStaff.data) {
        setAlertInfo({
          variant: 'success',
          title: 'Success!',
          message: 'Staff member has been updated successfully.',
        });
        setTimeout(() => {
          router.push('/staff');
        }, 3000);
      }
    } catch (err) {
      console.error('Failed to update staff:', err);
      setAlertInfo({
        variant: 'error',
        title: 'Save Failed',
        message: 'An error occurred while updating the staff member. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/staff');
  };

  return (
    <>
      <LoadingOverlay isLoading={isLoading || isSaving} />
      {alertInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">{alertInfo.title}</h3>
            <p className="text-gray-600 mb-4">{alertInfo.message}</p>
            <Button onClick={() => setAlertInfo(null)}>OK</Button>
          </div>
        </div>
      )}
      <div>
        <PageBreadcrumb crumbs={breadcrumbs} />
      <LoadingOverlay isLoading={isLoading || isSaving} />
        <div className="space-y-6">
          <ComponentCard title="Edit Staff Member">
            <div className="relative">
              {/* Header Status Bar */}
              <div className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-l-4 border-blue-500 p-3 rounded-r-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Editing Staff Member</p>
                    <p className="text-xs text-blue-600 dark:text-blue-300">Update the information below to modify the staff record</p>
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
                      <Label>First Name *</Label>
                      <Input
                        type="text"
                        placeholder="Enter first name"
                        value={formData.firstName}
                        onChange={(e) => handleChange('firstName', e.target.value)}
                      />
                      {errors.firstName && <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>}
                    </div>

                    <div className="col-span-2 lg:col-span-1">
                      <Label>Last Name *</Label>
                      <Input
                        type="text"
                        placeholder="Enter last name"
                        value={formData.lastName}
                        onChange={(e) => handleChange('lastName', e.target.value)}
                      />
                      {errors.lastName && <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>}
                    </div>

                    <div className="col-span-2 lg:col-span-1">
                      <Label>Gender *</Label>
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
                        label="Date of Birth *"
                        placeholder="Select a date"
                        defaultDate={formData.dob || undefined}
                        onChange={(dates) => handleChange('dob', dates[0])}
                      />
                      {errors.dob && <p className="text-sm text-red-500 mt-1">{errors.dob}</p>}
                    </div>

                  </div>
                </div>

                {/* Employment Information */}
                <div className="mb-8 p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                  <h3 className="text-base font-medium mb-4 text-gray-800 dark:text-gray-200">Employment Information</h3>
                  <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-3">
                    <div className="col-span-2 lg:col-span-1">
                      <Label>Staff Code *</Label>
                      <Input
                        type="text"
                        placeholder="Enter staff code (e.g., STF-001)"
                        value={formData.staffCode}
                        onChange={(e) => handleChange('staffCode', e.target.value)}
                      />
                      {errors.staffCode && <p className="text-sm text-red-500 mt-1">{errors.staffCode}</p>}
                    </div>

                    <div className="col-span-2 lg:col-span-1">
                      <Label>Position *</Label>
                      <Input
                        type="text"
                        placeholder="Enter job position"
                        value={formData.position}
                        onChange={(e) => handleChange('position', e.target.value)}
                      />
                      {errors.position && <p className="text-sm text-red-500 mt-1">{errors.position}</p>}
                    </div>

                    <div className="col-span-2 lg:col-span-1">
                      <Label>Department *</Label>
                      <Select
                        options={dropdownOptions.department}
                        value={formData.department || undefined}
                        onChange={(selectedOption) => handleChange('department', selectedOption)}
                        placeholder="Select department"
                        className="dark:bg-dark-900"
                      />
                      {errors.department && <p className="text-sm text-red-500 mt-1">{errors.department}</p>}
                    </div>

                    <div className="col-span-2 lg:col-span-1">
                      <Label>Employment Type *</Label>
                      <Select
                        options={dropdownOptions.employmentType}
                        value={formData.employmentType || undefined}
                        onChange={(selectedOption) => handleChange('employmentType', selectedOption)}
                        placeholder="Select employment type"
                        className="dark:bg-dark-900"
                      />
                      {errors.employmentType && <p className="text-sm text-red-500 mt-1">{errors.employmentType}</p>}
                    </div>

                    <div className="col-span-2 lg:col-span-1">
                      <Label>Employment Level</Label>
                      <Select
                        options={dropdownOptions.employmentLevel}
                        value={formData.employmentLevel || undefined}
                        onChange={(selectedOption) => handleChange('employmentLevel', selectedOption)}
                        placeholder="Select employment level"
                        className="dark:bg-dark-900"
                      />
                      {errors.employmentLevel && <p className="text-sm text-red-500 mt-1">{errors.employmentLevel}</p>}
                    </div>

                    <div className="col-span-2 lg:col-span-1">
                      <DatePicker
                        id="date-picker-employment-start"
                        label="Employment Start Date *"
                        placeholder="Select start date"
                        defaultDate={formData.employmentStartDate || undefined}
                        onChange={(dates) => handleChange('employmentStartDate', dates[0])}
                      />
                      {errors.employmentStartDate && <p className="text-sm text-red-500 mt-1">{errors.employmentStartDate}</p>}
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div className="mb-8 p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                  <h3 className="text-base font-medium mb-4 text-gray-800 dark:text-gray-200">Address Information</h3>
                  <div className="grid grid-cols-1 gap-x-6 gap-y-5">
                    <div>
                      <Address
                        value={formData.address}
                        onSave={(addressData) => handleChange('address', addressData)}
                        error={errors.address}
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="mb-8 p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                  <h3 className="text-base font-medium mb-4 text-gray-800 dark:text-gray-200">Contact Information</h3>
                  <div className="grid grid-cols-1 gap-x-6 gap-y-5">
                    <div>
                      <ContactInfo
                        value={formData.contact_data}
                        onChange={(contactData) => handleChange('contact_data', contactData)}
                      />
                      {errors.contact_data && <p className="text-sm text-red-500 mt-1">{errors.contact_data}</p>}
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="mb-8 p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                  <h3 className="text-base font-medium mb-4 text-gray-800 dark:text-gray-200">Additional Information</h3>
                  <div className="grid grid-cols-1 gap-x-6 gap-y-5">
                    <div>
                      <Label>Remarks</Label>
                      <TextArea
                        placeholder="Enter any additional remarks or notes"
                        value={formData.remark}
                        onChange={(value) => handleChange('remark', value)}
                        rows={4}
                      />
                      {errors.remark && <p className="text-sm text-red-500 mt-1">{errors.remark}</p>}
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSaving}
                  >
                    {isSaving ? 'Updating...' : 'Update Staff Member'}
                  </Button>
                </div>
              </div>
            </form>
          </ComponentCard>
        </div>
      </div>
    </>
  );
}
