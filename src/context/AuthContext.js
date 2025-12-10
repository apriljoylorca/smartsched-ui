import React, { useState, useEffect, createContext, useContext } from 'react';
import axios from 'axios'; // Import base axios for public endpoints

// Use our configured Axios instance for authenticated requests
import api, { API_BASE_URL } from '../services/api'; 

const AuthContext = createContext(null);

/**
 * Provides authentication state (token, user, role) to the entire app.
 * Also manages login, logout, and API request interceptors.
 */
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [user, setUser] = useState(() => {
    try {
      // Get user data (username, role) from localStorage
      return JSON.parse(localStorage.getItem('user'));
    } catch (e) {
      console.warn('Could not parse user from localStorage', e);
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false); // For auth actions
  const [isAuthLoading, setIsAuthLoading] = useState(true); // For initial load

  useEffect(() => {
    // On load, set the token and user from localStorage
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        // We don't need to set the header here, api.js interceptor does it
      } catch (e) {
        console.error('Failed to parse stored user data', e);
        // Clear bad data
        localStorage.clear();
        setToken(null);
        setUser(null);
      }
    }
    setIsAuthLoading(false); // Finished initial auth check
  }, []);

  // Function to handle user login
  const login = async (username, password) => {
    setIsLoading(true);
    try {
      // Ensure API_BASE_URL doesn't have trailing slash and construct URL correctly
      const loginUrl = API_BASE_URL.endsWith('/') 
        ? `${API_BASE_URL}auth/login` 
        : `${API_BASE_URL}/auth/login`;
      console.log('Login URL:', loginUrl);
      // Use the base 'axios' instance for this public endpoint
      const response = await axios.post(loginUrl, { username, password });
      const { token: newToken, role } = response.data;

      const userData = { username, role };

      // Store in state
      setToken(newToken);
      setUser(userData);

      // Store in localStorage
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));

      setIsLoading(false);
      return { success: true };
    } catch (error) {
      setIsLoading(false);
      throw error; // Throw error to be caught by the component
    }
  };

  // Function to handle user registration
  const register = async (username, password) => {
    setIsLoading(true);
    try {
      // Ensure API_BASE_URL doesn't have trailing slash and construct URL correctly
      const registerUrl = API_BASE_URL.endsWith('/') 
        ? `${API_BASE_URL}auth/register` 
        : `${API_BASE_URL}/auth/register`;
      console.log('Register URL:', registerUrl);
      // Register is also public, so use the base axios instance
      await axios.post(registerUrl, { username, password });
      setIsLoading(false);
      return { success: true };
    } catch (error) {
      setIsLoading(false);
      throw error; // Throw error to be caught by the component
    }
  };

  // Function to handle user logout
  const logout = () => {
    // Clear from state
    setToken(null);
    setUser(null);

    // Clear from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Redirect to login page
    window.location.href = '/login';
  };

  // Memoize the context value
  const value = {
    token,
    user,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.role === 'ROLE_ADMIN',
    isLoading,
    isAuthLoading, // Pass this down so app can wait
    login,
    register,
    logout,
  };

  // Render children only after the initial auth check is complete
  return <AuthContext.Provider value={value}>{!isAuthLoading && children}</AuthContext.Provider>;
}

// Custom hook to easily access auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
