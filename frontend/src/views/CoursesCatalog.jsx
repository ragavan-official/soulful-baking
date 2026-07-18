import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ArrowLeft, Check, Sparkles, ShoppingBag, AlertCircle } from 'lucide-react';
import Logo from '../components/Logo';
import BlurText from '../components/BlurText';
import ShinyText from '../components/ShinyText';
import SEO from '../components/SEO';
import TiltedCard from '../components/TiltedCard';
import { API_BASE_URL, parseResponse } from '../config';

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

const CoursesCatalog = () => {
  const [courses, setCourses] = useState([]);
  const [purchasedIds, setPurchasedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchCatalogData();
  }, []);

  const fetchCatalogData = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Fetch all courses in catalog
      const coursesResponse = await fetch(`${API_BASE_URL}/api/courses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const coursesData = await parseResponse(coursesResponse);
      if (!coursesResponse.ok) throw new Error(coursesData.message);

      // Fetch user's purchased courses to cross-reference
      const myLearningResponse = await fetch(`${API_BASE_URL}/api/courses/my-learning`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const myLearningData = await parseResponse(myLearningResponse);
      if (myLearningResponse.ok) {
        // Only mark as purchased if not expired
        const purchasedSet = new Set(myLearningData.filter(c => !c.isExpired).map(c => c._id));
        setPurchasedIds(purchasedSet);
      }

      setCourses(coursesData);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error loading course catalog');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (courseId) => {
    try {
      setPurchaseLoading(courseId);
      setError('');
      setSuccess('');
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/api/courses/${courseId}/purchase`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await parseResponse(response);
      if (!response.ok) throw new Error(data.message);

      setSuccess('Course purchased successfully! Ready to learn.');
      setPurchasedIds(prev => {
        const newSet = new Set(prev);
        newSet.add(courseId);
        return newSet;
      });

      // Automatically redirect to player after a short delay
      setTimeout(() => {
        navigate(`/courses/${courseId}`);
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to complete course purchase');
    } finally {
      setPurchaseLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="auth-container">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', borderTopColor: 'var(--gold-primary)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Baking our curriculum...</p>
        </div>
      </div>
    );
  }

  const catalogSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Baking Masterclasses & Courses",
    "description": "Learn professional cake decoration, brownie baking, and pastry making from expert bakers.",
    "itemListElement": courses.map((course, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "item": {
        "@type": "Course",
        "name": course.title,
        "description": course.description,
        "provider": {
          "@type": "Organization",
          "name": "Soulful Baking",
          "sameAs": "https://www.soulfulbaking.in"
        }
      }
    }))
  };

  return (
    <div className="dashboard-container" style={{ paddingBottom: '5rem' }}>
      <SEO 
        title="Online Baking Courses & Masterclasses | Soulful Baking"
        description="Join premium online baking masterclasses by Soulful Baking. Level up your baking skills with expert-guided video lessons, recipes, and support."
        keywords="online baking course, baking class, learn baking, cake decorating, brownie making"
        canonicalUrl="https://www.soulfulbaking.in/courses"
        schema={catalogSchema}
      />
      {/* Header */}
      <div className="dashboard-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Logo width={60} height={60} animate={false} />
          <div>
            <h1 className="dashboard-title">Baking Academy</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Premium masterclasses from our expert bakers.
            </p>
          </div>
        </div>

        <button onClick={() => navigate('/account')} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowLeft size={16} />
          My Profile
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '2rem' }}><AlertCircle size={18} /> {error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: '2rem' }}><Check size={18} /> {success}</div>}

      <div style={{ margin: '1rem 0 2.5rem', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--text-primary)' }}>
          <BlurText text="Available Masterclasses" delay={0.04} />
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          <ShinyText text="Get lifetime access to premium video lessons and recipes" speed={7} />
        </p>
      </div>

      {courses.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem' }}>
          <BookOpen size={48} style={{ color: 'var(--gold-primary)', opacity: 0.5, marginBottom: '1.5rem' }} />
          <h3>No Classes Available</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Check back later for newly published premium masterclasses!
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
          {courses.map((course) => {
            const isPurchased = purchasedIds.has(course._id);
            return (
              <TiltedCard 
                key={course._id} 
                className="glass-card" 
                style={{ 
                  padding: '1.5rem', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  height: '100%', 
                  justifyContent: 'space-between',
                  transition: 'transform 0.3s ease',
                }}
              >
                <div>
                  {course.thumbnail ? (
                    <img 
                      src={getMediaUrl(course.thumbnail)}
                      alt={course.title} 
                      style={{ 
                        width: '100%', 
                        height: '180px', 
                        objectFit: 'cover', 
                        borderRadius: '12px', 
                        marginBottom: '1.25rem', 
                        border: '1px solid var(--border-gold)' 
                      }} 
                    />
                  ) : (
                    <div 
                      style={{ 
                        width: '100%', 
                        height: '180px', 
                        background: 'rgba(0,0,0,0.4)', 
                        borderRadius: '12px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        marginBottom: '1.25rem', 
                        border: '1px solid var(--border-gold)' 
                      }}
                    >
                      <Sparkles size={42} style={{ color: 'var(--gold-primary)', opacity: 0.3 }} />
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', color: 'var(--text-primary)', lineHeight: '1.3' }}>
                      {course.title}
                    </h3>
                  </div>

                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                    {course.description || 'Gain premium access to visual walk-throughs, recipes, and detailed baking techniques.'}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid rgba(229, 169, 60, 0.1)', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Contains <strong>{course.videoCount}</strong> video lessons
                    </span>
                    <span style={{ color: 'var(--gold-primary)', fontWeight: '700', fontSize: '1.25rem' }}>
                      ₹{course.price.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '-0.25rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Access Duration: <strong>{course.validityDays !== undefined ? course.validityDays : 365}</strong> Days
                    </span>
                  </div>

                  {isPurchased ? (
                    <button 
                      onClick={() => navigate(`/courses/${course._id}`)} 
                      className="btn-primary"
                      style={{ 
                        background: 'linear-gradient(135deg, var(--gold-dark) 0%, rgba(229, 169, 60, 0.2) 100%)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--gold-primary)',
                        boxShadow: 'none'
                      }}
                    >
                      <Check size={18} />
                      Go to Classroom
                    </button>
                  ) : (
                    <button 
                      onClick={() => navigate(`/payment/${course._id}`)}
                      className="btn-primary"
                    >
                      <ShoppingBag size={18} />
                      Unlock Masterclass
                    </button>
                  )}
                </div>
              </TiltedCard>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CoursesCatalog;
