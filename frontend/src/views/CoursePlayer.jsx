import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Play, Lock, Clock, Calendar, ArrowLeft, Film, AlertTriangle, 
  FileText, DownloadCloud, Sparkles, AlertCircle, CheckCircle2, ShieldCheck, ShoppingBag
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { API_BASE_URL, parseResponse } from '../config';

// Resolves a media key or legacy full URL to a usable src for this environment.
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

const CoursePlayer = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [otherCourses, setOtherCourses] = useState([]);
  const [activeTab, setActiveTab] = useState('description'); // 'description', 'content', 'howToUse'
  const [activeVideoUrl, setActiveVideoUrl] = useState('');
  const [activeVideoTitle, setActiveVideoTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    fetchCourseDetails();
    fetchOtherCourses();
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
      
      if (!response.ok) throw new Error(data.message || 'Error loading course details');
      
      setCourse(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error loading course details');
    } finally {
      setLoading(false);
    }
  };

  const fetchOtherCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/courses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await parseResponse(response);
      if (response.ok) {
        setOtherCourses(data);
      }
    } catch (err) {
      console.error('Error fetching other courses:', err);
    }
  };

  const handlePaymentSubmit = async (e) => {
    if (e) e.preventDefault();
    setPaymentLoading(true);
    setError('');

    try {
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

      // 2. Open Razorpay checkout
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Soulful Baking Academy',
        description: `Unlock Course: ${orderData.courseTitle}`,
        image: '',
        order_id: orderData.orderId,
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

            setPaymentSuccess(true);
            setTimeout(() => {
              setPaymentSuccess(false);
              fetchCourseDetails();
            }, 2500);

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
          courseId: courseId
        },
        theme: { color: '#f26522' },
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
      rzp.on('payment.failed', function (response) {
        console.error('[Razorpay] Payment failed:', response.error);
        setError(response.error?.description || 'Payment failed. Please try again.');
        setPaymentLoading(false);
      });

      rzp.open();
    } catch (err) {
      console.error('Order creation error:', err);
      setError(err.message || 'Failed to initiate payment. Please try again.');
      setPaymentLoading(false);
    }
  };

  const handleVideoClick = (video) => {
    if (!course.isPurchased) {
      alert('Please purchase this masterclass to watch the video lessons!');
      return;
    }
    setActiveVideoUrl(video.videoUrl);
    setActiveVideoTitle(video.title);
  };

  const handlePdfDownload = () => {
    if (!course.isPurchased) {
      alert('Please purchase this masterclass to download the recipe PDF!');
      return;
    }
    if (course.recipePdfUrl) {
      window.open(course.recipePdfUrl, '_blank');
    } else {
      alert('No Recipe PDF guide available for this course yet.');
    }
  };

  if (loading) {
    return (
      <div className="course-detail-light-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', borderTopColor: '#f26522' }} />
          <p style={{ color: '#64748b' }}>Baking details...</p>
        </div>
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="course-detail-light-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', padding: '2rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px', padding: '2rem', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 1.25rem' }} />
          <h3 style={{ fontSize: '1.25rem', color: '#1e293b', marginBottom: '0.5rem' }}>Failed to Load Course</h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{error}</p>
          <button onClick={() => navigate('/courses')} className="course-detail-back-catalog-btn">
            Go back to Catalog
          </button>
        </div>
      </div>
    );
  }

  const isCheesecake = course.title?.toLowerCase().includes('cheese') || course.title?.toLowerCase().includes('soft-centered');

  const lessons = course.videos && course.videos.length > 0 ? course.videos : [
    { _id: 'mock_1', title: `Eggless ${course.title || 'Soft-Centered Cheesecakes'} Online Course`, videoUrl: '', duration: '225:00' }
  ];

  const filteredOtherCourses = otherCourses.filter(c => c._id !== courseId).slice(0, 2);

  return (
    <div className="course-detail-page-wrapper">
      <style>{`
        .course-detail-page-wrapper {
          background-color: transparent !important;
          color: var(--text-primary) !important;
          min-height: 100vh;
          width: 100%;
          position: relative;
          z-index: 10;
          font-family: 'Outfit', sans-serif;
          padding: 2rem 1rem 5rem;
          box-sizing: border-box;
        }
        .course-detail-container {
          max-width: 720px;
          margin: 0 auto;
        }
        .course-detail-header-nav {
          display: flex;
          justify-content: flex-start;
          margin-bottom: 1.5rem;
        }
        .course-detail-back-arrow {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 0.5rem;
          border-radius: 50%;
          transition: background 0.2s;
        }
        .course-detail-back-arrow:hover {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-primary);
        }
        .course-detail-main-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .course-detail-main-title {
          font-family: 'Playfair Display', serif;
          font-size: 2.25rem;
          color: var(--text-primary);
          margin-bottom: 1rem;
          font-weight: 700;
          line-height: 1.25;
        }
        .course-detail-meta-row {
          font-size: 0.95rem;
          color: var(--text-secondary);
          margin-bottom: 0.35rem;
          font-weight: 400;
        }
        .course-detail-meta-accent {
          color: var(--gold-primary);
          font-weight: 500;
        }
        .course-detail-price-section {
          margin: 1.5rem 0 1.25rem;
          text-align: center;
        }
        .course-detail-price-tag {
          font-size: 2.5rem;
          font-weight: 600;
          color: var(--gold-primary);
          font-family: 'Outfit', sans-serif;
        }
        .course-detail-gst-tag {
          font-size: 0.95rem;
          color: var(--text-secondary);
          margin-left: 0.5rem;
          font-weight: 400;
        }
        .course-detail-add-cart-btn {
          background: linear-gradient(135deg, var(--gold-primary) 0%, var(--gold-light) 100%);
          color: #070403;
          font-size: 0.95rem;
          font-weight: 600;
          padding: 0.75rem 2.25rem;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          box-shadow: 0 4px 15px rgba(229, 169, 60, 0.25);
        }
        .course-detail-add-cart-btn:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(229, 169, 60, 0.35);
        }
        .course-detail-active-banner {
          background-color: rgba(40, 199, 111, 0.1);
          border: 1px solid rgba(40, 199, 111, 0.3);
          color: var(--success);
          padding: 0.75rem 1rem;
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          margin: 1rem 0;
        }
        .course-detail-tabs {
          display: flex;
          justify-content: space-around;
          border-bottom: 1.5px solid var(--border-gold);
          margin: 2.5rem 0 2rem;
          width: 100%;
        }
        .course-detail-tab-trigger {
          background: none;
          border: none;
          color: var(--text-secondary);
          font-size: 0.95rem;
          font-weight: 500;
          padding: 0.75rem 1rem;
          cursor: pointer;
          position: relative;
          transition: all 0.2s ease;
          flex: 1;
          text-align: center;
        }
        .course-detail-tab-trigger.active {
          color: var(--gold-primary);
          font-weight: 600;
        }
        .course-detail-tab-trigger.active::after {
          content: '';
          position: absolute;
          bottom: -1.5px;
          left: 0;
          right: 0;
          height: 2px;
          background-color: var(--gold-primary);
        }
        .course-detail-tab-panel {
          animation: fadeIn 0.2s ease;
          text-align: left;
        }
        .course-detail-section-heading {
          display: flex;
          align-items: center;
          font-size: 1.15rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 2rem 0 1rem;
        }
        .course-detail-chevron-icon {
          color: var(--gold-primary);
          margin-right: 0.5rem;
          font-weight: bold;
        }
        .course-detail-media-card {
          display: flex;
          align-items: center;
          padding: 0.85rem 1rem;
          background: var(--bg-card);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid var(--border-gold);
          border-radius: 8px;
          margin-bottom: 0.75rem;
          transition: all 0.2s;
          cursor: pointer;
          justify-content: space-between;
        }
        .course-detail-media-card:hover {
          border-color: var(--border-gold-focus);
          background: rgba(229, 169, 60, 0.1);
        }
        .course-detail-media-card:active {
          transform: scale(0.995);
        }
        .course-detail-media-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .course-detail-square-icon-btn {
          border: 1.5px solid var(--gold-primary);
          border-radius: 6px;
          padding: 0.35rem;
          color: var(--gold-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
        }
        .course-detail-other-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 3rem 0 1.25rem;
          border-top: 1.5px solid var(--border-gold);
          padding-top: 2rem;
        }
        .course-detail-other-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }
        @media(min-width: 500px) {
          .course-detail-other-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        .course-detail-other-card {
          background: var(--bg-card);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid var(--border-gold);
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          transition: transform 0.2s, box-shadow 0.2s;
          cursor: pointer;
        }
        .course-detail-other-card:hover {
          transform: translateY(-2px);
          border-color: var(--border-gold-focus);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.5), 0 0 20px var(--shadow-glow);
        }
        .course-detail-other-img {
          width: 100%;
          height: 120px;
          object-fit: cover;
          border-bottom: 1px solid var(--border-gold);
        }
        .course-detail-other-info {
          padding: 0.85rem;
          text-align: left;
        }
        .course-detail-other-name {
          font-weight: 600;
          color: var(--text-primary);
          font-size: 0.95rem;
          line-height: 1.3;
          margin-bottom: 0.25rem;
        }
        .course-detail-other-inst {
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-bottom: 0.5rem;
        }
        .course-detail-other-price {
          font-weight: 600;
          color: var(--gold-primary);
          font-size: 0.9rem;
        }
        .course-detail-back-catalog-btn {
          background: none;
          border: 1px solid var(--border-gold);
          color: var(--text-secondary);
          font-weight: 500;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .course-detail-back-catalog-btn:hover {
          border-color: var(--border-gold-focus);
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-primary);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="course-detail-container">
        <div className="course-detail-header-nav">
          <button onClick={() => navigate('/courses')} className="course-detail-back-arrow" title="Back to curriculum catalog">
            <ArrowLeft size={20} />
          </button>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}><AlertCircle size={18} /> {error}</div>}
        {paymentSuccess && (
          <div className="alert alert-success" style={{ marginBottom: '1.5rem', backgroundColor: 'rgba(40, 199, 111, 0.1)', border: '1px solid rgba(40, 199, 111, 0.3)', color: 'var(--success)' }}>
            <CheckCircle2 size={18} /> Payment Verified! Course unlocked successfully!
          </div>
        )}

        <div className="course-detail-main-header">
          <h1 className="course-detail-main-title">{course.title}</h1>
          <div className="course-detail-meta-row">
            Instructor: <span className="course-detail-meta-accent">{course.instructor || 'Jeyadra Vijayselvan'}</span>
          </div>
          <div className="course-detail-meta-row">
            Language: <span className="course-detail-meta-accent">{course.language || 'English'}</span>
          </div>
          <div className="course-detail-meta-row">
            Validity Period: <span className="course-detail-meta-accent">{course.validityDays || 10} days</span>
          </div>

          {!course.isPurchased ? (
            <div className="course-detail-price-section">
              <div className="course-detail-price-tag">
                ₹{course.price ? course.price.toFixed(2) : '0.00'}
                <span className="course-detail-gst-tag">excluding 18% GST</span>
              </div>
              <div style={{ marginTop: '1.25rem' }}>
                <button 
                  onClick={handlePaymentSubmit} 
                  disabled={paymentLoading}
                  className="course-detail-add-cart-btn"
                >
                  {paymentLoading ? (
                    <div className="spinner" style={{ borderTopColor: '#000', width: '18px', height: '18px' }} />
                  ) : (
                    <>
                      <ShoppingBag size={18} />
                      <span>Add to Cart</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <div className="course-detail-active-banner">
                <CheckCircle2 size={16} />
                <span>Enrolled & Active • Access Valid until {new Date(course.expiresAt).toLocaleDateString()}</span>
              </div>
            </div>
          )}
        </div>

        {activeVideoUrl && course.isPurchased && (
          <div style={{ marginBottom: '2.5rem', background: '#000000', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-gold)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
            <video 
              src={activeVideoUrl}
              controls
              autoPlay
              controlsList="nodownload"
              onContextMenu={(e) => e.preventDefault()}
              style={{ width: '100%', display: 'block', maxHeight: '420px', backgroundColor: '#000000' }}
            />
            <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-gold)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.9rem' }}>{activeVideoTitle}</span>
              <button 
                onClick={() => { setActiveVideoUrl(''); setActiveVideoTitle(''); }}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '4px', padding: '0.25rem 0.6rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-primary)' }}
              >
                Close Video
              </button>
            </div>
          </div>
        )}

        <div className="course-detail-tabs">
          <button 
            className={`course-detail-tab-trigger ${activeTab === 'description' ? 'active' : ''}`}
            onClick={() => setActiveTab('description')}
          >
            Description
          </button>
          <button 
            className={`course-detail-tab-trigger ${activeTab === 'content' ? 'active' : ''}`}
            onClick={() => setActiveTab('content')}
          >
            Course Content
          </button>
          <button 
            className={`course-detail-tab-trigger ${activeTab === 'howToUse' ? 'active' : ''}`}
            onClick={() => setActiveTab('howToUse')}
          >
            How to Use
          </button>
        </div>

        <div className="course-detail-tab-content">
          {activeTab === 'description' && (
            <div className="course-detail-tab-panel">
              {isCheesecake ? (
                <div style={{ textAlign: 'left', lineHeight: '1.6' }}>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', color: 'var(--text-primary)', marginBottom: '0.5rem', fontWeight: 600 }}>
                    {course.title}
                  </h3>
                  <div style={{ color: 'var(--success)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '1.25rem', fontSize: '0.95rem' }}>
                    <span>🍀</span> 100% Vegetarian
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                    <p style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', margin: 0 }}>
                      <span>🚀</span>
                      <span>Learn And Master The EGGLESS Baked Cheesecake That Sets A New Global Standard! Dense, Fudgy, Ultra-Creamy And Custard-Soft At The Core.</span>
                    </p>
                    <p style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', margin: 0 }}>
                      <span>🚀</span>
                      <span>The True NY-Style Texture, Perfected Without Eggs And Engineered To Melt Slow And Rich On The Palate.</span>
                    </p>
                    <p style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', margin: 0 }}>
                      <span>🚀</span>
                      <span>Straight From The Creators Who Defined The World’s Best Eggless Cheesecake ✨</span>
                    </p>
                  </div>
                  
                  <div style={{ borderTop: '1px solid var(--border-gold)', borderBottom: '1px solid var(--border-gold)', padding: '0.75rem 0', margin: '1.5rem 0', textAlign: 'center', fontWeight: '500', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    No Eggs I No Curd I No Condensed Milk I No Gelatine I No AgarAgar
                  </div>
                  
                  <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.75rem', fontWeight: 600 }}>
                    What does this course Cover?
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                    {['Sturdy Crispy Crust', 'Decadent Baked Cheesecake', 'Fruity Cheesecakes', 'Chocolate Cheesecakes', 'Half and Half Cheesecakes', 'Baking and Setting Techniques', 'Slicing Techniques', 'Storage and Shelf Life'].map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center' }}>✅</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'left', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', color: 'var(--text-primary)', marginBottom: '0.75rem', fontWeight: 600 }}>
                    {course.title}
                  </h3>
                  {course.description ? (
                    <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem', margin: 0 }}>{course.description}</p>
                  ) : (
                    <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontStyle: 'italic', margin: 0 }}>
                      No description available for this course.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'content' && (
            <div className="course-detail-tab-panel">
              <div className="course-detail-section-heading">
                <span className="course-detail-chevron-icon">▶</span>
                <span>Course Video</span>
              </div>
              
              {lessons.map((vid, idx) => (
                <div 
                  key={vid._id || idx} 
                  className="course-detail-media-card"
                  onClick={() => handleVideoClick(vid)}
                >
                  <div className="course-detail-media-left">
                    <div className="course-detail-square-icon-btn">
                      <Play size={16} fill="var(--gold-primary)" />
                    </div>
                    <div>
                      <div style={{ fontWeight: '500', color: 'var(--text-primary)', fontSize: '0.95rem' }}>{vid.title}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{vid.duration || '225:00'}</div>
                    </div>
                  </div>
                  {!course.isPurchased && <Lock size={16} color="var(--text-secondary)" />}
                </div>
              ))}

              <div className="course-detail-section-heading" style={{ marginTop: '2.5rem' }}>
                <span className="course-detail-chevron-icon">▶</span>
                <span>Recipe PDF</span>
              </div>

              <div 
                className="course-detail-media-card"
                onClick={handlePdfDownload}
              >
                <div className="course-detail-media-left">
                  <div className="course-detail-square-icon-btn">
                    <FileText size={16} />
                  </div>
                  <div>
                    <div style={{ fontWeight: '500', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                      {course.title} Online Course
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {course.isPurchased ? (
                    <DownloadCloud size={18} color="var(--gold-primary)" />
                  ) : (
                    <Lock size={16} color="var(--text-secondary)" />
                  )}
                </div>
              </div>

              {filteredOtherCourses.length > 0 && (
                <div>
                  <h3 className="course-detail-other-title">Other Courses</h3>
                  <div className="course-detail-other-grid">
                    {filteredOtherCourses.map(other => (
                      <div 
                        key={other._id} 
                        className="course-detail-other-card"
                        onClick={() => {
                          setActiveVideoUrl('');
                          setActiveVideoTitle('');
                          navigate(`/courses/${other._id}`);
                        }}
                      >
                        {other.thumbnail ? (
                          <img 
                            src={getMediaUrl(other.thumbnail)} 
                            alt={other.title} 
                            className="course-detail-other-img"
                          />
                        ) : (
                          <div style={{ width: '100%', height: '120px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Film size={28} color="var(--text-secondary)" />
                          </div>
                        )}
                        <div className="course-detail-other-info">
                          <div className="course-detail-other-name">{other.title}</div>
                          <div className="course-detail-other-inst">{other.instructor || 'Jeyadra Vijayselvan'}</div>
                          <div className="course-detail-other-price">₹{other.price.toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'howToUse' && (
            <div className="course-detail-tab-panel">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', lineHeight: '1.6', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                <div style={{ background: 'rgba(22, 12, 7, 0.4)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid var(--gold-primary)' }}>
                  <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.25rem' }}>1. Secure Registration</strong>
                  Click "Add to Cart" to start the payment checkout. Complete the payment securely using Razorpay card, UPI, wallet, or netbanking options.
                </div>
                <div style={{ background: 'rgba(22, 12, 7, 0.4)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid var(--gold-primary)' }}>
                  <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.25rem' }}>2. Stream Video Lessons</strong>
                  Once enrolled, click on the lessons in the "Course Content" tab to watch them directly in the browser. You can play, pause, or rewind any time.
                </div>
                <div style={{ background: 'rgba(22, 12, 7, 0.4)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid var(--gold-primary)' }}>
                  <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.25rem' }}>3. Download PDF Recipe Guide</strong>
                  Use the download button under "Recipe PDF" to save the detailed, multi-page baking recipe guide on your device for offline reading.
                </div>
                <div style={{ background: 'rgba(22, 12, 7, 0.4)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid var(--gold-primary)' }}>
                  <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.25rem' }}>4. Access validity</strong>
                  Your enrollment access to this masterclass materials is active for a duration of <strong>{course.validityDays || 10} days</strong> from date of purchase.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoursePlayer;
