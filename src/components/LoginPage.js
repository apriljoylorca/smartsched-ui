import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Login Page Component
 */
function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check for session expired query param
  const urlParams = new URLSearchParams(location.search);
  const sessionExpired = urlParams.get('sessionExpired');

  useEffect(() => {
    if (sessionExpired) {
      setError("Your session has expired. Please log in again.");
      // Optional: Clear the query param from URL without reloading
      // navigate(location.pathname, { replace: true });
    }
  }, [sessionExpired, location.pathname, navigate]);


  // Get the page the user was trying to access, or default to home
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await login(username, password);
      // On success, navigate to the page they were trying to reach
      navigate(from, { replace: true });
    } catch (err) {
      console.error('=== LOGIN ERROR ===');
      console.error('Error object:', err);
      console.error('Response:', err.response);
      console.error('Request URL:', err.config?.url);
      console.error('Request Base URL:', err.config?.baseURL);
      
      let errorMsg = 'Login failed. Please check your username and password.';
      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.code === 'ERR_NETWORK') {
        errorMsg = 'Cannot connect to server. Please check if the API is running.';
      } else if (err.message) {
        errorMsg = `Error: ${err.message}`;
      }
      setError(errorMsg);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="form-card auth-card">
        <h2>Login to SmartSched</h2>
        <p>Please enter your credentials to access the dashboard.</p>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              aria-label="Username"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              aria-label="Password"
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="button-primary" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
        <p className="auth-switch-text">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
