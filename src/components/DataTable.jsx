import React, { useState, useEffect } from 'react';
import { Search, ExternalLink, FileText, Image as ImageIcon, Wand2, Loader2 } from 'lucide-react';
import { extractSSCPercentage } from '../services/aiService';

const normalizeCategory = (casteStr) => {
  if (!casteStr) return 'GENERAL';
  const upper = casteStr.toUpperCase();
  if (upper.includes('SC') || upper.includes('SCHEDULE CASTE')) return 'SC';
  if (upper.includes('ST') || upper.includes('SCHEDULE TRIBE')) return 'ST';
  if (upper.includes('OBC') || upper.includes('OTHER BACKWARD')) return 'OBC';
  if (upper.includes('EWS') || upper.includes('ECONOMICALLY WEAKER')) return 'EWS';
  return 'GENERAL';
};

const calculateAge = (dobString) => {
  if (!dobString) return '-';
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) return '-';
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
};

const DataTable = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [sscData, setSscData] = useState({});
  const [editingRow, setEditingRow] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [loadingRows, setLoadingRows] = useState({});
  const [isProcessingAll, setIsProcessingAll] = useState(false);

  // Load globally saved data from Vercel Blob on mount
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const res = await fetch('/api/get-ssc-data');
        if (res.ok) {
          const data = await res.json();
          setSscData(data);
        }
      } catch (err) {
        console.error("Failed to load global SSC data", err);
      }
    };
    loadSavedData();
  }, []);

  const saveToBlob = async (id, percentage) => {
    try {
      await fetch('/api/save-ssc-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, percentage })
      });
    } catch (err) {
      console.error("Failed to save to Vercel Blob", err);
    }
  };

  const processSSC = async (id, sscUrl) => {
    if (!sscUrl || loadingRows[id]) return;
    
    setLoadingRows(prev => ({ ...prev, [id]: true }));
    try {
      const percentage = await extractSSCPercentage(sscUrl);
      setSscData(prev => ({ ...prev, [id]: percentage }));
      // Save globally
      await saveToBlob(id, percentage);
    } catch (error) {
      setSscData(prev => ({ ...prev, [id]: 'Error' }));
    } finally {
      setLoadingRows(prev => ({ ...prev, [id]: false }));
    }
  };

  const startEditing = (id, currentVal) => {
    setEditingRow(id);
    setEditValue(currentVal === 'Error' || currentVal === 'N/A' ? '' : currentVal);
  };

  const saveEdit = (id) => {
    if (editValue.trim() !== '') {
      setSscData(prev => ({ ...prev, [id]: editValue }));
      // Save globally
      saveToBlob(id, editValue);
    }
    setEditingRow(null);
  };
  
  const handleKeyDown = (e, id) => {
    if (e.key === 'Enter') saveEdit(id);
    if (e.key === 'Escape') setEditingRow(null);
  };

  const processAll = async () => {
    setIsProcessingAll(true);
    for (const row of filteredData) {
      if (row.sscResultUrl && !sscData[row.id]) {
        await processSSC(row.id, row.sscResultUrl);
        // Add 4.5s delay to avoid Gemini API free tier rate limit (15 RPM)
        await new Promise(resolve => setTimeout(resolve, 4500));
      }
    }
    setIsProcessingAll(false);
  };
  
  const filteredData = data.filter(row => {
    // Text search
    const matchesSearch = Object.values(row).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Course filter
    let matchesCourse = true;
    if (filterCourse !== 'All') {
      const dbCourse = row.course ? row.course.toLowerCase() : '';
      const target = filterCourse.split(' ')[0].toLowerCase(); // e.g., "3D", "Robotics", "Tool"
      matchesCourse = dbCourse.includes(target);
    }

    // Category filter
    let matchesCategory = true;
    if (filterCategory !== 'All') {
      matchesCategory = normalizeCategory(row.caste) === filterCategory;
    }

    return matchesSearch && matchesCourse && matchesCategory;
  });

  const getFileIcon = (url, title) => {
    if (!url) return null;
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="action-link" title={title}>
        <FileText size={16} />
      </a>
    );
  };

  return (
    <div className="data-table-container glass-panel">
      <div className="table-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h3>Recent Applications</h3>
          <button 
            onClick={processAll} 
            disabled={isProcessingAll}
            className="process-all-btn"
          >
            {isProcessingAll ? <Loader2 size={16} className="spin" /> : <Wand2 size={16} />}
            {isProcessingAll ? "Processing..." : "Process All %"}
          </button>
        </div>
        <div className="table-filters">
          <div className="filter-group">
            <select 
              value={filterCourse} 
              onChange={(e) => setFilterCourse(e.target.value)}
              className="filter-select"
            >
              <option value="All">All Programs</option>
              <option value="3D Animation & Graphics">3D Animation & Graphics</option>
              <option value="Robotics & Mechatronics">Robotics & Mechatronics</option>
              <option value="Tool & Die Making">Tool & Die Making</option>
            </select>
          </div>
          
          <div className="filter-group">
            <select 
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value)}
              className="filter-select"
            >
              <option value="All">All Categories</option>
              <option value="SC">SC</option>
              <option value="ST">ST</option>
              <option value="OBC">OBC</option>
              <option value="GENERAL">GENERAL</option>
              <option value="EWS">EWS</option>
            </select>
          </div>

          <div className="search-bar">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search applicants..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </div>
      
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Name</th>
              <th>DOB</th>
              <th>Age</th>
              <th>Eligibility</th>
              <th>SSC %</th>
              <th>Category</th>
              <th>Course</th>
              <th>Docs</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((row) => (
                <tr key={row.id}>
                  <td>{row.timestamp ? row.timestamp.split(' ')[0] : '-'}</td>
                  <td className="font-medium">
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span>{row.name || '-'}</span>
                      <span className="text-secondary" style={{ fontSize: '0.8rem' }}>{row.email}</span>
                    </div>
                  </td>
                  <td>{row.dob ? row.dob : '-'}</td>
                  <td>{calculateAge(row.dob)}</td>
                  <td>
                    {calculateAge(row.dob) !== '-' ? (
                      calculateAge(row.dob) > 21 ? (
                        <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.5)' }}>
                          Not Eligible
                        </span>
                      ) : (
                        <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.5)' }}>
                          Eligible
                        </span>
                      )
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    {editingRow === row.id ? (
                      <input 
                        type="text" 
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => saveEdit(row.id)}
                        onKeyDown={(e) => handleKeyDown(e, row.id)}
                        className="search-input"
                        style={{ width: '70px', padding: '4px' }}
                      />
                    ) : sscData[row.id] ? (
                      <span 
                        className="font-medium" 
                        style={{ color: 'var(--accent)', cursor: 'pointer', borderBottom: '1px dashed var(--accent)' }}
                        onClick={() => startEditing(row.id, sscData[row.id])}
                        title="Click to edit manually"
                      >
                        {sscData[row.id]}
                      </span>
                    ) : row.sscResultUrl ? (
                      <button 
                        onClick={() => processSSC(row.id, row.sscResultUrl)}
                        disabled={loadingRows[row.id]}
                        className="extract-btn"
                      >
                        {loadingRows[row.id] ? <Loader2 size={14} className="spin" /> : <Wand2 size={14} />}
                        Extract
                      </button>
                    ) : (
                      <span className="text-secondary">-</span>
                    )}
                  </td>
                  <td>
                    <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none' }}>
                      {normalizeCategory(row.caste)}
                    </span>
                  </td>
                  <td>
                    <span className="badge course-badge">
                      {row.course ? row.course.replace('Diploma in ', '') : '-'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    {getFileIcon(row.casteDocUrl, "Caste Certificate")}
                    {getFileIcon(row.sscResultUrl, "SSC Marksheet")}
                    {getFileIcon(row.aadhaarUrl, "Aadhaar Card")}
                    {row.paymentUrl && (
                      <a href={row.paymentUrl} target="_blank" rel="noopener noreferrer" className="action-link" title="Payment Proof">
                        <ImageIcon size={16} />
                      </a>
                    )}
                    {row.photoUrl && (
                      <a href={row.photoUrl} target="_blank" rel="noopener noreferrer" className="action-link" title="Passport Size Photo">
                        <ImageIcon size={16} />
                      </a>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="empty-state">No applications found matching your search.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="table-footer">
        Showing {filteredData.length} of {data.length} applications
      </div>
    </div>
  );
};

export default DataTable;
