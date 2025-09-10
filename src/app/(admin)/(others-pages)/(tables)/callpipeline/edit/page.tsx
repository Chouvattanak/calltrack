"use client";
import React, { useState, useEffect, useCallback } from "react";
import LoadingOverlay from "@/components/ui/loading/LoadingOverlay";
import { useRouter } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import PhoneInput from "@/components/form/input/PhoneInput";
import { Modal } from "@/components/ui/modal";
import SuccessModal from "@/components/ui/modal/SuccessModal";
import PaginatedSelectionModal from "@/components/common/PaginatedSelectionModal";
import { getUserFromToken } from "@/lib/api";

// Call Pipeline Edit Form Component
export default function CallPipelineEditForm() {
  // --- State Definitions ---
  // Lead, Staff, Property types
  type MappedLead = {
    lead_id: string;
    full_name: string; // Changed from lead_name to full_name for PaginatedSelectionModal compatibility
    primary_contact: string;
    original: Record<string, unknown>;
  };
  type MappedStaff = {
    staff_id: string;
    full_name: string;
    position: string;
    original: Record<string, unknown>;
  };
  type MappedProperty = {
    property_profile_id: string;
    property_profile_name: string;
    property_type_name: string;
    project_name: string;
    price: string;
    original: Record<string, unknown>;
  };

  // Phone number formatting function
  const formatPhoneNumber = (phoneNumber: string): string => {
    if (!phoneNumber) return "(No Contact)";
    
    // Remove all non-digit characters
    const digits = phoneNumber.replace(/\D/g, "");
    
    // Only format if length is >= 9 digits
    if (digits.length >= 9) {
      // Handle different phone number formats
      if (digits.startsWith("855")) {
        // Already has country code
        const remaining = digits.slice(3);
        if (remaining.length >= 6) {
          return `(+855) ${remaining.slice(0, 3)}-${remaining.slice(3, 6)}-${remaining.slice(6)}`;
        }
      } else {
        // Assume it's a local number, add Cambodia country code
        return `(+855) ${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
      }
    }
    
    // If length < 9 or formatting fails, return original
    return phoneNumber;
  };

  // Price formatting function
  const formatPrice = (price: string | number): string => {
    if (!price) return "Price not available";
    
    // Convert to number and format with commas
    const numPrice = typeof price === 'string' ? parseFloat(price.replace(/[^0-9.]/g, '')) : price;
    
    if (isNaN(numPrice)) return "Price not available";
    
    return `$${numPrice.toLocaleString('en-US')}`;
  };

  const router = useRouter();

  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Call Pipeline", href: "/callpipeline" },
    { name: "Edit Pipeline" },
  ];

  // Form data
  const [formData, setFormData] = useState<{
    selectedLead: MappedLead | null;
    selectedStaff: MappedStaff | null;
    selectedProperty: MappedProperty | null;
    purpose: string;
  }>({
    selectedLead: null,
    selectedStaff: null,
    selectedProperty: null,
    purpose: "",
  });

  // Error state
  const [errors, setErrors] = useState<{
    selectedLead?: string;
    selectedStaff?: string;
    selectedProperty?: string;
    purpose?: string;
  }>({});

  // Modal visibility
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalStatus, setSuccessModalStatus] = useState<number|undefined>(undefined);
  const [successModalMessage, setSuccessModalMessage] = useState<string>("");
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

  // Data arrays for selection modals
  const [mappedLeads, setMappedLeads] = useState<MappedLead[]>([]);
  const [staffData, setStaffData] = useState<MappedStaff[]>([]);
  const [propertiesData, setPropertiesData] = useState<MappedProperty[]>([]);

  // Loading states for modals
  const [isLeadLoading, setIsLeadLoading] = useState(false);
  const [isStaffLoading, setIsStaffLoading] = useState(false);
  const [isPropertyLoading, setIsPropertyLoading] = useState(false);

  // Lead pagination states
  const [leadCurrentPage, setLeadCurrentPage] = useState(1);
  const [leadTotalRows, setLeadTotalRows] = useState(0);
  const [leadSearchQuery, setLeadSearchQuery] = useState("");
  const [leadSearchType, setLeadSearchType] = useState("");
  const leadPageSize = 10;

  // Staff pagination states
  const [staffCurrentPage, setStaffCurrentPage] = useState(1);
  const [staffTotalRows, setStaffTotalRows] = useState(0);
  const [staffSearchQuery, setStaffSearchQuery] = useState("");
  const [staffSearchType, setStaffSearchType] = useState("");
  const staffPageSize = 10;

  // Property pagination states
  const [propertyCurrentPage, setPropertyCurrentPage] = useState(1);
  const [propertyTotalRows, setPropertyTotalRows] = useState(0);
  const [propertySearchQuery, setPropertySearchQuery] = useState("");
  const [propertySearchType, setPropertySearchType] = useState("");
  const propertyPageSize = 10;

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pipeline Status state
  const [pipelineStatus, setPipelineStatus] = useState<string>("");

  // --- Initial Loading State ---
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [callLogId, setCallLogId] = useState<string>("");

  // --- Handler Functions ---
  const handleChange = (field: string, value: string | MappedLead | MappedStaff | MappedProperty | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleCancel = () => {
    router.push("/callpipeline");
  };

  const handleSave = async () => {
    // Example validation
    const newErrors: typeof errors = {};
    if (!formData.selectedLead) newErrors.selectedLead = "Lead is required.";
    if (!formData.selectedStaff) newErrors.selectedStaff = "Staff is required.";
    if (!formData.selectedProperty) newErrors.selectedProperty = "Property is required.";
    if (!formData.purpose.trim()) newErrors.purpose = "Purpose is required.";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    // TypeScript null checks (should be satisfied by validation above)
    if (!formData.selectedLead || !formData.selectedStaff || !formData.selectedProperty) {
      console.error("Missing required form data");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      let baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      baseUrl = baseUrl.replace(/\/+$/, "");
      const endpoint = `${baseUrl}/call-log/update`;

      // Only allow status_id to be changed to 8 (Success) or 9 (Fail) by user action, otherwise keep the pre-populated one
      let status_id = pipelineStatus;
      if (status_id !== "8" && status_id !== "9") {
        // Use the pre-populated status_id from the API (already set in pipelineStatus on mount)
        status_id = pipelineStatus;
      }

      const updateBody = {
        call_log_id: callLogId,
        lead_id: formData.selectedLead.lead_id,
        property_profile_id: formData.selectedProperty.property_profile_id,
        status_id: status_id,
        purpose: formData.purpose.trim(),
        fail_reason: null,
        follow_up_date: null,
        is_follow_up: true,
        is_active: true,
        p_call_log_detail: [],
        updated_by: formData.selectedStaff.staff_id,
      };

      console.log("Update API endpoint:", endpoint);
      console.log("Update API request body:", updateBody);

      const res = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(updateBody),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Update API error response:", errorData);
        throw new Error(`Failed to update call pipeline: ${res.status} ${res.statusText}`);
      }

      const responseData = await res.json();
      console.log("Update API success response:", responseData);

      setSuccessModalStatus(200);
      setSuccessModalMessage("Call Pipeline Updated Successfully! Your call pipeline changes have been saved. What would you like to do next?");
      setShowSuccessModal(true);
    } catch (err) {
      console.error("Update call pipeline error:", err);
      setSuccessModalStatus(400);
      setSuccessModalMessage("Failed to update call pipeline. Please try again.");
      setShowSuccessModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToPipeline = () => {
    setShowSuccessModal(false);
    router.push("/callpipeline");
  };

  // --- New Lead Creation Handlers ---
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
    
    if (!newLeadData.name.trim()) {
      errors.name = "Name is required.";
    }
    
    if (!newLeadData.phoneNumber.trim()) {
      errors.phoneNumber = "Phone number is required.";
    }
    
    setNewLeadErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateNewLead = async () => {
    if (!validateNewLead()) return;

    setIsCreatingLead(true);
    console.log("Form data:", newLeadData);

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
            channel_type_id: "3", // Updated to 3 as requested
            contact_values: [
              {
                user_name: `${firstName} ${lastName}`.trim(), // Use full name as requested
                contact_number: newLeadData.phoneNumber,
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
        throw new Error(`Failed to create lead: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log("✅ Lead created successfully:", responseData);
      
      setCreatedLeadInfo({ name: newLeadData.name, phone: newLeadData.phoneNumber });
      setNewLeadData({ name: "", phoneNumber: "" });
      setNewLeadErrors({});
      setShowCreateLeadModal(false);
      setShowLeadSuccessModal(true);
    } catch (error) {
      console.error("❌ Lead creation error:", error);
      setNewLeadErrors({ name: error instanceof Error ? error.message : "Failed to create lead" });
    } finally {
      setIsCreatingLead(false);
    }
  };

  const handleLeadSuccessModalClose = () => {
    setShowLeadSuccessModal(false);
    setCreatedLeadInfo(null);
    // Refresh the lead list
    fetchLeads();
  };

  // --- Lead Pagination Handlers ---
  const handleLeadPageChange = (page: number) => {
    setLeadCurrentPage(page);
    fetchLeads(page, leadSearchQuery, leadSearchType);
  };

  const handleLeadSearch = (query: string, searchType: string) => {
    setLeadSearchQuery(query);
    setLeadSearchType(searchType);
    setLeadCurrentPage(1);
    fetchLeads(1, query, searchType);
  };

  // --- Staff Pagination Handlers ---
  const handleStaffPageChange = (page: number) => {
    setStaffCurrentPage(page);
    fetchStaff(page, staffSearchQuery, staffSearchType);
  };

  const handleStaffSearch = (query: string, searchType: string) => {
    setStaffSearchQuery(query);
    setStaffSearchType(searchType);
    setStaffCurrentPage(1);
    fetchStaff(1, query, searchType);
  };

  // --- Property Pagination Handlers ---
  const handlePropertyPageChange = (page: number) => {
    setPropertyCurrentPage(page);
    fetchProperties(page, propertySearchQuery, propertySearchType);
  };

  const handlePropertySearch = (query: string, searchType: string) => {
    setPropertySearchQuery(query);
    setPropertySearchType(searchType);
    setPropertyCurrentPage(1);
    fetchProperties(1, query, searchType);
  };

  // --- Fetch Functions for Modals ---
  const fetchPropertyDetails = useCallback(async (propertyProfileId: string): Promise<MappedProperty | null> => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      let baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      baseUrl = baseUrl.replace(/\/+$/, "");
      const endpoint = `${baseUrl}/property-profile/pagination`;
      const body = {
        page_number: "1",
        page_size: "10",
        search_type: "property_profile_id",
        query_search: propertyProfileId,
      };
      console.log("Property Details API endpoint:", endpoint);
      console.log("Property Details API request body:", body);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to fetch property details");
      const data = await res.json();
      console.log("Property Details API response:", data);
      let propertyArr: unknown[] = [];
      if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0].data)) {
        propertyArr = data[0].data;
      } else if (Array.isArray(data?.data)) {
        propertyArr = data.data;
      } else if (Array.isArray(data?.results)) {
        propertyArr = data.results;
      }
      
      if (propertyArr.length > 0) {
        const propertyData = propertyArr[0] as Record<string, unknown>;
        return {
          property_profile_id: String(propertyData.property_profile_id || ""),
          property_profile_name: String(propertyData.property_profile_name || propertyData.property_name || "(No Property Name)"),
          property_type_name: String(propertyData.property_type_name || ""),
          project_name: String(propertyData.project_name || ""),
          price: String(propertyData.price || ""),
          original: propertyData,
        };
      }
      return null;
    } catch (err) {
      console.error("Property Details API error:", err);
      return null;
    }
  }, []);

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
      console.log("Lead API endpoint:", endpoint);
      console.log("Lead API request body:", body);
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
      console.log("Lead API response:", data);
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
      
      // Map to MappedLead format for edit page
      const mapped = leadsArr.map((lead) => {
        const leadData = lead as Record<string, unknown>;
        const leadFullName = [leadData.first_name, leadData.last_name].filter(Boolean).join(" ").trim();
        let primaryContact = "";
        if (Array.isArray(leadData.contact_data)) {
          const allContacts = leadData.contact_data.flatMap((cd: Record<string, unknown>) => Array.isArray(cd.contact_values) ? cd.contact_values : []);
          const primary = allContacts.find((v: Record<string, unknown>) => v.is_primary && v.contact_number);
          if (primary) {
            const rawNumber = String(primary.contact_number);
            // Format phone number to (+855) 000-000-0000
            primaryContact = formatPhoneNumber(rawNumber);
          } else if (allContacts.length > 0) {
            const rawNumber = String(allContacts[0].contact_number || "");
            // Format phone number to (+855) 000-000-0000
            primaryContact = formatPhoneNumber(rawNumber);
          }
        }
        return {
          lead_id: String(leadData.lead_id || ""),
          full_name: String(leadData.lead_name || leadFullName || "(No Name)"), // Use full_name for compatibility
          primary_contact: primaryContact || "(No Contact)",
          original: leadData,
        };
      });
      setMappedLeads(mapped);
      setLeadTotalRows(totalRows);
    } catch (err) {
      console.error("Lead API error:", err);
      setMappedLeads([]);
      setLeadTotalRows(0);
    } finally {
      setIsLeadLoading(false);
    }
  };

  const fetchStaff = async (page?: number, search?: string, searchType?: string) => {
    setIsStaffLoading(true);
    try {
      const currentPage = page || staffCurrentPage;
      const currentSearch = search !== undefined ? search : staffSearchQuery;
      const currentSearchType = searchType !== undefined ? searchType : staffSearchType;
      
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      let baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      baseUrl = baseUrl.replace(/\/+$/, "");
      const endpoint = `${baseUrl}/staff/pagination`;
      const body = {
        page_number: String(currentPage),
        page_size: String(staffPageSize),
        search_type: currentSearchType,
        query_search: currentSearch,
      };
      console.log("Staff API endpoint:", endpoint);
      console.log("Staff API request body:", body);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to fetch staff");
      const data = await res.json();
      console.log("Staff API response:", data);
      let staffArr: unknown[] = [];
      let totalRows = 0;
      
      if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0].data)) {
        staffArr = data[0].data;
        totalRows = data[0].total_row || 0;
      } else if (Array.isArray(data?.data)) {
        staffArr = data.data;
        totalRows = data.total_row || 0;
      } else if (Array.isArray(data?.results)) {
        staffArr = data.results;
        totalRows = data.total_row || 0;
      }
      
      // Map to MappedStaff format for edit page
      const mapped = staffArr.map((staff) => {
        const staffData = staff as Record<string, unknown>;
        const fullName = [staffData.first_name, staffData.last_name].filter(Boolean).join(" ").trim();
        return {
          staff_id: String(staffData.staff_id || ""),
          full_name: String(fullName || staffData.username || "(No Name)"),
          position: String(staffData.position || staffData.role || "(No Position)"),
          original: staffData,
        };
      });
      setStaffData(mapped);
      setStaffTotalRows(totalRows);
    } catch (err) {
      console.error("Staff API error:", err);
      setStaffData([]);
      setStaffTotalRows(0);
    } finally {
      setIsStaffLoading(false);
    }
  };

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
      console.log("Property API endpoint:", endpoint);
      console.log("Property API request body:", body);
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
      console.log("Property API response:", data);
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
      
      // Map to MappedProperty format for edit page
      const mapped = propertyArr.map((property) => {
        const propertyData = property as Record<string, unknown>;
        return {
          property_profile_id: String(propertyData.property_profile_id || ""),
          property_profile_name: String(propertyData.property_profile_name || propertyData.property_name || "(No Property Name)"),
          property_type_name: String(propertyData.property_type_name || ""),
          project_name: String(propertyData.project_name || ""),
          price: String(propertyData.price || ""),
          original: propertyData,
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

  // --- Fetch Call Log Data on Mount ---
  useEffect(() => {
    // Get callLogId from URL query parameter ?id=CL-000002
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id') || "";
    console.log("Extracted call log ID from URL query:", id);
    setCallLogId(id);

    // Check if we have pre-populated data from CallLogsTable
    const leadId = urlParams.get('leadId');
    const leadName = urlParams.get('leadName'); 
    const propertyId = urlParams.get('propertyId');
    const propertyName = urlParams.get('propertyName');
    const propertyPrice = urlParams.get('propertyPrice');
    const purpose = urlParams.get('purpose');
    const createdBy = urlParams.get('createdBy');
    const leadPhone = urlParams.get('leadPhone');

    // If we have pre-populated data, use it to avoid API call
    if (leadId && leadName && propertyId && propertyName) {
      console.log("Using pre-populated data from CallLogsTable");
      
      const mappedLead: MappedLead = {
        lead_id: leadId,
        full_name: leadName,
        primary_contact: formatPhoneNumber(leadPhone || ''),
        original: {},
      };

      const mappedStaff: MappedStaff = {
        staff_id: "", // Will be populated when staff modal is opened if needed
        full_name: createdBy || "(No Name)",
        position: "(No Position)",
        original: {},
      };

      const mappedProperty: MappedProperty = {
        property_profile_id: propertyId,
        property_profile_name: propertyName,
        property_type_name: "",
        project_name: "",
        price: propertyPrice || "",
        original: {},
      };

      setFormData({
        selectedLead: mappedLead,
        selectedStaff: mappedStaff,
        selectedProperty: mappedProperty,
        purpose: purpose || "",
      });

      setIsInitialLoading(false);
      console.log("Pre-populated form data:", {
        selectedLead: mappedLead,
        selectedStaff: mappedStaff,
        selectedProperty: mappedProperty,
        purpose: purpose || "",
      });
    }
  }, []);

  useEffect(() => {
    if (!callLogId) return;
    // Check if we already have pre-populated data (from URL params)
    const urlParams = new URLSearchParams(window.location.search);
    const hasPrePopulatedData = urlParams.get('leadId') && urlParams.get('leadName') && 
                                urlParams.get('propertyId') && urlParams.get('propertyName');
    if (hasPrePopulatedData) {
      console.log("Skipping API call - using pre-populated data from CallLogsTable");
      return;
    }
    console.log("No pre-populated data found, fetching from API...");
    const fetchCallLogData = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        let baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
        baseUrl = baseUrl.replace(/\/+$/, "");
        const endpoint = `${baseUrl}/call-log/pagination`;
        const body = {
          page_number: "1",
          page_size: "10",
          search_type: "call_log_id",
          query_search: callLogId,
        };
        console.log("Making API call to:", endpoint);
        console.log("Request body:", body);
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("Failed to fetch call log data");
        const data = await res.json();
        console.log("API Response:", data);
        let logArr = [];
        if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0].data)) {
          logArr = data[0].data;
        } else if (Array.isArray(data?.data)) {
          logArr = data.data;
        } else if (Array.isArray(data?.results)) {
          logArr = data.results;
        }
        console.log("Parsed logArr:", logArr);
        if (logArr.length > 0) {
          const log = logArr[0];
          console.log("Raw log object:", log);
          // The API response has a flat structure, not nested objects
          // Lead data is directly in the log object
          console.log("Lead fields:", {
            lead_id: log.lead_id,
            lead_name: log.lead_name,
          });
          // Get contact data from call_log_details
          // Get primary contact directly from parent level
          let primaryContact = log.primary_contact_number || "";
          const mappedLead: MappedLead = {
            lead_id: String(log.lead_id || ""),
            full_name: log.lead_name || "(No Name)",
            primary_contact: primaryContact || "(No Contact)",
            original: log,
          };
          console.log("Mapped lead:", mappedLead);
          // Staff data is also directly in the log object 
          console.log("Staff fields:", {
            created_by_name: log.created_by_name,
          });
          const mappedStaff: MappedStaff = {
            staff_id: "", // Not available in this response
            full_name: log.created_by_name || "(No Name)",
            position: "(No Position)", // Not available in this response
            original: log,
          };
          console.log("Mapped staff:", mappedStaff);
          // Property data is also directly in the log object
          console.log("Property fields:", {
            property_profile_id: log.property_profile_id,
            property_profile_name: log.property_profile_name,
          });
          // Fetch complete property details if we have a property_profile_id
          let mappedProperty: MappedProperty;
          if (log.property_profile_id) {
            const completeProperty = await fetchPropertyDetails(String(log.property_profile_id));
            if (completeProperty) {
              mappedProperty = completeProperty;
              console.log("Fetched complete property details:", mappedProperty);
            } else {
              // Fallback to basic property info
              mappedProperty = {
                property_profile_id: String(log.property_profile_id || ""),
                property_profile_name: log.property_profile_name || "(No Property Name)",
                property_type_name: "", // Not available in this response
                project_name: "", // Not available in this response  
                price: "", // Not available in this response
                original: log,
              };
            }
          } else {
            mappedProperty = {
              property_profile_id: "",
              property_profile_name: "(No Property Name)",
              property_type_name: "",
              project_name: "",
              price: "",
              original: log,
            };
          }
          console.log("Final mapped property:", mappedProperty);
          setFormData({
            selectedLead: mappedLead,
            selectedStaff: mappedStaff,
            selectedProperty: mappedProperty,
            purpose: log.purpose || "",
          });
          // Set pipeline status from call log status_id if available
          if (log.status_id) {
            setPipelineStatus(String(log.status_id));
          }
          console.log("Final formData set:", {
            selectedLead: mappedLead,
            selectedStaff: mappedStaff,
            selectedProperty: mappedProperty,
            purpose: log.purpose || "",
            status_id: log.status_id,
          });
        }
      } catch (err) {
        console.error("Call Log API error:", err);
      }
      setIsInitialLoading(false);
    };
    fetchCallLogData();
  }, [callLogId, fetchPropertyDetails]);

  if (isInitialLoading) {
    return <LoadingOverlay isLoading={true} />;
  }

  return (
    <div>
      <PageBreadcrumb crumbs={breadcrumbs} />
      <div className="space-y-6">
        {/* Call Pipeline Edit Form */}
        <ComponentCard title="Edit Call Pipeline">
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
            {/* Lead Selection */}
            <div>
              <Label htmlFor="selectedLead">Edit Lead *</Label>
              <div className="mt-1">
                {formData.selectedLead ? (
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                    <div>
                      <div className="font-medium text-gray-800 dark:text-white">
                        {formData.selectedLead.full_name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {formatPhoneNumber(formData.selectedLead.primary_contact)}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          router.push(`/lead/edit/${formData.selectedLead?.lead_id}`);
                        }}
                      >
                        Edit
                      </Button>
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

            {/* Staff Selection */}
            <div>
              <Label htmlFor="selectedStaff">Edit Staff *</Label>
              <div className="mt-1">
                {formData.selectedStaff ? (
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                    <div>
                      <div className="font-medium text-gray-800 dark:text-white">
                        {formData.selectedStaff.full_name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {formData.selectedStaff.position}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          router.push(`/staff/edit?id=${formData.selectedStaff?.staff_id}`);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowStaffModal(true);
                          fetchStaff();
                        }}
                      >
                        Change
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowStaffModal(true);
                      fetchStaff();
                    }}
                    className="w-full justify-center"
                  >
                    Choose Staff
                  </Button>
                )}
              </div>
              {errors.selectedStaff && (
                <p className="text-sm text-red-500 mt-1">{errors.selectedStaff}</p>
              )}
            </div>

            {/* Property Selection */}
            <div className="lg:col-span-2">
              <Label htmlFor="selectedProperty">Edit Property *</Label>
              <div className="mt-1">
                {formData.selectedProperty && formData.selectedProperty.property_profile_id !== '14' ? (
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                    <div>
                      <div className="font-medium text-gray-800 dark:text-white">
                        {formData.selectedProperty.property_profile_name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        ID: {formData.selectedProperty.property_profile_id}
                      </div>
                      {formData.selectedProperty.property_type_name && formData.selectedProperty.project_name && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {formData.selectedProperty.property_type_name} • {formData.selectedProperty.project_name}
                        </div>
                      )}
                      {formData.selectedProperty.price && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Price: {formatPrice(formData.selectedProperty.price)}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          router.push(`/property/edit?id=${formData.selectedProperty?.property_profile_id}`);
                        }}
                      >
                        Edit
                      </Button>
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
            <Label htmlFor="purpose">Edit Purpose *</Label>
            <TextArea
              placeholder="Update call pipeline purpose..."
              value={formData.purpose}
              onChange={(value) => handleChange("purpose", value)}
              rows={4}
            />
            {errors.purpose && <p className="text-sm text-red-500 mt-1">{errors.purpose}</p>}
          </div>

          {/* Pipeline Status Button Group - Modern Design (Ultra subtle inactive colors) */}
          <div className="mt-5">
            <Label>Pipeline Status</Label>
            <div className="flex gap-3 mt-2 w-full max-w-md">
              {/* New */}
              <button
                type="button"
                className={`flex-[1.2] min-w-[150px] h-12 rounded-xl border text-sm font-semibold shadow-sm transition-all duration-150 focus:outline-none
                  ${pipelineStatus === "1" ? "bg-gray-300 text-white shadow-md" : "bg-gray-25 text-gray-500"}
                `}
                disabled
              >
                New
              </button>
              {/* In-Progress */}
              <button
                type="button"
                className={`flex-[1.2] min-w-[150px] h-12 rounded-xl border text-sm font-semibold shadow-sm transition-all duration-150 focus:outline-none
                  ${pipelineStatus === "2" ? "bg-yellow-400 text-white shadow-md" : "bg-yellow-25 text-yellow-500"}
                `}
                disabled
              >
                In Progress
              </button>
              {/* Site Visit */}
              <button
                type="button"
                className={`flex-[1.2] min-w-[150px] h-12 rounded-xl border text-sm font-semibold shadow-sm transition-all duration-150 focus:outline-none
                  ${pipelineStatus === "3" ? "bg-blue-400 text-white shadow-md" : "bg-blue-25 text-blue-500"}
                `}
                disabled
              >
                Site Visit
              </button>
              {/* Success */}
              <button
                type="button"
                className={`flex-[1.2] min-w-[150px] h-12 rounded-xl border text-sm font-semibold shadow-sm transition-all duration-150 focus:outline-none
                  ${pipelineStatus === "8" ? "bg-green-500 text-white shadow-md" : "bg-green-25 text-green-500 hover:bg-green-50"}
                  ${pipelineStatus !== "3" ? "opacity-50 cursor-not-allowed" : ""}
                `}
                onClick={() => {
                  if (pipelineStatus === "3") setPipelineStatus("8");
                }}
                disabled={pipelineStatus !== "3"}
              >
                Success
              </button>
              {/* Fail */}
              <button
                type="button"
                className={`flex-[1.2] min-w-[150px] h-12 rounded-xl border text-sm font-semibold shadow-sm transition-all duration-150 focus:outline-none
                  ${pipelineStatus === "9" ? "bg-red-500 text-white shadow-md" : "bg-red-25 text-red-500 hover:bg-red-50"}
                `}
                onClick={() => setPipelineStatus("9")}
              >
                Fail
              </button>
            </div>
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
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </ComponentCard>
      </div>

      {/* Selection Modals */}
      <PaginatedSelectionModal
        isOpen={showLeadModal}
        onClose={() => setShowLeadModal(false)}
        onSelect={(lead) => handleChange("selectedLead", lead)}
        title="Edit Lead"
        data={mappedLeads}
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
        isOpen={showStaffModal}
        onClose={() => setShowStaffModal(false)}
        onSelect={(staff) => handleChange("selectedStaff", staff)}
        title="Edit Staff"
        data={staffData}
        columns={[
          { key: "staff_id", label: "ID" },
          { key: "full_name", label: "Name" },
          { key: "position", label: "Position" },
        ]}
        searchPlaceholder="Search staff..."
        isLoading={isStaffLoading}
        currentPage={staffCurrentPage}
        totalRows={staffTotalRows}
        pageSize={staffPageSize}
        onPageChange={handleStaffPageChange}
        onSearch={handleStaffSearch}
        searchQuery={staffSearchQuery}
        searchType={staffSearchType}
      />

      <PaginatedSelectionModal
        isOpen={showPropertyModal}
        onClose={() => setShowPropertyModal(false)}
        onSelect={(property) => handleChange("selectedProperty", property)}
        title="Edit Property"
        data={propertiesData}
        columns={[
          { key: "property_profile_id", label: "ID" },
          { key: "property_profile_name", label: "Property Name" },
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
      />

      {/* Success/Error Modal (Universal) */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        statusCode={successModalStatus}
        message={successModalMessage}
        buttonText={successModalStatus === 200 ? "Go to Call Pipeline" : undefined}
        onButtonClick={successModalStatus === 200 ? handleGoToPipeline : () => setShowSuccessModal(false)}
      />

      {/* Create New Lead Modal */}
      <Modal
        isOpen={showCreateLeadModal}
        onClose={() => setShowCreateLeadModal(false)}
        className="max-w-md"
      >
        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
            Create New Lead
          </h3>

          <div className="space-y-4">
            <div>
              <Label htmlFor="lead-name">Full Name *</Label>
              <Input
                id="lead-name"
                value={newLeadData.name}
                onChange={(e) => handleNewLeadChange("name", e.target.value)}
                placeholder="Enter full name"
                className={newLeadErrors.name ? "border-red-500" : ""}
              />
              {newLeadErrors.name && (
                <p className="mt-1 text-sm text-red-500">{newLeadErrors.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="lead-phone">Phone Number *</Label>
              <PhoneInput
                id="lead-phone"
                value={newLeadData.phoneNumber}
                onChange={(value) => handleNewLeadChange("phoneNumber", value)}
                placeholder="000-000-0000"
              />
              {newLeadErrors.phoneNumber && (
                <p className="mt-1 text-sm text-red-500">{newLeadErrors.phoneNumber}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowCreateLeadModal(false)}
              disabled={isCreatingLead}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateNewLead}
              disabled={isCreatingLead}
            >
              {isCreatingLead ? "Creating..." : "Create Lead"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Lead Success Modal */}
      <Modal
        isOpen={showLeadSuccessModal}
        onClose={handleLeadSuccessModalClose}
        className="max-w-md"
      >
        <div className="p-6 text-center">
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

          {createdLeadInfo && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Name:</strong> {createdLeadInfo.name}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Phone:</strong> {createdLeadInfo.phone}
              </p>
            </div>
          )}

          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            The new lead has been added to your system and is now available for selection.
          </p>

          <Button
            variant="primary"
            onClick={handleLeadSuccessModalClose}
            className="w-full"
          >
            Continue
          </Button>
        </div>
      </Modal>
    </div>
  );
}

