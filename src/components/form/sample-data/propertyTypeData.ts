// Property Type interface with required fields
export interface PropertyType {
  property_type_id: string;
  property_type_name: string;
  property_type_description: string;
  is_active: boolean;
  created_date: string;
  updated_date: string;
  status: 'Active' | 'Inactive' | 'Pending';
  // Additional fields for UI
  icon?: string;
  properties?: number;
  category?: string;
}

// Function to generate random created date
function getRandomCreatedDate(): string {
  const start = new Date(2018, 0, 1);
  const end = new Date();
  const randomDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return randomDate.toLocaleDateString();
}

// Function to generate random updated date (after created date)
function getRandomUpdatedDate(): string {
  const start = new Date(2020, 0, 1);
  const end = new Date();
  const randomDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return randomDate.toLocaleDateString();
}

// Function to get random status
function getRandomStatus(): 'Active' | 'Inactive' | 'Pending' {
  const statuses: ('Active' | 'Inactive' | 'Pending')[] = ['Active', 'Inactive', 'Pending'];
  return statuses[Math.floor(Math.random() * statuses.length)];
}

// Mock data for property types
export const propertyTypeData: PropertyType[] = [
  {
    property_type_id: "PT001",
    property_type_name: "Apartment",
    property_type_description: "Multi-story residential buildings with individual units for rental or ownership.",
    is_active: true,
    created_date: getRandomCreatedDate(),
    updated_date: getRandomUpdatedDate(),
    status: getRandomStatus(),
    icon: "/images/user/user-01.jpg",
    properties: 245,
    category: "Residential"
  },
  {
    property_type_id: "PT002",
    property_type_name: "Condominium",
    property_type_description: "Privately owned residential units in a multi-unit building with shared common areas.",
    is_active: true,
    created_date: getRandomCreatedDate(),
    updated_date: getRandomUpdatedDate(),
    status: getRandomStatus(),
    icon: "/images/user/user-02.jpg",
    properties: 189,
    category: "Residential"
  },
  {
    property_type_id: "PT003",
    property_type_name: "Villa",
    property_type_description: "Luxury standalone residential properties with private gardens and premium amenities.",
    is_active: true,
    created_date: getRandomCreatedDate(),
    updated_date: getRandomUpdatedDate(),
    status: getRandomStatus(),
    icon: "/images/user/user-03.jpg",
    properties: 67,
    category: "Residential"
  },
  {
    property_type_id: "PT004",
    property_type_name: "Townhouse",
    property_type_description: "Multi-level residential units sharing walls with adjacent properties.",
    is_active: true,
    created_date: getRandomCreatedDate(),
    updated_date: getRandomUpdatedDate(),
    status: getRandomStatus(),
    icon: "/images/user/user-04.jpg",
    properties: 123,
    category: "Residential"
  },
  {
    property_type_id: "PT005",
    property_type_name: "Office Building",
    property_type_description: "Commercial buildings designed for business and administrative purposes.",
    is_active: true,
    created_date: getRandomCreatedDate(),
    updated_date: getRandomUpdatedDate(),
    status: getRandomStatus(),
    icon: "/images/user/user-05.jpg",
    properties: 45,
    category: "Commercial"
  },
  {
    property_type_id: "PT006",
    property_type_name: "Retail Space",
    property_type_description: "Commercial properties designed for retail businesses and shopping purposes.",
    is_active: true,
    created_date: getRandomCreatedDate(),
    updated_date: getRandomUpdatedDate(),
    status: getRandomStatus(),
    icon: "/images/user/user-06.jpg",
    properties: 89,
    category: "Commercial"
  },
  {
    property_type_id: "PT007",
    property_type_name: "Warehouse",
    property_type_description: "Large industrial buildings for storage, distribution, and logistics operations.",
    is_active: true,
    created_date: getRandomCreatedDate(),
    updated_date: getRandomUpdatedDate(),
    status: getRandomStatus(),
    icon: "/images/user/user-07.jpg",
    properties: 34,
    category: "Industrial"
  },
  {
    property_type_id: "PT008",
    property_type_name: "Shopping Mall",
    property_type_description: "Large commercial complexes with multiple retail stores and entertainment facilities.",
    is_active: false,
    created_date: getRandomCreatedDate(),
    updated_date: getRandomUpdatedDate(),
    status: getRandomStatus(),
    icon: "/images/user/user-08.jpg",
    properties: 12,
    category: "Commercial"
  },
  {
    property_type_id: "PT009",
    property_type_name: "Land Plot",
    property_type_description: "Undeveloped land parcels available for future construction or investment.",
    is_active: true,
    created_date: getRandomCreatedDate(),
    updated_date: getRandomUpdatedDate(),
    status: getRandomStatus(),
    icon: "/images/user/user-09.jpg",
    properties: 156,
    category: "Land"
  },
  {
    property_type_id: "PT010",
    property_type_name: "Hotel",
    property_type_description: "Commercial properties providing accommodation and hospitality services.",
    is_active: true,
    created_date: getRandomCreatedDate(),
    updated_date: getRandomUpdatedDate(),
    status: getRandomStatus(),
    icon: "/images/user/user-10.jpg",
    properties: 28,
    category: "Hospitality"
  },
  {
    property_type_id: "PT011",
    property_type_name: "Mixed-Use",
    property_type_description: "Properties combining residential, commercial, and/or office spaces in one development.",
    is_active: true,
    created_date: getRandomCreatedDate(),
    updated_date: getRandomUpdatedDate(),
    status: getRandomStatus(),
    icon: "/images/user/user-11.jpg",
    properties: 76,
    category: "Mixed"
  },
  {
    property_type_id: "PT012",
    property_type_name: "Factory",
    property_type_description: "Industrial buildings designed for manufacturing and production activities.",
    is_active: false,
    created_date: getRandomCreatedDate(),
    updated_date: getRandomUpdatedDate(),
    status: getRandomStatus(),
    icon: "/images/user/user-12.jpg",
    properties: 23,
    category: "Industrial"
  }
];
