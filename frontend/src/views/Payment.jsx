import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  CreditCard, ArrowLeft, ShieldCheck, ShoppingBag, Sparkles, 
  AlertCircle, CheckCircle2, Phone, MessageSquare, RefreshCw
} from 'lucide-react';
import Logo from '../components/Logo';
import ShinyText from '../components/ShinyText';
import confetti from 'canvas-confetti';
import { API_BASE_URL, RAZORPAY_KEY_ID } from '../config';

const Payment = ({ user }) => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Phone OTP flow states
  // step: 'phone' → 'otp' → 'pay'
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState(user?.phone || '');
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [devOtp, setDevOtp] = useState(''); // shows OTP in dev mode when no SMS key

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    fetchCourseDetails();
  }, [courseId]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/courses/${courseId}?t=${Date.now()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to load course details');

      if (data.isPurchased) {
        navigate(`/courses/${courseId}`);
        return;
      }

      setCourse(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error loading checkout');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Send OTP to phone
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      setError('Please enter a valid 10-digit Indian mobile number');
      return;
    }
    setError('');
    setOtpLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/courses/${courseId}/send-payment-otp`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to send OTP');

      setOtpSent(true);
      setStep('otp');
      setResendTimer(30);
      if (data.devOtp) setDevOtp(data.devOtp); // show OTP in dev when no SMS key
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Step 2: Verify OTP → unlock Razorpay
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }
    setError('');
    setOtpLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/courses/${courseId}/verify-payment-otp`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ otp })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Invalid OTP');

      // OTP verified → move to payment step
      setStep('pay');
      setDevOtp('');
    } catch (err) {
      setError(err.message || 'OTP verification failed. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Step 3: Open Razorpay
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setPaymentLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');

      // Create Razorpay order on the backend
      const orderResponse = await fetch(`${API_BASE_URL}/api/courses/${courseId}/razorpay-order`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const orderData = await orderResponse.json();
      if (!orderResponse.ok) {
        throw new Error(orderData.message || 'Failed to create payment order');
      }

      // Open Razorpay checkout widget
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Soulful Baking Academy',
        description: `Unlock Course: ${orderData.courseTitle}`,
        order_id: orderData.orderId,
        config: {
          display: {
            hide: [],
            preferences: { show_default_blocks: true }
          }
        },
        handler: async function (response) {
          try {
            setPaymentLoading(true);
            setError('');

            const verifyResponse = await fetch(`${API_BASE_URL}/api/courses/${courseId}/razorpay-verify`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            const verifyData = await verifyResponse.json();
            if (!verifyResponse.ok) {
              throw new Error(verifyData.message || 'Signature verification failed');
            }

            confetti({
              particleCount: 150,
              spread: 80,
              origin: { y: 0.6 },
              colors: ['#e5a93c', '#fff', '#28c76f']
            });

            setSuccess(true);
            setTimeout(() => navigate(`/courses/${courseId}`), 2500);

          } catch (err) {
            console.error('Verification error:', err);
            setError(err.message || 'Error verifying payment signature');
          } finally {
            setPaymentLoading(false);
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: `+91${phone}`
        },
        notes: {
          courseId: courseId,
          userId: user?.id || user?._id || ''
        },
        theme: { color: '#e5a93c' },
        retry: { enabled: true, max_count: 3 },
        timeout: 900,
        modal: {
          escape: true,
          backdropclose: false,
          ondismiss: function () {
            setPaymentLoading(false);
            console.log('Payment modal dismissed');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      console.error('Order creation error:', err);
      setError(err.message || 'Failed to initiate payment. Please try again.');
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="auth-container">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', borderTopColor: 'var(--gold-primary)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Securing checkout gateway...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="auth-container">
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', maxWidth: '500px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(40, 199, 111, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)', margin: '0 auto 1.5rem', border: '1px solid rgba(40, 199, 111, 0.3)' }}>
            <CheckCircle2 size={42} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
            Payment Successful!
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
            Thank you for purchasing <strong style={{ color: 'var(--gold-light)' }}>{course?.title}</strong>. Your masterclass classroom is now unlocked.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            <Sparkles size={16} style={{ color: 'var(--gold-primary)' }} />
            <span>Redirecting to your classroom...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container" style={{ paddingBottom: '5rem', maxWidth: '1100px' }}>
      {/* Header */}
      <div className="dashboard-header" style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate('/courses')} className="btn-secondary" style={{ padding: '0.4rem 0.6rem' }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="dashboard-title">Checkout Gateway</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              {step === 'phone' && 'Step 1 of 3 — Enter your mobile number'}
              {step === 'otp' && 'Step 2 of 3 — Verify your mobile number'}
              {step === 'pay' && 'Step 3 of 3 — Complete payment'}
            </p>
          </div>
        </div>
        <Logo width={50} height={50} animate={false} />
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '2rem' }}><AlertCircle size={18} /> {error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2.5rem', alignItems: 'start' }}>
        {/* LEFT PANEL: ORDER SUMMARY */}
        <div className="glass-card" style={{ padding: '1.75rem', position: 'sticky', top: '20px' }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-gold)', paddingBottom: '0.75rem' }}>
            Order Summary
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {course?.thumbnail ? (
              <img src={course.thumbnail} alt={course.title} style={{ width: '100%', height: '170px', objectFit: 'cover', borderRadius: '10px', border: '1px solid var(--border-gold)' }} />
            ) : (
              <div style={{ width: '100%', height: '170px', background: 'rgba(0,0,0,0.4)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-gold)' }}>
                <ShoppingBag size={40} style={{ color: 'var(--gold-primary)', opacity: 0.3 }} />
              </div>
            )}

            <div>
              <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--text-primary)' }}>
                {course?.title}
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem', lineHeight: '1.5' }}>
                {course?.description || 'Get lifetime access to premium video lessons and recipes.'}
              </p>
            </div>

            <div style={{ borderTop: '1px solid rgba(229, 169, 60, 0.15)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Academy Price:</span>
              <span style={{ color: 'var(--gold-primary)', fontWeight: '700', fontSize: '1.5rem' }}>
                ₹{course?.price ? course.price.toFixed(2) : '0.00'}
              </span>
            </div>

            {/* Progress Steps */}
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginTop: '0.5rem' }}>
              {['phone', 'otp', 'pay'].map((s, i) => (
                <React.Fragment key={s}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: step === s ? 'var(--gold-primary)' : ((['phone', 'otp', 'pay'].indexOf(step) > i) ? 'rgba(40, 199, 111, 0.3)' : 'rgba(255,255,255,0.05)'),
                    border: `1px solid ${step === s ? 'var(--gold-primary)' : 'var(--border-gold)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', fontWeight: '700',
                    color: step === s ? '#000' : 'var(--text-secondary)',
                    flexShrink: 0, transition: 'all 0.3s ease'
                  }}>
                    {['phone', 'otp', 'pay'].indexOf(step) > i ? '✓' : i + 1}
                  </div>
                  {i < 2 && <div style={{ flex: 1, height: '1px', background: 'var(--border-gold)' }} />}
                </React.Fragment>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '-0.5rem' }}>
              <span>Mobile</span>
              <span style={{ marginRight: '-0.5rem' }}>Verify</span>
              <span>Pay</span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(229, 169, 60, 0.03)', padding: '0.75rem', borderRadius: '6px', border: '1px solid rgba(229, 169, 60, 0.1)' }}>
              <ShieldCheck size={18} style={{ color: 'var(--gold-primary)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Payments are securely processed. Immediate access will be granted upon successful payment.
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

          {/* ── STEP 1: ENTER PHONE ── */}
          {step === 'phone' && (
            <>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                Verify Your Mobile
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: '1.6' }}>
                We'll send a one-time password to your mobile number to authorize this payment.
              </p>

              <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Mobile Number
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
                      color: 'var(--gold-primary)', fontSize: '0.95rem', fontWeight: '600', userSelect: 'none'
                    }}>+91</span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="98765 43210"
                      required
                      style={{
                        width: '100%', padding: '0.85rem 1rem 0.85rem 3.5rem',
                        background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-gold)',
                        borderRadius: '8px', color: 'var(--text-primary)', fontSize: '1rem',
                        letterSpacing: '1px', outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                    OTP will be sent via SMS to this number
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={otpLoading}
                  className="btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, var(--gold-primary) 0%, var(--gold-dark) 100%)',
                    boxShadow: '0 4px 15px rgba(229, 169, 60, 0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '0.5rem', padding: '0.8rem 1.5rem', fontSize: '1rem'
                  }}
                >
                  {otpLoading ? <div className="spinner" style={{ borderTopColor: '#000' }} /> : (
                    <><Phone size={18} /><span>Send OTP</span></>
                  )}
                </button>
              </form>
            </>
          )}

          {/* ── STEP 2: ENTER OTP ── */}
          {step === 'otp' && (
            <>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                Enter OTP
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem', lineHeight: '1.6' }}>
                We've sent a 6-digit OTP to <strong style={{ color: 'var(--gold-light)' }}>+91 {phone}</strong>
              </p>

              {/* Dev mode OTP helper */}
              {devOtp && (
                <div style={{
                  background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)',
                  borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#93c5fd',
                  marginBottom: '1rem', lineHeight: '1.5'
                }}>
                  <strong>🔬 Dev Mode:</strong> SMS not configured. Your OTP is <strong style={{ fontSize: '1.1rem', letterSpacing: '3px' }}>{devOtp}</strong>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: '500' }}>
                    6-Digit OTP
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="● ● ● ● ● ●"
                    autoFocus
                    required
                    style={{
                      width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.04)',
                      border: '1px solid var(--border-gold)', borderRadius: '8px',
                      color: 'var(--text-primary)', fontSize: '1.5rem', textAlign: 'center',
                      letterSpacing: '8px', outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => { setStep('phone'); setOtp(''); setError(''); setDevOtp(''); }}
                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem', padding: 0, textDecoration: 'underline' }}
                    >
                      Change number
                    </button>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={resendTimer > 0 || otpLoading}
                      style={{
                        background: 'none', border: 'none',
                        color: resendTimer > 0 ? 'var(--text-muted)' : 'var(--gold-primary)',
                        cursor: resendTimer > 0 ? 'not-allowed' : 'pointer',
                        fontSize: '0.8rem', fontWeight: '600', padding: 0,
                        display: 'flex', alignItems: 'center', gap: '0.3rem'
                      }}
                    >
                      <RefreshCw size={12} />
                      {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={otpLoading || otp.length !== 6}
                  className="btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, var(--gold-primary) 0%, var(--gold-dark) 100%)',
                    boxShadow: '0 4px 15px rgba(229, 169, 60, 0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '0.5rem', padding: '0.8rem 1.5rem', fontSize: '1rem'
                  }}
                >
                  {otpLoading ? <div className="spinner" style={{ borderTopColor: '#000' }} /> : (
                    <><MessageSquare size={18} /><span>Verify OTP</span></>
                  )}
                </button>
              </form>
            </>
          )}

          {/* ── STEP 3: PAY ── */}
          {step === 'pay' && (
            <>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                background: 'rgba(40, 199, 111, 0.08)', border: '1px solid rgba(40, 199, 111, 0.25)',
                borderRadius: '8px', padding: '0.85rem 1rem', marginBottom: '1.5rem'
              }}>
                <CheckCircle2 size={18} style={{ color: '#28c76f', flexShrink: 0 }} />
                <span style={{ fontSize: '0.85rem', color: '#86efac' }}>
                  ✅ Mobile <strong>+91 {phone}</strong> verified successfully
                </span>
              </div>

              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '1.25rem' }}>
                Complete Your Purchase
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: '1.6' }}>
                Your mobile is verified. Click below to open the secure payment gateway and complete your transaction.
              </p>

              {/* Test mode notice */}
              {RAZORPAY_KEY_ID?.startsWith('rzp_test_') && (
                <div style={{
                  background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)',
                  borderRadius: '8px', padding: '0.85rem 1rem', fontSize: '0.8rem', color: '#93c5fd',
                  lineHeight: '1.6', marginBottom: '1.5rem'
                }}>
                  <strong style={{ display: 'block', marginBottom: '0.3rem' }}>🔬 Test Mode Active</strong>
                  Use test card <strong>4111 1111 1111 1111</strong>, any future expiry, any CVV.<br />
                  When prompted for card OTP, enter <strong>1111</strong>.
                </div>
              )}

              <form onSubmit={handlePaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px dashed var(--border-gold)', gap: '1rem' }}>
                  <ShieldCheck size={48} style={{ color: 'var(--gold-primary)', opacity: 0.8 }} />
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: '600' }}>
                    Secure Payment by Razorpay
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '300px' }}>
                    Your payment credentials are encrypted and processed securely.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={paymentLoading}
                  className="btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, var(--gold-primary) 0%, var(--gold-dark) 100%)',
                    boxShadow: '0 4px 15px rgba(229, 169, 60, 0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '0.5rem', padding: '0.8rem 1.5rem', fontSize: '1rem'
                  }}
                >
                  {paymentLoading ? (
                    <div className="spinner" style={{ borderTopColor: '#000' }} />
                  ) : (
                    <><ShoppingBag size={18} /><span>Pay ₹{course?.price ? course.price.toFixed(2) : '0.00'} & Unlock</span></>
                  )}
                </button>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default Payment;
