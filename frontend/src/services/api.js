import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:5000/api', // Flask Backend
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Let browser set Content-Type for FormData (multipart/form-data with boundary)
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle 401 errors (expired token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      // Redirect to login page if not already there
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/staff')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
