import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { flushSync } from 'react-dom';
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
import MenuPage from './views/MenuPage';
import { API_BASE_URL, parseResponse } from './config';

// Wraps a route that requires authentication.
// Saves the attempted path so Login can redirect back after success.
const RequireAuth = ({ user, children, redirectTo = '/login' }) => {
  const location = useLocation();
  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />;
  }
  return children;
};

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
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await parseResponse(response);

        if (response.ok && data && data.user) {
          setUser(data.user);
        } else {
          localStorage.removeItem('token');
        }
      } catch (err) {
        console.error('Session check error:', err);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    checkUserSession();
  }, []);

  // Called by Login/Signup after a successful auth response.
  // Uses flushSync so React commits the state update synchronously
  // before navigate() is called — eliminating any race condition.
  const handleLoginSuccess = (userData, redirectTo = null) => {
    flushSync(() => {
      setUser(userData);
    });

    if (userData.role === 'admin') {
      navigate('/admin', { replace: true });
    } else if (redirectTo && redirectTo !== '/login' && redirectTo !== '/signup') {
      navigate(redirectTo, { replace: true });
    } else {
      navigate('/courses', { replace: true });
    }
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
        <Route path="/" element={<Home user={user} onLogout={handleLogout} />} />

        <Route path="/login"  element={<Login  user={user} onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/signup" element={<Signup user={user} onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/forgot-password" element={<ForgotPassword user={user} />} />

        <Route
          path="/account"
          element={
            <RequireAuth user={user}>
              <Account user={user} onLogout={handleLogout} />
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            user && user.role === 'admin' ? (
              <AdminDashboard user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/courses" replace />
            )
          }
        />
        <Route
          path="/courses"
          element={
            <RequireAuth user={user}>
              <CoursesCatalog />
            </RequireAuth>
          }
        />
        <Route
          path="/courses/:courseId"
          element={
            <RequireAuth user={user}>
              <CoursePlayer />
            </RequireAuth>
          }
        />
        <Route
          path="/payment/:courseId"
          element={
            <RequireAuth user={user}>
              <Payment user={user} />
            </RequireAuth>
          }
        />

        <Route path="/menu" element={<MenuPage user={user} onLogout={handleLogout} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default App;
