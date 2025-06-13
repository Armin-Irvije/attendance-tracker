// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './dashboard';
import AddClient from './pages/AddClient';
import ClientPage from './pages/clientPage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/add-client" element={<AddClient />} />
        <Route path="/client/:clientId" element={<ClientPage />} />
      </Routes>
    </Router>
  );
}