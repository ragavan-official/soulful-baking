import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Shield, ArrowLeft, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import Logo from '../components/Logo';
import SplitText from '../components/SplitText';
import ShinyText from '../components/ShinyText';
import { API_BASE_URL, parseResponse } from '../config';

const ForgotPassword = ({ user }) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [sandboxWarning, setSandboxWarning] = useState(false);

  const navigate = useNavigate();

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
        navigate('/account');
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
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
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
        setSuccess('A password reset code has been sent to your email.');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong while sending verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (!otp) {
      setError('Please enter the 6-digit OTP code');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, otp, newPassword })
      });

      const data = await parseResponse(response);

      if (!response.ok) {
        throw new Error(data.message || 'Password reset failed');
      }

      setSuccess('Password reset successfully! Redirecting to login...');
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

  // Stagger wrapper for form items
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
  };

  return (
    <div className="auth-container">
      <motion.div 
        className="glass-card"
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5, type: 'spring' }}
        >
          <Logo width={90} height={90} />
        </motion.div>
        
        <div style={{ margin: '1rem 0 1.5rem', textAlign: 'center' }}>
          <h2>
            <SplitText text="Reset Password" delay={0.07} />
          </h2>
          <p style={{ marginTop: '0.25rem' }}>
            <ShinyText text="Recover your premium experience" speed={6} />
          </p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div 
              className="alert alert-error"
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div 
              className="alert alert-success"
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {!otpSent ? (
            <motion.form 
              key="email-form"
              onSubmit={handleSendOtp}
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, x: -30, transition: { duration: 0.25, ease: 'easeIn' } }}
            >
              <motion.div className="input-group" variants={itemVariants}>
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
              </motion.div>

              <motion.button 
                type="submit" 
                className="btn-primary" 
                disabled={loading}
                variants={itemVariants}
                whileHover={{ scale: 1.02, boxShadow: '0 8px 24px rgba(229, 169, 60, 0.2)' }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? <div className="spinner" /> : (
                  <>
                    <KeyRound size={18} />
                    Send Reset OTP
                  </>
                )}
              </motion.button>
            </motion.form>
          ) : (
            <motion.form 
              key="otp-form"
              onSubmit={handleResetSubmit}
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, x: 30, transition: { duration: 0.25, ease: 'easeIn' } }}
            >
              <motion.div style={{ textAlign: 'left', marginBottom: '1.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }} variants={itemVariants}>
                Please enter the 6-digit verification code sent to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong> and configure your new password.
              </motion.div>

              <motion.div className="input-group" variants={itemVariants}>
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
              </motion.div>

              {sandboxWarning && (
                <motion.p 
                  style={{ fontSize: '0.85rem', color: 'var(--gold-primary)', marginTop: '-0.5rem', marginBottom: '1.25rem', textAlign: 'left', lineHeight: '1.4' }}
                  variants={itemVariants}
                >
                  ⚠️ Resend Sandbox Mode active: check your backend terminal logs for the OTP code.
                </motion.p>
              )}

              <motion.div className="input-group" variants={itemVariants}>
                <label className="input-label" htmlFor="newPassword">New Password</label>
                <div className="input-wrapper">
                  <Lock className="input-icon" size={18} />
                  <input
                    id="newPassword"
                    type="password"
                    className="input-field"
                    placeholder="Min. 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
              </motion.div>

              <motion.div className="input-group" variants={itemVariants}>
                <label className="input-label" htmlFor="confirmPassword">Confirm New Password</label>
                <div className="input-wrapper">
                  <Lock className="input-icon" size={18} />
                  <input
                    id="confirmPassword"
                    type="password"
                    className="input-field"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </motion.div>

              <motion.div 
                style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}
                variants={itemVariants}
              >
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
              </motion.div>

              <motion.button 
                type="submit" 
                className="btn-primary" 
                disabled={loading}
                variants={itemVariants}
                whileHover={{ scale: 1.02, boxShadow: '0 8px 24px rgba(229, 169, 60, 0.2)' }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? <div className="spinner" /> : (
                  <>
                    <Shield size={18} />
                    Reset Password
                  </>
                )}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>

        <motion.div 
          style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Link to="/login" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowLeft size={16} />
            Back to Sign In
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
