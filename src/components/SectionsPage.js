import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api'; // Use centralized api instance
import { useAuth } from '../context/AuthContext'; // Import useAuth

function SectionsPage() {
    const [sections, setSections] = useState([]);
    const [formData, setFormData] = useState({
        program: '',
        yearLevel: '',
        sectionName: '',
        numberOfStudents: ''
    });
    const [isEditing, setIsEditing] = useState(false);
    const [currentSectionId, setCurrentSectionId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saveLoading, setSaveLoading] = useState(false);
    const [error, setError] = useState('');
    const { isAdmin } = useAuth(); // Get user's role

    // Fetch all sections
    useEffect(() => {
        const fetchSections = async () => {
            try {
                setLoading(true);
                setError('');
                const config = { headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache', 'Expires': '0' } };
                const res = await api.get('/sections', config); // Use 'api' instance
                setSections(res.data);
            } catch (err) {
                console.error("Error fetching sections:", err);
                setError('Failed to load sections. Please ensure the backend is running.');
            } finally {
                setLoading(false);
            }
        };
        fetchSections();
    }, []);

    // Handle form input changes
    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Reset form to its initial state
    const resetForm = () => {
        setFormData({
            program: '',
            yearLevel: '',
            sectionName: '',
            numberOfStudents: ''
        });
        setIsEditing(false);
        setCurrentSectionId(null);
    };

    // Handle form submission (for create and update)
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSaveLoading(true); // Indicate loading

        const yearLevelNum = parseInt(formData.yearLevel, 10);
        const studentsNum = parseInt(formData.numberOfStudents, 10);

        if (isNaN(yearLevelNum) || yearLevelNum <= 0) {
             setError('Year Level must be a valid positive number.');
             setSaveLoading(false);
             return;
        }
        if (isNaN(studentsNum) || studentsNum <= 0) {
             setError('Number of Students must be a valid positive number.');
             setSaveLoading(false);
             return;
        }

        const dataToSubmit = {
            ...formData,
            yearLevel: yearLevelNum,
            numberOfStudents: studentsNum
        };

        try {
            if (isEditing) {
                if (!isAdmin) {
                    setError('You do not have permission to edit sections.');
                    setSaveLoading(false);
                    return;
                }
                const res = await api.put(`/sections/${currentSectionId}`, dataToSubmit);
                setSections(prevSections =>
                    prevSections.map(sec => (sec.id === currentSectionId ? res.data : sec))
                 );
            } else {
                const res = await api.post('/sections', dataToSubmit);
                setSections(prevSections => [...prevSections, res.data]);
            }
            resetForm();
        } catch (err) {
            console.error("Error saving section:", err);
            setError(`Failed to save section. ${err.response?.data?.message || 'Please try again.'}`);
        } finally {
             setSaveLoading(false); // Stop loading indicator
        }
    };

    // Set form for editing an existing section
    const handleEdit = (section) => {
        if (!isAdmin) return;
        setFormData({
            program: section.program,
            yearLevel: section.yearLevel.toString(),
            sectionName: section.sectionName,
            numberOfStudents: section.numberOfStudents.toString()
        });
        setIsEditing(true);
        setCurrentSectionId(section.id);
    };

    // Handle deletion of a section
    const handleDelete = async (id) => {
        if (!isAdmin) return;
        
        const sectionToDelete = sections.find(s => s.id === id);
        const sectionIdentifier = sectionToDelete
            ? `${sectionToDelete.program} ${sectionToDelete.yearLevel}-${sectionToDelete.sectionName}`
            : 'this section';

        if (window.confirm(`Are you sure you want to delete ${sectionIdentifier}? This will also remove it from any generated schedules.`)) {
             setError('');
            try {
                await api.delete(`/sections/${id}`);
                setSections(prevSections => prevSections.filter(sec => sec.id !== id));
                 if (isEditing && currentSectionId === id) {
                    resetForm();
                }
            } catch (err) {
                console.error("Error deleting section:", err);
                 setError(`Failed to delete section. ${err.response?.data?.message || 'The server might be down.'}`);
            }
        }
    };

    // Render logic
    return (
        <div className="page-container crud-layout-container">
            {/* Form Container */}
            <div className="crud-form-container">
                <div className="form-card">
                    <h2>{isEditing ? 'Edit Section' : 'Add New Section'}</h2>
                    {error && <p className="error-message">{error}</p>}

                    {(isAdmin || !isEditing) && (
                        <form onSubmit={handleFormSubmit}>
                            <div className="form-group">
                                <label htmlFor="sectionProgram">Program</label>
                                <input
                                    id="sectionProgram"
                                    type="text"
                                    name="program"
                                    placeholder="e.g., BSIT"
                                    value={formData.program}
                                    onChange={handleFormChange}
                                    required
                                    aria-label="Section Program"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="sectionYearLevel">Year Level</label>
                                <input
                                    id="sectionYearLevel"
                                    type="number"
                                    name="yearLevel"
                                    placeholder="e.g., 3"
                                    value={formData.yearLevel}
                                    onChange={handleFormChange}
                                    required
                                    min="1"
                                    aria-label="Section Year Level"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="sectionName">Section Name</label>
                                <input
                                    id="sectionName"
                                    type="text"
                                    name="sectionName"
                                    placeholder="e.g., A"
                                    value={formData.sectionName}
                                    onChange={handleFormChange}
                                    required
                                    aria-label="Section Name"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="sectionNumStudents">Number of Students</label>
                                <input
                                    id="sectionNumStudents"
                                    type="number"
                                    name="numberOfStudents"
                                    placeholder="e.g., 40"
                                    value={formData.numberOfStudents}
                                    onChange={handleFormChange}
                                    required
                                    min="1"
                                    aria-label="Number of Students"
                                />
                            </div>
                            <div className="form-actions">
                                <button 
                                    type="submit" 
                                    className="button-primary" 
                                    disabled={saveLoading || (isEditing && !isAdmin)}
                                >
                                    {saveLoading ? 'Saving...' : (isEditing ? 'Update Section' : 'Save Section')}
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
                        <p className="info-message">Only Admins can edit section details.</p>
                    )}
                </div>
            </div>

            {/* List Container */}
            <div className="crud-list-container">
                <h2>Manage Sections</h2>
                {loading && sections.length === 0 && <p>Loading sections...</p>}
                 {!loading && error && sections.length === 0 && <p className="error-message">{error}</p>}

                 {sections.length > 0 ? (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Program</th>
                                <th>Year & Section</th>
                                <th>Students</th>
                                <th>Schedules</th>
                                {isAdmin && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {sections
                                // Sort sections by program, then year, then name
                                .sort((a, b) => {
                                    if (a.program !== b.program) return a.program.localeCompare(b.program);
                                    if (a.yearLevel !== b.yearLevel) return a.yearLevel - b.yearLevel;
                                    return a.sectionName.localeCompare(b.sectionName);
                                })
                                .map(section => (
                                <tr key={section.id}>
                                    <td>{section.program}</td>
                                    <td>{`${section.yearLevel}-${section.sectionName}`}</td>
                                    <td>{section.numberOfStudents}</td>
                                    <td>
                                        <Link to={`/schedule/section/${section.id}`}>View Schedule</Link>
                                    </td>
                                    {isAdmin && (
                                        <td className="action-buttons">
                                            <button 
                                                className="button-edit" 
                                                onClick={() => handleEdit(section)} 
                                                aria-label={`Edit ${section.program} ${section.yearLevel}-${section.sectionName}`}
                                            >
                                                Edit
                                            </button>
                                            <button 
                                                className="button-delete" 
                                                onClick={() => handleDelete(section.id)} 
                                                aria-label={`Delete ${section.program} ${section.yearLevel}-${section.sectionName}`}
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
                     !loading && !error && <p>No sections found. Add one using the form.</p>
                 )}
            </div>
        </div>
    );
}

export default SectionsPage;