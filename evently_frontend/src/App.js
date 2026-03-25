import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './Navbar';
import Home from './Home';
import Login from './Login';
import Signup from './Signup';
import Venues from './Venues';
import VenueDetail from './VenueDetail';
import VenueOwnerDashboard from './VenueOwnerDashboard';
import AdminDashboard from './AdminDashboard';
import EventOrganizerDashboard from './EventOrganizerDashboard';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setAuthChecked(true);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const handleLogin = (userData) => {
    setUser(userData);
  };

  if (!authChecked) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home user={user} onLogout={handleLogout} />} />
        <Route path="/login" element={<Login onLoginSuccess={handleLogin} />} />
        <Route path="/signup" element={<Signup onSignupSuccess={handleLogin} />} />
        <Route path="/venues" element={<Venues user={user} onLogout={handleLogout} />} />
        <Route path="/venues/:slug" element={<VenueDetail user={user} onLogout={handleLogout} />} />

        <Route
          path="/owner"
          element={
            user?.user_type === 'venue_owner' ? (
              <VenueOwnerDashboard user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login?redirect=/owner" replace />
            )
          }
        />

        <Route
          path="/organizer"
          element={
            user ? (
              <EventOrganizerDashboard user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login?redirect=/organizer" replace />
            )
          }
        />

        <Route
          path="/admin"
          element={
            user?.user_type === 'admin' ? (
              <AdminDashboard user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login?redirect=/admin" replace />
            )
          }
        />

        {/* Catch-all must always be last */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;