import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import AnimatedBackground from './components/AnimatedBackground';
import Login from './views/Login';
import Signup from './views/Signup';
import ForgotPassword from './views/ForgotPassword';
import Account from './views/Account';
import AdminDashboard from './views/AdminDashboard';
import CoursesCatalog from './views/CoursesCatalog';
import CoursePlayer from './views/CoursePlayer';
import Payment from './views/Payment';
import Home from './views/Home';
import { API_BASE_URL } from './config';


const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserSession = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (response.ok) {
          setUser(data.user);
        } else {
          // Token is invalid/expired
          localStorage.removeItem('token');
        }
      } catch (err) {
        console.error('Session check error:', err);
      } finally {
        setLoading(false);
      }
    };

    checkUserSession();
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 50% 50%, #170d08 0%, #070403 100%)',
        color: 'var(--text-secondary)'
      }}>
        <AnimatedBackground />
        <div className="spinner" style={{ width: '45px', height: '45px', borderTopColor: 'var(--gold-primary)', marginBottom: '1.2rem' }} />
        <p style={{ letterSpacing: '1px', fontSize: '0.95rem' }}>Preparing sweet delicacies...</p>
      </div>
    );
  }

  return (
    <>
      <AnimatedBackground />
      <Routes>
        <Route 
          path="/" 
          element={<Home user={user} onLogout={handleLogout} />} 
        />
        <Route 
          path="/login" 
          element={<Login user={user} onLoginSuccess={handleLoginSuccess} />} 
        />
        <Route 
          path="/signup" 
          element={<Signup user={user} onLoginSuccess={handleLoginSuccess} />} 
        />
        <Route 
          path="/forgot-password" 
          element={<ForgotPassword user={user} />} 
        />
        <Route 
          path="/account" 
          element={user ? <Account user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/admin" 
          element={user && user.role === 'admin' ? (
            <AdminDashboard user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/account" replace />
          )} 
        />
        <Route 
          path="/courses" 
          element={user ? <CoursesCatalog /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/courses/:courseId" 
          element={user ? <CoursePlayer /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/payment/:courseId" 
          element={user ? <Payment user={user} /> : <Navigate to="/login" replace />} 
        />

        <Route 
          path="*" 
          element={<Navigate to="/" replace />} 
        />
      </Routes>
    </>
  );
};

export default App;
