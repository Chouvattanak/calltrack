"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import DatePicker from "@/components/form/date-picker";
import TextArea from "@/components/form/input/TextArea";
import ImageUpload from "@/components/form/ImageUpload";
import LoadingOverlay from "@/components/ui/loading/LoadingOverlay";
import Address, { IAddress } from "@/components/form/Address";
import ContactInfo, { IContactChannel } from "@/components/form/ContactInfo";
import { formatDateForAPI } from "@/lib/utils";

interface SelectOption {
    value: string;
    label: string;
}

interface AlertInfo {
  variant: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

export default function CreateStaffPage() {
  const router = useRouter();

  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Staff", href: "/staff" },
    { name: "Create" },
  ];

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    gender: null as SelectOption | null,
    dob: null as Date | null,
    staffCode: "",
    position: "",
    department: null as SelectOption | null,
    manager: null as SelectOption | null,
    employmentType: null as SelectOption | null,
    employmentLevel: null as SelectOption | null,
    employmentStartDate: null as Date | null,
    address: {
        province: null, district: null, commune: null, village: null,
        homeAddress: "", streetAddress: ""
    } as IAddress,
    remark: "",
    contact_data: [] as IContactChannel[],
    photo: null as File | null,
  });

  type StaffFormErrors = {
    firstName?: string; lastName?: string; gender?: string; dob?: string; email?: string;
    staffCode?: string; position?: string; department?: string; manager?: string;
    employmentType?: string; employmentLevel?: string; employmentStartDate?: string;
    address?: string; remark?: string; contact_data?: string;
  };

  const [errors, setErrors] = useState<StaffFormErrors>({});
  const [departmentOptions, setDepartmentOptions] = useState<SelectOption[]>([]);
  const [managerOptions, setManagerOptions] = useState<SelectOption[]>([]);
  const [employmentTypeOptions, setEmploymentTypeOptions] = useState<SelectOption[]>([]);
  const [employmentLevelOptions, setEmploymentLevelOptions] = useState<SelectOption[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [alertInfo, setAlertInfo] = useState<AlertInfo | null>(null);

  const dropdownOptions = {
    gender: [
        { value: "1", label: "Male" },
        { value: "2", label: "Female" },
        { value: "3", label: "Other" }
    ],
    employmentType: [
        { value: "full time", label: "Full Time" },
        { value: "part time", label: "Part Time" },
        { value: "contract", label: "Contract" },
        { value: "intern", label: "Intern" }
    ],
    employmentLevel: [
        { value: "Entry", label: "Entry Level" },
        { value: "Junior", label: "Junior" },
        { value: "Senior", label: "Senior" },
        { value: "Lead", label: "Lead" },
        { value: "Manager", label: "Manager" },
        { value: "Director", label: "Director" }
    ]
  };

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        // For now, use default department options
        // In production, replace with actual API endpoint: const departmentResponse = await api.get('/departments');
        setDepartmentOptions([
          { value: "1", label: "IT" },
          { value: "2", label: "HR" },
          { value: "3", label: "Finance" },
          { value: "4", label: "Operations" },
          { value: "5", label: "Marketing" }
        ]);

        // For now, use default manager options
        // In production, replace with actual API endpoint: const managerResponse = await api.get('/staff/managers');
        setManagerOptions([
          { value: "1", label: "John Manager" },
          { value: "2", label: "Jane Supervisor" },
          { value: "3", label: "Bob Director" }
        ]);
      } catch (error) {
        console.error('Error fetching dropdown data:', error);
      }

      // Set employment options from local data
      setEmploymentTypeOptions([
        { value: "full time", label: "Full Time" },
        { value: "part time", label: "Part Time" },
        { value: "contract", label: "Contract" },
        { value: "intern", label: "Intern" }
      ]);
      setEmploymentLevelOptions([
        { value: "Entry", label: "Entry Level" },
        { value: "Junior", label: "Junior" },
        { value: "Senior", label: "Senior" },
        { value: "Lead", label: "Lead" },
        { value: "Manager", label: "Manager" },
        { value: "Director", label: "Director" }
      ]);
    };

    fetchDropdownData();
  }, []);

  const handleChange = (field: keyof typeof formData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field-specific error when user starts typing/selecting
    if (errors[field as keyof StaffFormErrors]) {
      const newErrors = { ...errors };
      delete newErrors[field as keyof StaffFormErrors];
      setErrors(newErrors);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: StaffFormErrors = {};
    
    // Required field validations
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required.";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required.";
    if (!formData.gender) newErrors.gender = "Please select a gender.";
    if (!formData.dob) newErrors.dob = "Date of birth is required.";
    if (!formData.staffCode.trim()) newErrors.staffCode = "Staff code is required.";
    if (!formData.position.trim()) newErrors.position = "Position is required.";
    if (!formData.department) newErrors.department = "Please select a department.";
    if (!formData.manager) newErrors.manager = "Please select a manager.";
    if (!formData.employmentType) newErrors.employmentType = "Please select employment type.";
    if (!formData.employmentStartDate) newErrors.employmentStartDate = "Employment start date is required.";
    
    // Email validation
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSaving(true);
    
    try {
      // Handle photo upload if present
      let photoUrl = null;
      if (formData.photo) {
        const photoFormData = new FormData();
        photoFormData.append('photo', formData.photo);
        photoFormData.append('menu', 'staff');
        const uploadResponse = await api.post('/files/upload-one-photo', photoFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        photoUrl = uploadResponse.data.imageUrl;
      }

      // Process contact data to match API structure
      const contactDataGrouped = formData.contact_data.reduce((acc, channel) => {
        if (channel.channel_type && channel.contact_values.length > 0) {
          acc.push({
            channel_type_id: channel.channel_type.value,
            contact_values: channel.contact_values.map(val => ({
              user_name: val.user_name || "staff.user", // Default username if not provided
              contact_number: val.contact_number,
              remark: val.remark || "",
              is_primary: val.is_primary
            }))
          });
        }
        return acc;
      }, [] as { channel_type_id: string; contact_values: { user_name: string; contact_number: string; remark: string; is_primary: boolean }[] }[]);

      const staffData = {
        staff_id: formData.staffCode, // Use staff code as staff_id
        staff_code: formData.staffCode,
        first_name: formData.firstName,
        last_name: formData.lastName,
        gender_id: formData.gender?.value,
        village_id: formData.address.village?.value || null,
        manager_id: formData.manager?.value || "1", // Use selected manager or default
        date_of_birth: formatDateForAPI(formData.dob),
        position: formData.position,
        department: formData.department?.label || null,
        employment_type: formData.employmentType?.label || null, // Use .label not .value
        employment_start_date: formatDateForAPI(formData.employmentStartDate),
        employment_end_date: null,
        employment_level: formData.employmentLevel?.label || null, // Use .label not .value
        current_address: formData.address.homeAddress || null,
        photo_url: photoUrl && photoUrl.length > 0 ? photoUrl[0] : null, // Single URL or null, not array
        menu_id: "MU_05",
        contact_data: contactDataGrouped
      };

      console.log('Staff payload before API call:', JSON.stringify(staffData, null, 2));
      console.log('Date of birth:', formData.dob, '-> formatted:', formatDateForAPI(formData.dob));
      console.log('Employment start date:', formData.employmentStartDate, '-> formatted:', formatDateForAPI(formData.employmentStartDate));
      console.log('Email:', formData.email);
      console.log('Street address:', formData.address.streetAddress);
      console.log('API Base URL:', process.env.NEXT_PUBLIC_API_BASE_URL);
      
      // Use staff API endpoint
      const response = await api.post('/staff/create', staffData);
      console.log("Staff Create API Response:", response);
      console.log("Staff Create API Response Data:", response.data);
      console.log("Response Status:", response.status);
      
      // Check if the response indicates success
      if (response.status === 200 || response.status === 201) {
        setAlertInfo({
          variant: 'success',
          title: 'Success!',
          message: 'Staff member created successfully.'
        });
        
        // Redirect to staff list after a short delay
        setTimeout(() => {
          router.push('/staff');
        }, 1500);
      } else {
        // Handle error response
        const errorMessage = response.data?.message || 'Failed to create staff member';
        setAlertInfo({
          variant: 'error',
          title: 'Error',
          message: errorMessage
        });
      }
    } catch (error: unknown) {
      console.error('Error creating staff:', error);
      setAlertInfo({
        variant: 'error',
        title: 'Error',
        message: 'Failed to create staff member. Please try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <LoadingOverlay isLoading={isSaving} />
      {alertInfo && (
        <div className="fixed top-5 right-5 z-[10000] w-full max-w-sm">
          <div className={`p-4 rounded-md ${
            alertInfo.variant === 'success' ? 'bg-green-100 text-green-800' :
            alertInfo.variant === 'error' ? 'bg-red-100 text-red-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            <h3 className="font-semibold">{alertInfo.title}</h3>
            <p>{alertInfo.message}</p>
            <button 
              onClick={() => setAlertInfo(null)}
              className="mt-2 px-3 py-1 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
      <div>
        <PageBreadcrumb crumbs={breadcrumbs} />
      <LoadingOverlay isLoading={isSaving} />
        <div className="space-y-6">
          <ComponentCard title="Create New Staff Member">
            <div className="relative">
              {/* Header Status Bar */}
              <div className="mb-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-l-4 border-green-500 p-3 rounded-r-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">Creating New Staff Member</p>
                    <p className="text-xs text-green-600 dark:text-green-300">Fill in the information below to create a new staff record</p>
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
                {/* Photo Upload Section */}
                <div className="col-span-2 lg:col-span-3 pb-6">
                  <ImageUpload
                    value={formData.photo}
                    onChange={(file: File | null) => handleChange("photo", file)}
                    initialPreviewUrl=""
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
                        onChange={(e) => handleChange("firstName", e.target.value)}
                      />
                      {errors.firstName && <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>}
                    </div>

                    <div className="col-span-2 lg:col-span-1">
                      <Label>Last Name *</Label>
                      <Input
                        type="text"
                        placeholder="Enter last name"
                        value={formData.lastName}
                        onChange={(e) => handleChange("lastName", e.target.value)}
                      />
                      {errors.lastName && <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>}
                    </div>

                    <div className="col-span-2 lg:col-span-1">
                      <Label>Gender *</Label>
                      <Select
                        options={dropdownOptions.gender}
                        value={formData.gender || undefined}
                        onChange={(selectedOption) => handleChange("gender", selectedOption)}
                        placeholder="Select gender"
                        className="dark:bg-dark-900 dark:border-dark-700 dark:text-white"
                      />
                      {errors.gender && <p className="text-sm text-red-500 mt-1">{errors.gender}</p>}
                    </div>

                    <div className="col-span-2 lg:col-span-1">
                      <DatePicker
                        id="date-picker-dob"
                        label="Date of Birth *"
                        placeholder="Select date of birth"
                        value={formData.dob || undefined}
                        onChange={(dates) => handleChange("dob", dates)}
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
                        onChange={(e) => handleChange("staffCode", e.target.value)}
                      />
                      {errors.staffCode && <p className="text-sm text-red-500 mt-1">{errors.staffCode}</p>}
                    </div>

                    <div className="col-span-2 lg:col-span-1">
                      <Label>Position *</Label>
                      <Input
                        type="text"
                        placeholder="Enter job position"
                        value={formData.position}
                        onChange={(e) => handleChange("position", e.target.value)}
                      />
                      {errors.position && <p className="text-sm text-red-500 mt-1">{errors.position}</p>}
                    </div>

                    <div className="col-span-2 lg:col-span-1">
                      <Label>Department *</Label>
                      <Select
                        options={departmentOptions}
                        value={formData.department || undefined}
                        onChange={(selectedOption) => handleChange("department", selectedOption)}
                        placeholder="Select department"
                        className="dark:bg-dark-900 dark:border-dark-700 dark:text-white"
                      />
                      {errors.department && <p className="text-sm text-red-500 mt-1">{errors.department}</p>}
                    </div>

                    <div className="col-span-2 lg:col-span-1">
                      <Label>Manager *</Label>
                      <Select
                        options={managerOptions}
                        value={formData.manager || undefined}
                        onChange={(selectedOption) => handleChange("manager", selectedOption)}
                        placeholder="Select manager"
                        className="dark:bg-dark-900 dark:border-dark-700 dark:text-white"
                      />
                      {errors.manager && <p className="text-sm text-red-500 mt-1">{errors.manager}</p>}
                    </div>

                    <div className="col-span-2 lg:col-span-1">
                      <Label>Employment Type *</Label>
                      <Select
                        options={employmentTypeOptions}
                        value={formData.employmentType || undefined}
                        onChange={(selectedOption) => handleChange("employmentType", selectedOption)}
                        placeholder="Select employment type"
                        className="dark:bg-dark-900 dark:border-dark-700 dark:text-white"
                      />
                      {errors.employmentType && <p className="text-sm text-red-500 mt-1">{errors.employmentType}</p>}
                    </div>

                    <div className="col-span-2 lg:col-span-1">
                      <Label>Employment Level</Label>
                      <Select
                        options={employmentLevelOptions}
                        value={formData.employmentLevel || undefined}
                        onChange={(selectedOption) => handleChange("employmentLevel", selectedOption)}
                        placeholder="Select employment level"
                        className="dark:bg-dark-900 dark:border-dark-700 dark:text-white"
                      />
                      {errors.employmentLevel && <p className="text-sm text-red-500 mt-1">{errors.employmentLevel}</p>}
                    </div>

                    <div className="col-span-2 lg:col-span-1">
                      <DatePicker
                        id="date-picker-employment-start"
                        label="Employment Start Date *"
                        placeholder="Select start date"
                        value={formData.employmentStartDate || undefined}
                        onChange={(dates) => handleChange("employmentStartDate", dates)}
                      />
                      {errors.employmentStartDate && <p className="text-sm text-red-500 mt-1">{errors.employmentStartDate}</p>}
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
                        onChange={(contactData: IContactChannel[]) => handleChange("contact_data", contactData)}
                      />
                    </div>

                    <div>
                      <Address
                        value={formData.address}
                        onSave={(address: IAddress) => handleChange("address", address)}
                      />
                    </div>

                    <div>
                      <Label>Remarks</Label>
                      <TextArea
                        placeholder="Enter any additional remarks..."
                        value={formData.remark}
                        onChange={(value) => handleChange("remark", value)}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6 justify-end">
                <Button size="md" variant="outline" type="button" onClick={() => router.push('/staff')}>
                  Cancel
                </Button>
                <Button size="md" type="submit" disabled={isSaving}>
                  {isSaving ? 'Creating...' : 'Save Staff'}
                </Button>
              </div>
            </form>
          </ComponentCard>
        </div>
      </div>
    </>
  );
}
