import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { User, Mail, Lock, UserPlus, Shield } from 'lucide-react';
import confetti from 'canvas-confetti';
import Logo from '../components/Logo';
import SplitText from '../components/SplitText';
import ShinyText from '../components/ShinyText';
import { API_BASE_URL, parseResponse } from '../config';

const Signup = ({ user, onLoginSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [sandboxWarning, setSandboxWarning] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = location.state?.from || null;

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    // Redirect if already logged in
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/courses');
      }
    }
  }, [user, navigate]);

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ffe082', '#e5a93c', '#9e721d', '#f5ebe6']
    });
  };

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await parseResponse(response);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send verification code');
      }

      setOtpSent(true);
      setResendTimer(30);
      if (data.sandboxWarning) {
        setSandboxWarning(true);
        setSuccess('Verification OTP generated. Check the backend server logs if the email does not arrive.');
      } else {
        setSandboxWarning(false);
        setSuccess('A verification code has been sent to your email.');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong while sending verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleLocalSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    if (!otpSent) {
      await handleSendOtp();
      return;
    }

    if (!otp) {
      setError('Please enter the 6-digit OTP code');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password, otp })
      });

      const data = await parseResponse(response);

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      setSuccess('Account created successfully! Redirecting to login...');
      triggerConfetti();

      setTimeout(() => {
        navigate('/login');
      }, 1500);
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
        throw new Error(data.message || 'Google signup failed');
      }

      setSuccess('Google login successful!');
      triggerConfetti();

      // Store token and notify App — App.jsx handles redirect via useEffect
      localStorage.setItem('token', data.token);
      onLoginSuccess(data.user, fromPath);
    } catch (err) {
      setError(err.message || 'Google sign-up error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-card">
        <Logo width={90} height={90} />
        
        <div style={{ margin: '1rem 0 1.5rem', textAlign: 'center' }}>
          <h2>
            <SplitText text="Create Account" delay={0.07} />
          </h2>
          <p style={{ marginTop: '0.25rem' }}>
            <ShinyText text="Join the premium baking experience" speed={6} />
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleLocalSubmit}>
          {!otpSent ? (
            <>
              <div className="input-group">
                <label className="input-label" htmlFor="name">Full Name</label>
                <div className="input-wrapper">
                  <User className="input-icon" size={18} />
                  <input
                    id="name"
                    type="text"
                    className="input-field"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

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
                <label className="input-label" htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <Lock className="input-icon" size={18} />
                  <input
                    id="password"
                    type="password"
                    className="input-field"
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? <div className="spinner" /> : (
                  <>
                    <UserPlus size={18} />
                    Register
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <div style={{ textAlign: 'left', marginBottom: '1.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Please enter the 6-digit verification code sent to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>.
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="otp">Verification Code</label>
                <div className="input-wrapper">
                  <Shield className="input-icon" size={18} />
                  <input
                    id="otp"
                    type="text"
                    className="input-field"
                    placeholder="123456"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    required
                    autoFocus
                  />
                </div>
              </div>

              {sandboxWarning && (
                <p style={{ fontSize: '0.85rem', color: 'var(--gold-primary)', marginTop: '-0.5rem', marginBottom: '1.25rem', textAlign: 'left', lineHeight: '1.4' }}>
                  ⚠️ Resend Sandbox Mode active: check your backend terminal logs for the OTP code.
                </p>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    padding: '0.25rem 0',
                    textDecoration: 'underline'
                  }}
                >
                  Change Email
                </button>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={resendTimer > 0 || loading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: resendTimer > 0 ? 'var(--text-secondary)' : 'var(--gold-primary)',
                    cursor: resendTimer > 0 ? 'not-allowed' : 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: '500',
                    padding: '0.25rem 0',
                    opacity: resendTimer > 0 ? 0.6 : 1
                  }}
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                </button>
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? <div className="spinner" /> : (
                  <>
                    <Shield size={18} />
                    Verify & Complete Register
                  </>
                )}
              </button>
            </>
          )}
        </form>

        <div className="divider">or sign up with</div>

        <div className="google-btn-wrapper">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google OAuth initialization failed')}
            theme="filled_dark"
            shape="rectangular"
            text="signup_with"
            width="100%"
          />
        </div>

        <p style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--gold-primary)', fontWeight: '500', textDecoration: 'none' }}>
            Sign In
          </Link>
        </p>


      </div>
    </div>
  );
};

export default Signup;
