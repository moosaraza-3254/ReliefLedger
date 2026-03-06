import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Register from './pages/Register.jsx';
import Login from './pages/Login.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import DonorDashboard from './pages/DonorDashboard.jsx';
import RecipientDashboard from './pages/RecipientDashboard.jsx';

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/admin-dashboard"
          element={<ProtectedRoute element={<AdminDashboard />} requiredRole="ADMIN" />}
        />
        <Route
          path="/donor-dashboard"
          element={<ProtectedRoute element={<DonorDashboard />} requiredRole="DONOR" />}
        />
        <Route
          path="/recipient-dashboard"
          element={<ProtectedRoute element={<RecipientDashboard />} requiredRole="RECIPIENT" />}
        />
      </Routes>
    </Router>
  );
}

export default App;
