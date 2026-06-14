import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

const COURSE_DATA = {
  "Diploma in 3D Animation and Graphics": {
    shortName: "3D Animation & Graphics",
    capacity: { SC: 9, ST: 5, OBC: 16, GENERAL: 30, EWS: 6 }
  },
  "Diploma in Robotics & Mechatronics": {
    shortName: "Robotics & Mechatronics",
    capacity: { SC: 5, ST: 2, OBC: 8, GENERAL: 15, EWS: 3 }
  },
  "Diploma in Tool & Die Making": {
    shortName: "Tool & Die Making",
    capacity: { SC: 9, ST: 5, OBC: 16, GENERAL: 30, EWS: 6 }
  }
};

const normalizeCaste = (casteStr) => {
  if (!casteStr) return 'GENERAL';
  const upper = casteStr.toUpperCase();
  if (upper.includes('SC') || upper.includes('SCHEDULE CASTE')) return 'SC';
  if (upper.includes('ST') || upper.includes('SCHEDULE TRIBE')) return 'ST';
  if (upper.includes('OBC') || upper.includes('OTHER BACKWARD')) return 'OBC';
  if (upper.includes('EWS') || upper.includes('ECONOMICALLY WEAKER')) return 'EWS';
  return 'GENERAL';
};

export const AdmissionStatusWidget = ({ data }) => {
  const [activeCourse, setActiveCourse] = useState(Object.keys(COURSE_DATA)[0]);

  // Use selected course configuration
  const courseConfig = COURSE_DATA[activeCourse];
  const intakeCapacity = courseConfig.capacity;
  
  // Filter registrations for the selected course
  // We do a loose match in case form data has slight variations
  const relevantData = data.filter(d => {
    if (!d.course) return false;
    const dbCourse = d.course.toLowerCase();
    const target = courseConfig.shortName.split(' ')[0].toLowerCase();
    return dbCourse.includes(target);
  });

  const registrations = {
    SC: 0, ST: 0, OBC: 0, GENERAL: 0, EWS: 0
  };

  relevantData.forEach(row => {
    const category = normalizeCaste(row.caste);
    if (registrations[category] !== undefined) {
      registrations[category]++;
    }
  });

  const chartData = [
    { name: 'SC', Capacity: intakeCapacity.SC, Registered: registrations.SC },
    { name: 'ST', Capacity: intakeCapacity.ST, Registered: registrations.ST },
    { name: 'OBC', Capacity: intakeCapacity.OBC, Registered: registrations.OBC },
    { name: 'GENERAL', Capacity: intakeCapacity.GENERAL, Registered: registrations.GENERAL },
    { name: 'EWS', Capacity: intakeCapacity.EWS, Registered: registrations.EWS },
  ];

  const totalCapacity = Object.values(intakeCapacity).reduce((a, b) => a + b, 0);
  const totalRegistered = Object.values(registrations).reduce((a, b) => a + b, 0);

  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  return (
    <div className="admission-status-container glass-panel">
      <div className="admission-header">
        <div>
          <h3>AICTE Diploma Admission Status</h3>
          <p className="subtitle">As on {currentDate}</p>
        </div>
        
        {/* Course Tabs */}
        <div className="course-tabs">
          {Object.keys(COURSE_DATA).map(courseKey => (
            <button
              key={courseKey}
              onClick={() => setActiveCourse(courseKey)}
              className={`course-tab ${activeCourse === courseKey ? 'active' : ''}`}
            >
              {COURSE_DATA[courseKey].shortName}
            </button>
          ))}
        </div>
      </div>

      <div className="infographic-body">
        {/* Table View */}
        <div className="status-table-wrapper">
          <table className="status-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>SC</th>
                <th>ST</th>
                <th>OBC</th>
                <th>GENERAL</th>
                <th className="highlight-col">Total</th>
                <th>EWS</th>
                <th className="highlight-col">Grand Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Intake Capacity</td>
                <td>{intakeCapacity.SC}</td>
                <td>{intakeCapacity.ST}</td>
                <td>{intakeCapacity.OBC}</td>
                <td>{intakeCapacity.GENERAL}</td>
                <td className="highlight-col">
                  {intakeCapacity.SC + intakeCapacity.ST + intakeCapacity.OBC + intakeCapacity.GENERAL}
                </td>
                <td>{intakeCapacity.EWS}</td>
                <td className="highlight-col">{totalCapacity}</td>
              </tr>
              <tr>
                <td>Registrations</td>
                <td>{registrations.SC}</td>
                <td>{registrations.ST}</td>
                <td>{registrations.OBC}</td>
                <td>{registrations.GENERAL}</td>
                <td className="highlight-col">
                  {registrations.SC + registrations.ST + registrations.OBC + registrations.GENERAL}
                </td>
                <td>{registrations.EWS}</td>
                <td className="highlight-col">{totalRegistered}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Visual Chart */}
        <div className="status-chart-wrapper">
          <div className="chart-title-bar">
            <h4>{courseConfig.shortName} - Capacity vs. Registrations</h4>
            <div className="total-badge small">
              <span>{totalRegistered} / {totalCapacity}</span> Total
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--text-secondary)" />
              <YAxis stroke="var(--text-secondary)" />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
                labelStyle={{ color: '#fff', fontWeight: 'bold', marginBottom: '4px' }}
              />
              <Legend />
              <Bar dataKey="Capacity" fill="var(--text-secondary)" radius={[4, 4, 0, 0]} opacity={0.5} />
              <Bar dataKey="Registered" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
