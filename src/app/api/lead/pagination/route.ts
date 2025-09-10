import { NextRequest, NextResponse } from 'next/server';

// Mock data for demonstration - replace with actual database calls
const mockLeads = [
    {
        lead_id: "1",
        first_name: "John",
        last_name: "Smith",
        gender_name: "Male",
        email: "john.smith@email.com",
        date_of_birth: "1985-03-15",
        created_date: "2024-01-15T10:30:00Z",
        lead_source_name: "Website",
        customer_type_name: "Individual",
        business_name: "Tech Solutions Inc",
        occupation: "Software Engineer",
        province_name: "New York",
        district_name: "Manhattan",
        commune_name: "Midtown",
        village_name: "Central",
        home_address: "123 Main St",
        street_address: "Apt 4B",
        is_active: true,
        photo_url: "/images/user/user-01.jpg",
        contact_data: [{
            contact_values: [{
                contact_number: "+1 (555) 123-4567",
                is_primary: true,
                remark: "Primary contact"
            }]
        }]
    },
    {
        lead_id: "2",
        first_name: "Sarah",
        last_name: "Johnson",
        gender_name: "Female",
        email: "sarah.johnson@email.com",
        date_of_birth: "1990-07-22",
        created_date: "2024-01-16T14:20:00Z",
        lead_source_name: "Referral",
        customer_type_name: "Individual",
        business_name: "Marketing Pro",
        occupation: "Marketing Manager",
        province_name: "California",
        district_name: "Los Angeles",
        commune_name: "Beverly Hills",
        village_name: "West Side",
        home_address: "456 Oak Ave",
        street_address: "Suite 200",
        is_active: true,
        photo_url: "/images/user/user-02.jpg",
        contact_data: [{
            contact_values: [{
                contact_number: "+1 (555) 987-6543",
                is_primary: true,
                remark: "Primary contact"
            }]
        }]
    },
    {
        lead_id: "3",
        first_name: "Michael",
        last_name: "Brown",
        gender_name: "Male",
        email: "michael.brown@email.com",
        date_of_birth: "1988-11-30",
        created_date: "2024-01-17T09:15:00Z",
        lead_source_name: "Social Media",
        customer_type_name: "Business",
        business_name: "Brown Enterprises",
        occupation: "CEO",
        province_name: "Illinois",
        district_name: "Chicago",
        commune_name: "Downtown",
        village_name: "Loop",
        home_address: "789 Pine Rd",
        street_address: "Floor 10",
        is_active: false,
        photo_url: "/images/user/user-03.jpg",
        contact_data: [{
            contact_values: [{
                contact_number: "+1 (555) 456-7890",
                is_primary: true,
                remark: "Primary contact"
            }]
        }]
    },
    {
        lead_id: "4",
        first_name: "Emily",
        last_name: "Davis",
        gender_name: "Female",
        email: "emily.davis@email.com",
        date_of_birth: "1992-05-18",
        created_date: "2024-01-18T16:45:00Z",
        lead_source_name: "Phone",
        customer_type_name: "Individual",
        business_name: "Davis Consulting",
        occupation: "Consultant",
        province_name: "Texas",
        district_name: "Houston",
        commune_name: "Heights",
        village_name: "Garden",
        home_address: "321 Elm St",
        street_address: "Unit 5",
        is_active: true,
        photo_url: "/images/user/user-04.jpg",
        contact_data: [{
            contact_values: [{
                contact_number: "+1 (555) 321-0987",
                is_primary: true,
                remark: "Primary contact"
            }]
        }]
    },
    {
        lead_id: "5",
        first_name: "David",
        last_name: "Wilson",
        gender_name: "Male",
        email: "david.wilson@email.com",
        date_of_birth: "1987-09-12",
        created_date: "2024-01-19T11:30:00Z",
        lead_source_name: "Email",
        customer_type_name: "Individual",
        business_name: "Wilson Corp",
        occupation: "Manager",
        province_name: "Arizona",
        district_name: "Phoenix",
        commune_name: "Scottsdale",
        village_name: "North",
        home_address: "654 Maple Dr",
        street_address: "Building A",
        is_active: true,
        photo_url: "/images/user/user-05.jpg",
        contact_data: [{
            contact_values: [{
                contact_number: "+1 (555) 654-3210",
                is_primary: true,
                remark: "Primary contact"
            }]
        }]
    },
    {
        lead_id: "6",
        first_name: "Lisa",
        last_name: "Anderson",
        gender_name: "Female",
        email: "lisa.anderson@email.com",
        date_of_birth: "1991-12-08",
        created_date: "2024-01-20T13:15:00Z",
        lead_source_name: "Website",
        customer_type_name: "Individual",
        business_name: "Anderson Design",
        occupation: "Designer",
        province_name: "Washington",
        district_name: "Seattle",
        commune_name: "Capitol Hill",
        village_name: "East",
        home_address: "987 Cedar Ave",
        street_address: "Apt 12",
        is_active: true,
        photo_url: "/images/user/user-06.jpg",
        contact_data: [{
            contact_values: [{
                contact_number: "+1 (555) 111-2222",
                is_primary: true,
                remark: "Primary contact"
            }]
        }]
    },
    {
        lead_id: "7",
        first_name: "Robert",
        last_name: "Martinez",
        gender_name: "Male",
        email: "robert.martinez@email.com",
        date_of_birth: "1984-06-25",
        created_date: "2024-01-21T08:45:00Z",
        lead_source_name: "Referral",
        customer_type_name: "Business",
        business_name: "Martinez Holdings",
        occupation: "Director",
        province_name: "Florida",
        district_name: "Miami",
        commune_name: "South Beach",
        village_name: "Ocean",
        home_address: "555 Palm St",
        street_address: "Penthouse",
        is_active: true,
        photo_url: "/images/user/user-07.jpg",
        contact_data: [{
            contact_values: [{
                contact_number: "+1 (555) 333-4444",
                is_primary: true,
                remark: "Primary contact"
            }]
        }]
    },
    {
        lead_id: "8",
        first_name: "Amanda",
        last_name: "Thompson",
        gender_name: "Female",
        email: "amanda.thompson@email.com",
        date_of_birth: "1993-04-14",
        created_date: "2024-01-22T15:20:00Z",
        lead_source_name: "Social Media",
        customer_type_name: "Individual",
        business_name: "Thompson Media",
        occupation: "Content Creator",
        province_name: "Colorado",
        district_name: "Denver",
        commune_name: "Downtown",
        village_name: "LoDo",
        home_address: "777 Spruce Blvd",
        street_address: "Loft 3",
        is_active: true,
        photo_url: "/images/user/user-08.jpg",
        contact_data: [{
            contact_values: [{
                contact_number: "+1 (555) 555-6666",
                is_primary: true,
                remark: "Primary contact"
            }]
        }]
    },
    {
        lead_id: "9",
        first_name: "James",
        last_name: "Garcia",
        gender_name: "Male",
        email: "james.garcia@email.com",
        date_of_birth: "1989-08-03",
        created_date: "2024-01-23T12:10:00Z",
        lead_source_name: "Phone",
        customer_type_name: "Individual",
        business_name: "Garcia Services",
        occupation: "Technician",
        province_name: "Nevada",
        district_name: "Las Vegas",
        commune_name: "Strip",
        village_name: "Central",
        home_address: "888 Willow Way",
        street_address: "Unit 15",
        is_active: false,
        photo_url: "/images/user/user-09.jpg",
        contact_data: [{
            contact_values: [{
                contact_number: "+1 (555) 777-8888",
                is_primary: true,
                remark: "Primary contact"
            }]
        }]
    },
    {
        lead_id: "10",
        first_name: "Jessica",
        last_name: "Lee",
        gender_name: "Female",
        email: "jessica.lee@email.com",
        date_of_birth: "1986-10-17",
        created_date: "2024-01-24T17:30:00Z",
        lead_source_name: "Email",
        customer_type_name: "Individual",
        business_name: "Lee Consulting",
        occupation: "Consultant",
        province_name: "Oregon",
        district_name: "Portland",
        commune_name: "Pearl District",
        village_name: "Northwest",
        home_address: "999 Birch Ct",
        street_address: "Suite 8",
        is_active: true,
        photo_url: "/images/user/user-10.jpg",
        contact_data: [{
            contact_values: [{
                contact_number: "+1 (555) 999-0000",
                is_primary: true,
                remark: "Primary contact"
            }]
        }]
    }
];

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { page_number, page_size, search_type, query_search } = body;

        // Convert to numbers
        const pageNumber = parseInt(page_number) || 1;
        const pageSize = parseInt(page_size) || 10;
        const searchQuery = query_search?.trim() || '';

        // Filter data based on search
        let filteredLeads = mockLeads;
        if (searchQuery) {
            filteredLeads = mockLeads.filter(lead => {
                const searchValue = searchQuery.toLowerCase();
                if (search_type === 'lead_id') {
                    return lead.lead_id.toLowerCase().includes(searchValue);
                } else if (search_type === 'lead_name') {
                    const fullName = `${lead.first_name} ${lead.last_name}`.toLowerCase();
                    return fullName.includes(searchValue);
                }
                return false;
            });
        }

        // Apply pagination
        const startIndex = (pageNumber - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedLeads = filteredLeads.slice(startIndex, endIndex);

        // Format response to match expected structure
        const response = [
            {
                data: paginatedLeads,
                total_row: filteredLeads.length,
                page_number: pageNumber,
                page_size: pageSize,
                total_pages: Math.ceil(filteredLeads.length / pageSize)
            }
        ];

        return NextResponse.json(response);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
