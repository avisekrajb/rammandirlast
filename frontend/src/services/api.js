import axios from 'axios';
import { getToken } from './auth';

// Relative base URL by default: requests go to the same origin and the dev-server
// proxy forwards /api to the backend. This keeps the app working unchanged from
// http://localhost:4000 and from a phone on http://192.168.1.107:4000.
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - prevent infinite loops
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only handle 401 errors, don't redirect if already on login page
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      // Don't redirect if already on home page or auth page
      if (!['/', '/login', '/signup'].includes(currentPath)) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;