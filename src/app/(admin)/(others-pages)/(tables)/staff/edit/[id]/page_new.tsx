"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import api, { getUserFromToken } from "@/lib/api";
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
import ContactInfo, { IContactChannel, IContactValue } from "@/components/form/ContactInfo";
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

export default function EditStaffPage() {
  const router = useRouter();
  const params = useParams();
  const staffId = params.id as string;

  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Staff", href: "/staff" },
    { name: "Edit" },
  ];

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    gender: null as SelectOption | null,
    dob: null as Date | null,
    email: "",
    staffCode: "",
    position: "",
    department: null as SelectOption | null,
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
    staffCode?: string; position?: string; department?: string; 
    employmentType?: string; employmentLevel?: string; employmentStartDate?: string;
    address?: string; remark?: string; contact_data?: string;
  };

  const [errors, setErrors] = useState<StaffFormErrors>({});
  const [departmentOptions, setDepartmentOptions] = useState<SelectOption[]>([]);
  const [employmentTypeOptions, setEmploymentTypeOptions] = useState<SelectOption[]>([]);
  const [employmentLevelOptions, setEmploymentLevelOptions] = useState<SelectOption[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [alertInfo, setAlertInfo] = useState<AlertInfo | null>(null);

  const dropdownOptions = {
    gender: [
        { value: "1", label: "Male" },
        { value: "2", label: "Female" },
        { value: "3", label: "Other" }
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
      } catch (error) {
        console.error('Error fetching dropdown data:', error);
      }

      // Set employment options from local data
      setEmploymentTypeOptions([
        { value: "Full-time", label: "Full-time" },
        { value: "Part-time", label: "Part-time" },
        { value: "Contract", label: "Contract" },
        { value: "Intern", label: "Intern" }
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

  // Load staff data when component mounts
  useEffect(() => {
    const loadStaffData = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/staff/${staffId}`);
        const staffData = response.data;
        
        if (staffData) {
          // Parse date strings to Date objects
          const dobDate = staffData.date_of_birth ? new Date(staffData.date_of_birth) : null;
          const employmentStartDate = staffData.employment_start_date ? new Date(staffData.employment_start_date) : null;

          // Find gender option
          const genderOption = dropdownOptions.gender.find(g => g.value === String(staffData.gender_id)) || null;
          
          // Find department option  
          const departmentOption = departmentOptions.find(d => d.label === staffData.department) || null;
          
          // Find employment type option
          const employmentTypeOption = employmentTypeOptions.find(e => e.value === staffData.employment_type) || null;
          
          // Find employment level option
          const employmentLevelOption = employmentLevelOptions.find(e => e.value === staffData.employment_level) || null;

          setFormData({
            firstName: staffData.first_name || "",
            lastName: staffData.last_name || "",
            gender: genderOption,
            dob: dobDate,
            email: staffData.email || "",
            staffCode: staffData.staff_code || "",
            position: staffData.position || "",
            department: departmentOption,
            employmentType: employmentTypeOption,
            employmentLevel: employmentLevelOption,
            employmentStartDate: employmentStartDate,
            address: {
              province: null,
              district: null,
              commune: null,
              village: null,
              homeAddress: staffData.current_address || "",
              streetAddress: ""
            },
            remark: staffData.remark || "",
            contact_data: staffData.contact_data || [],
            photo: null,
          });
        }
      } catch (error) {
        console.error('Error loading staff data:', error);
        setAlertInfo({
          variant: 'error',
          title: 'Error',
          message: 'Failed to load staff data. Please try again.'
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (staffId) {
      loadStaffData();
    }
  }, [staffId, departmentOptions, employmentTypeOptions, employmentLevelOptions, dropdownOptions.gender]);

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
    if (!formData.employmentType) newErrors.employmentType = "Please select employment type.";
    if (!formData.employmentStartDate) newErrors.employmentStartDate = "Employment start date is required.";
    
    // Email validation
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSaving(true);
    
    try {
      const user = getUserFromToken();
      
      const staffData = {
        staff_code: formData.staffCode,
        first_name: formData.firstName,
        last_name: formData.lastName,
        gender_id: formData.gender?.value,
        email: formData.email || null,
        date_of_birth: formatDateForAPI(formData.dob),
        position: formData.position,
        department: formData.department?.label || null,
        employment_type: formData.employmentType?.value,
        employment_level: formData.employmentLevel?.value || null,
        employment_start_date: formatDateForAPI(formData.employmentStartDate),
        current_address: `${formData.address.homeAddress || ''} ${formData.address.streetAddress || ''}`.trim() || null,
        is_active: true,
        updated_by: user?.user_name || 'System',
        contact_data: formData.contact_data.map((channel: IContactChannel) => ({
          channel_type_id: channel.channel_type?.value,
          channel_type_name: channel.channel_type?.label,
          contact_values: channel.contact_values.map((contact: IContactValue) => ({
            contact_number: contact.contact_number,
            is_primary: contact.is_primary,
            remark: contact.remark || ""
          }))
        })),
        remark: formData.remark || null
      };

      console.log('Updating staff with data:', staffData);
      
      // Use staff API endpoint
      const response = await api.put(`/staff/update/${staffId}`, staffData);
      
      if (response.data) {
        setAlertInfo({
          variant: 'success',
          title: 'Success!',
          message: 'Staff member updated successfully.'
        });
        
        // Redirect to staff list after a short delay
        setTimeout(() => {
          router.push('/staff');
        }, 1500);
      }
    } catch (error: unknown) {
      console.error('Error updating staff:', error);
      setAlertInfo({
        variant: 'error',
        title: 'Error',
        message: 'Failed to update staff member. Please try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageBreadcrumb crumbs={breadcrumbs} />
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingOverlay isLoading={isLoading} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageBreadcrumb crumbs={breadcrumbs} />

      <ComponentCard title="Edit Staff Member">
        <form onSubmit={handleSubmit} className="space-y-6">
          {alertInfo && (
            <div className={`p-4 rounded-md ${
              alertInfo.variant === 'success' ? 'bg-green-50 border border-green-200' :
              alertInfo.variant === 'error' ? 'bg-red-50 border border-red-200' :
              'bg-blue-50 border border-blue-200'
            }`}>
              <div className="flex">
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${
                    alertInfo.variant === 'success' ? 'text-green-800' :
                    alertInfo.variant === 'error' ? 'text-red-800' :
                    'text-blue-800'
                  }`}>
                    {alertInfo.title}
                  </h3>
                  <div className={`mt-2 text-sm ${
                    alertInfo.variant === 'success' ? 'text-green-700' :
                    alertInfo.variant === 'error' ? 'text-red-700' :
                    'text-blue-700'
                  }`}>
                    <p>{alertInfo.message}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Personal Information</h3>
              
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  type="text"
                  placeholder="Enter first name"
                  value={formData.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                />
                {errors.firstName && <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>}
              </div>

              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  type="text"
                  placeholder="Enter last name"
                  value={formData.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                />
                {errors.lastName && <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>}
              </div>

              <div>
                <Label htmlFor="gender">Gender *</Label>
                <Select
                  options={dropdownOptions.gender}
                  value={formData.gender || undefined}
                  onChange={(selectedOption) => handleChange("gender", selectedOption)}
                  className="dark:bg-dark-900 dark:border-dark-700 dark:text-white"
                />
                {errors.gender && <p className="text-sm text-red-500 mt-1">{errors.gender}</p>}
              </div>

              <div>
                <Label htmlFor="dob">Date of Birth *</Label>
                <DatePicker
                  id="date-picker-dob"
                  label="Date of Birth"
                  placeholder="Select date of birth"
                  value={formData.dob || undefined}
                  onChange={(dates) => handleChange("dob", dates)}
                />
                {errors.dob && <p className="text-sm text-red-500 mt-1">{errors.dob}</p>}
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
                {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
              </div>
            </div>

            {/* Employment Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Employment Information</h3>

              <div>
                <Label htmlFor="staffCode">Staff Code *</Label>
                <Input
                  type="text"
                  placeholder="Enter staff code (e.g., STF-001)"
                  value={formData.staffCode}
                  onChange={(e) => handleChange("staffCode", e.target.value)}
                />
                {errors.staffCode && <p className="text-sm text-red-500 mt-1">{errors.staffCode}</p>}
              </div>

              <div>
                <Label htmlFor="position">Position *</Label>
                <Input
                  type="text"
                  placeholder="Enter job position"
                  value={formData.position}
                  onChange={(e) => handleChange("position", e.target.value)}
                />
                {errors.position && <p className="text-sm text-red-500 mt-1">{errors.position}</p>}
              </div>

              <div>
                <Label htmlFor="department">Department *</Label>
                <Select
                  options={departmentOptions}
                  value={formData.department || undefined}
                  onChange={(selectedOption) => handleChange("department", selectedOption)}
                  className="dark:bg-dark-900 dark:border-dark-700 dark:text-white"
                />
                {errors.department && <p className="text-sm text-red-500 mt-1">{errors.department}</p>}
              </div>

              <div>
                <Label htmlFor="employmentType">Employment Type *</Label>
                <Select
                  options={employmentTypeOptions}
                  value={formData.employmentType || undefined}
                  onChange={(selectedOption) => handleChange("employmentType", selectedOption)}
                  className="dark:bg-dark-900 dark:border-dark-700 dark:text-white"
                />
                {errors.employmentType && <p className="text-sm text-red-500 mt-1">{errors.employmentType}</p>}
              </div>

              <div>
                <Label htmlFor="employmentLevel">Employment Level</Label>
                <Select
                  options={employmentLevelOptions}
                  value={formData.employmentLevel || undefined}
                  onChange={(selectedOption) => handleChange("employmentLevel", selectedOption)}
                  className="dark:bg-dark-900 dark:border-dark-700 dark:text-white"
                />
                {errors.employmentLevel && <p className="text-sm text-red-500 mt-1">{errors.employmentLevel}</p>}
              </div>

              <div>
                <Label htmlFor="employmentStartDate">Employment Start Date *</Label>
                <DatePicker
                  id="date-picker-startDate"
                  label="Start Date"
                  placeholder="Select start date"
                  value={formData.employmentStartDate || undefined}
                  onChange={(dates) => handleChange("employmentStartDate", dates)}
                />
                {errors.employmentStartDate && <p className="text-sm text-red-500 mt-1">{errors.employmentStartDate}</p>}
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Address Information</h3>
            <Address
              value={formData.address}
              onSave={(address: IAddress) => handleChange("address", address)}
            />
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h3>
            <ContactInfo
              value={formData.contact_data}
              onChange={(contactData: IContactChannel[]) => handleChange("contact_data", contactData)}
            />
          </div>

          {/* Photo Upload */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profile Photo</h3>
            <ImageUpload
              value={formData.photo}
              onChange={(file: File | null) => handleChange("photo", file)}
              initialPreviewUrl=""
            />
          </div>

          {/* Remarks */}
          <div>
            <Label htmlFor="remark">Remarks</Label>
            <TextArea
              placeholder="Enter any additional remarks..."
              value={formData.remark}
              onChange={(value) => handleChange("remark", value)}
              rows={3}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/staff')}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSaving}
            >
              {isSaving ? 'Updating...' : 'Update Staff'}
            </Button>
          </div>
        </form>

        {isSaving && <LoadingOverlay isLoading={isSaving} />}
      </ComponentCard>
    </div>
  );
}
