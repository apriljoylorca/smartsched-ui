import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api'; // Use centralized api instance
import { useAuth } from '../context/AuthContext'; // Import useAuth

function TeachersPage() {
    const [teachers, setTeachers] = useState([]);
    const [formData, setFormData] = useState({ name: '', department: '' });
    const [isEditing, setIsEditing] = useState(false);
    const [currentTeacherId, setCurrentTeacherId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saveLoading, setSaveLoading] = useState(false); // For form submission
    const [error, setError] = useState('');
    const { isAdmin } = useAuth(); // Get user's role

    // Fetch all teachers
    useEffect(() => {
        const fetchTeachers = async () => {
            try {
                setLoading(true);
                setError('');
                 // Add cache-busting header
                const config = { headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache', 'Expires': '0' } };
                const res = await api.get('/teachers', config); // Use 'api' instance
                setTeachers(res.data);
            } catch (err) {
                console.error("Error fetching teachers:", err);
                setError('Failed to load teachers. Please ensure the backend is running.');
            } finally {
                setLoading(false);
            }
        };
        fetchTeachers();
    }, []);

    // Handle form input changes
    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Reset form to its initial state
    const resetForm = () => {
        setFormData({ name: '', department: '' });
        setIsEditing(false);
        setCurrentTeacherId(null);
    };

    // Handle form submission (for create and update)
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSaveLoading(true); // Indicate loading during save/update

        try {
            if (isEditing) {
                // Update: Only Admin can do this
                if (!isAdmin) {
                    setError('You do not have permission to edit teachers.');
                    setSaveLoading(false);
                    return;
                }
                const res = await api.put(`/teachers/${currentTeacherId}`, formData);
                setTeachers(prevTeachers =>
                    prevTeachers.map(t => (t.id === currentTeacherId ? res.data : t))
                );
            } else {
                // Create: Admin or Scheduler
                const res = await api.post('/teachers', formData);
                setTeachers(prevTeachers => [...prevTeachers, res.data]);
            }
            resetForm();
        } catch (err) {
            console.error("Error saving teacher:", err);
            setError(`Failed to save teacher. ${err.response?.data?.message || 'Please try again.'}`);
        } finally {
             setSaveLoading(false); // Stop loading indicator
        }
    };

    // Set form for editing an existing teacher
    const handleEdit = (teacher) => {
        if (!isAdmin) return; // Should not be clickable, but extra check
        setFormData({ name: teacher.name, department: teacher.department });
        setIsEditing(true);
        setCurrentTeacherId(teacher.id);
    };

    // Handle deletion of a teacher
    const handleDelete = async (id) => {
        if (!isAdmin) return; // Should not be clickable

        const teacherToDelete = teachers.find(t => t.id === id);
        const teacherName = teacherToDelete ? teacherToDelete.name : 'this teacher';

        if (window.confirm(`Are you sure you want to delete ${teacherName}? This will also remove them from any generated schedules.`)) {
            setError('');
            try {
                await api.delete(`/teachers/${id}`);
                setTeachers(prevTeachers => prevTeachers.filter(t => t.id !== id));
                if (isEditing && currentTeacherId === id) {
                    resetForm();
                }
            } catch (err) {
                console.error("Error deleting teacher:", err);
                 setError(`Failed to delete teacher. ${err.response?.data?.message || 'The server might be down.'}`);
            }
        }
    };

    // Render logic
    return (
        <div className="page-container crud-layout-container">
             {/* Form Container */}
            <div className="crud-form-container">
                <div className="form-card">
                    {/* Admins can Add/Edit, Schedulers can only Add */}
                    <h2>{isEditing ? 'Edit Teacher' : 'Add New Teacher'}</h2>
                    {error && <p className="error-message">{error}</p>}
                    
                    {/* Show form for adding always, for editing only if admin */}
                    {(isAdmin || !isEditing) && (
                        <form onSubmit={handleFormSubmit}>
                            <div className="form-group">
                                <label htmlFor="teacherName">Name</label>
                                <input
                                    id="teacherName"
                                    type="text"
                                    name="name"
                                    placeholder="e.g., Maria Santos"
                                    value={formData.name}
                                    onChange={handleFormChange}
                                    required
                                    aria-label="Teacher Name"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="teacherDepartment">Department</label>
                                <input
                                    id="teacherDepartment"
                                    type="text"
                                    name="department"
                                    placeholder="e.g., IT Department"
                                    value={formData.department}
                                    onChange={handleFormChange}
                                    required
                                    aria-label="Teacher Department"
                                />
                            </div>
                            <div className="form-actions">
                                <button 
                                    type="submit" 
                                    className="button-primary" 
                                    disabled={saveLoading || (isEditing && !isAdmin)} // Disable update if not admin
                                >
                                    {saveLoading ? 'Saving...' : (isEditing ? 'Update Teacher' : 'Save Teacher')}
                                </button>
                                {isEditing && isAdmin && ( // Only show Cancel Edit if admin is editing
                                    <button type="button" className="button-secondary" onClick={resetForm} disabled={saveLoading}>
                                        Cancel Edit
                                    </button>
                                )}
                            </div>
                        </form>
                    )}
                     {/* Message for Schedulers if they click Edit */}
                     {isEditing && !isAdmin && (
                        <p className="info-message">Only Admins can edit teacher details.</p>
                     )}
                </div>
            </div>

             {/* List Container */}
            <div className="crud-list-container">
                <h2>Manage Teachers</h2>
                {loading && teachers.length === 0 && <p>Loading teachers...</p>}
                 {!loading && error && teachers.length === 0 && <p className="error-message">{error}</p>}

                {teachers.length > 0 ? (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Department</th>
                                <th>Schedules</th>
                                {/* Actions column only shown for Admins */}
                                {isAdmin && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {teachers
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .map(teacher => (
                                <tr key={teacher.id}>
                                    <td>{teacher.name}</td>
                                    <td>{teacher.department}</td>
                                    <td>
                                        <Link to={`/schedule/teacher/${teacher.id}`}>View Schedule</Link>
                                    </td>
                                    {/* Action buttons only shown for Admins */}
                                    {isAdmin && (
                                        <td className="action-buttons">
                                            <button 
                                                className="button-edit" 
                                                onClick={() => handleEdit(teacher)} 
                                                aria-label={`Edit ${teacher.name}`}
                                            >
                                                Edit
                                            </button>
                                            <button 
                                                className="button-delete" 
                                                onClick={() => handleDelete(teacher.id)} 
                                                aria-label={`Delete ${teacher.name}`}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                     !loading && !error && <p>No teachers found. Add one using the form.</p>
                )}
            </div>
        </div>
    );
}

export default TeachersPage;