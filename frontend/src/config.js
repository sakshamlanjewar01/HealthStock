// Centralized frontend configurations
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1065005693223-3ilqu7gflsucakcan8kpnvkljurpqnh9.apps.googleusercontent.com';
const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const API_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;
export const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

