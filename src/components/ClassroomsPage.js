import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api'; // Use centralized api instance
import { useAuth } from '../context/AuthContext'; // Import useAuth

function ClassroomsPage() {
    const [classrooms, setClassrooms] = useState([]);
    const [formData, setFormData] = useState({ name: '', capacity: '', type: '' });
    const [isEditing, setIsEditing] = useState(false);
    const [currentClassroomId, setCurrentClassroomId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saveLoading, setSaveLoading] = useState(false);
    const [error, setError] = useState('');
    const { isAdmin } = useAuth(); // Get user's role

    // Fetch all classrooms
    useEffect(() => {
        const fetchClassrooms = async () => {
            try {
                setLoading(true);
                setError('');
                const config = { headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache', 'Expires': '0' } };
                const res = await api.get('/classrooms', config); // Use 'api' instance
                setClassrooms(res.data);
            } catch (err) {
                console.error("Error fetching classrooms:", err);
                setError('Failed to load classrooms. Please ensure the backend is running.');
            } finally {
                setLoading(false);
            }
        };
        fetchClassrooms();
    }, []);

    // Handle form input changes
    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Reset form to its initial state
    const resetForm = () => {
        setFormData({ name: '', capacity: '', type: '' });
        setIsEditing(false);
        setCurrentClassroomId(null);
    };

    // Handle form submission (for create and update)
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSaveLoading(true); // Indicate loading

        const capacityNum = parseInt(formData.capacity, 10);
        if (isNaN(capacityNum) || capacityNum <= 0) {
             setError('Capacity must be a valid positive number.');
             setSaveLoading(false);
             return;
        }

        const dataToSubmit = {
            ...formData,
            capacity: capacityNum
        };

        try {
            if (isEditing) {
                if (!isAdmin) {
                    setError('You do not have permission to edit classrooms.');
                    setSaveLoading(false);
                    return;
                }
                const res = await api.put(`/classrooms/${currentClassroomId}`, dataToSubmit);
                setClassrooms(prevClassrooms =>
                    prevClassrooms.map(c => (c.id === currentClassroomId ? res.data : c))
                );
            } else {
                const res = await api.post('/classrooms', dataToSubmit);
                setClassrooms(prevClassrooms => [...prevClassrooms, res.data]);
            }
            resetForm();
        } catch (err) {
            console.error("Error saving classroom:", err);
            setError(`Failed to save classroom. ${err.response?.data?.message || 'Please try again.'}`);
        } finally {
            setSaveLoading(false); // Stop loading indicator
        }
    };

    // Set form for editing an existing classroom
    const handleEdit = (classroom) => {
        if (!isAdmin) return;
        setFormData({
            name: classroom.name,
            capacity: classroom.capacity.toString(),
            type: classroom.type
        });
        setIsEditing(true);
        setCurrentClassroomId(classroom.id);
    };

    // Handle deletion of a classroom
    const handleDelete = async (id) => {
        if (!isAdmin) return;
        
        const classroomToDelete = classrooms.find(c => c.id === id);
        const classroomName = classroomToDelete ? classroomToDelete.name : 'this classroom';

        if (window.confirm(`Are you sure you want to delete ${classroomName}? This will also remove it from any generated schedules.`)) {
             setError('');
            try {
                await api.delete(`/classrooms/${id}`);
                setClassrooms(prevClassrooms => prevClassrooms.filter(c => c.id !== id));
                 if (isEditing && currentClassroomId === id) {
                    resetForm();
                }
            } catch (err) {
                console.error("Error deleting classroom:", err);
                setError(`Failed to delete classroom. ${err.response?.data?.message || 'The server might be down.'}`);
            }
        }
    };

    // Render logic
    return (
        <div className="page-container crud-layout-container">
            {/* Form Container */}
            <div className="crud-form-container">
                <div className="form-card">
                    <h2>{isEditing ? 'Edit Classroom' : 'Add New Classroom'}</h2>
                    {error && <p className="error-message">{error}</p>}

                    {(isAdmin || !isEditing) && (
                        <form onSubmit={handleFormSubmit}>
                            <div className="form-group">
                                <label htmlFor="classroomName">Name</label>
                                <input
                                    id="classroomName"
                                    type="text"
                                    name="name"
                                    placeholder="e.g., Room 301"
                                    value={formData.name}
                                    onChange={handleFormChange}
                                    required
                                    aria-label="Classroom Name"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="classroomCapacity">Capacity</label>
                                <input
                                    id="classroomCapacity"
                                    type="number"
                                    name="capacity"
                                    placeholder="e.g., 45"
                                    value={formData.capacity}
                                    onChange={handleFormChange}
                                    required
                                    min="1"
                                    aria-label="Classroom Capacity"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="classroomType">Type</label>
                                <input
                                    id="classroomType"
                                    type="text"
                                    name="type"
                                    placeholder="e.g., Lecture Room, Computer Laboratory"
                                    value={formData.type}
                                    onChange={handleFormChange}
                                    required
                                    aria-label="Classroom Type"
                                />
                            </div>
                            <div className="form-actions">
                                <button 
                                    type="submit" 
                                    className="button-primary" 
                                    disabled={saveLoading || (isEditing && !isAdmin)}
                                >
                                    {saveLoading ? 'Saving...' : (isEditing ? 'Update Classroom' : 'Save Classroom')}
                                </button>
                                {isEditing && isAdmin && (
                                    <button type="button" className="button-secondary" onClick={resetForm} disabled={saveLoading}>
                                        Cancel Edit
                                    </button>
                                )}
                            </div>
                        </form>
                    )}
                    {isEditing && !isAdmin && (
                       <p className="info-message">Only Admins can edit classroom details.</p>
                    )}
                </div>
            </div>

             {/* List Container */}
            <div className="crud-list-container">
                <h2>Manage Classrooms</h2>
                {loading && classrooms.length === 0 && <p>Loading classrooms...</p>}
                 {!loading && error && classrooms.length === 0 && <p className="error-message">{error}</p>}

                {classrooms.length > 0 ? (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Capacity</th>
                                <th>Type</th>
                                <th>Schedules</th>
                                {isAdmin && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {classrooms
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .map(classroom => (
                                <tr key={classroom.id}>
                                    <td>{classroom.name}</td>
                                    <td>{classroom.capacity}</td>
                                    <td>{classroom.type}</td>
                                    <td>
                                        <Link to={`/schedule/classroom/${classroom.id}`}>View Schedule</Link>
                                    </td>
                                    {isAdmin && (
                                        <td className="action-buttons">
                                            <button 
                                                className="button-edit" 
                                                onClick={() => handleEdit(classroom)} 
                                                aria-label={`Edit ${classroom.name}`}
                                            >
                                                Edit
                                            </button>
                                            <button 
                                                className="button-delete" 
                                                onClick={() => handleDelete(classroom.id)} 
                                                aria-label={`Delete ${classroom.name}`}
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
                     !loading && !error && <p>No classrooms found. Add one using the form.</p>
                )}
            </div>
        </div>
    );
}

export default ClassroomsPage;