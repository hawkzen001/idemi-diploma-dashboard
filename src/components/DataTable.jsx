import React, { useState, useEffect } from 'react';
import { Search, ExternalLink, FileText, Image as ImageIcon, Wand2, Loader2, ArrowUpDown, ArrowUp, ArrowDown, Download } from 'lucide-react';
import { extractSSCPercentage } from '../services/aiService';
import staticSscData from '../data/ssc-data.json';
import Papa from 'papaparse';

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

const DataTable = ({ data, readOnly = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [sscData, setSscData] = useState(staticSscData || {});
  const [editingRow, setEditingRow] = useState(null);
  const [editValue, setEditValue] = useState('');
  
  const [categoryData, setCategoryData] = useState({});
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCategoryValue, setEditCategoryValue] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);

  const [loadingRows, setLoadingRows] = useState({});
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  // Load globally saved data from Vercel Blob on mount
  useEffect(() => {
    const loadGlobalData = async () => {
      try {
        const [sscRes, catRes] = await Promise.all([
          fetch('/api/get-ssc-data'),
          fetch('/api/get-category-data')
        ]);
        if (sscRes.ok) {
          const data = await sscRes.json();
          // Merge static data with any newly saved blob data
          setSscData(prev => ({ ...staticSscData, ...prev, ...data }));
        }
        if (catRes.ok) {
          const data = await catRes.json();
          setCategoryData(data);
        }
      } catch (error) {
        console.error('Failed to load global data', error);
      }
    };
    loadGlobalData();
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

  const saveCategory = async (id) => {
    if (editCategoryValue === categoryData[id] || 
        (!categoryData[id] && editCategoryValue === normalizeCategory(data.find(d => d.id === id)?.caste))) {
      setEditingCategory(null);
      return;
    }

    setSavingCategory(true);
    const originalCategoryData = { ...categoryData };
    setCategoryData(prev => ({ ...prev, [id]: editCategoryValue }));

    try {
      const response = await fetch('/api/save-category-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, category: editCategoryValue }),
      });
      if (!response.ok) throw new Error('Failed to save');
    } catch (error) {
      console.error('Failed to save category:', error);
      setCategoryData(originalCategoryData);
      alert('Failed to save category permanently. It has been reverted.');
    } finally {
      setSavingCategory(false);
      setEditingCategory(null);
    }
  };

  const processAll = async () => {
    setIsProcessingAll(true);
    // Use the raw 'data' array so new students are always scanned even if they are currently filtered out
    for (const row of data) {
      if (row.sscResultUrl && !sscData[row.id] && sscData[row.id] !== 'Error') {
        await processSSC(row.id, row.sscResultUrl);
        // Add 4.5s delay to avoid Gemini API free tier rate limit (15 RPM)
        await new Promise(resolve => setTimeout(resolve, 4500));
      }
    }
    setIsProcessingAll(false);
  };

  const [autoSyncDone, setAutoSyncDone] = useState(false);
  
  // Automatically start extracting newly registered students when the admin opens the dashboard
  useEffect(() => {
    if (!readOnly && data.length > 0 && Object.keys(sscData).length > 0 && !autoSyncDone) {
      setAutoSyncDone(true);
      
      // Check if any students are missing their percentage
      const needsProcessing = data.some(row => row.sscResultUrl && !sscData[row.id] && sscData[row.id] !== 'Error');
      if (needsProcessing) {
        console.log("Auto-syncing new student extractions...");
        setTimeout(() => processAll(), 1000);
      }
    }
  }, [data, sscData, readOnly, autoSyncDone]);
  
  const filteredData = data.filter(row => {
    // Text search
    const matchesSearch = Object.values(row).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Course filter
    const matchesCourse = filterCourse === 'All' || 
      (row.course && row.course.toLowerCase().includes(filterCourse.toLowerCase()));
      
    // Category filter
    const matchesCategory = filterCategory === 'All' || 
      (categoryData[row.id] || normalizeCategory(row.caste)) === filterCategory;
      
    return matchesSearch && matchesCourse && matchesCategory;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    let aValue, bValue;
    
    if (sortConfig.key === 'date') {
      aValue = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      bValue = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    } else if (sortConfig.key === 'ssc') {
      const aSsc = sscData[a.id];
      const bSsc = sscData[b.id];
      aValue = (aSsc && !isNaN(parseFloat(aSsc))) ? parseFloat(aSsc) : -1;
      bValue = (bSsc && !isNaN(parseFloat(bSsc))) ? parseFloat(bSsc) : -1;
    }
    
    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const getFileIcon = (url, title) => {
    if (!url) return null;
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="action-link" title={title}>
        <FileText size={16} />
      </a>
    );
  };

  const exportToCSV = () => {
    const exportData = sortedData.map(row => ({
      'Date': row.timestamp ? row.timestamp.split(' ')[0] : '-',
      'Name': row.name || '-',
      'Email': row.email || '-',
      'DOB': row.dob || '-',
      'Age': calculateAge(row.dob),
      'Eligibility': calculateAge(row.dob) !== '-' ? (calculateAge(row.dob) > 21 ? 'Not Eligible' : 'Eligible') : '-',
      'SSC %': sscData[row.id] || '-',
      'Category': normalizeCategory(row.caste),
      'Course': row.course ? row.course.replace('Diploma in ', '') : '-'
    }));

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "recent_applications.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="data-table-container glass-panel">
      <div className="table-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h3>Recent Applications</h3>
          {!readOnly && (
            <button 
              onClick={processAll} 
              disabled={isProcessingAll}
              className="process-all-btn"
            >
              {isProcessingAll ? <Loader2 size={16} className="spin" /> : <Wand2 size={16} />}
              {isProcessingAll ? "Processing..." : "Process All %"}
            </button>
          )}
          <button 
            onClick={exportToCSV}
            className="process-all-btn"
            style={{ background: 'var(--accent)' }}
          >
            <Download size={16} />
            Export CSV
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
              <th 
                onClick={() => requestSort('date')}
                style={{ cursor: 'pointer', userSelect: 'none', transition: 'color 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'}
                onMouseLeave={(e) => e.currentTarget.style.color = ''}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Date
                  {sortConfig.key === 'date' ? (
                    sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                  ) : <ArrowUpDown size={14} style={{ opacity: 0.3 }} />}
                </div>
              </th>
              <th>Name</th>
              <th>DOB</th>
              <th>Age</th>
              <th>Eligibility</th>
              <th 
                onClick={() => requestSort('ssc')}
                style={{ cursor: 'pointer', userSelect: 'none', transition: 'color 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'}
                onMouseLeave={(e) => e.currentTarget.style.color = ''}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  SSC %
                  {sortConfig.key === 'ssc' ? (
                    sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                  ) : <ArrowUpDown size={14} style={{ opacity: 0.3 }} />}
                </div>
              </th>
              <th>Category</th>
              <th>Course</th>
              <th>Docs</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.length > 0 ? (
              sortedData.map((row) => (
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
                    {editingRow === row.id && !readOnly ? (
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
                        style={{ 
                          color: 'var(--accent)', 
                          cursor: readOnly ? 'default' : 'pointer', 
                          borderBottom: readOnly ? 'none' : '1px dashed var(--accent)' 
                        }}
                        onClick={() => !readOnly && startEditing(row.id, sscData[row.id])}
                        title={readOnly ? "SSC Percentage" : "Click to edit manually"}
                      >
                        {sscData[row.id]}
                      </span>
                    ) : row.sscResultUrl && !readOnly ? (
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
                    {editingCategory === row.id && !readOnly ? (
                      <select
                        autoFocus
                        value={editCategoryValue}
                        onChange={(e) => setEditCategoryValue(e.target.value)}
                        onBlur={() => saveCategory(row.id)}
                        disabled={savingCategory}
                        className="edit-input"
                        style={{ padding: '4px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface-light)', color: 'var(--text-primary)' }}
                      >
                        <option value="GENERAL">GENERAL</option>
                        <option value="OBC">OBC</option>
                        <option value="SC">SC</option>
                        <option value="ST">ST</option>
                        <option value="EWS">EWS</option>
                      </select>
                    ) : (
                      <span
                        className={`badge ${categoryData[row.id] || normalizeCategory(row.caste)} ${!readOnly ? "editable-value" : ""}`}
                        onClick={() => {
                          if (!readOnly) {
                            setEditingCategory(row.id);
                            setEditCategoryValue(categoryData[row.id] || normalizeCategory(row.caste));
                          }
                        }}
                        title={!readOnly ? "Click to edit" : ""}
                        style={!readOnly ? { cursor: 'pointer' } : {}}
                      >
                        {categoryData[row.id] || normalizeCategory(row.caste)}
                      </span>
                    )}
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
