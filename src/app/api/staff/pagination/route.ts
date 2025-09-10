import { NextRequest, NextResponse } from 'next/server';

// Mock data for demonstration - replace with actual database calls
const mockStaff = [
    {
        staff_id: 1,
        staff_code: "STF-001",
        first_name: "John",
        last_name: "Doe",
        gender_name: "Male",
        email: "john.doe@company.com",
        date_of_birth: "1988-05-10",
        created_date: "2024-01-01T08:00:00Z",
        created_by: "admin",
        last_update: "2024-01-01T08:00:00Z",
        updated_by: "admin",
        position: "Software Engineer",
        department: "IT",
        employment_type: "Full-time",
        employment_start_date: "2024-01-01",
        employment_end_date: null,
        employment_level: "Senior",
        current_address: "789 Tech Street, Silicon Valley",
        photo_url: ["/images/user/user-01.jpg"],
        is_active: true,
        contact_data: [{
            channel_type_id: 1,
            channel_type_name: "Phone",
            contact_values: [{
                contact_number: "+1 (555) 100-0001",
                is_primary: true,
                remark: "Work phone"
            }]
        }, {
            channel_type_id: 2,
            channel_type_name: "Email",
            contact_values: [{
                contact_number: "john.doe@company.com",
                is_primary: true,
                remark: "Work email"
            }]
        }]
    },
    {
        staff_id: 2,
        staff_code: "STF-002",
        first_name: "Jane",
        last_name: "Smith",
        gender_name: "Female",
        email: "jane.smith@company.com",
        date_of_birth: "1992-08-15",
        created_date: "2024-01-02T09:00:00Z",
        created_by: "admin",
        last_update: "2024-01-02T09:00:00Z",
        updated_by: "admin",
        position: "Project Manager",
        department: "Operations",
        employment_type: "Full-time",
        employment_start_date: "2024-01-02",
        employment_end_date: null,
        employment_level: "Mid-level",
        current_address: "456 Business Ave, Downtown",
        photo_url: ["/images/user/user-02.jpg"],
        is_active: true,
        contact_data: [{
            channel_type_id: 1,
            channel_type_name: "Phone",
            contact_values: [{
                contact_number: "+1 (555) 200-0002",
                is_primary: true,
                remark: "Mobile"
            }]
        }]
    },
    {
        staff_id: 3,
        staff_code: "STF-003",
        first_name: "Mike",
        last_name: "Johnson",
        gender_name: "Male",
        email: "mike.johnson@company.com",
        date_of_birth: "1985-12-03",
        created_date: "2024-01-03T10:00:00Z",
        created_by: "admin",
        last_update: "2024-01-03T10:00:00Z",
        updated_by: "admin",
        position: "Sales Manager",
        department: "Sales",
        employment_type: "Full-time",
        employment_start_date: "2024-01-03",
        employment_end_date: null,
        employment_level: "Senior",
        current_address: "123 Commerce Blvd, Business District",
        photo_url: ["/images/user/user-03.jpg"],
        is_active: true,
        contact_data: [{
            channel_type_id: 1,
            channel_type_name: "Phone",
            contact_values: [{
                contact_number: "+1 (555) 300-0003",
                is_primary: true,
                remark: "Direct line"
            }]
        }, {
            channel_type_id: 2,
            channel_type_name: "Email",
            contact_values: [{
                contact_number: "mike.johnson@company.com",
                is_primary: true,
                remark: "Primary email"
            }]
        }]
    },
    {
        staff_id: 4,
        staff_code: "STF-004",
        first_name: "Sarah",
        last_name: "Wilson",
        gender_name: "Female",
        email: "sarah.wilson@company.com",
        date_of_birth: "1990-04-18",
        created_date: "2024-01-04T11:00:00Z",
        created_by: "admin",
        last_update: "2024-01-04T11:00:00Z",
        updated_by: "admin",
        position: "UX Designer",
        department: "Design",
        employment_type: "Part-time",
        employment_start_date: "2024-01-04",
        employment_end_date: null,
        employment_level: "Mid-level",
        current_address: "321 Creative Lane, Art District",
        photo_url: ["/images/user/user-04.jpg"],
        is_active: true,
        contact_data: [{
            channel_type_id: 1,
            channel_type_name: "Phone",
            contact_values: [{
                contact_number: "+1 (555) 400-0004",
                is_primary: true,
                remark: "Personal"
            }]
        }]
    },
    {
        staff_id: 5,
        staff_code: "STF-005",
        first_name: "David",
        last_name: "Brown",
        gender_name: "Male",
        email: "david.brown@company.com",
        date_of_birth: "1987-11-25",
        created_date: "2024-01-05T12:00:00Z",
        created_by: "admin",
        last_update: "2024-01-05T12:00:00Z",
        updated_by: "admin",
        position: "Marketing Specialist",
        department: "Marketing",
        employment_type: "Contract",
        employment_start_date: "2024-01-05",
        employment_end_date: "2024-12-31",
        employment_level: "Junior",
        current_address: "654 Media Street, Marketing Hub",
        photo_url: ["/images/user/user-05.jpg"],
        is_active: true,
        contact_data: [{
            channel_type_id: 1,
            channel_type_name: "Phone",
            contact_values: [{
                contact_number: "+1 (555) 500-0005",
                is_primary: true,
                remark: "Work cell"
            }]
        }, {
            channel_type_id: 2,
            channel_type_name: "Email",
            contact_values: [{
                contact_number: "david.brown@company.com",
                is_primary: false,
                remark: "Secondary email"
            }]
        }]
    },
    {
        staff_id: 6,
        staff_code: "STF-006",
        first_name: "Lisa",
        last_name: "Davis",
        gender_name: "Female",
        email: "lisa.davis@company.com",
        date_of_birth: "1993-06-12",
        created_date: "2024-01-06T13:00:00Z",
        created_by: "admin",
        last_update: "2024-01-06T13:00:00Z",
        updated_by: "admin",
        position: "HR Coordinator",
        department: "Human Resources",
        employment_type: "Full-time",
        employment_start_date: "2024-01-06",
        employment_end_date: null,
        employment_level: "Entry-level",
        current_address: "987 People Place, HR Center",
        photo_url: ["/images/user/user-06.jpg"],
        is_active: false,
        contact_data: [{
            channel_type_id: 1,
            channel_type_name: "Phone",
            contact_values: [{
                contact_number: "+1 (555) 600-0006",
                is_primary: true,
                remark: "Office"
            }]
        }]
    },
    {
        staff_id: 7,
        staff_code: "STF-007",
        first_name: "Robert",
        last_name: "Garcia",
        gender_name: "Male",
        email: "robert.garcia@company.com",
        date_of_birth: "1984-02-28",
        created_date: "2024-01-07T14:00:00Z",
        created_by: "admin",
        last_update: "2024-01-07T14:00:00Z",
        updated_by: "admin",
        position: "Finance Manager",
        department: "Finance",
        employment_type: "Full-time",
        employment_start_date: "2024-01-07",
        employment_end_date: null,
        employment_level: "Senior",
        current_address: "159 Money Street, Financial District",
        photo_url: ["/images/user/user-07.jpg"],
        is_active: true,
        contact_data: [{
            channel_type_id: 1,
            channel_type_name: "Phone",
            contact_values: [{
                contact_number: "+1 (555) 700-0007",
                is_primary: true,
                remark: "Direct"
            }]
        }, {
            channel_type_id: 2,
            channel_type_name: "Email",
            contact_values: [{
                contact_number: "robert.garcia@company.com",
                is_primary: true,
                remark: "Work email"
            }]
        }]
    },
    {
        staff_id: 8,
        staff_code: "STF-008",
        first_name: "Amanda",
        last_name: "Martinez",
        gender_name: "Female",
        email: "amanda.martinez@company.com",
        date_of_birth: "1991-09-07",
        created_date: "2024-01-08T15:00:00Z",
        created_by: "admin",
        last_update: "2024-01-08T15:00:00Z",
        updated_by: "admin",
        position: "QA Engineer",
        department: "IT",
        employment_type: "Full-time",
        employment_start_date: "2024-01-08",
        employment_end_date: null,
        employment_level: "Mid-level",
        current_address: "753 Quality Road, Tech Park",
        photo_url: ["/images/user/user-08.jpg"],
        is_active: true,
        contact_data: [{
            channel_type_id: 1,
            channel_type_name: "Phone",
            contact_values: [{
                contact_number: "+1 (555) 800-0008",
                is_primary: true,
                remark: "Mobile"
            }]
        }]
    }
];

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { page_number, page_size, search_type, query_search } = body;

        console.log('Staff Pagination API - Received params:', { page_number, page_size, search_type, query_search });

        // Log the first few staff members for debugging
        console.log('First few staff members from mock data:', mockStaff.slice(0, 3).map(s => ({
            staff_id: s.staff_id,
            first_name: s.first_name,
            last_name: s.last_name
        })));

        // Convert to numbers
        const pageNumber = parseInt(page_number) || 1;
        const pageSize = parseInt(page_size) || 10;
        const searchQuery = query_search?.trim() || '';

        // Filter data based on search
        let filteredStaff = mockStaff;
        if (searchQuery) {
            filteredStaff = mockStaff.filter(staff => {
                const searchValue = searchQuery.toLowerCase();
                if (search_type === 'staff_id') {
                    return String(staff.staff_id).includes(searchQuery) || staff.staff_code.toLowerCase().includes(searchValue);
                } else if (search_type === 'staff_name') {
                    const fullName = `${staff.first_name} ${staff.last_name}`.toLowerCase();
                    return fullName.includes(searchValue);
                } else if (search_type === 'department') {
                    return staff.department.toLowerCase().includes(searchValue);
                } else if (search_type === 'position') {
                    return staff.position.toLowerCase().includes(searchValue);
                } else {
                    // Default search in all fields
                    const fullName = `${staff.first_name} ${staff.last_name}`.toLowerCase();
                    return (
                        String(staff.staff_id).includes(searchQuery) ||
                        staff.staff_code.toLowerCase().includes(searchValue) ||
                        fullName.includes(searchValue) ||
                        staff.department.toLowerCase().includes(searchValue) ||
                        staff.position.toLowerCase().includes(searchValue) ||
                        staff.email.toLowerCase().includes(searchValue)
                    );
                }
            });
        }

        // Apply pagination
        const startIndex = (pageNumber - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedStaff = filteredStaff.slice(startIndex, endIndex);

        // Format response to match expected structure
        const response = [
            {
                data: paginatedStaff,
                total_row: filteredStaff.length,
                page_number: pageNumber,
                page_size: pageSize,
                total_pages: Math.ceil(filteredStaff.length / pageSize)
            }
        ];

        console.log('Staff Pagination API - Response:', {
            total_staff: paginatedStaff.length,
            total_rows: filteredStaff.length,
            page_number: pageNumber,
            total_pages: Math.ceil(filteredStaff.length / pageSize)
        });

        return NextResponse.json(response);
    } catch (error) {
        console.error('Staff Pagination API Error:', error);
        return NextResponse.json(
            { 
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
