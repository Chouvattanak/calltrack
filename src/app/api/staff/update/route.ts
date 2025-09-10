import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        
        console.log('Staff Update API - Received data:', body);

        // Validate required fields
        const requiredFields = [
            'staff_id',
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

        // Validate staff_id exists (in real implementation, check database)
        if (!body.staff_id) {
            return NextResponse.json([{
                statusCode: 404,
                message: 'Staff member not found',
                data: null
            }], { status: 404 });
        }
        
        // Process contact_data to ensure proper structure
        const contactData = Array.isArray(body.contact_data) ? body.contact_data : [];
        
        // Create updated staff object
        const updatedStaff = {
            staff_id: body.staff_id,
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
            is_active: body.is_active !== undefined ? body.is_active : true,
            updated_date: new Date().toISOString()
        };

        // In a real implementation, this would update the database
        // const result = await database.staff.update(body.staff_id, updatedStaff);
        
        // Simulate successful update
        console.log('Staff Update API - Staff updated:', {
            staff_id: body.staff_id,
            name: `${body.first_name} ${body.last_name}`,
            position: body.position,
            department: body.department,
            is_active: updatedStaff.is_active
        });

        // Return success response matching the expected format
        const response = [{
            statusCode: 200,
            message: 'Staff member updated successfully',
            data: updatedStaff
        }];

        return NextResponse.json(response, { status: 200 });

    } catch (error) {
        console.error('Staff Update API Error:', error);
        
        return NextResponse.json([{
            statusCode: 500,
            message: 'Internal server error occurred while updating staff member',
            error: error instanceof Error ? error.message : 'Unknown error',
            data: null
        }], { status: 500 });
    }
}
