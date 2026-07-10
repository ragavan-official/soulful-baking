import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, User, Mail, Calendar, ShieldAlert, Award, 
  GraduationCap, Compass, Play
} from 'lucide-react';
import Logo from '../components/Logo';
import SplitText from '../components/SplitText';
import ShinyText from '../components/ShinyText';

const Account = ({ user, onLogout }) => {
  const [purchasedCourses, setPurchasedCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    
    const fetchPurchasedCourses = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('http://localhost:3001/api/courses/my-learning', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (response.ok) {
          setPurchasedCourses(data);
        }
      } catch (err) {
        console.error('Error fetching purchased courses:', err);
      } finally {
        setCoursesLoading(false);
      }
    };

    fetchPurchasedCourses();
  }, [user]);

  if (!user) {
    return (
      <div className="auth-container">
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <Logo width={80} height={80} />
          <h3 style={{ margin: '1.5rem 0 1rem' }}>Access Denied</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Please sign in to view your profile details.
          </p>
          <button onClick={() => navigate('/login')} className="btn-primary">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const handleLogoutClick = () => {
    localStorage.removeItem('token');
    onLogout();
    navigate('/login');
  };

  const formattedDate = user.createdAt 
    ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Recently';

  const userInitial = user.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="auth-container" style={{ padding: '2rem 1rem' }}>
      <div className="glass-card profile-card" style={{ maxWidth: '480px', padding: '2.5rem 2rem' }}>
        <Logo width={80} height={80} animate={false} />

        <div style={{ margin: '1.5rem 0' }}>
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="profile-avatar-large" />
          ) : (
            <div className="profile-avatar-placeholder-large">{userInitial}</div>
          )}

          <h2 className="profile-name">
            <SplitText text={user.name} delay={0.06} />
          </h2>
          <p className="profile-email">
            <ShinyText text={user.email} speed={8} />
          </p>
        </div>

        <div className="profile-details-list">
          <div className="profile-detail-item">
            <div className="profile-detail-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={16} />
              <span>Full Name</span>
            </div>
            <div className="profile-detail-value">{user.name}</div>
          </div>

          <div className="profile-detail-item">
            <div className="profile-detail-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Mail size={16} />
              <span>Email</span>
            </div>
            <div className="profile-detail-value" style={{ fontSize: '0.85rem' }}>{user.email}</div>
          </div>

          <div className="profile-detail-item">
            <div className="profile-detail-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award size={16} />
              <span>Role</span>
            </div>
            <div className="profile-detail-value">
              <span className={`role-tag ${user.role === 'admin' ? 'role-admin' : 'role-user'}`}>
                {user.role}
              </span>
            </div>
          </div>

          <div className="profile-detail-item">
            <div className="profile-detail-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={16} />
              <span>Member Since</span>
            </div>
            <div className="profile-detail-value">{formattedDate}</div>
          </div>
        </div>

        {/* Learning Dashboard Section */}
        <div style={{ marginTop: '1.5rem', marginBottom: '2rem', textAlign: 'left' }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-gold)', paddingBottom: '0.5rem', marginBottom: '1rem', fontSize: '1rem', color: 'var(--gold-primary)', fontFamily: 'var(--font-serif)' }}>
            <GraduationCap size={18} />
            My Baking Academy
          </h4>

          {coursesLoading ? (
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div className="spinner" style={{ margin: '0 auto', width: '20px', height: '20px', borderTopColor: 'var(--gold-primary)' }} />
            </div>
          ) : purchasedCourses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', border: '1px dashed var(--border-gold)' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                You haven't unlocked any masterclasses yet.
              </p>
              <button 
                onClick={() => navigate('/courses')} 
                className="btn-primary" 
                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', width: 'auto', margin: '0 auto' }}
              >
                <Compass size={16} /> Explore Catalog
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {purchasedCourses.map((c) => (
                <div 
                  key={c._id} 
                  onClick={() => navigate(`/courses/${c._id}`)}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.75rem', 
                    background: 'rgba(255,255,255,0.03)', 
                    padding: '0.75rem', 
                    borderRadius: '8px', 
                    border: '1px solid var(--border-gold)', 
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--gold-primary)'; e.currentTarget.style.background = 'rgba(229, 169, 60, 0.05)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-gold)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                >
                  {c.thumbnail ? (
                    <img src={c.thumbnail} alt={c.title} style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-gold)' }} />
                  ) : (
                    <div style={{ width: '45px', height: '45px', background: 'rgba(0,0,0,0.4)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-gold)' }}>
                      <Play size={16} style={{ color: 'var(--gold-primary)' }} />
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)', display: 'block' }}>{c.title}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Unlocked: {new Date(c.purchasedAt).toLocaleDateString()} | {c.videoCount} lessons
                    </span>
                  </div>
                </div>
              ))}
              
              <button 
                onClick={() => navigate('/courses')} 
                className="btn-secondary" 
                style={{ fontSize: '0.85rem', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.25rem' }}
              >
                <Compass size={14} /> Explore Catalog
              </button>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {user.role === 'admin' && (
            <button 
              onClick={() => navigate('/admin')} 
              className="btn-primary" 
              style={{ background: 'linear-gradient(135deg, #d32f2f 0%, #f44336 100%)', color: '#fff', boxShadow: '0 4px 15px rgba(244, 67, 54, 0.2)' }}
            >
              <ShieldAlert size={18} />
              Admin Control Panel
            </button>
          )}

          <button onClick={handleLogoutClick} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Account;
