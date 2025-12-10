import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Although we only need register, it's consistent

/**
 * Registration Page Component
 */
function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // Directly use the register function from useAuth hook
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      await register(username, password);
      setSuccess(
        'Registration successful! Please wait for an admin to approve your account.'
      );
      // Clear form
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      // Redirect to login after a delay
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('=== REGISTRATION ERROR ===');
      console.error('Error object:', err);
      console.error('Response:', err.response);
      console.error('Request URL:', err.config?.url);
      console.error('Request Base URL:', err.config?.baseURL);
      
      let errorMsg = 'Registration failed. Please try again.';
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
        <h2>Register Account</h2>
        <p>Register as a Scheduler. Your account will require admin approval.</p>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
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
            <label htmlFor="password">Password (min. 8 characters)</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              aria-label="Password"
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              aria-label="Confirm Password"
            />
          </div>
          <div className="form-actions">
            <button
              type="submit"
              className="button-primary"
              disabled={isLoading || success} // Disable after success
            >
              {isLoading ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
        <p className="auth-switch-text">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;