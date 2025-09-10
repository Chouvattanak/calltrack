export interface Developer {
  developer_id: string;
  developer_name: string;
  developer_description?: string;
  contact_info?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  address?: {
    street?: string;
    city?: string;
    province?: string;
    country?: string;
  };
  established_year?: number;
  is_active: boolean;
  created_date: string;
  updated_date?: string;
}

export const developerData: Developer[] = [
  {
    developer_id: "DEV001",
    developer_name: "Borey Peng Group",
    developer_description: "Leading real estate developer in Cambodia",
    contact_info: {
      phone: "+855 23 123 456",
      email: "contact@boreypeng.com",
      website: "www.boreypeng.com"
    },
    address: {
      street: "Street 271",
      city: "Phnom Penh",
      province: "Phnom Penh",
      country: "Cambodia"
    },
    established_year: 2008,
    is_active: true,
    created_date: "2024-01-15",
    updated_date: "2024-07-20"
  },
  {
    developer_id: "DEV002",
    developer_name: "Prince Group",
    developer_description: "Luxury residential and commercial developer",
    contact_info: {
      phone: "+855 23 234 567",
      email: "info@princegroup.com.kh",
      website: "www.princegroup.com.kh"
    },
    address: {
      street: "Monivong Boulevard",
      city: "Phnom Penh",
      province: "Phnom Penh",
      country: "Cambodia"
    },
    established_year: 2006,
    is_active: true,
    created_date: "2024-01-16",
    updated_date: "2024-07-21"
  },
  {
    developer_id: "DEV003",
    developer_name: "Worldbridge Group",
    developer_description: "Integrated real estate and hospitality developer",
    contact_info: {
      phone: "+855 23 345 678",
      email: "contact@worldbridge.com.kh",
      website: "www.worldbridge.com.kh"
    },
    address: {
      street: "Russian Boulevard",
      city: "Phnom Penh",
      province: "Phnom Penh",
      country: "Cambodia"
    },
    established_year: 2010,
    is_active: true,
    created_date: "2024-01-17",
    updated_date: "2024-07-22"
  },
  {
    developer_id: "DEV004",
    developer_name: "ING Holdings",
    developer_description: "Affordable housing and commercial property developer",
    contact_info: {
      phone: "+855 23 456 789",
      email: "info@ingholdings.com",
      website: "www.ingholdings.com"
    },
    address: {
      street: "Street 360",
      city: "Phnom Penh",
      province: "Phnom Penh",
      country: "Cambodia"
    },
    established_year: 2012,
    is_active: true,
    created_date: "2024-01-18",
    updated_date: "2024-07-23"
  },
  {
    developer_id: "DEV005",
    developer_name: "Urban Village",
    developer_description: "Modern urban development specialist",
    contact_info: {
      phone: "+855 23 567 890",
      email: "contact@urbanvillage.com.kh",
      website: "www.urbanvillage.com.kh"
    },
    address: {
      street: "Street 2004",
      city: "Phnom Penh",
      province: "Phnom Penh",
      country: "Cambodia"
    },
    established_year: 2015,
    is_active: true,
    created_date: "2024-01-19",
    updated_date: "2024-07-24"
  }
];

export default developerData;
