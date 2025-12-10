import React from 'react';
import { Link } from 'react-router-dom'; // Use Link for internal navigation
import { useAuth } from '../context/AuthContext'; // Import useAuth

/**
 * Footer component for the SmartSched application
 */
function Footer() {
  const currentYear = new Date().getFullYear();
  const { isAuthenticated, isAdmin } = useAuth(); // Get auth state and role

  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-section">
          <h4>SmartSched</h4>
          <p>Intelligent scheduling solution for educational institutions.</p>
        </div>
        
        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            {/* Use Link component for client-side routing */}
            <li><Link to="/">Home</Link></li>
            {/* Show links based on auth state */}
            {isAuthenticated ? (
              <>
                <li><Link to="/teachers">Teachers</Link></li>
                <li><Link to="/classrooms">Classrooms</Link></li>
                <li><Link to="/sections">Sections</Link></li>
                 {/* Admin Only Link */}
                {isAdmin && <li><Link to="/admin/users">Users</Link></li>}
              </>
            ) : (
              <>
                <li><Link to="/login">Login</Link></li>
                <li><Link to="/register">Register</Link></li>
              </>
            )}
            <li><Link to="/aboutus">About Us</Link></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h4>Features</h4>
          <ul>
            <li>AI Schedule Generation Interface</li>
            <li>Data Management (CRUD)</li>
            <li>Schedule Viewing & Export (Excel)</li>
            <li>Role-Based Access & User Management</li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h4>Contact</h4>
          <p>For support and inquiries:</p>
          <p>Email: support@smartsched.edu</p>
          <p>Phone: +63 999 000 1111</p>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {currentYear} SmartSched. All rights reserved.</p>
        <p>Designed for Consolatrix College of Toledo City, Inc.</p>
      </div>
    </footer>
  );
}

export default Footer;