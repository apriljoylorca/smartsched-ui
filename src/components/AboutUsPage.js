import React from 'react';

/**
 * About Us Page component
 * Updated text to reflect new features
 */
function AboutUsPage() {
  return (
    <div className="page-container">
      <div className="form-card">
        <h2>About SmartSched</h2>
        <p>
          SmartSched is an exclusive scheduling application for College Department School 
          Administrators and Schedule In-charge Personnel. It uses AI to generate optimal 
          class schedules based on user input, customizable rules, and constraints, aiming 
          to resolve conflicts and optimize student and resource allocation.
        </p>
        
        <h3>Key Features</h3>
        <ul>
          <li>AI-powered schedule generation</li>
          <li>Role-Based Access Control (Admin & Scheduler)</li>
          <li>User Approval Workflow</li>
          <li>Conflict resolution and optimization</li>
          <li>Excel Schedule Export</li>
        </ul>
        
        <h3>Our Mission</h3>
        <p>
          To provide educational institutions with an intelligent scheduling solution that 
          maximizes efficiency, minimizes conflicts, and optimizes the use of available 
          resources for the benefit of students and faculty.
        </p>
        {/* Developers Section */}
        <h3>Developers</h3>
        <div className="developers-section">
          <div className="developer-rows">
            <div className="developer-list">
              <div className="developer-card">
                <img src="/images/image1.jpg" alt="April Joy C. Lorca" className="developer-photo" />
                <div className="developer-info">
                  <strong>Programmer</strong>
                  <div>April Joy C. Lorca</div>
                </div>
              </div>
              <div className="developer-card">
                <img src="/images/image4.jpg" alt="Van Exel J. Mission" className="developer-photo" />
                <div className="developer-info">
                  <strong>Assistant Programmer</strong>
                  <div>Van Exel J. Mission</div>
                </div>
              </div>
              <div className="developer-card">
                <img src="/images/image2.jpg" alt="Andrey C. Rubio" className="developer-photo" />
                <div className="developer-info">
                  <strong>Tester</strong>
                  <div>Andrey C. Rubio</div>
                </div>
              </div>
            </div>
            <div className="developer-list">
              <div className="developer-card">
                <img src="/images/image5.jpg" alt="Clark Niño B. Purisima" className="developer-photo" />
                <div className="developer-info">
                  <strong>System Analyst</strong>
                  <div>Clark Niño B. Purisima</div>
                </div>
              </div>
              <div className="developer-card">
                <img src="/images/image6.jpg" alt="Rechiel G. Castillo" className="developer-photo" />
                <div className="developer-info">
                  <strong>Project Manager</strong>
                  <div>Rechiel G. Castillo</div>
                </div>
              </div>
              <div className="developer-card">
                <img src="/images/image3.png" alt="Genesis A. Dazo" className="developer-photo" />
                <div className="developer-info">
                  <strong>Assistant Project Manager</strong>
                  <div>Genesis A. Dazo</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* End Developers Section */}
      </div>
    </div>
  );
}

export default AboutUsPage;