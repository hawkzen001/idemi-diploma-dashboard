import React, { useState, useEffect, useRef } from 'react';
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

const getCourseInfo = (courseString) => {
  if (!courseString) return { code: '-', name: '-' };
  const lower = courseString.toLowerCase();
  if (lower.includes('3d animation')) return { code: '3DANI', name: '3D Animation and Graphics' };
  if (lower.includes('mechatronics') || lower.includes('robotics')) return { code: 'RM', name: 'Robotics and Mechatronics' };
  if (lower.includes('tool') || lower.includes('die')) return { code: 'TD', name: 'Tool & Die Making' };
  return { code: courseString, name: courseString };
};

const DataTable = ({ data, readOnly = false }) => {
  const tableContainerRef = useRef(null);
  
  const scrollRight = () => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  const scrollLeft = () => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

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

  const [filterConsidered, setFilterConsidered] = useState('1st Year');
  const [consideredData, setConsideredData] = useState({});
  const [editingConsidered, setEditingConsidered] = useState(null);
  const [editConsideredValue, setEditConsideredValue] = useState('');
  const [savingConsidered, setSavingConsidered] = useState(false);

  const [eligibilityData, setEligibilityData] = useState({});
  const [editingEligibility, setEditingEligibility] = useState(null);
  const [editEligibilityValue, setEditEligibilityValue] = useState('');
  const [savingEligibility, setSavingEligibility] = useState(false);

  const [verificationData, setVerificationData] = useState({});
  const [editingVerification, setEditingVerification] = useState(null);
  const [editVerificationValue, setEditVerificationValue] = useState('');
  const [savingVerification, setSavingVerification] = useState(false);

  const [loadingRows, setLoadingRows] = useState({});
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  // Load globally saved data from Vercel Blob on mount
  useEffect(() => {
    const loadGlobalData = async () => {
      try {
        const [sscRes, catRes, conRes, eligRes, verifRes] = await Promise.all([
          fetch('/api/get-ssc-data'),
          fetch('/api/get-category-data'),
          fetch('/api/get-considered-data'),
          fetch('/api/get-eligibility-data'),
          fetch('/api/get-verification-data')
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
        if (conRes.ok) {
          const data = await conRes.json();
          setConsideredData(data);
        }
        if (eligRes.ok) {
          const data = await eligRes.json();
          setEligibilityData(data);
        }
        if (verifRes.ok) {
          const data = await verifRes.json();
          setVerificationData(data);
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

  const saveConsidered = async (id) => {
    if (editConsideredValue === (consideredData[id] || '1st Year')) {
      setEditingConsidered(null);
      return;
    }

    setSavingConsidered(true);
    const originalConsideredData = { ...consideredData };
    setConsideredData(prev => ({ ...prev, [id]: editConsideredValue }));

    try {
      const response = await fetch('/api/save-considered-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, consideredFor: editConsideredValue }),
      });
      if (!response.ok) throw new Error('Failed to save');
    } catch (error) {
      console.error('Failed to save considered for:', error);
      setConsideredData(originalConsideredData);
      alert('Failed to save "Applied For" permanently. It has been reverted.');
    } finally {
      setSavingConsidered(false);
      setEditingConsidered(null);
    }
  };

  const saveEligibility = async (id) => {
    if (editEligibilityValue === eligibilityData[id]) {
      setEditingEligibility(null);
      return;
    }

    setSavingEligibility(true);
    const originalEligibilityData = { ...eligibilityData };
    
    try {
      const response = await fetch('/api/save-eligibility-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, eligibility: editEligibilityValue })
      });
      if (response.ok) {
        setEligibilityData(prev => ({ ...prev, [id]: editEligibilityValue }));
      } else {
        alert('Failed to save Eligibility permanently. It has been reverted.');
      }
    } catch (error) {
      console.error(error);
      alert('Failed to save Eligibility permanently. It has been reverted.');
    } finally {
      setSavingEligibility(false);
      setEditingEligibility(null);
    }
  };

  const saveVerification = async (id) => {
    if (editVerificationValue === (verificationData[id] || 'Pending')) {
      setEditingVerification(null);
      return;
    }

    setSavingVerification(true);
    try {
      const response = await fetch('/api/save-verification-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, verification: editVerificationValue })
      });
      if (response.ok) {
        setVerificationData(prev => ({ ...prev, [id]: editVerificationValue }));
      } else {
        const errorText = await response.text();
        alert(`Failed: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to save Verification permanently. It has been reverted.');
    } finally {
      setSavingVerification(false);
      setEditingVerification(null);
    }
  };

  const getEligibility = (row) => {
    if (eligibilityData[row.id]) return eligibilityData[row.id];

    // Basic Eligibility Logic (can be updated based on specific rules)
    const age = calculateAge(row.dob);
    if (age === '-' || age < 15 || age > 24) return 'Not Eligible';
    if (!row.casteDocUrl && normalizeCategory(row.caste) !== 'GENERAL') return 'Pending Docs';
    if (!row.sscResultUrl) return 'Pending Docs';
    return 'Eligible';
  };

  const getEligibilityStyle = (status) => {
    switch (status) {
      case 'Eligible':
        return { background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.5)' };
      case 'Not Eligible':
        return { background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.5)' };
      case 'Pending Docs':
        return { background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.5)' };
      default:
        return {};
    }
  };

  const getVerification = (row) => {
    return verificationData[row.id] || 'Pending';
  };

  const getVerificationStyle = (status) => {
    switch (status) {
      case 'Verified':
        return { background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.5)' };
      case 'Rejected':
        return { background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.5)' };
      case 'Pending':
      default:
        return { background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.5)' };
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
    let matchesCourse = true;
    if (filterCourse !== 'All') {
      const courseInfo = getCourseInfo(row.course);
      matchesCourse = courseInfo.name === filterCourse;
    }
      
    // Category filter
    const matchesCategory = filterCategory === 'All' || 
      (categoryData[row.id] || normalizeCategory(row.caste)) === filterCategory;
      
    // Applied For filter
    const currentConsidered = consideredData[row.id] || '1st Year';
    const matchesConsidered = filterConsidered === 'All' || currentConsidered === filterConsidered;
      
    return matchesSearch && matchesCourse && matchesCategory && matchesConsidered;
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
    } else if (sortConfig.key === 'age') {
      const aAge = calculateAge(a.dob);
      const bAge = calculateAge(b.dob);
      aValue = aAge !== '-' ? parseInt(aAge) : -1;
      bValue = bAge !== '-' ? parseInt(bAge) : -1;
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
      'Eligibility': getEligibility(row),
      'Verification': getVerification(row),
      'SSC %': sscData[row.id] || '-',
      'Category': normalizeCategory(row.caste),
      'Course': getCourseInfo(row.course).name
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
              <option value="3D Animation and Graphics">3D Animation and Graphics</option>
              <option value="Robotics and Mechatronics">Robotics and Mechatronics</option>
              <option value="Tool & Die Making">Tool & Die Making</option>
            </select>

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

            <select 
              value={filterConsidered} 
              onChange={(e) => setFilterConsidered(e.target.value)}
              className="filter-select"
            >
              <option value="All">All Years</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
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
      
      <div className="table-responsive" ref={tableContainerRef}>
        <table className="data-table">
          <thead>
            <tr>
              <th className="sticky-col">Name</th>
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
              <th>DOB</th>
              <th 
                onClick={() => requestSort('age')}
                style={{ cursor: 'pointer', userSelect: 'none', transition: 'color 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'}
                onMouseLeave={(e) => e.currentTarget.style.color = ''}
                title="Click to sort by Age"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Age
                  {sortConfig.key === 'age' ? (
                    sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                  ) : (
                    <ArrowUpDown size={14} style={{ opacity: 0.3 }} />
                  )}
                </div>
              </th>
              <th>Eligibility</th>
              <th>Verification</th>
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
              <th>Applied For</th>
              <th>Course</th>
              <th>Docs</th>
              <th className="sticky-col-right" style={{ width: '50px' }}></th>
            </tr>
          </thead>
          <tbody>
            {sortedData.length > 0 ? (
              sortedData.map((row) => (
                <tr key={row.id}>
                  <td className="font-medium sticky-col">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button 
                        onClick={scrollLeft}
                        title="Scroll Left"
                        style={{ 
                          background: 'rgba(255,255,255,0.05)', 
                          border: '1px solid rgba(255,255,255,0.1)', 
                          color: 'var(--text-primary)', 
                          cursor: 'pointer', 
                          minWidth: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s',
                          padding: 0
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                      >
                        &lt;
                      </button>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span>{row.name || '-'}</span>
                        <span className="text-secondary" style={{ fontSize: '0.8rem' }}>{row.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>{row.timestamp ? row.timestamp.split(' ')[0] : '-'}</td>
                  <td>{row.dob ? row.dob : '-'}</td>
                  <td>{calculateAge(row.dob)}</td>
                  <td>
                    {editingEligibility === row.id && !readOnly ? (
                      <select
                        autoFocus
                        value={editEligibilityValue}
                        onChange={(e) => setEditEligibilityValue(e.target.value)}
                        onBlur={() => saveEligibility(row.id)}
                        disabled={savingEligibility}
                        className="edit-input"
                        style={{ padding: '4px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface-light)', color: 'var(--text-primary)' }}
                      >
                        <option value="Eligible">Eligible</option>
                        <option value="Not Eligible">Not Eligible</option>
                        <option value="Pending Docs">Pending Docs</option>
                      </select>
                    ) : (
                      <span
                        className={`badge ${!readOnly ? "editable-value" : ""}`}
                        onClick={() => {
                          if (!readOnly) {
                            setEditingEligibility(row.id);
                            setEditEligibilityValue(eligibilityData[row.id] || getEligibility(row));
                          }
                        }}
                        title={!readOnly ? "Click to override" : ""}
                        style={{ ...getEligibilityStyle(getEligibility(row)), ...(!readOnly ? { cursor: 'pointer' } : {}) }}
                      >
                        {getEligibility(row)}
                      </span>
                    )}
                  </td>
                  <td>
                    {editingVerification === row.id && !readOnly ? (
                      <select
                        autoFocus
                        value={editVerificationValue}
                        onChange={(e) => setEditVerificationValue(e.target.value)}
                        onBlur={() => saveVerification(row.id)}
                        disabled={savingVerification}
                        className="editable-input"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Verified">Verified</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    ) : (
                      <span
                        className={`badge ${!readOnly ? "editable-value" : ""}`}
                        onClick={() => {
                          if (!readOnly) {
                            setEditingVerification(row.id);
                            setEditVerificationValue(getVerification(row));
                          }
                        }}
                        title={!readOnly ? "Click to edit" : ""}
                        style={{ ...getVerificationStyle(getVerification(row)), ...(!readOnly ? { cursor: 'pointer' } : {}) }}
                      >
                        {getVerification(row)}
                      </span>
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
                    {editingConsidered === row.id && !readOnly ? (
                      <select
                        autoFocus
                        value={editConsideredValue}
                        onChange={(e) => setEditConsideredValue(e.target.value)}
                        onBlur={() => saveConsidered(row.id)}
                        disabled={savingConsidered}
                        className="edit-input"
                        style={{ padding: '4px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface-light)', color: 'var(--text-primary)' }}
                      >
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                      </select>
                    ) : (
                      <span
                        className={`badge ${!readOnly ? "editable-value" : ""}`}
                        onClick={() => {
                          if (!readOnly) {
                            setEditingConsidered(row.id);
                            setEditConsideredValue(consideredData[row.id] || '1st Year');
                          }
                        }}
                        title={!readOnly ? "Click to edit" : ""}
                        style={!readOnly ? { cursor: 'pointer', background: 'var(--surface-lighter)' } : { background: 'var(--surface-lighter)' }}
                      >
                        {consideredData[row.id] || '1st Year'}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="badge course-badge" title={getCourseInfo(row.course).name}>
                      {getCourseInfo(row.course).code}
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
                  <td className="sticky-col-right" style={{ padding: '0 8px' }}>
                    <button 
                      onClick={scrollRight}
                      title="Scroll Right"
                      style={{ 
                        background: 'rgba(255,255,255,0.05)', 
                        border: '1px solid rgba(255,255,255,0.1)', 
                        color: 'var(--text-primary)', 
                        cursor: 'pointer', 
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        marginLeft: 'auto'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                    >
                      &gt;
                    </button>
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
