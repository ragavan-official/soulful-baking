import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { Mail, Lock, LogIn, Shield } from 'lucide-react';
import confetti from 'canvas-confetti';
import Logo from '../components/Logo';
import SplitText from '../components/SplitText';
import ShinyText from '../components/ShinyText';
import { API_BASE_URL, parseResponse } from '../config';

const Login = ({ user, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const location = useLocation();
  // Where to go after login — set by RequireAuth when redirecting here
  const fromPath = location.state?.from || null;


  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ffe082', '#e5a93c', '#9e721d', '#f5ebe6']
    });
  };

  const handleLocalSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await parseResponse(response);

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      setSuccess('Logged in successfully!');
      triggerConfetti();
      
      // Store token and notify App — App.jsx handles redirect via useEffect
      localStorage.setItem('token', data.token);
      onLoginSuccess(data.user, fromPath);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: credentialResponse.credential })
      });

      const data = await parseResponse(response);

      if (!response.ok) {
        throw new Error(data.message || 'Google authentication failed');
      }

      setSuccess('Google login successful!');
      triggerConfetti();
      
      // Store token and notify App — App.jsx handles redirect via useEffect
      localStorage.setItem('token', data.token);
      onLoginSuccess(data.user, fromPath);
    } catch (err) {
      setError(err.message || 'Google sign-in error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-card">
        <Logo width={100} height={100} />
        
        <div style={{ margin: '1rem 0 1.5rem', textAlign: 'center' }}>
          <h2>
            <SplitText text="Welcome Back" delay={0.07} />
          </h2>
          <p style={{ marginTop: '0.25rem' }}>
            <ShinyText text="Indulge your sweet cravings" speed={6} />
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleLocalSubmit}>
          <div className="input-group">
            <label className="input-label" htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={18} />
              <input
                id="email"
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="input-label" htmlFor="password">Password</label>
              <Link to="/forgot-password" style={{ color: 'var(--gold-primary)', fontSize: '0.85rem', textDecoration: 'none', fontWeight: '500' }}>
                Forgot Password?
              </Link>
            </div>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input
                id="password"
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <div className="spinner" /> : (
              <>
                <LogIn size={18} />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="divider">or sign in with</div>

        <div className="google-btn-wrapper">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google sign-in failed. Please try again.')}
            theme="filled_dark"
            shape="rectangular"
            text="signin_with"
            width={360}
          />
        </div>

        <p style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: 'var(--gold-primary)', fontWeight: '500', textDecoration: 'none' }}>
            Sign Up
          </Link>
        </p>


      </div>
    </div>
  );
};

export default Login;
