// lib/api.js or utils/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://manhemdigitalsolutions.com/pos-admin/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Optional: Add request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    // You can add auth tokens here if needed
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Optional: Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors here
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.log('Unauthorized access');
    }
    return Promise.reject(error);
  }
);

export default api;