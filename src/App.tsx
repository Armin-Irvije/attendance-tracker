// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Dashboard from './dashboard';
import AddClient from './pages/AddClient';
import ClientPage from './pages/clientPage';
import UserManagement from './pages/UserManagement';
import Login from './login';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = () => {
      const authStatus = localStorage.getItem('isAuthenticated') || sessionStorage.getItem('isAuthenticated');
      setIsAuthenticated(!!authStatus);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
                        <Routes>
                    <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
                    <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
                    <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
                    <Route path="/add-client" element={isAuthenticated ? <AddClient /> : <Navigate to="/login" />} />
                    <Route path="/client/:clientId" element={isAuthenticated ? <ClientPage /> : <Navigate to="/login" />} />
                    <Route path="/user-management" element={isAuthenticated ? <UserManagement /> : <Navigate to="/login" />} />
                  </Routes>
    </Router>
  );
}