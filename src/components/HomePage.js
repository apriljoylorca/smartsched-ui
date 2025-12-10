import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api'; // Use centralized api instance
import { useAuth } from '../context/AuthContext'; // Import useAuth

/**
 * A reusable component for a single folder (Program)
 */
function ProgramFolder({ programName, sections }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="folder-item">
      <div className="folder-header" onClick={() => setIsOpen(!isOpen)}>
        <span className="folder-icon" role="img" aria-label="folder">🗂️</span>
        <span className="folder-name">{programName}</span>
        <span className={`folder-arrow ${isOpen ? 'open' : ''}`}>▶</span>
      </div>
      <div className={`section-list ${isOpen ? '' : 'collapsed'}`}>
        <ul>
          {sections.length > 0 ? (
            sections
              .sort((a, b) => {
                // Sort by year level, then section name
                if (a.yearLevel !== b.yearLevel) {
                  return a.yearLevel - b.yearLevel;
                }
                return a.sectionName.localeCompare(b.sectionName);
              })
              .map(section => (
                <li key={section.id}>
                  <span className="file-icon" role="img" aria-label="file">📄</span>
                  <Link 
                    to={`/schedule/section/${section.id}`} 
                    className="file-link"
                  >
                    {`${section.yearLevel}-${section.sectionName}`}
                  </Link>
                </li>
              ))
          ) : (
            <li>No sections found for this program.</li>
          )}
        </ul>
      </div>
    </div>
  );
}

/**
 * The main Home Page component (Modified for Auth)
 */
function HomePage() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isAuthenticated } = useAuth(); // Get auth state

  useEffect(() => {
    // Only fetch if authenticated
    if (isAuthenticated) {
      const fetchSections = async () => {
        try {
          setLoading(true);
          setError('');
           // Add cache-busting header
          const config = { headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache', 'Expires': '0' } };
          const res = await api.get('/sections', config); // Use 'api' instance
          setSections(res.data);
        } catch (err) {
          console.error("Error fetching sections:", err);
          setError('Failed to load sections. Please ensure the backend is running and you are logged in.');
        } finally {
          setLoading(false);
        }
      };
      fetchSections();
    } else {
      // If not authenticated, don't show loading
      setLoading(false);
    }
  }, [isAuthenticated]); // Re-run effect if auth state changes

  // Group sections by program
  const programs = sections.reduce((acc, section) => {
    const program = section.program || 'Uncategorized';
    if (!acc[program]) {
      acc[program] = [];
    }
    acc[program].push(section);
    return acc;
  }, {});

  // ProtectedRoute handles the main auth check, but this prevents flashing
  if (loading && isAuthenticated) return <p>Loading programs...</p>; 
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="homepage">
      {/* Header with Title and Generate Button */}
      <header className="home-header">
        <h1>Class Schedules</h1>
        {/* Button is visible to both Admin and Scheduler */}
        <Link to="/generate" className="generate-button">
          + Generate New Schedule
        </Link>
      </header>
      
      {/* Container for the folder list */}
      <div className="folder-container">
        {Object.keys(programs).length > 0 ? (
          Object.keys(programs).sort().map(programName => (
            <ProgramFolder 
              key={programName}
              programName={programName}
              sections={programs[programName]}
            />
          ))
        ) : (
          // Only show this message if loading is done and list is empty
          !loading && <div className="form-card">
            <p>No programs found. Please add a section via the "Sections" page to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;

