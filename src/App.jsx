import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import './index.css';

function App() {
  return (
    <div className="app-root">
      <Routes>
        <Route path="/" element={<Dashboard readOnly={true} />} />
        <Route path="/admin-dashboard" element={<Dashboard readOnly={false} />} />
      </Routes>
    </div>
  );
}

export default App;
