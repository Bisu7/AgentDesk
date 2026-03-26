import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import CustomerDashboard from './pages/CustomerDashboard';
import AgentDashboard from './pages/AgentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import TicketChat from './pages/TicketChat';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <div className="p-10 text-red-500">Unauthorized Access</div>;
  }
  return children;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();
  if (loading) return null; // Let ProtectedRoute handle loading if deep linking
  
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          {user?.role === 'customer' && <Navigate to="/dashboard/customer" />}
          {user?.role === 'agent' && <Navigate to="/dashboard/agent" />}
          {user?.role === 'admin' && <Navigate to="/dashboard/admin" />}
        </ProtectedRoute>
      } />
      
      <Route path="/dashboard/customer/*" element={<ProtectedRoute allowedRoles={['customer']}><CustomerDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/agent/*" element={<ProtectedRoute allowedRoles={['agent']}><AgentDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/admin/*" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/ticket/:id" element={<ProtectedRoute><TicketChat /></ProtectedRoute>} />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;
