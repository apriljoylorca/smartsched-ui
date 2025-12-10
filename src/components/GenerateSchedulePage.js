import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; // Use centralized api instance

function GenerateSchedulePage() {
    // --- State Variables ---
    const [sections, setSections] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [selectedSectionId, setSelectedSectionId] = useState('');
    const defaultSubjectState = {
        subjectCode: '',
        subjectName: '',
        teacherId: '',
        classHoursPerWeek: 3,
        isMajor: false // Default state
    };
    const [subjects, setSubjects] = useState([{...defaultSubjectState}]);
    const [loading, setLoading] = useState(false); // Used for form submission/polling
    const [loadingLists, setLoadingLists] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [pollingStatus, setPollingStatus] = useState(''); // User feedback during polling

    const navigate = useNavigate();
    const pollingIntervalRef = useRef(null); // Ref to store interval ID

    // --- Data Fetching Logic ---
    const fetchDropdownData = useCallback(async () => {
        setLoadingLists(true);
        setError('');
        const axiosConfig = { headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache', 'Expires': '0' } };
        try {
            const [sectionsRes, teachersRes] = await Promise.all([
                api.get('/sections', axiosConfig), // Use 'api' instance
                api.get('/teachers', axiosConfig) // Use 'api' instance
            ]);
            setSections(sectionsRes.data);
            setTeachers(teachersRes.data);
        } catch (err) {
            console.error("Error fetching dropdown data:", err);
            setError('Failed to load sections/teachers. Backend might be down.');
        } finally {
            setLoadingLists(false);
        }
    }, []);

    useEffect(() => {
        fetchDropdownData();
        // --- Cleanup polling on component unmount ---
        return () => {
             if (pollingIntervalRef.current) {
                 console.log("Cleaning up polling interval.");
                 clearInterval(pollingIntervalRef.current);
             }
        };
    }, [fetchDropdownData]);


    // --- Form Handlers ---
    const handleSubjectChange = (index, event) => {
        const { name, value, type, checked } = event.target;
        let newValue;
        if (type === 'checkbox') {
            newValue = checked;
        } else {
            newValue = value;
        }

        setSubjects(prevSubjects => {
            const newSubjects = prevSubjects.map((subject, i) => {
                if (i === index) {
                    const updatedSubject = { ...subject, [name]: newValue };
                    return updatedSubject;
                }
                return subject;
            });
            return newSubjects;
        });
    };

    const handleAddSubject = () => {
        if (subjects.length < 10) {
            setSubjects(prevSubjects => [...prevSubjects, { ...defaultSubjectState }]);
        }
     };
    const handleRemoveSubject = (index) => {
         if (subjects.length > 1) {
            setSubjects(prevSubjects => prevSubjects.filter((_, i) => i !== index));
        }
    };
    const handleSectionChange = (event) => {
        const newSectionId = event.target.value;
        setSelectedSectionId(newSectionId);
    };


    // --- Polling Function ---
    const checkSolverStatus = useCallback(async (problemId, sectionIdToNavigate) => {
        console.log(`Polling status for problemId: ${problemId}`);
        setPollingStatus('AI is optimizing your schedule... This may take a few minutes.');
        try {
            const res = await api.get(`/schedules/status/${problemId}`, { // Use 'api' instance
                headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache', 'Expires': '0' }
            });
            const status = res.data.status;
            console.log(`Current status for ${problemId}: ${status}`);
            
            // Update status message based on current state
            if (status === 'SOLVING_ACTIVE') {
                setPollingStatus('AI is actively solving your schedule... Please wait.');
            } else if (status === 'SOLVING_SCHEDULED') {
                setPollingStatus('AI solver is starting up... Please wait.');
            } else if (status === 'NOT_SOLVING') {
                setPollingStatus('AI has finished processing! Preparing your schedule...');
            }

            // Check if solving is finished
            if (status === 'NOT_SOLVING') {
                clearInterval(pollingIntervalRef.current); // Stop polling
                pollingIntervalRef.current = null;
                setLoading(false); // Stop main loading indicator
                setSuccess('Schedule generation complete! Redirecting to view your optimized schedule...');
                
                // Navigate after a longer delay to ensure backend processing is complete
                setTimeout(() => {
                    navigate(`/schedule/section/${sectionIdToNavigate}`);
                }, 2000); // 2 second delay to ensure backend is ready

            } else if (status !== 'SOLVING_ACTIVE' && status !== 'SOLVING_SCHEDULED') {
                 console.error(`Unexpected solver status received: ${status}`);
                 clearInterval(pollingIntervalRef.current);
                 pollingIntervalRef.current = null;
                 setError(`Solver finished with unexpected status: ${status}. Check backend logs.`);
                 setLoading(false);
                 setPollingStatus('');
            }
            // If status is SOLVING_ACTIVE or SOLVING_SCHEDULED, interval will poll again

        } catch (err) {
            console.error(`Error polling status for problemId ${problemId}:`, err);
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
            setError(`Failed to check solver status. ${err.message}`);
            setLoading(false);
            setPollingStatus('');
        }
    }, [navigate]);


    // --- Form Submission (Updated for Polling) ---
    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        setPollingStatus('');
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }

        if (!selectedSectionId) { setLoading(false); setError('Please select a section.'); return; }
        if (subjects.some(s => !s.subjectCode || !s.subjectName)) { setLoading(false); setError('Subject Code and Name are required for all subjects.'); return; }

        const scheduleInputs = subjects.map(subject => {
            const inputPayload = {
                subjectCode: subject.subjectCode,
                subjectName: subject.subjectName,
                teacherId: subject.teacherId || null,
                classHoursPerWeek: parseInt(subject.classHoursPerWeek, 10),
                isMajor: !!subject.isMajor, // Ensure boolean
                sectionId: selectedSectionId
            };
            return inputPayload;
        });

        try {
            const res = await api.post('/schedules/solve', scheduleInputs); // Use 'api' instance
            console.log("Backend response:", res.data);

            const problemId = res.data.problemId;
            if (!problemId) { throw new Error("Backend did not return a problemId."); }

            setSuccess(res.data.message || "AI scheduling process started...");
            setPollingStatus('AI is starting to optimize your schedule... Please wait.');

            const sectionIdToNavigate = selectedSectionId;
            // Don't reset form immediately, wait for navigation or failure
            // setSubjects([{...defaultSubjectState}]);
            // setSelectedSectionId('');

             // Start Polling
             checkSolverStatus(problemId, sectionIdToNavigate); // Initial check
             pollingIntervalRef.current = setInterval(() => {
                 checkSolverStatus(problemId, sectionIdToNavigate);
             }, 2000); // Poll every 2 seconds for faster response

        } catch (err) {
            console.error("Error generating schedule:", err);
             const errorMsg = err.response?.data?.message || err.message || 'Failed to start generation.';
             setError(`Error: ${errorMsg}`);
             setLoading(false); // Stop loading on initial failure
        }
     };

    // --- Render Logic ---
    return (
        <div className="page-container">
            <div className="generate-schedule-header">
                <h1>Generate New Schedule</h1>
                <p className="page-description">
                    Create an optimized class schedule by selecting a section and adding subjects. 
                    The AI will generate the best possible schedule considering all constraints.
                </p>
            </div>

            {loadingLists && (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading sections and teachers...</p>
                </div>
            )}

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            {pollingStatus && <div className="info-message">{pollingStatus}</div>}

            {/* Render form only when lists are loaded and there's no success/polling message */}
            {!error && !loadingLists && !success && !pollingStatus && (
                <div className="generation-form">
                    <form onSubmit={handleSubmit}>
                        <fieldset disabled={loading}>
                            {/* Section Selection */}
                            <div className="form-section">
                                <h3>Step 1: Select Section</h3>
                                <div className="form-group">
                                    <label htmlFor="sectionSelect">Choose the section to schedule</label>
                                    <select 
                                        id="sectionSelect" 
                                        value={selectedSectionId} 
                                        onChange={handleSectionChange} 
                                        required
                                        className="section-select"
                                    >
                                        <option value="" disabled>-- Select a Section --</option>
                                        {sections.sort((a, b) => {
                                            if (a.program !== b.program) return a.program.localeCompare(b.program);
                                            if (a.yearLevel !== b.yearLevel) return a.yearLevel - b.yearLevel;
                                            return a.sectionName.localeCompare(b.sectionName);
                                        }).map(section => (
                                            <option key={section.id} value={section.id}>
                                                {`${section.program} | ${section.yearLevel}-${section.sectionName}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Subjects Section */}
                            <div className="form-section">
                                <div className="section-header">
                                    <h3>Step 2: Add Subjects</h3>
                                    <button 
                                        type="button" 
                                        className="button-secondary add-subject-btn" 
                                        onClick={handleAddSubject} 
                                        disabled={subjects.length >= 10}
                                    >
                                        + Add Subject {subjects.length >= 10 ? '(Max 10)' : ''}
                                    </button>
                                </div>
                                
                                <div className="subjects-container">
                                    {subjects.map((subject, index) => (
                                        <div className="subject-card" key={`subject-${index}`}>
                                            <div className="subject-header">
                                                <h4>Subject {index + 1}</h4>
                                                <button 
                                                    type="button" 
                                                    className="button-delete subject-remove-btn" 
                                                    onClick={() => handleRemoveSubject(index)} 
                                                    title="Remove Subject" 
                                                    aria-label={`Remove Subject ${index+1}`} 
                                                    disabled={subjects.length <= 1}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                            
                                            <div className="subject-fields">
                                                <div className="form-group">
                                                    <label htmlFor={`subjectCode-${index}`}>Subject Code</label>
                                                    <input 
                                                        id={`subjectCode-${index}`}
                                                        type="text" 
                                                        name="subjectCode" 
                                                        placeholder="e.g., CS101" 
                                                        value={subject.subjectCode} 
                                                        onChange={event => handleSubjectChange(index, event)} 
                                                        required 
                                                        aria-label="Subject Code"
                                                    />
                                                </div>
                                                
                                                <div className="form-group">
                                                    <label htmlFor={`subjectName-${index}`}>Subject Name</label>
                                                    <input 
                                                        id={`subjectName-${index}`}
                                                        type="text" 
                                                        name="subjectName" 
                                                        placeholder="e.g., Introduction to Programming" 
                                                        value={subject.subjectName} 
                                                        onChange={event => handleSubjectChange(index, event)} 
                                                        required 
                                                        aria-label="Subject Name"
                                                    />
                                                </div>
                                                
                                                <div className="form-group">
                                                    <label htmlFor={`teacher-${index}`}>Teacher</label>
                                                    <select 
                                                        id={`teacher-${index}`}
                                                        name="teacherId" 
                                                        value={subject.teacherId} 
                                                        onChange={event => handleSubjectChange(index, event)}
                                                        aria-label="Select Teacher"
                                                    >
                                                        <option value="">-- No Teacher Assigned --</option>
                                                        {teachers.sort((a,b) => a.name.localeCompare(b.name))
                                                            .map(teacher => ( 
                                                                <option key={teacher.id} value={teacher.id}>
                                                                    {teacher.name}
                                                                </option> 
                                                            ))
                                                        }
                                                    </select>
                                                </div>
                                                
                                                <div className="form-group">
                                                    <label htmlFor={`hours-${index}`}>Hours per Week</label>
                                                    <select 
                                                        id={`hours-${index}`}
                                                        name="classHoursPerWeek" 
                                                        value={subject.classHoursPerWeek} 
                                                        onChange={event => handleSubjectChange(index, event)}
                                                        aria-label="Select Hours per Week"
                                                    >
                                                        <option value={1}>1 hour/week</option>
                                                        <option value={2}>2 hours/week</option>
                                                        <option value={3}>3 hours/week</option>
                                                        <option value={4}>4 hours/week</option>
                                                        <option value={5}>5 hours/week</option>
                                                    </select>
                                                </div>
                                                
                                                <div className="form-group checkbox-group">
                                                    <label className="checkbox-label" htmlFor={`isMajor-${index}`}>
                                                        <input 
                                                            id={`isMajor-${index}`} 
                                                            type="checkbox" 
                                                            name="isMajor" 
                                                            checked={!!subject.isMajor} 
                                                            onChange={event => handleSubjectChange(index, event)} 
                                                        />
                                                        <span className="checkbox-custom"></span>
                                                        Major Subject / Lab
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Submit Section */}
                            <div className="form-section submit-section">
                                <div className="form-actions">
                                    <button 
                                        type="submit" 
                                        className="button-primary generate-btn" 
                                        disabled={loadingLists || loading || !selectedSectionId}
                                    >
                                        {loading ? (
                                            <>
                                                <div className="loading-spinner small"></div>
                                                Processing...
                                            </>
                                        ) : (
                                            'Generate Schedule'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </fieldset>
                    </form>
                </div>
            )}
             {/* Show message if process started but not finished */}
             {(success || pollingStatus) && !error && (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>{pollingStatus || success}</p>
                    <p>Please wait, this may take a few minutes...</p>
                </div>
            )}
        </div>
    );
}

export default GenerateSchedulePage;