import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api'; // Use centralized api instance
import { useAuth } from '../context/AuthContext'; // Import useAuth

function SchedulePage() {
  const { type, id } = useParams();
  const [schedules, setSchedules] = useState([]);
  const [owner, setOwner] = useState(null);
  const [allData, setAllData] = useState({ teachers: {}, sections: {}, classrooms: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isAdmin } = useAuth(); // Get user's role
  const navigate = useNavigate(); // For redirecting after delete

  // Memoized function to fetch lookup data
  const fetchAllData = useCallback(async () => {
    // Avoid refetching if already loaded unless there was an error
    if (Object.keys(allData.teachers).length > 0 && !error) {
      return;
    }
    console.log("Fetching lookup data (teachers, sections, classrooms)...");
    try {
      const config = { headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache', 'Expires': '0' } };
      const [teachersRes, sectionsRes, classroomsRes] = await Promise.all([
        api.get('/teachers', config),
        api.get('/sections', config),
        api.get('/classrooms', config)
      ]);
      const createMap = (data) => data.reduce((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, {});

      console.log("Lookup data fetched successfully.");
      setAllData({
        teachers: createMap(teachersRes.data),
        sections: createMap(sectionsRes.data),
        classrooms: createMap(classroomsRes.data),
      });
      setError(''); // Clear previous error on successful fetch
    } catch (err) {
      console.error("Error fetching lookup data", err);
      setError('Could not load supporting data for the schedule (teachers, sections, classrooms). Backend might be down.');
      setLoading(false); // Stop loading if lookup fails
    }
  }, [allData.teachers, error]); // Depend only on teachers map and error

  // Memoized function to fetch schedule data
  const fetchSchedules = useCallback(async () => {
    // Only proceed if lookup data IS loaded and there's no error
    if (Object.keys(allData.teachers).length === 0 || error) {
      console.log("Waiting for lookup data or error state preventing schedule fetch...");
       if (error) setLoading(false); // Stop loading if lookup already failed
      return;
    }

    console.log(`Fetching schedules for ${type} ID: ${id}`);
    setLoading(true); // Start loading schedule data specifically
    setError(''); // Clear previous schedule errors
    try {
      // Set the owner from the already-fetched allData
      let foundOwner = null;
      if (type === 'teacher' && allData.teachers[id]) foundOwner = allData.teachers[id];
      if (type === 'classroom' && allData.classrooms[id]) foundOwner = allData.classrooms[id];
      if (type === 'section' && allData.sections[id]) foundOwner = allData.sections[id];

      if (foundOwner) {
          setOwner(foundOwner);
      } else {
           console.warn(`Owner ${type} with ID ${id} not found in lookup data.`);
           setError(`The ${type} with ID ${id} could not be found.`); // Set error if owner not found
           setLoading(false);
           return; // Stop execution
      }

      const config = { headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache', 'Expires': '0' } };
      const allSchedulesRes = await api.get(`/schedules/all`, config);
      console.log("Fetched all schedules, filtering now...");

      const filteredSchedules = allSchedulesRes.data.filter(s => {
        if (type === 'teacher') return s.teacherId === id;
        if (type === 'classroom') return s.classroomId === id;
        if (type === 'section') return s.sectionId === id;
        return false;
      });
      console.log(`Filtered schedules count: ${filteredSchedules.length}`);
      setSchedules(filteredSchedules);

    } catch (err) {
      console.error(`Error fetching schedule data for ${type} ${id}:`, err);
      setError(`Failed to load schedule for this ${type}.`);
    } finally {
      setLoading(false); // Stop loading schedule data
    }
  }, [type, id, allData, error]); // Depend on type, id, allData, and error

  // First effect: Fetch lookup data once
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Second effect: Fetch main schedule data, depends on lookup data being ready
  useEffect(() => {
    // Only run if lookup data is loaded and there's no error
    if (Object.keys(allData.teachers).length > 0 && !error) {
      fetchSchedules();
    }
  }, [allData, error, fetchSchedules]); // Re-run if lookup data arrives or error changes
  
  // --- NEW: Handle Export ---
  const handleExport = async () => {
    if (type !== 'section') {
      alert("Export is only available for section schedules.");
      return;
    }
    setError(''); // Clear previous errors
    try {
      const response = await api.get(`/schedules/export/section/${id}`, {
        responseType: 'blob', // Important: expect a binary file
      });
      
      const blob = new Blob([response.data], { type: 'application/vnd.ms-excel' });
      const url = window.URL.createObjectURL(blob);
      
      // Get filename from content-disposition header
      let filename = `Schedule_Section_${id}.xls`; // Default
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch.length > 1) {
          filename = filenameMatch[1];
        }
      }
      
      // Create a temporary link to trigger the download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error("Error exporting schedule:", err);
      setError("Failed to export schedule. Please try again.");
    }
  };
  
  // --- NEW: Handle Delete ---
  const handleDeleteSchedule = async () => {
    if (!isAdmin) return; // Should not be visible

    // Find a problemId from the first schedule entry for this section/teacher/classroom
    const problemId = schedules[0]?.problemId;
    if (!problemId) {
      alert("Cannot delete: This schedule does not have an associated problem ID (it may have been generated by an older version).");
      return;
    }

    if (window.confirm(`Are you sure you want to delete this generated schedule (Problem ID: ${problemId})? This action will remove ALL entries associated with this generation run and cannot be undone.`)) {
      setError(''); // Clear previous errors
      try {
        await api.delete(`/schedules/problem/${problemId}`);
        // Clear schedules from view and show success
        setSchedules([]);
        alert("Schedule deleted successfully.");
        // Navigate back to home or relevant list page
        navigate("/"); // Or navigate back to the list page if more appropriate
      } catch (err) {
        console.error("Error deleting schedule:", err);
        setError(`Failed to delete schedule. ${err.response?.data?.message || 'Please ensure the backend is running.'}`);
      }
    }
  };

  const getOwnerName = () => {
     if (owner) { // Use state if available
        switch (type) {
          case 'teacher': return owner.name;
          case 'classroom': return owner.name;
          case 'section': return `${owner.program} ${owner.yearLevel}-${owner.sectionName}`;
          default: return 'Unknown';
        }
     } else if (!loading && Object.keys(allData.teachers).length > 0) { // Fallback to allData if owner state isn't set but data loaded
        if (type === 'teacher' && allData.teachers[id]) return allData.teachers[id].name;
        if (type === 'classroom' && allData.classrooms[id]) return allData.classrooms[id].name;
        if (type === 'section' && allData.sections[id]) {
            const sec = allData.sections[id];
            return `${sec.program} ${sec.yearLevel}-${sec.sectionName}`;
        }
        return `Selected ${type}`; // Fallback if ID wasn't found
     }
     // Default while loading or if data missing
     return `Selected ${type}`;
  };

  const getEntityName = (entityType, entityId) => {
    if (!entityId) return "N/A";

    const dataMap = allData[entityType + 's']; // Adjusted to match state keys ('teachers', 'sections', 'classrooms')

    // Check if the map itself exists and has keys
    if (!dataMap || Object.keys(dataMap).length === 0) {
        return "Loading..."; // Indicate that lookup data is pending
    }

    const entity = dataMap[entityId];

    if (!entity) {
      console.warn(`Entity ${entityType} with ID ${entityId} not found in lookup map.`);
      return "Not Found"; // Entity ID exists but not in our map
    }

    if (entityType === 'section') {
      return `${entity.program} ${entity.yearLevel}-${entity.sectionName}`;
    }
    return entity.name || `Unnamed ${entityType}`; // Fallback for missing name
  };


  const daysOrder = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

  // Display loading only if not already showing an error
  if (loading && !error) return <p>Loading schedule for {getOwnerName()}...</p>;

  // If there was an error, show it prominently
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="page-container">
      <div className="schedule-page-header">
        <h2>Schedule for: {getOwnerName()}</h2>
        <div className="schedule-actions">
          {/* Export button only shows for sections */}
          {type === 'section' && schedules.length > 0 && (
            <button className="button-export" onClick={handleExport}>
              Export to XLS
            </button>
          )}
          {/* Delete button only shows for Admins and if there are schedules */}
          {isAdmin && schedules.length > 0 && (
             <button className="button-delete" onClick={handleDeleteSchedule}>
              Delete Schedule
            </button>
          )}
        </div>
      </div>

      {schedules.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th>Day</th>
              <th>Time</th>
              <th>Subject</th>
              <th>Teacher</th>
              <th>Classroom</th>
              <th>Section</th>
            </tr>
          </thead>
          <tbody>
            {schedules
              .sort((a, b) => {
                const dayComparison = daysOrder.indexOf(a.dayOfWeek) - daysOrder.indexOf(b.dayOfWeek);
                if (dayComparison !== 0) return dayComparison;
                // Attempt to parse time for proper sorting
                 try {
                     // Basic parsing assuming HH:MM AM/PM format
                     const timeA = Date.parse(`01/01/1970 ${a.startTime}`);
                     const timeB = Date.parse(`01/01/1970 ${b.startTime}`);
                     if (!isNaN(timeA) && !isNaN(timeB)) {
                         return timeA - timeB;
                     }
                 } catch (e) {
                     console.warn("Could not parse time for sorting, falling back to string compare:", a.startTime, b.startTime);
                 }
                 // Fallback to string comparison if parsing fails
                 return a.startTime.localeCompare(b.startTime);
              })
              .map(schedule => (
                <tr key={schedule.id}>
                  <td>{schedule.dayOfWeek}</td>
                  <td>{`${schedule.startTime} - ${schedule.endTime}`}</td>
                  <td>{`${schedule.subjectCode} - ${schedule.subjectName}`}</td>
                  <td>
                    {schedule.teacherId ? (
                      <Link to={`/schedule/teacher/${schedule.teacherId}`}>
                        {getEntityName('teacher', schedule.teacherId)}
                      </Link>
                    ) : (
                      'N/A' // Display N/A if teacherId is null or empty
                    )}
                  </td>
                  <td>
                     {schedule.classroomId ? (
                         <Link to={`/schedule/classroom/${schedule.classroomId}`}>
                             {getEntityName('classroom', schedule.classroomId)}
                         </Link>
                     ): 'N/A'}
                  </td>
                  <td>
                     {schedule.sectionId ? (
                         <Link to={`/schedule/section/${schedule.sectionId}`}>
                             {getEntityName('section', schedule.sectionId)}
                         </Link>
                     ): 'N/A'}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      ) : (
        <div className="form-card">
            <p>No schedules found for {getOwnerName()}. You can <Link to="/generate">generate one</Link>.</p>
        </div>
      )}
    </div>
  );
}

export default SchedulePage;

