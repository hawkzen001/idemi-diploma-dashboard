import React from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#14b8a6', '#f59e0b'];

export const TimelineChart = ({ data }) => {
  // Process data for timeline (count by date)
  const timelineData = data.reduce((acc, curr) => {
    const date = curr.timestamp ? curr.timestamp.split(' ')[0] : 'Unknown';
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.keys(timelineData).map(date => ({
    date,
    count: timelineData[date]
  })).sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="chart-container">
      <h3>Applications Over Time</h3>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
            <XAxis dataKey="date" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
            <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} allowDecimals={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
              itemStyle={{ color: 'var(--text-primary)' }}
            />
            <Area type="monotone" dataKey="count" stroke="#6366f1" fillOpacity={1} fill="url(#colorCount)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const CourseDistributionChart = ({ data }) => {
  // Process data for courses
  const courseData = data.reduce((acc, curr) => {
    const course = curr.course || 'Unspecified';
    acc[course] = (acc[course] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.keys(courseData).map(course => ({
    name: course,
    value: courseData[course]
  }));

  return (
    <div className="chart-container" style={{ display: 'flex', flexDirection: 'column' }}>
      <h3>Applications by Course</h3>
      <div className="chart-wrapper" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ height: '220px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                itemStyle={{ color: 'var(--text-primary)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-legend" style={{ marginTop: 'auto', paddingTop: '1rem' }}>
          {chartData.map((entry, index) => (
            <div key={index} className="legend-item" style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', width: '100%' }}>
              <span className="legend-color" style={{ backgroundColor: COLORS[index % COLORS.length], width: '12px', height: '12px', borderRadius: '50%', marginRight: '8px', flexShrink: 0 }}></span>
              <span className="legend-label" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.name}</span>
              <span className="legend-value" style={{ fontWeight: 600, color: 'var(--text-primary)', marginLeft: '8px' }}>{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
