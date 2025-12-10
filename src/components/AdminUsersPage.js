import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

/**
 * Admin-only page for managing user approvals
 */
function AdminUsersPage() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth(); // Get current admin user to prevent self-delete

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Use cache-busting headers to get fresh data
      const config = { headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache', 'Expires': '0' } };
      const [pendingRes, allRes] = await Promise.all([
        api.get('/users/pending', config),
        api.get('/users', config),
      ]);
      setPendingUsers(pendingRes.data);
      setAllUsers(allRes.data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load user data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleApprove = async (userId) => {
    try {
      await api.post(`/users/approve/${userId}`);
      // Refetch all users to update lists
      fetchUsers();
    } catch (err) {
      console.error('Error approving user:', err);
      setError('Failed to approve user.');
    }
  };

  const handleDelete = async (userId, username) => {
    if (username === user.username) {
      alert("You cannot delete your own account.");
      return;
    }
    if (window.confirm(`Are you sure you want to delete user: ${username}? This action is permanent.`)) {
      try {
        await api.delete(`/users/${userId}`);
        // Refetch all users to update lists
        fetchUsers();
      } catch (err) {
        console.error('Error deleting user:', err);
        setError('Failed to delete user.');
      }
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading user data...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1>User Management</h1>
      {error && <p className="error-message">{error}</p>}

      {/* Pending Users Section */}
      <div className="crud-list-container" style={{ marginBottom: '2rem' }}>
        <h2>Pending Approvals</h2>
        {pendingUsers.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.map((u) => (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td>{u.role.replace('ROLE_', '')}</td> {/* Nicer display */}
                  <td className="action-buttons">
                    <button
                      className="button-primary"
                      onClick={() => handleApprove(u.id)}
                      style={{ margin: 0, padding: '0.6rem 1rem' }} // More padding for this button
                    >
                      Approve
                    </button>
                    {/* Optionally add a reject/delete button here */}
                     <button
                      className="button-delete"
                      onClick={() => handleDelete(u.id, u.username)}
                      disabled={u.username === user.username} // Should never happen for pending
                    >
                      Reject/Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No users are currently pending approval.</p>
        )}
      </div>

      {/* All Users Section */}
      <div className="crud-list-container">
        <h2>All Users</h2>
        {allUsers.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map((u) => (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td>{u.role.replace('ROLE_', '')}</td> {/* Nicer display */}
                  <td>
                    {u.enabled ? (
                      <span className="status-approved">Approved</span>
                    ) : (
                      <span className="status-pending">Pending</span>
                    )}
                  </td>
                  <td className="action-buttons">
                    <button
                      className="button-delete"
                      onClick={() => handleDelete(u.id, u.username)}
                      disabled={u.username === user.username} // Admin can't delete self
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No users found.</p>
        )}
      </div>
    </div>
  );
}

export default AdminUsersPage;