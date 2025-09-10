import { NextResponse } from 'next/server';

// Mock dashboard data - replace with actual database calls
const mockDashboardData = {
  dashboard_summary: {
    total_project: 45,
    total_developer: 12,
    total_property: 156,
    total_staff: 24
  },
  lead_summary: {
    total_lead: 1285,
    total_lead_current_month: 120,
    total_lead_previous_month: 95,
    lead_percentage_change: 26.3
  },
  call_log_summary: {
    total_call: 2847,
    total_success_call: 1821,
    total_follow_up_call: 692,
    total_fail_call: 334,
    total_call_current_month: 285,
    total_call_previous_month: 267,
    call_percentage_change: 6.7
  },
  call_log_by_month: [
    {
      month: 1,
      year: 2025,
      total_call: 234,
      total_success_call: 145,
      total_follow_up_call: 56,
      total_fail_call: 33
    },
    {
      month: 2,
      year: 2025,
      total_call: 267,
      total_success_call: 168,
      total_follow_up_call: 64,
      total_fail_call: 35
    },
    {
      month: 3,
      year: 2025,
      total_call: 245,
      total_success_call: 152,
      total_follow_up_call: 58,
      total_fail_call: 35
    },
    {
      month: 4,
      year: 2025,
      total_call: 289,
      total_success_call: 182,
      total_follow_up_call: 71,
      total_fail_call: 36
    },
    {
      month: 5,
      year: 2025,
      total_call: 312,
      total_success_call: 195,
      total_follow_up_call: 78,
      total_fail_call: 39
    },
    {
      month: 6,
      year: 2025,
      total_call: 298,
      total_success_call: 189,
      total_follow_up_call: 73,
      total_fail_call: 36
    },
    {
      month: 7,
      year: 2025,
      total_call: 285,
      total_success_call: 178,
      total_follow_up_call: 69,
      total_fail_call: 38
    },
    {
      month: 8,
      year: 2025,
      total_call: 325,
      total_success_call: 203,
      total_follow_up_call: 82,
      total_fail_call: 40
    }
  ],
  customer_demographic: [
    {
      province: "California",
      total_customer: 324
    },
    {
      province: "New York",
      total_customer: 267
    },
    {
      province: "Texas",
      total_customer: 198
    },
    {
      province: "Florida",
      total_customer: 156
    },
    {
      province: "Illinois",
      total_customer: 134
    },
    {
      province: "Arizona",
      total_customer: 98
    },
    {
      province: "Washington",
      total_customer: 87
    },
    {
      province: "Colorado",
      total_customer: 76
    },
    {
      province: "Nevada",
      total_customer: 65
    },
    {
      province: "Oregon",
      total_customer: 54
    },
    {
      province: "Georgia",
      total_customer: 43
    },
    {
      province: "Michigan",
      total_customer: 32
    }
  ]
};

export async function GET() {
    try {
        // You can add authentication here if needed
        // const authHeader = request.headers.get('authorization');
        
        // Format response to match expected structure
        const response = [
            {
                data: [mockDashboardData],
                total_row: 1,
                page_number: 1,
                page_size: 1,
                total_pages: 1
            }
        ];

        return NextResponse.json(response);
    } catch (error) {
        console.error('Dashboard API Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Also support POST for consistency with other endpoints
export async function POST() {
    return GET();
}
