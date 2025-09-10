interface ISelectOption {
    value: string;
    label: string;
}

const formatApiDataForSelect = (data: Record<string, unknown>[], idKey: string, nameKey: string): ISelectOption[] => {

if (!Array.isArray(data)) {
    return [];
}

return data
    .filter(item => item && item[idKey] != null) 
    .map(item => ({
        value: String(item[idKey]),
        label: String(item[nameKey])
    }));
};

const parseDateString = (dateString: string | null): Date | null => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return null;
    }
    return new Date(date.valueOf() + date.getTimezoneOffset() * 60 * 1000);
}

export const formatDateForAPI = (date: Date | string | null | undefined): string | null => {
    if (!date) return null;
    
    // If it's already a string, return it as is (assuming it's in YYYY-MM-DD format)
    if (typeof date === 'string') {
        return date;
    }
    
    // If it's a Date object, format it
    if (date instanceof Date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    // If it's neither string nor Date, try to create a Date object
    try {
        const parsedDate = new Date(date as string | number);
        if (isNaN(parsedDate.getTime())) {
            return null;
        }
        const year = parsedDate.getFullYear();
        const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
        const day = String(parsedDate.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch (error) {
        console.error('Error formatting date:', error);
        return null;
    }
};

export const getUserFromToken = (): { userid: string } | null => {
    if (typeof window === 'undefined') return null;
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.debug('[getUserFromToken] No token found in localStorage.');
            return null;
        }
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.debug('[getUserFromToken] Decoded token payload:', payload);
        if (!payload.user_id) {
            console.debug('[getUserFromToken] userid not found in token payload.');
        }
        return { userid: payload.user_id };
    } catch (err) {
        console.error('[getUserFromToken] Error decoding token:', err);
        return null;
    }
};

export {
    formatApiDataForSelect, 
    parseDateString
};

export default formatApiDataForSelect;