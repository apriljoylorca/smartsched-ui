import React from 'react';
import { Routes, Route, NavLink, Link, useLocation, Navigate } from 'react-router-dom';
import HomePage from './components/HomePage';
import TeachersPage from './components/TeachersPage';
import ClassroomsPage from './components/ClassroomsPage';
import SectionsPage from './components/SectionsPage';
import GenerateSchedulePage from './components/GenerateSchedulePage';
import SchedulePage from './components/SchedulePage';
import AboutUsPage from './components/AboutUsPage';
import Footer from './components/Footer';

// --- Import Auth and New Components ---
import { useAuth } from './context/AuthContext'; // Note: AuthProvider is in index.js now
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import AdminUsersPage from './components/AdminUsersPage';
import ProtectedRoute from './components/ProtectedRoute';

/**
 * AppContent contains the layout and routes.
 * It's separate from App so it can use the useAuth and useLocation hooks.
 */
function AppContent() {
  const location = useLocation();
  const { isAuthenticated, user, isAdmin, logout } = useAuth();
  
  // Show banner only on the homepage ('/') and the '/aboutus' page
  const showBanner = location.pathname === '/' || location.pathname === '/aboutus';

  return (
    <div className="app-container">
      <header className="navbar">
        <Link to="/" className="logo">SMARTSCHED</Link>
        <nav>
          {/* Conditional Nav Links based on Auth */}
          {isAuthenticated ? (
            <>
              <NavLink to="/">Home</NavLink>
              <NavLink to="/teachers">Teachers</NavLink>
              <NavLink to="/classrooms">Classrooms</NavLink>
              <NavLink to="/sections">Sections</NavLink>
              {/* Admin-only link */}
              {isAdmin && <NavLink to="/admin/users">Users</NavLink>}
              <NavLink to="/aboutus">About Us</NavLink>
              {/* Logout Button */}
              <a href="#logout" onClick={(e) => { e.preventDefault(); logout(); }} className="logout-link">
                Logout ({user?.username}) {/* Add optional chaining */}
              </a>
            </>
          ) : (
            <>
              {/* Public links */}
              <NavLink to="/aboutus">About Us</NavLink>
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/register">Register</NavLink>
            </>
          )}
        </nav>
      </header>
      
      {/* Conditionally render the banner based on the current page */}
      {showBanner && (
        <div className="image-banner">
          <img src="/images/banner.png" alt="SmartSched Banner" className="banner-image" />
        </div>
      )}

      <main className="main-content">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/aboutus" element={<AboutUsPage />} />

          {/* Protected Routes (Scheduler & Admin) */}
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_SCHEDULER']}>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teachers"
            element={
              <ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_SCHEDULER']}>
                <TeachersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/classrooms"
            element={
              <ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_SCHEDULER']}>
                <ClassroomsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sections"
            element={
              <ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_SCHEDULER']}>
                <SectionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/generate"
            element={
              <ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_SCHEDULER']}>
                <GenerateSchedulePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/schedule/:type/:id"
            element={
              <ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_SCHEDULER']}>
                <SchedulePage />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes (Admin Only) */}
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />
          
          {/* Catch-all: Redirect based on authentication status */}
          <Route 
            path="*" 
            element={<Navigate to={isAuthenticated ? '/' : '/login'} replace />} 
          />
        </Routes>
      </main>
      
      <Footer />
    </div>
  );
}

// The main App component now just renders the content
// BrowserRouter and AuthProvider are in index.js
function App() {
  return (
    <AppContent />
  );
}

export default App;