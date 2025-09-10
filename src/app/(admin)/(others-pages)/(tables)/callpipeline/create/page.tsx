import LoadingOverlay from "@/components/ui/loading/LoadingOverlay";
"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import PhoneInput from "@/components/form/input/PhoneInput";
import { Modal } from "@/components/ui/modal";
import PaginatedSelectionModal from "@/components/common/PaginatedSelectionModal";
import { getUserFromToken } from "@/lib/api";

// Call Pipeline Creation Form Component
export default function CallPipelineCreateForm() {
  const router = useRouter();

  // Phone number formatting function
  const formatPhoneNumber = (phoneNumber: string): string => {
    if (!phoneNumber) return "(No Contact)";
    
    // Remove all non-digit characters
    const digits = phoneNumber.replace(/\D/g, "");
    
    // Only format if 9 or more digits
    if (digits.length >= 9) {
      // Handle different phone number formats
      if (digits.startsWith("855")) {
        // Already has country code
        const remaining = digits.slice(3);
        if (remaining.length >= 6) {
          return `(+855) ${remaining.slice(0, 3)}-${remaining.slice(3, 6)}-${remaining.slice(6)}`;
        }
      } else if (digits.length >= 9) {
        // Assume it's a local number, add Cambodia country code
        return `(+855) ${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
      }
    }
    
    // If less than 9 digits or formatting fails, return original
    return phoneNumber;
  };

  // Price formatting function
  const formatPrice = (price: number): string => {
    if (!price) return "Price not available";
    return `$${price.toLocaleString()}`;
  };

  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Call Pipeline", href: "/callpipeline" },
    { name: "Create Pipeline" },
  ];

  // Lead type for modal selection
  type MappedLead = {
    lead_id: string;
    full_name: string;
    primary_contact: string;
    original: Record<string, unknown>;
  };
  const [formData, setFormData] = useState({
    selectedLead: null as MappedLead | null,
    selectedProperty: null as MappedProperty | null,
    purpose: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Modal states
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showCreateLeadModal, setShowCreateLeadModal] = useState(false);
  const [showLeadSuccessModal, setShowLeadSuccessModal] = useState(false);

  // New Lead Creation States
  const [newLeadData, setNewLeadData] = useState({
    name: "",
    phoneNumber: "",
  });
  const [newLeadErrors, setNewLeadErrors] = useState<{ [key: string]: string }>({});
  const [isCreatingLead, setIsCreatingLead] = useState(false);
  const [createdLeadInfo, setCreatedLeadInfo] = useState<{ name: string; phone: string } | null>(null);

  // Lead API logic
  const [leadsData, setLeadsData] = useState<MappedLead[]>([]);
  const [isLeadLoading, setIsLeadLoading] = useState(false);

  // Lead pagination states
  const [leadCurrentPage, setLeadCurrentPage] = useState(1);
  const [leadTotalRows, setLeadTotalRows] = useState(0);
  const [leadSearchQuery, setLeadSearchQuery] = useState("");
  const [leadSearchType, setLeadSearchType] = useState("");
  const leadPageSize = 10;
  const fetchLeads = async (page?: number, search?: string, searchType?: string) => {
    setIsLeadLoading(true);
    try {
      const currentPage = page || leadCurrentPage;
      const currentSearch = search !== undefined ? search : leadSearchQuery;
      const currentSearchType = searchType !== undefined ? searchType : leadSearchType;
      
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      let baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      baseUrl = baseUrl.replace(/\/+$/, "");
      const endpoint = `${baseUrl}/lead/pagination`;
      const body = {
        page_number: String(currentPage),
        page_size: String(leadPageSize),
        search_type: currentSearchType,
        query_search: currentSearch,
      };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to fetch leads");
      const data = await res.json();
      let leadsArr: unknown[] = [];
      let totalRows = 0;
      
      if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0].data)) {
        leadsArr = data[0].data;
        totalRows = data[0].total_row || 0;
      } else if (Array.isArray(data?.data)) {
        leadsArr = data.data;
        totalRows = data.total_row || 0;
      } else if (Array.isArray(data?.results)) {
        leadsArr = data.results;
        totalRows = data.total_row || 0;
      }
      // Map to MappedLead format
      const mapped = leadsArr.map((lead) => {
        const l = lead as Record<string, unknown>;
        
        // Extract contact information
        let primaryContact = "";
        if (Array.isArray(l.contact_data)) {
          const allContacts = l.contact_data.flatMap((cd: { contact_values?: unknown[] }) =>
            Array.isArray(cd.contact_values) ? cd.contact_values : []
          );
          const primary = allContacts.find((v: unknown) => {
            const contact = v as { is_primary?: boolean; contact_number?: string };
            return contact.is_primary && contact.contact_number;
          });
          if (primary) {
            const typedPrimary = primary as { contact_number?: string };
            const rawNumber = String(typedPrimary.contact_number);
            // Format phone number to (+855) 000-000-0000
            primaryContact = formatPhoneNumber(rawNumber);
          } else if (allContacts.length > 0) {
            const firstContact = allContacts[0] as { contact_number?: string };
            const rawNumber = String(firstContact.contact_number || "");
            // Format phone number to (+855) 000-000-0000
            primaryContact = formatPhoneNumber(rawNumber);
          }
        }
        
        // Build full name
        const fullName = [l.first_name, l.last_name]
          .filter(Boolean)
          .join(" ")
          .trim();
          
        return {
          lead_id: String(l.lead_id || ""),
          full_name: fullName || "(No Name)",
          primary_contact: primaryContact || "(No Contact)",
          original: lead as Record<string, unknown>,
        };
      });
      
      setLeadsData(mapped);
      setLeadTotalRows(totalRows);
    } catch (err) {
      console.error("Lead API error:", err);
      setLeadsData([]);
      setLeadTotalRows(0);
    } finally {
      setIsLeadLoading(false);
    }
  };

  // Property type for modal selection
  type MappedProperty = {
    property_profile_id: number;
    property_type_name: string;
    project_name: string;
    price: number;
    original: Record<string, unknown>;
  };
  const [propertiesData, setPropertiesData] = useState<MappedProperty[]>([]);
  const [isPropertyLoading, setIsPropertyLoading] = useState(false);

  // Property pagination states
  const [propertyCurrentPage, setPropertyCurrentPage] = useState(1);
  const [propertyTotalRows, setPropertyTotalRows] = useState(0);
  const [propertySearchQuery, setPropertySearchQuery] = useState("");
  const [propertySearchType, setPropertySearchType] = useState("");
  const propertyPageSize = 10;
  const fetchProperties = async (page?: number, search?: string, searchType?: string) => {
    setIsPropertyLoading(true);
    try {
      const currentPage = page || propertyCurrentPage;
      const currentSearch = search !== undefined ? search : propertySearchQuery;
      const currentSearchType = searchType !== undefined ? searchType : propertySearchType;
      
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      let baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      baseUrl = baseUrl.replace(/\/+$/, "");
      const endpoint = `${baseUrl}/property-profile/pagination`;
      const body = {
        page_number: String(currentPage),
        page_size: String(propertyPageSize),
        search_type: currentSearchType,
        query_search: currentSearch,
      };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to fetch properties");
      const data = await res.json();
      let propertyArr: unknown[] = [];
      let totalRows = 0;
      
      if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0].data)) {
        propertyArr = data[0].data;
        totalRows = data[0].total_row || 0;
      } else if (Array.isArray(data?.data)) {
        propertyArr = data.data;
        totalRows = data.total_row || 0;
      } else if (Array.isArray(data?.results)) {
        propertyArr = data.results;
        totalRows = data.total_row || 0;
      }
      // Map to MappedProperty
      const mapped = propertyArr.map((property) => {
        const p = property as Record<string, unknown>;
        return {
          property_profile_id: p.property_profile_id as number,
          property_type_name: p.property_type_name as string,
          project_name: p.project_name as string,
          price: p.price as number,
          original: property as Record<string, unknown>,
        };
      });
      setPropertiesData(mapped);
      setPropertyTotalRows(totalRows);
    } catch (err) {
      console.error("Property API error:", err);
      setPropertiesData([]);
      setPropertyTotalRows(0);
    } finally {
      setIsPropertyLoading(false);
    }
  };

  // New Lead Creation Functions
  const handleNewLeadChange = (field: keyof typeof newLeadData, value: string) => {
    setNewLeadData((prev) => ({ ...prev, [field]: value }));
    if (newLeadErrors[field]) {
      setNewLeadErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateNewLead = () => {
    const errors: { [key: string]: string } = {};
    if (!newLeadData.name.trim()) errors.name = "Name is required.";
    if (!newLeadData.phoneNumber.trim()) errors.phoneNumber = "Phone number is required.";
    setNewLeadErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateNewLead = async () => {
    if (!validateNewLead()) return;
    
    console.log("=== CREATE NEW LEAD DEBUG START ===");
    console.log("Form data:", newLeadData);
    
    setIsCreatingLead(true);
    try {
      // Get logged-in user information
      const currentUser = getUserFromToken();
      console.log("Current user from token:", currentUser);
      
      if (!currentUser?.user_id) {
        throw new Error("Unable to get current user information. Please log in again.");
      }
      
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      let baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      baseUrl = baseUrl.replace(/\/+$/, "");
      
      console.log("API Base URL:", baseUrl);
      console.log("Token available:", !!token);
      console.log("User ID:", currentUser.user_id);
      
      // Split name into first and last name
      const nameParts = newLeadData.name.trim().split(" ");
      const firstName = nameParts[0] || "";
      let lastName = nameParts.slice(1).join(" ") || "";
      
      // If no last name provided, use a space to ensure we have both first and last name
      if (!lastName) {
        lastName = " ";
        console.log("No last name provided, using space");
      }
      
      console.log("Name parts:", { firstName, lastName });
      
      // Create payload with minimal required data and placeholders
      const leadPayload = {
        first_name: firstName,
        last_name: lastName,
        gender_id: "1", // Default to Male
        customer_type_id: "1", // Default customer type
        lead_source_id: "1", // Default lead source
        village_id: "999999", // Placeholder village ID that exists in DB
        business_id: "1", // Default business
        initial_staff_id: String(currentUser.user_id), // Current logged-in user ID as string
        current_staff_id: String(currentUser.user_id), // Current logged-in user ID as string
        date_of_birth: "1990-01-01", // Default DOB
        email: `${firstName.toLowerCase()}@placeholder.com`, // Placeholder email
        occupation: "N/A", // Placeholder occupation
        home_address: "N/A", // Placeholder address
        street_address: "N/A", // Placeholder address
        biz_description: null,
        relationship_date: new Date().toISOString().split('T')[0], // Today's date
        remark: "Created from Call Pipeline - Quick Creation",
        photo_url: null,
        contact_data: [
          {
            channel_type_id: "3", // Should be 3
            contact_values: [
              {
                user_name: `${firstName} ${lastName}`.trim(), // Use full name as requested
                contact_number: newLeadData.phoneNumber.startsWith("+855") 
                  ? newLeadData.phoneNumber.slice(4) // Remove +855 prefix to get raw digits like 012512512
                  : newLeadData.phoneNumber.replace(/\D/g, ""), // Remove all non-digits as fallback
                remark: "Primary contact",
                is_primary: true,
              }
            ]
          }
        ],
      };

      console.log("Lead payload:", JSON.stringify(leadPayload, null, 2));

      const response = await fetch(`${baseUrl}/lead/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(leadPayload),
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Response error text:", errorText);
        throw new Error(`Failed to create lead: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log("API Response:", JSON.stringify(result, null, 2));
      
      // Success! The API returned 200, so lead was created successfully
      console.log("Lead created successfully");
      
      // Try to extract lead data from different possible response structures
      let createdLead = null;
      
      if (Array.isArray(result) && result.length > 0) {
        // Structure: [{ statusCode: 200, data: {...} }] or [{ data: {...} }]
        createdLead = result[0].data || result[0];
      } else if (result?.data) {
        // Structure: { statusCode: 200, data: {...} } or { data: {...} }
        createdLead = result.data;
      } else {
        // Structure: { lead_id: "...", ... } (direct lead object)
        createdLead = result;
      }
      
      console.log("Extracted created lead:", createdLead);
      
      // Safely extract lead_id with fallback
      const leadId = createdLead?.lead_id || createdLead?.id || `temp_${Date.now()}`;
      console.log("Extracted lead ID:", leadId);
      
      const newMappedLead = {
        lead_id: String(leadId),
        full_name: `${firstName} ${lastName}`.trim(),
        primary_contact: newLeadData.phoneNumber,
        original: createdLead,
      };
      
      console.log("Mapped lead for selection:", newMappedLead);
        
        // Select the newly created lead
        handleChange("selectedLead", newMappedLead);
        
        // Store created lead info for success modal
        setCreatedLeadInfo({
          name: `${firstName} ${lastName}`.trim(),
          phone: newLeadData.phoneNumber
        });
        
        // Reset form and close create modal, then show success modal
        setNewLeadData({ name: "", phoneNumber: "" });
        setNewLeadErrors({});
        setShowCreateLeadModal(false);
        setShowLeadSuccessModal(true);
        
        console.log("=== CREATE NEW LEAD SUCCESS ===");
    } catch (error) {
      console.error('=== CREATE NEW LEAD ERROR ===');
      console.error('Error details:', error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      alert(`Failed to create lead: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreatingLead(false);
      console.log("=== CREATE NEW LEAD DEBUG END ===");
    }
  };

  const handleLeadSuccessModalClose = () => {
    setShowLeadSuccessModal(false);
    setCreatedLeadInfo(null);
    
    // Refresh leads data to show the newly created lead
    console.log("Refreshing leads data after successful creation...");
    fetchLeads();
    
    // Reopen the lead selection modal to show the updated list
    setShowLeadModal(true);
  };

  const handleChange = (
    field: keyof typeof formData,
    value: MappedLead | MappedProperty | string | null
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.selectedLead) newErrors.selectedLead = "Lead selection is required.";
    if (!formData.selectedProperty) newErrors.selectedProperty = "Property selection is required.";
    if (!formData.purpose.trim()) newErrors.purpose = "Purpose is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Lead pagination handlers
  const handleLeadPageChange = (page: number) => {
    setLeadCurrentPage(page);
    fetchLeads(page);
  };

  const handleLeadSearch = (query: string, type: string) => {
    setLeadSearchQuery(query);
    setLeadSearchType(type);
    setLeadCurrentPage(1);
    fetchLeads(1, query, type);
  };

  // Property pagination handlers
  const handlePropertyPageChange = (page: number) => {
    setPropertyCurrentPage(page);
    fetchProperties(page);
  };

  const handlePropertySearch = (query: string, type: string) => {
    setPropertySearchQuery(query);
    setPropertySearchType(type);
    setPropertyCurrentPage(1);
    fetchProperties(1, query, type);
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      setIsSubmitting(true);
      
      // Get current user from token
      const currentUser = getUserFromToken();
      if (!currentUser?.user_id) {
        throw new Error("Unable to get current user information. Please log in again.");
      }
      
      // Build payload for API
      const payload = {
        lead_id: String((formData.selectedLead?.original as { lead_id?: string })?.lead_id ?? ""),
        property_profile_id: String((formData.selectedProperty?.original as { property_profile_id?: number })?.property_profile_id ?? ""),
        status_id: "1",
        purpose: String(formData.purpose ?? ""),
        follow_up_date: null,
        fail_reason: null,
        is_follow_up: true,
        p_call_log_detail: [],
        created_by: String(currentUser.user_id),
      };
      
      console.log("=== CALL PIPELINE CREATE DEBUG START ===");
      console.log("Current user:", currentUser);
      console.log("API Payload:", JSON.stringify(payload, null, 2));
      console.log("=== CALL PIPELINE CREATE DEBUG END ===");
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const response = await fetch(`${apiBase}/call-log/create`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        setShowSuccessModal(true);
      } else {
        throw new Error("Failed to create call pipeline");
      }
    } catch (error) {
      console.error('Error creating call pipeline:', error);
      alert("Failed to save call pipeline. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("/callpipeline");
  };

  const handleCreateAnother = () => {
    setShowSuccessModal(false);
    // Reset form data
    setFormData({
      selectedLead: null,
      selectedProperty: null,
      purpose: "",
    });
    setErrors({});
  };

  const handleGoToPipeline = () => {
    setShowSuccessModal(false);
    router.push("/callpipeline");
  };

  return (
    <div>
      <PageBreadcrumb crumbs={breadcrumbs} />
      <div className="space-y-6">
        {/* Call Pipeline Creation Form */}
        <ComponentCard title="Create New Call Pipeline">
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
            {/* Lead Selection */}
            <div>
              <Label htmlFor="selectedLead">Select Lead *</Label>
              <div className="mt-1">
                {formData.selectedLead ? (
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                    <div>
                      <div className="font-medium text-gray-800 dark:text-white">
                        {formData.selectedLead.full_name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {formData.selectedLead.primary_contact}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowLeadModal(true);
                        fetchLeads();
                      }}
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowLeadModal(true);
                      fetchLeads();
                    }}
                    className="w-full justify-center"
                  >
                    Choose Lead
                  </Button>
                )}
              </div>
              {errors.selectedLead && (
                <p className="text-sm text-red-500 mt-1">{errors.selectedLead}</p>
              )}
            </div>

            {/* Property Selection */}
            <div>
              <Label htmlFor="selectedProperty">Select Property *</Label>
              <div className="mt-1">
                {formData.selectedProperty ? (
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                    <div>
                      <div className="font-medium text-gray-800 dark:text-white">
                        {formData.selectedProperty.property_profile_id}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {formData.selectedProperty.property_type_name} •{" "}
                        {formData.selectedProperty.project_name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {formatPrice(formData.selectedProperty.price)}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowPropertyModal(true);
                        fetchProperties();
                      }}
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPropertyModal(true);
                      fetchProperties();
                    }}
                    className="w-full justify-center"
                  >
                    Choose Property
                  </Button>
                )}
              </div>
              {errors.selectedProperty && (
                <p className="text-sm text-red-500 mt-1">{errors.selectedProperty}</p>
              )}
            </div>
          </div>

          {/* Purpose - Full width */}
          <div className="mt-5">
            <Label htmlFor="purpose">Purpose *</Label>
            <TextArea
              placeholder="Enter call pipeline purpose..."
              value={formData.purpose}
              onChange={(value) => handleChange("purpose", value)}
              rows={4}
            />
            {errors.purpose && <p className="text-sm text-red-500 mt-1">{errors.purpose}</p>}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Pipeline"}
            </Button>
          </div>
        </ComponentCard>
      </div>

      {/* Selection Modals */}
      <PaginatedSelectionModal
        isOpen={showLeadModal}
        onClose={() => setShowLeadModal(false)}
        onSelect={(item) => {
          const selectedLead = item as MappedLead;
          handleChange("selectedLead", selectedLead);
        }}
        title="Select Lead"
        data={leadsData}
        columns={[
          { key: "lead_id", label: "ID" },
          { key: "full_name", label: "Name" },
          { key: "primary_contact", label: "Primary Contact" },
        ]}
        searchPlaceholder="Search leads..."
        isLoading={isLeadLoading}
        currentPage={leadCurrentPage}
        totalRows={leadTotalRows}
        pageSize={leadPageSize}
        onPageChange={handleLeadPageChange}
        onSearch={handleLeadSearch}
        searchQuery={leadSearchQuery}
        searchType={leadSearchType}
        extraActions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCreateLeadModal(true)}
            className="ml-3"
          >
            + Create New Lead
          </Button>
        }
      />

      <PaginatedSelectionModal
        isOpen={showPropertyModal}
        onClose={() => setShowPropertyModal(false)}
        onSelect={(property) => handleChange("selectedProperty", property)}
        title="Select Property"
        data={propertiesData}
        columns={[
          { key: "property_profile_id", label: "ID" },
          { key: "property_type_name", label: "Type" },
          { key: "project_name", label: "Project" },
          { key: "price", label: "Price" },
        ]}
        searchPlaceholder="Search properties..."
        isLoading={isPropertyLoading}
        currentPage={propertyCurrentPage}
        totalRows={propertyTotalRows}
        pageSize={propertyPageSize}
        onPageChange={handlePropertyPageChange}
        onSearch={handlePropertySearch}
        searchQuery={propertySearchQuery}
        searchType={propertySearchType}
        extraActions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => router.push("/property/create")}
            className="ml-3"
          >
            + Create New Property
          </Button>
        }
      />

      {/* Create New Lead Modal */}
      <Modal
        isOpen={showCreateLeadModal}
        onClose={() => {
          setShowCreateLeadModal(false);
          setNewLeadData({ name: "", phoneNumber: "" });
          setNewLeadErrors({});
        }}
        className="max-w-md p-6"
      >
        <div>
          <h3 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white">
            Create New Lead
          </h3>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            Enter the basic information to quickly create a new lead.
          </p>

          <div className="space-y-4">
            {/* Name Field */}
            <div>
              <Label htmlFor="newLeadName">Full Name *</Label>
              <Input
                id="newLeadName"
                type="text"
                placeholder="Enter full name"
                value={newLeadData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNewLeadChange("name", e.target.value)}
              />
              {newLeadErrors.name && (
                <p className="text-sm text-red-500 mt-1">{newLeadErrors.name}</p>
              )}
            </div>

            {/* Phone Number Field */}
            <div>
              <PhoneInput
                id="newLeadPhone"
                label="Phone Number"
                placeholder="000-000-0000"
                value={newLeadData.phoneNumber}
                onChange={(value) => handleNewLeadChange("phoneNumber", value)}
                error={!!newLeadErrors.phoneNumber}
                required
              />
              {newLeadErrors.phoneNumber && (
                <p className="text-sm text-red-500 mt-1">{newLeadErrors.phoneNumber}</p>
              )}
            </div>

            {/* Info Note */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Note:</strong> Other details like address, email, and date of birth will be set with placeholder values. You can edit them later in the Lead management section.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCreateLeadModal(false);
                setNewLeadData({ name: "", phoneNumber: "" });
                setNewLeadErrors({});
              }}
              disabled={isCreatingLead}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleCreateNewLead}
              disabled={isCreatingLead}
            >
              {isCreatingLead ? "Creating..." : "Create Lead"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        className="max-w-md p-6"
      >
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full dark:bg-green-900/20">
            <svg
              className="w-6 h-6 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
            Call Pipeline Created Successfully!
          </h3>

          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            Your new call pipeline has been created and is ready for use. What would you like to do next?
          </p>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-3">
              <Button
                variant="outline"
                onClick={handleCreateAnother}
                className="flex-1"
              >
                Create Another Pipeline
              </Button>
              <Button
                variant="primary"
                onClick={handleGoToPipeline}
                className="flex-1"
              >
                Go to Call Pipeline
              </Button>
            </div>
            
            {/* Loan Payment Schedule Button */}
            <div className="border-t pt-3 mt-2">
              <Button
                variant="outline"
                onClick={() => {
                  const propertyPrice = formData.selectedProperty?.price || 0;
                  const params = new URLSearchParams({
                    propertyPrice: String(propertyPrice),
                    callPipelineId: 'new' // Since this is a new pipeline
                  });
                  router.push(`/callpipeline/payment_schedule?${params.toString()}`);
                }}
                className="w-full bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30"
              >
                📊 Generate Loan Payment Schedule
              </Button>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                Calculate payment schedule based on selected property price
              </p>
            </div>
          </div>
        </div>
      </Modal>

      {/* Lead Creation Success Modal */}
      <Modal
        isOpen={showLeadSuccessModal}
        onClose={handleLeadSuccessModalClose}
        className="max-w-md p-6"
      >
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full dark:bg-green-900/20">
            <svg
              className="w-6 h-6 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
            Lead Created Successfully!
          </h3>

          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            {createdLeadInfo && (
              <>
                New lead &ldquo;<strong>{createdLeadInfo.name}</strong>&rdquo; with phone number <strong>{createdLeadInfo.phone}</strong> has been created and selected for this pipeline.
              </>
            )}
          </p>

          <div className="flex justify-center">
            <Button
              variant="primary"
              onClick={handleLeadSuccessModalClose}
              className="px-8"
            >
              Continue
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
