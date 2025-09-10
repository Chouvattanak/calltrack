// Project interface with required fields
export interface Project {
  project_id: string;
  project_description: string;
  is_active: boolean;
  created_date: string;
  // Address fields
  province?: string;
  district?: string;
  commune?: string;
  village?: string;
  homeAddress?: string;
  streetAddress?: string;
  // Additional fields for UI
  avatar?: string;
  properties?: number;
}

// Function to generate random created date
function getRandomCreatedDate(): string {
  const start = new Date(2018, 0, 1);
  const end = new Date();
  const randomDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return randomDate.toLocaleDateString();
}

// Mock data for projects
export const projectData: Project[] = [
  {
    project_id: "PRJ001",
    project_description: "Modern residential complex with luxury amenities and smart home features for urban living.",
    is_active: true,
    created_date: getRandomCreatedDate(),
    avatar: "/images/user/user-01.jpg",
    properties: 120,
    province: "Phnom Penh",
    district: "Chamkar Mon",
    commune: "Boeung Keng Kang 1",
    village: "Phum 1",
    homeAddress: "Street 240",
    streetAddress: "Building Complex A"
  },
  {
    project_id: "PRJ002",
    project_description: "Eco-friendly resort development with sustainable tourism facilities and natural landscaping.",
    is_active: true,
    created_date: getRandomCreatedDate(),
    avatar: "/images/user/user-02.jpg",
    properties: 85,
    province: "Siem Reap",
    district: "Siem Reap",
    commune: "Siem Reap",
    village: "Phum 2",
    homeAddress: "Resort Road",
    streetAddress: "Eco Resort Phase 1"
  },
  {
    project_id: "PRJ003",
    project_description: "Commercial office tower with modern workspace solutions and retail spaces at ground level.",
    is_active: true,
    created_date: getRandomCreatedDate(),
    avatar: "/images/user/user-03.jpg",
    properties: 45,
    province: "Battambang",
    district: "Battambang",
    commune: "Rattanak",
    village: "Phum 3",
    homeAddress: "Business Center",
    streetAddress: "Tower Plaza"
  },
  {
    project_id: "PRJ004",
    project_description: "Cultural heritage preservation project with traditional architecture and modern amenities.",
    is_active: false,
    created_date: getRandomCreatedDate(),
    avatar: "/images/user/user-04.jpg",
    properties: 25,
    province: "Kampong Cham",
    district: "Kampong Cham",
    commune: "Kampong Cham",
    village: "Phum 4",
    homeAddress: "Heritage Site",
    streetAddress: "Cultural District"
  },
  {
    project_id: "PRJ005",
    project_description: "Industrial park development with manufacturing facilities and logistics infrastructure.",
    is_active: true,
    created_date: getRandomCreatedDate(),
    avatar: "/images/user/user-05.jpg",
    properties: 200,
    province: "Kampot",
    district: "Kampot",
    commune: "Kampong Bay",
    village: "Phum 5",
    homeAddress: "Industrial Zone",
    streetAddress: "Manufacturing Hub"
  },
  {
    project_id: "PRJ006",
    project_description: "Mixed-use development combining residential, commercial, and entertainment facilities in prime location.",
    is_active: true,
    created_date: getRandomCreatedDate(),
    avatar: "/images/user/user-06.jpg",
    properties: 150,
    province: "Kandal",
    district: "Ta Khmao",
    commune: "Ta Khmao",
    village: "Phum 6",
    homeAddress: "Central Plaza",
    streetAddress: "Mixed Development Zone"
  },
  {
    project_id: "PRJ007",
    project_description: "Beachfront condominium project with luxury amenities and ocean views for vacation living.",
    is_active: true,
    created_date: getRandomCreatedDate(),
    avatar: "/images/user/user-07.jpg",
    properties: 75,
    province: "Kep",
    district: "Kep",
    commune: "Kep",
    village: "Phum 7",
    homeAddress: "Oceanfront Drive",
    streetAddress: "Seaside Condos"
  },
  {
    project_id: "PRJ008",
    project_description: "Mountain resort and wellness retreat with spa facilities and adventure tourism activities.",
    is_active: true,
    created_date: getRandomCreatedDate(),
    avatar: "/images/user/user-08.jpg",
    properties: 60,
    province: "Mondulkiri",
    district: "Sen Monorom",
    commune: "Sen Monorom",
    village: "Phum 8",
    homeAddress: "Mountain Ridge",
    streetAddress: "Wellness Resort"
  },
  {
    project_id: "PRJ009",
    project_description: "Technology park with innovation centers, co-working spaces, and startup incubation facilities.",
    is_active: true,
    created_date: getRandomCreatedDate(),
    avatar: "/images/user/user-09.jpg",
    properties: 95,
    province: "Preah Sihanouk",
    district: "Preah Sihanouk",
    commune: "Buon",
    village: "Phum 9",
    homeAddress: "Tech Valley",
    streetAddress: "Innovation Center"
  },
  {
    project_id: "PRJ010",
    project_description: "Affordable housing project providing quality homes for middle-income families with community facilities.",
    is_active: false,
    created_date: getRandomCreatedDate(),
    avatar: "/images/user/user-10.jpg",
    properties: 180,
    province: "Pursat",
    district: "Pursat",
    commune: "Pursat",
    village: "Phum 10",
    homeAddress: "Family Village",
    streetAddress: "Community Housing"
  },
  {
    project_id: "PRJ011",
    project_description: "Shopping mall and entertainment complex with retail stores, restaurants, and cinema facilities.",
    is_active: true,
    created_date: getRandomCreatedDate(),
    avatar: "/images/user/user-11.jpg",
    properties: 110,
    province: "Takeo",
    district: "Takeo",
    commune: "Takeo",
    village: "Phum 11",
    homeAddress: "Shopping District",
    streetAddress: "Mall Complex"
  },
  {
    project_id: "PRJ012",
    project_description: "Educational campus development with modern facilities for students and research activities.",
    is_active: true,
    created_date: getRandomCreatedDate(),
    avatar: "/images/user/user-12.jpg",
    properties: 80,
    province: "Kratie",
    district: "Kratie",
    commune: "Kratie",
    village: "Phum 12",
    homeAddress: "University Avenue",
    streetAddress: "Academic Campus"
  }
];
