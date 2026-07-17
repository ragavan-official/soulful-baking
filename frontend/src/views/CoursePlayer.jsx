import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Play, Lock, Clock, Calendar, ArrowLeft, Film, AlertTriangle, 
  ChevronRight, LockKeyhole, EyeOff, ShieldAlert
} from 'lucide-react';
import Logo from '../components/Logo';
import { API_BASE_URL, parseResponse } from '../config';

const CoursePlayer = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();

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
      
      if (!response.ok) throw new Error(data.message);
      
      setCourse(data);

      if (!data.isPurchased) {
        navigate(`/payment/${courseId}`);
        return;
      }

      // Select first video by default
      if (data.videos && data.videos.length > 0) {
        setActiveVideoIndex(0);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error loading course classroom');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="auth-container">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', borderTopColor: 'var(--gold-primary)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Entering your classroom...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="auth-container">
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <ShieldAlert size={48} color="var(--error)" style={{ marginBottom: '1.5rem' }} />
          <h3>Access Error</h3>
          <p style={{ color: 'var(--text-secondary)', margin: '1rem 0 1.5rem' }}>
            {error || 'We could not fetch details for this classroom.'}
          </p>
          <button onClick={() => navigate('/account')} className="btn-primary">
            Go to Profile
          </button>
        </div>
      </div>
    );
  }

  const activeVideo = course.videos[activeVideoIndex];

  return (
    <div className="dashboard-container" style={{ paddingBottom: '5rem', maxWidth: '1300px' }}>
      {/* Header */}
      <div className="dashboard-header" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={() => navigate('/account')} className="btn-secondary" style={{ padding: '0.4rem 0.6rem' }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="dashboard-title" style={{ fontSize: '1.8rem' }}>{course.title}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              Enrolled: {new Date(course.purchasedAt).toLocaleDateString()} | Day <strong>{course.daysSincePurchase}</strong> of access
            </p>
          </div>
        </div>

        <button onClick={() => navigate('/courses')} className="btn-secondary">
          Academy Catalog
        </button>
      </div>

      {/* Split Classroom View */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
        
        {/* --- LEFT: VIDEO STREAM VIEWPORT --- */}
        <div>
          {activeVideo ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ position: 'relative', paddingTop: '56.25%', width: '100%', height: 0, borderRadius: '15px', overflow: 'hidden', border: '1px solid var(--border-gold)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.6)' }}>
                <video
                  src={activeVideo.videoUrl}
                  controls
                  autoPlay
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none', objectFit: 'contain' }}
                />
              </div>

              {/* Lesson details */}
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--gold-primary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Lesson {activeVideoIndex + 1}
                  </span>
                </div>
                <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-serif)' }}>{activeVideo.title}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginTop: '0.75rem', lineHeight: '1.6' }}>
                  Welcome to this masterclass lesson. Make sure to follow the recipe guidelines and take notes on baking times and temperature controls.
                </p>
              </div>
            </div>
          ) : (
            <div className="glass-card" style={{ textAlign: 'center', padding: '4rem' }}>
              <Film size={48} style={{ color: 'var(--gold-primary)', opacity: 0.3, marginBottom: '1rem' }} />
              <h3>No Lessons Uploaded</h3>
              <p style={{ color: 'var(--text-secondary)' }}>This course does not have any video content currently.</p>
            </div>
          )}
        </div>

        {/* --- RIGHT: SIDEBAR LESSON LIST --- */}
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', height: 'fit-content' }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', borderBottom: '1px solid var(--border-gold)', paddingBottom: '0.75rem' }}>
            Course Curriculum
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '550px', overflowY: 'auto' }}>
            {course.videos.map((vid, idx) => {
              const isActive = idx === activeVideoIndex;
              return (
                <button
                  key={vid._id}
                  onClick={() => setActiveVideoIndex(idx)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    padding: '0.8rem',
                    textAlign: 'left',
                    background: isActive ? 'rgba(229, 169, 60, 0.15)' : 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid',
                    borderColor: isActive ? 'var(--gold-primary)' : 'var(--border-gold)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', width: '100%' }}>
                    <Play size={14} style={{ color: 'var(--gold-primary)', marginTop: '0.2rem', flexShrink: 0 }} />
                    
                    <div style={{ flex: 1 }}>
                      <span style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: isActive ? '600' : '500', 
                        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                        display: 'block',
                        lineHeight: '1.3'
                      }}>
                        {vid.title}
                      </span>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                          Lesson {idx + 1}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CoursePlayer;
