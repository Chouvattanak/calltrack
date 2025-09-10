import api from '@/lib/api';
import { jwtDecode } from 'jwt-decode';

export async function fetchAndStoreStaffInfo(token: string) {
  try {
    const decoded = jwtDecode<{ user_id: string }>(token);
    const userId = parseInt(decoded.user_id, 10);
    const response = await api.post('/staff/pagination', {
      page_number: '1',
      page_size: '1',
      search_type: 'staff_id',
      query_search: userId,
    });
    const apiResult = response.data[0];
    if (apiResult && apiResult.data && apiResult.data.length > 0) {
      const staff = apiResult.data[0];
      localStorage.setItem('staff', JSON.stringify(staff));
      console.log('[fetchAndStoreStaffInfo] Staff info saved to localStorage:', staff);
    }
  } catch (error) {
    // Optionally handle error
    console.error('Failed to fetch or store staff info:', error);
  }
}
