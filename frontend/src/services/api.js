import axios from 'axios';

const getBaseUrl = () => {
  const envUrl = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '').trim();
  
  if (!envUrl) {
    return '/api';
  }

  // Remove trailing slash
  let cleanUrl = envUrl.replace(/\/+$/, '');

  // If URL does not end with '/api', append '/api'
  if (!cleanUrl.endsWith('/api')) {
    cleanUrl = `${cleanUrl}/api`;
  }

  return cleanUrl;
};

const API_BASE_URL = getBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization Bearer token if available in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle standard API responses & 401 unauthorized
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    if (error.response?.status === 401) {
      // Clear invalid token if unauthenticated
      localStorage.removeItem('token');
    }
    return Promise.reject(new Error(message));
  }
);

export default api;
