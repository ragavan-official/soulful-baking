import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CreditCard, ArrowLeft, ShieldCheck, ShoppingBag, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import Logo from '../components/Logo';
import ShinyText from '../components/ShinyText';
import confetti from 'canvas-confetti';
import { API_BASE_URL, parseResponse } from '../config';
import { loadRazorpayScript } from '../utils/loadRazorpay';

// Resolves an R2 key or legacy full URL to a usable src for this environment.
const getMediaUrl = (keyOrUrl) => {
  if (!keyOrUrl) return '';
  if (keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://')) {
    try {
      const u = new URL(keyOrUrl);
      return `${API_BASE_URL}${u.pathname}`;
    } catch {
      return keyOrUrl;
    }
  }
  return `${API_BASE_URL}/api/media/${keyOrUrl}`;
};

const Payment = ({ user }) => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
      const data = await parseResponse(response);
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

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setPaymentLoading(true);
    setError('');

    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error('Razorpay SDK failed to load. Please check your network connection.');
      }

      const token = localStorage.getItem('token');

      // 1. Create Razorpay order on backend
      const orderResponse = await fetch(`${API_BASE_URL}/api/courses/${courseId}/razorpay-order`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const orderData = await parseResponse(orderResponse);
      if (!orderResponse.ok) {
        throw new Error(orderData.message || 'Failed to create payment order');
      }

      // 2. Open Razorpay checkout — use keyId returned by backend
      const options = {
        key: orderData.keyId, // always matches whatever key backend is using
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Soulful Baking Academy',
        description: `Unlock Course: ${orderData.courseTitle}`,
        image: '', // optional logo URL
        order_id: orderData.orderId,
        // Explicitly enable all payment methods (cards, UPI, netbanking, wallets)
        method: {
          card: true,
          upi: true,
          netbanking: true,
          wallet: true,
          emi: false,
        },
        handler: async function (response) {
          try {
            setPaymentLoading(true);
            setError('');

            // 3. Verify signature on backend
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

            const verifyData = await parseResponse(verifyResponse);
            if (!verifyResponse.ok) {
              throw new Error(verifyData.message || 'Signature verification failed');
            }

            // 4. Celebrate!
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
          name: '',
          email: '',
          contact: ''
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
          }
        }
      };

      const rzp = new window.Razorpay(options);

      // Show specific error message if card/payment fails
      rzp.on('payment.failed', function (response) {
        console.error('[Razorpay] Payment failed:', response.error);
        setError(
          response.error?.description ||
          response.error?.reason ||
          'Payment failed. Please try a different payment method or card.'
        );
        setPaymentLoading(false);
      });

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
          <button onClick={() => navigate('/')} className="btn-secondary" style={{ padding: '0.4rem 0.6rem' }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="dashboard-title">Checkout Gateway</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Finalize your registration for this masterclass.
            </p>
          </div>
        </div>
        <Logo width={50} height={50} animate={false} />
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '2rem' }}><AlertCircle size={18} /> {error}</div>}

      <div className="checkout-grid">
        {/* LEFT: ORDER SUMMARY */}
        <div className="glass-card" style={{ padding: '1.75rem', position: 'sticky', top: '20px' }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-gold)', paddingBottom: '0.75rem' }}>
            Order Summary
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {course?.thumbnail ? (
              <img
                src={getMediaUrl(course.thumbnail)}
                alt={course.title}
                style={{ width: '100%', height: '170px', objectFit: 'cover', borderRadius: '10px', border: '1px solid var(--border-gold)' }}
              />
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
                {course?.description || 'Access premium video lessons and recipes during your course validity period.'}
              </p>
            </div>

            <div style={{ borderTop: '1px solid rgba(229, 169, 60, 0.15)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Access Validity:</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '1rem' }}>
                {course?.validityDays || 365} Days
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Academy Price:</span>
              <span style={{ color: 'var(--gold-primary)', fontWeight: '700', fontSize: '1.5rem' }}>
                ₹{course?.price ? course.price.toFixed(2) : '0.00'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(229, 169, 60, 0.03)', padding: '0.75rem', borderRadius: '6px', border: '1px solid rgba(229, 169, 60, 0.1)' }}>
              <ShieldCheck size={18} style={{ color: 'var(--gold-primary)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Payments are securely processed. Immediate access granted upon successful payment.
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT: PAYMENT */}
        <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '1.25rem' }}>
            Complete Your Purchase
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: '1.6' }}>
            Click below to open the secure payment gateway. Complete the transaction using cards, UPI, wallets, or net banking.
          </p>

          <form onSubmit={handlePaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px dashed var(--border-gold)', gap: '1rem', marginBottom: '1rem' }}>
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
                <>
                  <ShoppingBag size={18} />
                  <span>Pay ₹{course?.price ? course.price.toFixed(2) : '0.00'} & Unlock</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Payment;
