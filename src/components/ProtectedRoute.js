import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * A wrapper for routes that require authentication.
 * @param {{ allowedRoles: string[] }} props
 * e.g., <ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_SCHEDULER']} />
 */
function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, isAuthLoading } = useAuth();
  const location = useLocation();

  if (isAuthLoading) {
    // Show a loading spinner or placeholder while checking auth status
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Checking authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page, saving the location they tried to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // User is authenticated but not authorized
    // Redirect to home page with an error message in state (optional)
    return <Navigate to="/" state={{ error: 'Access Denied' }} replace />;
  }

  // User is authenticated and authorized
  return children;
}

export default ProtectedRoute;
