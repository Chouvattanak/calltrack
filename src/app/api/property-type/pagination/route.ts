import { NextResponse } from 'next/server';

// This internal API route is disabled - use external API only  
export async function POST() {
    return NextResponse.json(
        { error: 'Internal API disabled. Use external API endpoint: {{base_url}}/call_tracker_api/property-type/pagination' },
        { status: 503 }
    );
}
