import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Library from './views/Library';
import StudyPlayer from './views/StudyPlayer';
import AdminLogin from './views/AdminLogin';
import AdminDashboard from './views/AdminDashboard';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Library />} />
        <Route path="/study/:studyId" element={<StudyPlayer />} />
        
        {/* Admin Routes */}
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
