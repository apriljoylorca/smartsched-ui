import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../services/api';
import axios from 'axios';

/**
 * Component to test API connection and diagnose issues
 */
function ConnectionTest() {
  const [testResults, setTestResults] = useState({
    apiUrl: null,
    healthCheck: null,
    cors: null,
    authEndpoint: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    const results = {
      apiUrl: API_BASE_URL,
      healthCheck: { status: 'pending', message: 'Testing...' },
      cors: { status: 'pending', message: 'Testing...' },
      authEndpoint: { status: 'pending', message: 'Testing...' },
    };

    setTestResults(results);
    setLoading(true);

    // Test 1: Health Check
    try {
      // Construct health URL properly
      const baseUrl = API_BASE_URL.endsWith('/api') 
        ? API_BASE_URL.replace('/api', '') 
        : API_BASE_URL;
      const healthUrl = `${baseUrl}/api/health`;
      console.log('Testing health endpoint:', healthUrl);
      const healthResponse = await axios.get(healthUrl, { timeout: 5000 });
      results.healthCheck = {
        status: 'success',
        message: 'Health check passed',
        data: healthResponse.data,
      };
    } catch (error) {
      results.healthCheck = {
        status: 'error',
        message: error.message,
        details: error.code === 'ERR_NETWORK' 
          ? 'Network error - API may be down or CORS issue'
          : `HTTP ${error.response?.status}: ${error.response?.statusText}`,
      };
    }

    // Test 2: CORS Test (OPTIONS request)
    try {
      const corsUrl = API_BASE_URL + '/auth/login';
      console.log('Testing CORS:', corsUrl);
      await axios.options(corsUrl, { timeout: 5000 });
      results.cors = {
        status: 'success',
        message: 'CORS is configured correctly',
      };
    } catch (error) {
      results.cors = {
        status: 'warning',
        message: 'CORS preflight may have issues',
        details: error.message,
      };
    }

    // Test 3: Auth Endpoint (should return 400 for missing body, not 404)
    try {
      const authUrl = API_BASE_URL + '/auth/login';
      console.log('Testing auth endpoint:', authUrl);
      await axios.post(authUrl, {}, { timeout: 5000, validateStatus: () => true });
      results.authEndpoint = {
        status: 'success',
        message: 'Auth endpoint is reachable',
      };
    } catch (error) {
      if (error.code === 'ERR_NETWORK') {
        results.authEndpoint = {
          status: 'error',
          message: 'Cannot reach auth endpoint - Network error',
          details: 'Check if API is running and CORS is configured',
        };
      } else {
        results.authEndpoint = {
          status: error.response?.status === 400 ? 'success' : 'error',
          message: `Auth endpoint returned: ${error.response?.status}`,
          details: error.response?.status === 400 
            ? 'Endpoint exists (400 = bad request, which is expected without body)'
            : error.message,
        };
      }
    }

    setTestResults(results);
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>API Connection Diagnostics</h2>
      <button onClick={testConnection} disabled={loading} style={{ marginBottom: '20px' }}>
        {loading ? 'Testing...' : 'Run Tests Again'}
      </button>

      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <h3>API Configuration</h3>
        <p><strong>API_BASE_URL:</strong> {testResults.apiUrl || 'Not set'}</p>
        <p><strong>Environment Variable:</strong> {process.env.REACT_APP_API_BASE_URL || 'Not set (using default)'}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Test Results</h3>
        
        <div style={{ marginBottom: '15px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
          <h4>1. Health Check</h4>
          <p><strong>Status:</strong> 
            <span style={{ color: testResults.healthCheck?.status === 'success' ? 'green' : 'red' }}>
              {testResults.healthCheck?.status || 'pending'}
            </span>
          </p>
          <p><strong>Message:</strong> {testResults.healthCheck?.message}</p>
          {testResults.healthCheck?.details && (
            <p><strong>Details:</strong> {testResults.healthCheck.details}</p>
          )}
        </div>

        <div style={{ marginBottom: '15px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
          <h4>2. CORS Configuration</h4>
          <p><strong>Status:</strong> 
            <span style={{ color: testResults.cors?.status === 'success' ? 'green' : testResults.cors?.status === 'warning' ? 'orange' : 'red' }}>
              {testResults.cors?.status || 'pending'}
            </span>
          </p>
          <p><strong>Message:</strong> {testResults.cors?.message}</p>
          {testResults.cors?.details && (
            <p><strong>Details:</strong> {testResults.cors.details}</p>
          )}
        </div>

        <div style={{ marginBottom: '15px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
          <h4>3. Auth Endpoint</h4>
          <p><strong>Status:</strong> 
            <span style={{ color: testResults.authEndpoint?.status === 'success' ? 'green' : 'red' }}>
              {testResults.authEndpoint?.status || 'pending'}
            </span>
          </p>
          <p><strong>Message:</strong> {testResults.authEndpoint?.message}</p>
          {testResults.authEndpoint?.details && (
            <p><strong>Details:</strong> {testResults.authEndpoint.details}</p>
          )}
        </div>
      </div>

      <div style={{ padding: '15px', backgroundColor: '#fff3cd', borderRadius: '5px' }}>
        <h3>Troubleshooting Tips</h3>
        <ul>
          <li>If Health Check fails: API may be down or URL is incorrect</li>
          <li>If CORS fails: Check backend CORS configuration includes your domain</li>
          <li>If Auth Endpoint fails: Check API is running and endpoint path is correct</li>
          <li>For Vercel: Make sure REACT_APP_API_BASE_URL is set to: https://smartsched-backend.onrender.com/api</li>
        </ul>
      </div>
    </div>
  );
}

export default ConnectionTest;

