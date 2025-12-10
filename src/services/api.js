import axios from 'axios';

// Get API base URL from environment variable, with fallback
let apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

// Normalize the URL - remove trailing slash if present
apiBaseUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;

// Ensure it ends with /api if it doesn't already
if (!apiBaseUrl.endsWith('/api')) {
  apiBaseUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl + 'api' : apiBaseUrl + '/api';
}

export const API_BASE_URL = apiBaseUrl;

// Log API configuration on load
console.log('=== API CONFIGURATION ===');
console.log('API_BASE_URL:', API_BASE_URL);
console.log('REACT_APP_API_BASE_URL env:', process.env.REACT_APP_API_BASE_URL);

// Check if we're in production but using localhost
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const isUsingLocalhost = API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1');

if (isProduction && isUsingLocalhost) {
  console.error('⚠️ CONFIGURATION ERROR ⚠️');
  console.error('You are in production but API_BASE_URL points to localhost!');
  console.error('Please set REACT_APP_API_BASE_URL environment variable in Vercel to:');
  console.error('https://smartsched-backend.onrender.com/api');
  console.error('Then redeploy your application.');
  
  // Show user-friendly error banner
  const errorBanner = document.createElement('div');
  errorBanner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #ff4444;
    color: white;
    padding: 15px;
    text-align: center;
    z-index: 10000;
    font-weight: bold;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
  `;
  errorBanner.innerHTML = `
    ⚠️ API Configuration Error: Environment variable REACT_APP_API_BASE_URL is not set. 
    Please configure it in Vercel and redeploy. 
    <a href="/test-connection" style="color: white; text-decoration: underline; margin-left: 10px;">Test Connection</a>
  `;
  document.body.insertBefore(errorBanner, document.body.firstChild);
}

console.log('Full login URL will be:', `${API_BASE_URL}/auth/login`);

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
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle 401/403 errors (e.g., token expired)
api.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`);
    return response;
  },
  (error) => {
    console.error('=== API ERROR ===');
    console.error('URL:', error.config?.url);
    console.error('Method:', error.config?.method);
    console.error('Base URL:', error.config?.baseURL);
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Response Data:', error.response?.data);
    console.error('Error Message:', error.message);
    if (error.code === 'ERR_NETWORK') {
      console.error('Network Error - Could not reach API. Check if API is running and CORS is configured.');
    }
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