"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Select from "@/components/form/Select";
import Address, { IAddress } from "@/components/form/Address";
import PhotoUpload, { PhotoFile } from "@/components/form/PhotoUpload";
import SuccessModal from "@/components/ui/modal/SuccessModal";
import api from "@/lib/api";
import { getDropdownDataFromCache } from "@/lib/dropdownCache";

const breadcrumbs = [
  { name: "Home", href: "/" },
  { name: "Property", href: "/property" },
  { name: "Create", href: "/property/create" }
];

interface ISelectOption {
  value: string;
  label: string;
}

interface FormData {
  PropertyName: string;
  Location: IAddress;
  PropertyType: ISelectOption | null;
  Status: ISelectOption | null;
  Price: string;
  Description: string;
  Features: string;
  Bedrooms: string;
  Bathrooms: string;
  YearBuilt: string;
  Project: ISelectOption | null;
  Width: string;
  Length: string;
  photo_url?: string[];
}

interface FormErrors {
  PropertyName?: string;
  Location?: string;
  PropertyType?: string;
  Status?: string;
  Price?: string;
  Description?: string;
  Features?: string;
  Bedrooms?: string;
  Bathrooms?: string;
  YearBuilt?: string;
  Project?: string;
  Width?: string;
  Length?: string;
}

export default function CreatePropertyPage() {
  const router = useRouter();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorModal, setErrorModal] = useState<{ open: boolean; statusCode?: number; message?: string }>({ open: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    PropertyName: "",
    Location: {
      province: null,
      district: null,
      commune: null,
      village: null,
      homeAddress: "",
      streetAddress: ""
    },
    PropertyType: null,
    Status: null,
    Price: "",
    Description: "",
    Features: "",
    Bedrooms: "",
    Bathrooms: "",
    YearBuilt: "",
    Project: null,
    Width: "",
    Length: "",
  });
  // Project Options (fetched from API)
  const [projectOptions, setProjectOptions] = useState<ISelectOption[]>([]);
  const [propertyTypeOptions, setPropertyTypeOptions] = useState<ISelectOption[]>([]);
  const [statusOptions, setStatusOptions] = useState<ISelectOption[]>([]);
  React.useEffect(() => {
    async function fetchDropdowns() {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
      // Get token from localStorage
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      // Fetch projects
      try {
        const response = await fetch(`${apiBase}/project/pagination`, {
          method: "POST",
          headers,
          body: JSON.stringify({ page_number: "1", page_size: "100" })
        });
        const data = await response.json();
        console.log("Project API response:", data);
        const apiResult = data[0];
        if (apiResult && apiResult.data) {
          setProjectOptions(apiResult.data.map((proj: { project_id: string, project_name: string }) => ({ value: proj.project_id, label: proj.project_name })));
        }
      } catch (err) {
        console.error("Project API error:", err);
        setProjectOptions([]);
      }
      // Property type options from cache
      try {
        const dropdownData = getDropdownDataFromCache();
        if (dropdownData && dropdownData.propertyTypeOptions) {
          setPropertyTypeOptions(dropdownData.propertyTypeOptions.map((type: any) => ({ value: String(type.property_type_id), label: type.property_type_name })));
        } else {
          setPropertyTypeOptions([]);
        }
      } catch (err) {
        console.error("Property Type cache error:", err);
        setPropertyTypeOptions([]);
      }
      // Fetch property status options
      try {
        const response = await fetch(`${apiBase}/property-status/pagination`, {
          method: "POST",
          headers,
          body: JSON.stringify({ page_number: "1", page_size: "100" })
        });
        const data = await response.json();
        console.log("Property Status API response:", data);
        const apiResult = data[0];
        if (apiResult && apiResult.data) {
          setStatusOptions(apiResult.data.map((status: { property_status_id: number, property_status_name: string }) => ({ value: status.property_status_id.toString(), label: status.property_status_name })));
        }
      } catch (err) {
        console.error("Property Status API error:", err);
        setStatusOptions([]);
      }
    }
    fetchDropdowns();
  }, []);
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [photos, setPhotos] = useState<PhotoFile[]>([]);

  const handleChange = (field: keyof FormData, value: string | boolean | ISelectOption | null | IAddress) => {
    console.log("Property form handleChange:", field, value);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    // Property Name
    if (!formData.PropertyName.trim()) {
      newErrors.PropertyName = "Property name is required";
    } else if (formData.PropertyName.length < 3) {
      newErrors.PropertyName = "Property name must be at least 3 characters";
    }
    // Location
    if (!formData.Location.province || !formData.Location.district || !formData.Location.commune || !formData.Location.village) {
      newErrors.Location = "Complete location is required";
    }
    // Property Type
    if (!formData.PropertyType) {
      newErrors.PropertyType = "Property type is required";
    }
    // Project
    if (!formData.Project) {
      newErrors.Project = "Project is required";
    }
    // Status
    if (!formData.Status) {
      newErrors.Status = "Status is required";
    }
    // Price
    if (!formData.Price.trim()) {
      newErrors.Price = "Price is required";
    } else if (isNaN(Number(formData.Price.replace(/[^\d.]/g, "")))) {
      newErrors.Price = "Price must be a valid number";
    }
    // Description
    if (!formData.Description.trim()) {
      newErrors.Description = "Description is required";
    } else if (formData.Description.length < 10) {
      newErrors.Description = "Description must be at least 10 characters";
    }
    // Features
    if (formData.Features && formData.Features.length < 3) {
      newErrors.Features = "Features must be at least 3 characters";
    }
    // Bedrooms
    if (formData.Bedrooms && (isNaN(Number(formData.Bedrooms)) || Number(formData.Bedrooms) < 0)) {
      newErrors.Bedrooms = "Bedrooms must be a non-negative number";
    }
    // Bathrooms
    if (formData.Bathrooms && (isNaN(Number(formData.Bathrooms)) || Number(formData.Bathrooms) < 0)) {
      newErrors.Bathrooms = "Bathrooms must be a non-negative number";
    }
    // Year Built
    if (formData.YearBuilt && (isNaN(Number(formData.YearBuilt)) || Number(formData.YearBuilt) < 1800 || Number(formData.YearBuilt) > new Date().getFullYear())) {
      newErrors.YearBuilt = `Year built must be between 1800 and ${new Date().getFullYear()}`;
    }
    // Width
    if (formData.Width && (isNaN(Number(formData.Width)) || Number(formData.Width) < 0)) {
      newErrors.Width = "Width must be a non-negative number";
    }
    // Length
    if (formData.Length && (isNaN(Number(formData.Length)) || Number(formData.Length) < 0)) {
      newErrors.Length = "Length must be a non-negative number";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Photo handlers
  const handlePhotosChange = (newPhotos: PhotoFile[]) => {
    setPhotos(newPhotos);
  };

  const uploadMultiplePhotosToStorage = async (photos: PhotoFile[]): Promise<string[]> => {
    if (photos.length === 0) {
      return [];
    }

    const formData = new FormData();
    
    // Add each photo file to the FormData
    photos.forEach((photo) => {
      if (photo.file) {
        formData.append('photo', photo.file);
      }
    });
    
    // Add metadata
    formData.append('menu', 'property_profile');
    formData.append('photoId', ''); // Empty for new property

    try {
      const uploadResponse = await api.post('/files/upload-multiple-photos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      console.log('Multiple upload response:', uploadResponse.data);
      
      // Extract the imageUrls array from the response
      const imageUrls = uploadResponse.data.imageUrls;
      if (!imageUrls || !Array.isArray(imageUrls)) {
        throw new Error('No imageUrls array returned from upload response');
      }
      
      return imageUrls;
    } catch (error) {
      console.error('Error uploading multiple photos:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setIsSubmitting(true);
    try {
      // Upload photos first if any exist
      let photoUrls: string[] = [];
      if (photos.length > 0) {
        console.log("Uploading photos before creating property...");
        // Log photo files before upload
        console.log("Photo files to upload:", photos.filter(photo => photo.file));
        try {
          // Filter out photos without files
          const photosWithFiles = photos.filter(photo => photo.file);
          if (photosWithFiles.length > 0) {
            console.log(`Uploading ${photosWithFiles.length} photos in batch`);
            photoUrls = await uploadMultiplePhotosToStorage(photosWithFiles);
            console.log('Successfully uploaded photos, URLs:', photoUrls);
          }
        } catch (uploadError) {
          console.error("Error uploading photos:", uploadError);
          alert("Failed to upload photos. Please try again.");
          setIsSubmitting(false);
          return;
        }
      }

      // Build payload for API - Updated to match expected PUT request structure
      // Ensure we get the correct status ID
      let statusId = "";
      if (formData.Status) {
        // If Status.value exists, use it; otherwise find the ID from statusOptions
        if (formData.Status.value) {
          statusId = String(formData.Status.value);
        } else if (formData.Status.label) {
          // Fallback: find the ID by matching the label
          const statusOption = statusOptions.find(opt => opt.label === formData.Status?.label);
          statusId = statusOption ? String(statusOption.value) : "";
        }
      }
      
      const payload = {
        property_type_id: String(formData.PropertyType?.value || ""),
        project_id: String(formData.Project?.value || ""),
        project_owner_id: "5", // Hard-coded to 5 as requested
        property_status_id: statusId,
        village_id: String(formData.Location.village?.value || ""),
        property_profile_name: String(formData.PropertyName || ""),
        home_number: String(formData.Location.homeAddress || ""),
        room_number: String(formData.Location.homeAddress || ""), // Use same as home_number for now
        address: String(formData.Location.streetAddress || ""), 
        width: String(formData.Width || ""),
        length: String(formData.Length || ""),
        price: String(formData.Price || ""),
        bedroom: String(formData.Bedrooms || ""),
        bathroom: String(formData.Bathrooms || ""),
        year_built: String(formData.YearBuilt || ""),
        description: String(formData.Description || ""),
        feature: String(formData.Features || ""),
        photo_url: photoUrls // Use the uploaded photo URLs
      };
      
      // Debug logging for form data values
      console.log("Form Data Status:", formData.Status);
      console.log("Status ID extracted:", statusId);
      console.log("Property Create Payload:", JSON.stringify(payload, null, 2));
      console.log("Photo URLs count:", photoUrls.length);
      console.log("Photo URLs:", photoUrls);
      console.log('API Base URL:', process.env.NEXT_PUBLIC_API_BASE_URL);
      console.log('Endpoint: /property-profile/create');
      console.log('Project Owner ID: hardcoded to "5"');
      
      // Validate required fields
      const requiredFields = ['property_type_id', 'project_id', 'property_status_id', 'village_id', 'property_profile_name'];
      const missingFields = requiredFields.filter(field => !payload[field as keyof typeof payload]);
      if (missingFields.length > 0) {
        console.error('Missing required fields:', missingFields);
        alert(`Missing required fields: ${missingFields.join(', ')}`);
        setIsSubmitting(false);
        return;
      }
      
      // Use api client instead of fetch for better authentication handling
      const response = await api.post('/property-profile/create', payload);
      
      console.log('Create property response status:', response.status);
      console.log('Create property response data:', response.data);
      
      // Only treat status 200 as success
      if (response.status === 200) {
        console.log('Create property success response:', response.data);
        setShowSuccessModal(true);
      } else if (response.status === 400) {
        // Bad request - client error
        const errorMessage = response.data?.message || 'Bad request. Please check your input and try again.';
        console.error('Create property 400 error:', errorMessage);
        alert(`Error: ${errorMessage}`);
        setIsSubmitting(false);
        return; // Don't redirect
      } else if (response.status === 500 || response.status === 501) {
        // Server errors
        const errorMessage = response.data?.message || 'Server error. Please try again later.';
        console.error('Create property server error:', response.status, errorMessage);
        alert(`Server Error (${response.status}): ${errorMessage}`);
        setIsSubmitting(false);
        return; // Don't redirect
      } else {
        // Any other non-200 status is treated as error
        const errorMessage = response.data?.message || `Unexpected response status: ${response.status}`;
        console.error('Create property unexpected status:', response.status, errorMessage);
        alert(`Error (${response.status}): ${errorMessage}`);
        setIsSubmitting(false);
        return; // Don't redirect
      }
    } catch (error: any) {
      console.error('Error creating property:', error);
      
      // Handle different types of errors
      if (error.response) {
        // The request was made and the server responded with a status code
        const status = error.response.status;
        const errorMessage = error.response.data?.message || error.message || 'Unknown error occurred';
        
        if (status === 400) {
          alert(`Bad Request: ${errorMessage}`);
        } else if (status === 500 || status === 501) {
          alert(`Server Error (${status}): ${errorMessage}`);
        } else {
          alert(`Error (${status}): ${errorMessage}`);
        }
      } else if (error.request) {
        // The request was made but no response was received
        alert("Network error: Unable to reach the server. Please check your internet connection.");
      } else {
        // Something happened in setting up the request
        alert(`Request error: ${error.message || 'Failed to create property. Please try again.'}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/property');
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    router.push('/property');
  };

  return (
    <div>
      <PageBreadcrumb crumbs={breadcrumbs} />
      

      <ComponentCard title="Create Property">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* General Information */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <h4 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">General Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="PropertyName">Property Name *</Label>
                <Input
                  id="PropertyName"
                  type="text"
                  value={formData.PropertyName}
                  onChange={(e) => handleChange('PropertyName', e.target.value)}
                  placeholder="Enter property name"
                  className={errors.PropertyName ? 'border-red-500' : ''}
                />
                {errors.PropertyName && (
                  <p className="mt-1 text-sm text-red-500">{errors.PropertyName}</p>
                )}
              </div>
              <div>
                <Label htmlFor="PropertyType">Property Type *</Label>
                <Select
                  value={formData.PropertyType}
                  onChange={(value) => handleChange('PropertyType', value)}
                  options={propertyTypeOptions}
                  placeholder="Select Property Type"
                  className={errors.PropertyType ? 'border-red-500' : ''}
                />
                {errors.PropertyType && (
                  <p className="mt-1 text-sm text-red-500">{errors.PropertyType}</p>
                )}
              </div>
              <div>
                <Label htmlFor="Project">Project *</Label>
                <Select
                  value={formData.Project}
                  onChange={(value) => handleChange('Project', value)}
                  options={projectOptions}
                  placeholder="Select Project"
                  className={errors.Project ? 'border-red-500' : ''}
                />
                {errors.Project && (
                  <p className="mt-1 text-sm text-red-500">{errors.Project}</p>
                )}
              </div>
              <div>
                <Label htmlFor="Status">Status *</Label>
                <Select
                  value={formData.Status}
                  onChange={(value) => handleChange('Status', value)}
                  options={statusOptions}
                  placeholder="Select Status"
                  className={errors.Status ? 'border-red-500' : ''}
                />
                {errors.Status && (
                  <p className="mt-1 text-sm text-red-500">{errors.Status}</p>
                )}
              </div>
              <div>
                <Label htmlFor="Price">Price *</Label>
                <Input
                  id="Price"
                  type="text"
                  value={formData.Price}
                  onChange={(e) => handleChange('Price', e.target.value)}
                  placeholder="Enter price (e.g., $500,000)"
                  className={errors.Price ? 'border-red-500' : ''}
                />
                {errors.Price && (
                  <p className="mt-1 text-sm text-red-500">{errors.Price}</p>
                )}
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <h4 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">Location</h4>
            <Address
              value={formData.Location}
              onSave={(address) => handleChange('Location', address)}
              error={errors.Location}
              label="Location *"
            />
          </div>

          {/* Property Details */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <h4 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">Property Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="Width">Width</Label>
                <Input
                  id="Width"
                  type="text"
                  value={formData.Width}
                  onChange={(e) => handleChange('Width', e.target.value)}
                  placeholder="Enter width"
                  className={errors.Width ? 'border-red-500' : ''}
                />
                {errors.Width && (
                  <p className="mt-1 text-sm text-red-500">{errors.Width}</p>
                )}
              </div>
              <div>
                <Label htmlFor="Length">Length</Label>
                <Input
                  id="Length"
                  type="text"
                  value={formData.Length}
                  onChange={(e) => handleChange('Length', e.target.value)}
                  placeholder="Enter length"
                  className={errors.Length ? 'border-red-500' : ''}
                />
                {errors.Length && (
                  <p className="mt-1 text-sm text-red-500">{errors.Length}</p>
                )}
              </div>
              <div>
                <Label htmlFor="Bedrooms">Bedrooms</Label>
                <Input
                  id="Bedrooms"
                  type="number"
                  value={formData.Bedrooms}
                  onChange={(e) => handleChange('Bedrooms', e.target.value)}
                  placeholder="Number of bedrooms"
                  className={errors.Bedrooms ? 'border-red-500' : ''}
                />
                {errors.Bedrooms && (
                  <p className="mt-1 text-sm text-red-500">{errors.Bedrooms}</p>
                )}
              </div>
              <div>
                <Label htmlFor="Bathrooms">Bathrooms</Label>
                <Input
                  id="Bathrooms"
                  type="number"
                  value={formData.Bathrooms}
                  onChange={(e) => handleChange('Bathrooms', e.target.value)}
                  placeholder="Number of bathrooms"
                  className={errors.Bathrooms ? 'border-red-500' : ''}
                />
                {errors.Bathrooms && (
                  <p className="mt-1 text-sm text-red-500">{errors.Bathrooms}</p>
                )}
              </div>
              <div>
                <Label htmlFor="YearBuilt">Year Built</Label>
                <Input
                  id="YearBuilt"
                  type="number"
                  value={formData.YearBuilt}
                  onChange={(e) => handleChange('YearBuilt', e.target.value)}
                  placeholder="Year property was built"
                  className={errors.YearBuilt ? 'border-red-500' : ''}
                />
                {errors.YearBuilt && (
                  <p className="mt-1 text-sm text-red-500">{errors.YearBuilt}</p>
                )}
              </div>
            </div>
          </div>

          {/* Features & Description */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <h4 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">Features & Description</h4>
            <div className="space-y-6">
              <div>
                <Label htmlFor="Description">Description *</Label>
                <TextArea
                  value={formData.Description}
                  onChange={(value) => handleChange('Description', value)}
                  placeholder="Enter property description"
                  rows={4}
                  className={errors.Description ? 'border-red-500' : ''}
                />
                {errors.Description && (
                  <p className="mt-1 text-sm text-red-500">{errors.Description}</p>
                )}
              </div>
              <div>
                <Label htmlFor="Features">Features & Amenities</Label>
                <TextArea
                  value={formData.Features}
                  onChange={(value) => handleChange('Features', value)}
                  placeholder="Enter property features and amenities (e.g., Pool, Gym, Parking, etc.)"
                  rows={3}
                  className={errors.Features ? 'border-red-500' : ''}
                />
                {errors.Features && (
                  <p className="mt-1 text-sm text-red-500">{errors.Features}</p>
                )}
              </div>
            </div>
          </div>

          {/* Property Photos */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <h4 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">Property Photos</h4>
            <PhotoUpload
              photos={photos}
              onPhotosChange={handlePhotosChange}
            />
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Property'}
            </Button>
          </div>
        </form>
      </ComponentCard>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        statusCode={200}
        message="The property profile has been successfully added to the system."
        buttonText="Back to Property List"
      />
      {/* Error Modal */}
      <SuccessModal
        isOpen={errorModal.open}
        onClose={() => setErrorModal({ open: false })}
        statusCode={errorModal.statusCode}
        message={errorModal.message}
        buttonText="Okay, Got It"
      />
    </div>
  );
}
