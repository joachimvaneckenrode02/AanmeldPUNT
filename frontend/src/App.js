import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'sonner';

// Layout
import Layout from './components/layout/Layout';

// Public pages
import Login from './pages/Login';
import Register from './pages/Register';

// Protected pages
import Dashboard from './pages/Dashboard';
import Registration from './pages/Registration';
import AvailableStudies from './pages/AvailableStudies';
import MyRegistrations from './pages/MyRegistrations';
import Attendance from './pages/Attendance';

// Admin pages
import AdminClasses from './pages/admin/Classes';
import AdminStudyTypes from './pages/admin/StudyTypes';
import AdminAvailability from './pages/admin/Availability';
import AdminExclusionDates from './pages/admin/ExclusionDates';
import AdminEmailTemplates from './pages/admin/EmailTemplates';
import AdminRegistrations from './pages/admin/Registrations';
import AdminReports from './pages/admin/Reports';
import AdminUsers from './pages/admin/Users';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="aanmelden" element={<Registration />} />
            <Route path="beschikbaar" element={<AvailableStudies />} />
            <Route path="mijn-aanmeldingen" element={<MyRegistrations />} />
            <Route path="aanwezigheden" element={<Attendance />} />
            
            {/* Admin routes */}
            <Route path="admin/klassen" element={<AdminClasses />} />
            <Route path="admin/studiesoorten" element={<AdminStudyTypes />} />
            <Route path="admin/beschikbaarheid" element={<AdminAvailability />} />
            <Route path="admin/uitsluitingen" element={<AdminExclusionDates />} />
            <Route path="admin/email-templates" element={<AdminEmailTemplates />} />
            <Route path="admin/aanmeldingen" element={<AdminRegistrations />} />
            <Route path="admin/rapporten" element={<AdminReports />} />
            <Route path="admin/gebruikers" element={<AdminUsers />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}

export default App;
