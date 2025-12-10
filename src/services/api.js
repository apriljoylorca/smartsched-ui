import axios from 'axios';

export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

// Create a new Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add a request interceptor to attach the JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle 401/403 errors (e.g., token expired)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Token is invalid or expired. Log the user out.
      console.error("Authentication Error. Logging out.");
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Reload the page to force user to login screen
      // Add a query param to show a message if desired
      window.location.href = '/login?sessionExpired=true';
    }
    return Promise.reject(error);
  }
);

export default api;