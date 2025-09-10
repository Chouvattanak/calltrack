export interface CallLog {
  call_log_id: string;
  created_by_name: string;
  created_date: string;
  fail_reason: string | null;
  follow_up_date: string;
  is_active: boolean;
  is_follow_up: boolean;
  last_update: string;
  lead_id: string;
  lead_name: string;
  phone_number?: string;  // Added for phone number display
  primary_contact_number?: string;  // Direct from call log pagination API - replaces lead pagination calls
  property_profile_id: number;
  property_profile_name: string | null;
  property_profile_price?: number;  // Added for property price
  property_type_id?: number;  // Added for property type ID
  property_type_name?: string;   // Added for property type name
  purpose: string;
  pipeline_status?: string;  // Renamed from status
  status_id: number;
  total_call: number;
  total_site_visit: number;
  updated_by_name: string;
  current_staff_id?: string;  // Added for staff ID
  call_log_details?: Array<{
    contact_data?: Array<{
      contact_values?: Array<{
        contact_number?: string;
        is_primary?: boolean;
      }>;
    }>;
    contact_result_id?: number;
    contact_result_name?: string;
    call_date?: string;
    call_end_datetime?: string;
    created_date?: string;
  }>;
  site_visit_details?: Array<{
    contact_result_id?: number;
    contact_result_name?: string;
    start_datetime?: string;
    end_datetime?: string;
    created_date?: string;
  }>;
  latest_status_id?: number;
  latest_status_name?: string;
}

// Mock data removed - all data should come from API
export const callLogsData: CallLog[] = [];
