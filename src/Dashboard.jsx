import React, { useEffect, useState } from 'react';
import { fetchApplications } from './api';
import KpiCard from './components/KpiCard';
import { TimelineChart, CourseDistributionChart } from './components/ChartWidgets';
import { AdmissionStatusWidget } from './components/AdmissionStatusWidget';
import DataTable from './components/DataTable';
import { ChatPanel } from './components/ChatPanel';
import { Users, UserPlus, BookOpen, Loader2 } from 'lucide-react';

const Dashboard = ({ readOnly = false }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await fetchApplications();
        setData(result);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch data from Google Sheets.');
        setLoading(false);
        console.error(err);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <Loader2 className="spinner" size={48} />
        <p>Loading Dashboard Data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-screen">
        <div className="error-card glass-panel">
          <h3>Oops! Something went wrong.</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary">Try Again</button>
        </div>
      </div>
    );
  }

  // Calculate KPIs
  const totalApplications = data.length;
  // Recent applications (last 7 days approx, or simply some count)
  // Since this is mock logic for live data, we'll just show total
  
  const uniqueCourses = new Set(data.map(d => d.course)).size;
  const femaleCount = data.filter(d => d.gender && d.gender.toLowerCase() === 'female').length;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1 className="dashboard-title">IDEMI AICTE Diploma</h1>
          <p className="dashboard-subtitle">AY 2026-27 Application Tracker</p>
        </div>
        <div className="header-actions">
          <div className="status-indicator">
            <span className="dot pulse"></span>
            Live Data Sync
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        {/* KPIs Row */}
        <div className="kpi-grid">
          <KpiCard 
            title="Total Applications" 
            value={totalApplications} 
            icon={Users} 
            trend={12} 
          />
          <KpiCard 
            title="Female Applicants" 
            value={femaleCount} 
            icon={UserPlus} 
          />
          <KpiCard 
            title="Courses Offered" 
            value={uniqueCourses} 
            icon={BookOpen} 
          />
        </div>

        {/* Admission Status Infographic */}
        <AdmissionStatusWidget data={data} />
        <AdmissionStatusWidget data={data} isSecondYear={true} />

        {/* Charts Row */}
        <div className="charts-grid">
          <TimelineChart data={data} />
          <CourseDistributionChart data={data} />
        </div>

        {/* Data Table Row */}
        <div className="table-section">
          <DataTable data={data} readOnly={readOnly} />
        </div>

        <ChatPanel data={data} />
      </main>
    </div>
  );
};

export default Dashboard;
