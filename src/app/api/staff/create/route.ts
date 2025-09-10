import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        
        console.log('Staff Create API - Received data:', body);

        // Validate required fields
        const requiredFields = [
            'first_name', 
            'last_name', 
            'gender_id', 
            'date_of_birth',
            'position',
            'department',
            'employment_type',
            'employment_start_date',
            'employment_level',
            'current_address'
        ];

        const missingFields = requiredFields.filter(field => !body[field]);
        if (missingFields.length > 0) {
            return NextResponse.json([{
                statusCode: 400,
                message: `Missing required fields: ${missingFields.join(', ')}`,
                data: null
            }], { status: 400 });
        }

        // Generate new staff ID (in real implementation, this would be handled by the database)
        const newStaffId = `STF-${Date.now()}`;
        
        // Process contact_data to ensure proper structure
        const contactData = Array.isArray(body.contact_data) ? body.contact_data : [];
        
        // Create staff object
        const newStaff = {
            staff_id: newStaffId,
            first_name: body.first_name,
            last_name: body.last_name,
            gender_id: body.gender_id,
            gender_name: body.gender_name || 'Unknown', // This would come from a lookup in real DB
            email: body.email || '',
            date_of_birth: body.date_of_birth,
            position: body.position,
            department: body.department,
            employment_type: body.employment_type,
            employment_start_date: body.employment_start_date,
            employment_end_date: body.employment_end_date || null,
            employment_level: body.employment_level,
            current_address: body.current_address,
            photo_url: Array.isArray(body.photo_url) ? body.photo_url : [body.photo_url || ''],
            contact_data: contactData,
            is_active: true,
            created_date: new Date().toISOString(),
            updated_date: new Date().toISOString()
        };

        // In a real implementation, this would save to database
        // const result = await database.staff.create(newStaff);
        
        // Simulate successful creation
        console.log('Staff Create API - New staff created:', {
            staff_id: newStaffId,
            name: `${body.first_name} ${body.last_name}`,
            position: body.position,
            department: body.department
        });

        // Return success response matching the expected format
        const response = [{
            statusCode: 200,
            message: 'Staff member created successfully',
            data: newStaff
        }];

        return NextResponse.json(response, { status: 200 });

    } catch (error) {
        console.error('Staff Create API Error:', error);
        
        return NextResponse.json([{
            statusCode: 500,
            message: 'Internal server error occurred while creating staff member',
            error: error instanceof Error ? error.message : 'Unknown error',
            data: null
        }], { status: 500 });
    }
}
