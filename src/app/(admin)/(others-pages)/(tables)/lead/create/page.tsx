"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import SuccessModal from "@/components/ui/modal/SuccessModal";
import { EnvelopeIcon } from "@/icons";
import axios from "axios";
import Address, { IAddress } from "@/components/form/Address";
import ContactInfo, { IContactChannel, IContactValue } from "@/components/form/ContactInfo";
import { formatDateForAPI } from "@/lib/utils";

interface SelectOption {
    value: string;
    label: string;
}



export default function CreateLeadPage() {
  const router = useRouter();

  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Lead", href: "/lead" },
    { name: "Create" },
  ];

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    gender: null as SelectOption | null,
    dob: null as Date | null,
    email: "",
    phone: "",
    occupation: "",
    leadSource: null as SelectOption | null,
    contactDate: null as Date | null,
    customerType: null as SelectOption | null,
    business: null as SelectOption | null,
    address: {
        province: null, district: null, commune: null, village: null,
        homeAddress: "", streetAddress: ""
    } as IAddress,
    remark: "",
    contact_data: [] as IContactChannel[],
    photo: null as File | null,
  });

  type LeadFormErrors = {
    firstName?: string; lastName?: string; gender?: string; dob?: string; email?: string;
    phone?: string; occupation?: string; leadSource?: string; contactDate?: string; customerType?: string;
    business?: string; address?: string; remark?: string; contact_data?: string; photo?: string;
  };

  const [errors, setErrors] = useState<LeadFormErrors>({});
  const [businessOptions, setBusinessOptions] = useState<SelectOption[]>([]);
  const [leadSourceOptions, setLeadSourceOptions] = useState<SelectOption[]>([]);
  const [customerTypeOptions, setCustomerTypeOptions] = useState<SelectOption[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  // Removed alertInfo, now using errorModal for all error feedback
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorModal, setErrorModal] = useState<{ open: boolean; statusCode?: number; message?: string }>({ open: false });

  const dropdownOptions = {
    gender: [
      { value: "1", label: "Male" },
      { value: "2", label: "Female" },
    ],
  };

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [business, leadSource, customerType] = await Promise.all([
          api.get('common/business'),
          api.get('lead-source/lead-source'),
          api.get('customer-type/customer-type'),
          // api.get('channel-type/channel-type') // Not currently used in UI
        ]);

        const formattedBusinesses = business.data.map((item: unknown) => {
          const b = item as Record<string, unknown>;
          return {
            value: String(b.business_id),
            label: b.business_name as string
          };
        });

        const formattedLeadSources = leadSource.data.map((item: unknown) => {
          const ls = item as Record<string, unknown>;
          return {
            value: String(ls.lead_source_id),
            label: ls.lead_source_name as string
          };
        });
        
        const formattedCustomerTypes = customerType.data.map((item: unknown) => {
          const ct = item as Record<string, unknown>;
          return {
            value: String(ct.customer_type_id),
            label: ct.customer_type_name as string
          };
        });

        // Prepare channel types for potential future use
        // const formattedChannelTypes = channelType.data.map((item: unknown) => {
        //   const ch = item as Record<string, unknown>;
        //   return {
        //     value: String(ch.channel_type_id),
        //     label: ch.channel_type_name as string
        //   };
        // });

        setBusinessOptions(formattedBusinesses);
        setLeadSourceOptions(formattedLeadSources);
        setCustomerTypeOptions(formattedCustomerTypes);
        // Note: Channel types prepared but not currently used in UI

      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          console.error("Unauthorized request. Token may be invalid or expired.");
        } else {
          console.error("Failed to fetch dropdown data:", error);
        }
      }
    };

    fetchDropdownData();
  }, []); // Empty array ensures this runs only once on mount

  const handleChange = (field: keyof typeof formData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
        setErrors(prevErrors => {
            const newErrors = { ...prevErrors };
            delete newErrors[field];
            return newErrors;
        });
    }
  };

  const validate = () => {
    const newErrors: LeadFormErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required.";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required.";
    if (!formData.gender) newErrors.gender = "Please select a gender.";
    if (!formData.dob) newErrors.dob = "Date of birth is required.";
    if (!formData.email.trim()) { newErrors.email = "Email is required."; } 
    else if (!/\S+@\S+\.\S+/.test(formData.email)) { newErrors.email = "Email address is invalid.";}
    // if (!formData.phone.trim()) newErrors.phone = "Phone number is required.";
    if (!formData.occupation.trim()) newErrors.occupation = "Occupation is required.";
    if (!formData.leadSource) newErrors.leadSource = "Please select a lead source.";
    if (!formData.contactDate) newErrors.contactDate = "Contact Date is required.";
    if (!formData.contactDate) newErrors.dob = "Contact Date is required.";
    if (!formData.customerType) newErrors.customerType = "Please select a customer type.";
    if (!formData.business) newErrors.business = "Please select a business.";
    if (!formData.address.province) {
        newErrors.address = "A complete address with province is required.";
    }
    if (formData.contact_data.length === 0 || !formData.contact_data.some(c => c.contact_values.length > 0)) {
    newErrors.contact_data = "Contact is required.";
    } else {
        const isInvalid = formData.contact_data.some(c => 
            !c.channel_type || c.contact_values.some(v => !v.contact_number.trim())
        );
        if (isInvalid) {
            newErrors.contact_data = "Each contact group must have a channel and each contact must have a number/ID.";
        }
    }
    console.log(formData);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSave = async () => { 
    const tokenUser = getUserFromToken();
        if (!validate() || !tokenUser?.user_id) {
            if (!tokenUser?.user_id) {
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
        let photoUrl = null;
        if (formData.photo) {
            const photoFormData = new FormData();
            photoFormData.append('photo', formData.photo);
            photoFormData.append('menu', 'lead');
            const uploadResponse = await api.post('/files/upload-one-photo', photoFormData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            photoUrl = uploadResponse.data.imageUrl;
        }

        const contactDataGrouped = formData.contact_data.reduce((acc, channel) => {
            if (channel.channel_type && channel.contact_values.length > 0) {
                acc.push({
                    channel_type_id: channel.channel_type.value,
                    contact_values: channel.contact_values.map(val => ({
                        user_name: val.user_name,
                        contact_number: val.contact_number,
                        remark: val.remark,
                        is_primary: val.is_primary,
                    }))
                });
            }
            return acc;
        }, [] as { channel_type_id: string; contact_values: Omit<IContactValue, 'id'>[] }[]);

        const leadPayload = {
            first_name: formData.firstName,
            last_name: formData.lastName,
            gender_id: formData.gender?.value,
            customer_type_id: formData.customerType?.value,
            lead_source_id: formData.leadSource?.value,
            village_id: formData.address.village?.value,
            business_id: formData.business?.value,
            initial_staff_id: String(Number(tokenUser?.user_id) || 1), // Convert to number then to string
            current_staff_id: String(Number(tokenUser?.user_id) || 1), // Convert to number then to string
            date_of_birth: formatDateForAPI(formData.dob),
            email: formData.email || null,
            occupation: formData.occupation || null,
            home_address: formData.address.homeAddress || null,
            street_address: formData.address.streetAddress || null,
            biz_description: null,
            relationship_date: formatDateForAPI(formData.contactDate),
            remark: formData.remark || null,
            photo_url: photoUrl,
            contact_data: contactDataGrouped,
        };

        console.log('Lead payload before API call:', JSON.stringify(leadPayload, null, 2));
        console.log('Initial staff ID:', tokenUser?.user_id, '-> converted to number:', Number(tokenUser?.user_id));
        console.log('Current staff ID:', tokenUser?.user_id, '-> converted to number:', Number(tokenUser?.user_id));
        console.log('Date of birth:', formData.dob, '-> formatted:', formatDateForAPI(formData.dob));
        console.log('Relationship date:', formData.contactDate, '-> formatted:', formatDateForAPI(formData.contactDate));

        const createLead = await api.post('/lead/create', leadPayload);
        console.log("Lead Create API Response:", createLead);
        console.log("Lead Create API Response Data:", createLead.data);
        console.log("Response Status:", createLead.status);
        
        // Check if the response indicates success
        if (createLead.status === 200 || createLead.status === 201) {
          setShowSuccess(true);
        } else {
          // Handle error response
          setErrorModal({
            open: true,
            statusCode: createLead.status,
            message: createLead.data?.message || 'Failed to create lead',
          });
        }
  } catch (error: unknown) {
    console.error('Error creating lead:', error);
    setErrorModal({
      open: true,
      statusCode: 500,
      message: 'An error occurred while saving the lead. Please try again.'
    });
  } finally {
    setIsSaving(false);
  }
  };
  const handleCancel = () => { router.push("/lead"); };

  return (
    <>
      {/* Use the full-page LoadingOverlay for all loading states */}
      <LoadingOverlay isLoading={isSaving} />
      {/* Universal Success Modal */}
      <SuccessModal
        isOpen={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          router.push("/lead");
        }}
        statusCode={200}
        message="The lead has been created successfully."
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
      {/* Main content remains unchanged */}
      <div>
        <PageBreadcrumb crumbs={breadcrumbs} />
        <div className="space-y-6">
          <ComponentCard title="Create New Lead">
            <div className="relative">
              {/* Header Status Bar */}
              <div className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-l-4 border-blue-500 p-3 rounded-r-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Creating New Lead</p>
                    <p className="text-xs text-blue-600 dark:text-blue-300">Fill in the information below to create a new lead record</p>
                  </div>
                </div>
              </div>
              {/* Ribbon Style Badge */}
              <div className="absolute top-0 left-0 z-10">
                <div className="bg-blue-500 text-white px-4 py-1 text-sm font-semibold shadow-lg transform -rotate-45 -translate-x-8 -translate-y-4">
                  NEW
                </div>
              </div>
            </div>
            <form className="flex flex-col" noValidate onSubmit={(e) => { e.preventDefault(); handleSave() }}>
              <div className="px-2 pb-3">
                {/* Photo Upload Section */}
                <div className="col-span-2 lg:col-span-3 pb-6">
                  <ImageUpload
                    value={formData.photo}
                    onChange={(file) => handleChange('photo', file)}
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
                      <Input type="text" placeholder="Enter first name" value={formData.firstName} onChange={(e) => handleChange("firstName", e.target.value)} />
                      {errors.firstName && <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>}
                    </div>
                    <div className="col-span-2 lg:col-span-1">
                      <Label>Last Name</Label>
                      <Input type="text" placeholder="Enter last name" value={formData.lastName} onChange={(e) => handleChange("lastName", e.target.value)} />
                      {errors.lastName && <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>}
                    </div>
                    <div className="col-span-2 lg:col-span-1">
                      <Label>Gender</Label>
                      <Select 
                        options={dropdownOptions.gender} 
                        value={formData.gender} 
                        onChange={(selectedOption) => handleChange("gender", selectedOption)} 
                        placeholder="Select gender" 
                      />
                      {errors.gender && <p className="text-sm text-red-500 mt-1">{errors.gender}</p>}
                    </div>
                    <div className="col-span-2 lg:col-span-1">
                      <DatePicker id="date-picker-dob" label="Date of Birth" placeholder="Select a date" value={formData.dob || undefined} onChange={(dates) => handleChange("dob", dates[0])} />
                      {errors.dob && <p className="text-sm text-red-500 mt-1">{errors.dob}</p>}
                    </div>
                    <div className="col-span-2 lg:col-span-1">
                      <Label>Email</Label>
                      <div className="relative">
                        <Input placeholder="info@gmail.com" type="email" className="pl-[62px]" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} />
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 border-r border-gray-200 px-3.5 py-3 text-gray-500 dark:border-gray-800 dark:text-gray-400"><EnvelopeIcon /></span>
                      </div>
                      {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                    </div>
                    <div className="col-span-2 lg:col-span-1">
                      <Label>Occupation</Label>
                      <Input type="text" placeholder="Enter occupation" value={formData.occupation} onChange={(e) => handleChange("occupation", e.target.value)} />
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
                      <Select options={leadSourceOptions} value={formData.leadSource || undefined} onChange={(selectedOption) => handleChange("leadSource", selectedOption)} className="dark:bg-dark-900" />
                      {errors.leadSource && <p className="text-sm text-red-500 mt-1">{errors.leadSource}</p>}
                    </div>
                    <div className="col-span-2 lg:col-span-1">
                      <Label>Customer Type</Label>
                      <Select options={customerTypeOptions} value={formData.customerType || undefined} onChange={(selectedOption) => handleChange("customerType", selectedOption)} className="dark:bg-dark-900" />
                      {errors.customerType && <p className="text-sm text-red-500 mt-1">{errors.customerType}</p>}
                    </div>
                    <div className="col-span-2 lg:col-span-1">
                      <Label>Business</Label>
                      <Select options={businessOptions} value={formData.business || undefined} onChange={(selectedOption) => handleChange("business", selectedOption)} className="dark:bg-dark-900" />
                      {errors.business && <p className="text-sm text-red-500 mt-1">{errors.business}</p>}
                    </div>
                    <div className="col-span-2 lg:col-span-1">
                      <DatePicker id="date-picker-contactDate" label="Contact Date" placeholder="Select a date" value={formData.contactDate || undefined} onChange={(dates) => handleChange("contactDate", dates[0])} />
                      {errors.dob && <p className="text-sm text-red-500 mt-1">{errors.contactDate}</p>}
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
                          onSave={(newAddress) => handleChange('address', newAddress) }
                          error={errors.address}
                        />
                    </div>
                    <div>
                      <Label>Remark</Label>
                      <TextArea value={formData.remark} onChange={(value) => handleChange("remark", value)} rows={3} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-6 justify-end">
                <Button size="md" variant="outline" type="button" onClick={handleCancel}>Cancel</Button>
                <Button size="md" type="submit">Save Lead</Button>
              </div>
            </form>
          </ComponentCard>
        </div>
      </div>
    </>
  );
}