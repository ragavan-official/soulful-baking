import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  MapPin, Phone, ArrowRight, Sparkles, 
  Award, Shield, BookOpen, Compass, ChevronRight, Menu, X, Heart
} from 'lucide-react';
import Logo from '../components/Logo';
import SplitText from '../components/SplitText';
import ShinyText from '../components/ShinyText';

// Custom inline Instagram Icon since lucide-react doesn't export it in this package version
const Instagram = ({ size = 24, className, style }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

// Asset imports
import heroDessert from '../assets/hero_dessert.png';
import storyDessert from '../assets/story_dessert.png';
import cakeStrawberry from '../assets/cake_strawberry.png';
import cakeLayered from '../assets/cake_layered.png';
import cakeBrownie from '../assets/cake_brownie.png';

const Home = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDashboardClick = () => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/account');
      }
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="home-page">
      {/* Header / Navbar */}
      <header className={`home-navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="navbar-container">
          <Link to="/" className="navbar-logo">
            <Logo width={45} height={45} animate={false} />
            <span className="navbar-logo-text">Soulful Baking</span>
          </Link>

          <nav className="navbar-links-desktop">
            <Link to="/" className="nav-link active">Home</Link>
            <Link to="/courses" className="nav-link">Courses</Link>
            <a href="#story" className="nav-link">Our Story</a>
            <a href="#delicacies" className="nav-link">Signature Delicacies</a>
            <a href="#contact" className="nav-link">Contact</a>
          </nav>

          <div className="navbar-actions">
            {user ? (
              <button onClick={handleDashboardClick} className="btn-navbar">
                Dashboard
              </button>
            ) : (
              <button onClick={() => navigate('/login')} className="btn-navbar">
                Sign In
              </button>
            )}
            
            <button 
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="mobile-nav-menu">
            <Link to="/" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <Link to="/courses" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Courses</Link>
            <a href="#story" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Our Story</a>
            <a href="#delicacies" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Signature Delicacies</a>
            <a href="#contact" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Contact</a>
            {user ? (
              <button onClick={() => { setMobileMenuOpen(false); handleDashboardClick(); }} className="btn-navbar" style={{ width: '100%', marginTop: '1rem' }}>
                Dashboard
              </button>
            ) : (
              <button onClick={() => { setMobileMenuOpen(false); navigate('/login'); }} className="btn-navbar" style={{ width: '100%', marginTop: '1rem' }}>
                Sign In
              </button>
            )}
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <span className="hero-badge">
              <Sparkles size={14} style={{ color: 'var(--gold-primary)' }} />
              Premium Baking Academy
            </span>
            <h1 className="hero-title">
              <SplitText text="Sweet Moments" delay={0.04} />
              <br />
              <span className="highlight-text">Start Here</span>
            </h1>
            <p className="hero-description">
              Unleash your inner chef with masterclass baking tutorials. Discover professional recipes, pastry techniques, and artisanal cake decoration with step-by-step guidance from shamini.
            </p>
            <div className="hero-cta-buttons">
              <button onClick={() => navigate('/courses')} className="btn-primary-glow">
                Explore Masterclasses
                <ArrowRight size={18} />
              </button>
              <a href="#story" className="btn-secondary-outline">
                Our Story
              </a>
            </div>
          </div>

          <div className="hero-image-wrapper">
            <div className="hero-image-backdrop"></div>
            <img 
              src={heroDessert} 
              alt="Crème caramel dessert with whipped cream" 
              className="hero-image"
            />
          </div>
        </div>
      </section>

      {/* Story & Features Section */}
      <section id="story" className="story-section">
        <div className="story-container">
          <div className="story-image-column">
            <div className="story-image-card">
              <img 
                src={storyDessert} 
                alt="Layered chocolate hazelnut cake slice" 
                className="story-image"
              />
            </div>
          </div>

          <div className="story-content-column">
            <span className="section-subtitle">Since 2020</span>
            <h2 className="section-title">Sweet Moments Baked Here</h2>
            <p className="story-text">
              At Soulful Baking, baking is not just about combining flour, sugar, and yeast. It is a soulful journey of craftsmanship, passion, and precision. We curate premium online classes that take you from baking basics to creating complex wedding cakes and delicate french pastries.
            </p>
            <p className="story-text">
              Every course is carefully planned to give you the science behind the crust, the secret to a moist crumb, and visual walk-throughs that ensure your success in the kitchen.
            </p>
            <button onClick={() => navigate('/courses')} className="btn-secondary-link">
              Browse All Courses <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="features-grid-container">
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Compass size={24} />
              </div>
              <h3 className="feature-title">Baking Fundamentals</h3>
              <p className="feature-desc">Master the foundations of dough kneading, batter aeration, and precise oven scaling.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Sparkles size={24} />
              </div>
              <h3 className="feature-title">Baking Science</h3>
              <p className="feature-desc">Understand yeast chemistry, sugar caramelization, and structure builders like gluten and egg proteins.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Award size={24} />
              </div>
              <h3 className="feature-title">Expert Mentorship</h3>
              <p className="feature-desc">Get your baking queries solved, recipes reviewed, and earn certifications as you progress.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Signature Delicacies Section */}
      <section id="delicacies" className="delicacies-section">
        <div className="section-header">
          <span className="section-subtitle">Handcrafted Classics</span>
          <h2 className="section-title text-center">Our Signature Delicacies</h2>
          <p className="section-desc">
            Explore the culinary art of premium cake design and rich pastries. Here is a glimpse of what you will learn to craft.
          </p>
        </div>

        <div className="delicacies-grid">
          {/* Card 1 */}
          <div className="delicacy-card">
            <div className="delicacy-image-wrapper">
              <img src={cakeStrawberry} alt="Merro Chople Dessert" />
              <div className="delicacy-overlay">
                <button onClick={() => navigate('/courses')} className="btn-overlay-cta">Learn to Bake</button>
              </div>
            </div>
            <div className="delicacy-info">
              <span className="delicacy-category">Signature Pastry</span>
              <h3 className="delicacy-title">Merro Chople</h3>
              <p className="delicacy-desc">A mini chocolate gateau base layered with chocolate mousse, finished with a fresh strawberry and gold leaf garnish.</p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="delicacy-card">
            <div className="delicacy-image-wrapper">
              <img src={cakeLayered} alt="Conoalut Beticina Honey Cake" />
              <div className="delicacy-overlay">
                <button onClick={() => navigate('/courses')} className="btn-overlay-cta">Learn to Bake</button>
              </div>
            </div>
            <div className="delicacy-info">
              <span className="delicacy-category">Multi-layered Cake</span>
              <h3 className="delicacy-title">Conoalut Beticina</h3>
              <p className="delicacy-desc">Traditional Russian honey cake featuring ten thin caramelized biscuit layers sandwiching sour cream frosting.</p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="delicacy-card">
            <div className="delicacy-image-wrapper">
              <img src={cakeBrownie} alt="Cosol Chis Brownie" />
              <div className="delicacy-overlay">
                <button onClick={() => navigate('/courses')} className="btn-overlay-cta">Learn to Bake</button>
              </div>
            </div>
            <div className="delicacy-info">
              <span className="delicacy-category">Decadent Bar</span>
              <h3 className="delicacy-title">Cosol Chis</h3>
              <p className="delicacy-desc">A dense, chewy dark chocolate fudge brownie slab decorated with chocolate glaze and sea salt flakes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer id="contact" className="home-footer">
        <div className="footer-container">
          <div className="footer-brand-section">
            <div className="footer-logo">
              <Logo width={60} height={60} animate={false} />
              <span className="footer-logo-text">Soulful Baking</span>
            </div>
            <p className="footer-tagline">
              Baking masterclasses designed to inspire your passion and elevate your dessert game to international standards.
            </p>
            <div className="footer-socials">
              <a 
                href="https://www.instagram.com/soulful_baking_shamini/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="social-btn"
                aria-label="Instagram Profile"
              >
                <Instagram size={20} />
              </a>
            </div>
          </div>

          <div className="footer-links-section">
            <h4 className="footer-heading">Quick Links</h4>
            <ul className="footer-links-list">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/courses">Courses Catalog</Link></li>
              <li><a href="#story">Our Story</a></li>
              <li><a href="#delicacies">Signature Delicacies</a></li>
              <li><Link to="/login">Sign In</Link></li>
            </ul>
          </div>

          <div className="footer-contact-section">
            <h4 className="footer-heading">Contact Details</h4>
            <ul className="footer-contact-list">
              <li className="contact-item">
                <MapPin size={22} className="contact-icon" style={{ marginTop: '3px' }} />
                <span className="contact-text">
                  New Perungalathur, Chennai,<br />
                  Nedunkundram, Tamil Nadu 600063
                </span>
              </li>
              <li className="contact-item">
                <Phone size={18} className="contact-icon" />
                <span className="contact-text">
                  <strong>ph:</strong> +91 90429 60912
                </span>
              </li>
              <li className="contact-item">
                <div className="whatsapp-icon-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg 
                    viewBox="0 0 24 24" 
                    width="18" 
                    height="18" 
                    fill="currentColor" 
                    className="contact-icon"
                    style={{ color: '#25D366' }}
                  >
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.451 5.436 0 9.851-4.415 9.854-9.857.001-2.636-1.024-5.113-2.887-6.978C16.368 1.95 13.882.925 11.25.925c-5.438 0-9.853 4.414-9.856 9.856-.001 1.761.47 3.473 1.362 5.006l-1.012 3.7 3.8-.996zm13.155-7.142c-.29-.145-1.713-.847-1.978-.943-.265-.097-.459-.145-.651.145-.193.291-.748.944-.917 1.137-.168.193-.337.217-.627.072-2.91-1.454-4.81-3.411-5.585-4.743-.204-.352-.022-.544.15-.716.154-.155.337-.393.507-.589.17-.196.226-.338.338-.564.112-.226.056-.423-.028-.568-.084-.145-.651-1.568-.891-2.146-.233-.56-.47-.482-.651-.492-.168-.008-.362-.01-.555-.01-.193 0-.507.072-.772.361-.265.291-1.012.989-1.012 2.41 0 1.42 1.037 2.793 1.182 2.988.145.195 2.04 3.117 4.943 4.372.69.298 1.23.477 1.65.611.693.22 1.325.19 1.823.115.556-.083 1.713-.699 1.954-1.374.24-.675.24-1.253.168-1.374-.072-.12-.265-.193-.555-.338z"/>
                  </svg>
                  <span className="contact-text">
                    <strong>wph:</strong> +91 90429 60912
                  </span>
                </div>
              </li>
              <li className="contact-item">
                <Instagram size={18} className="contact-icon" style={{ color: '#E1306C' }} />
                <span className="contact-text">
                  <strong>ig:</strong> <a href="https://www.instagram.com/soulful_baking_shamini/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold-primary)', textDecoration: 'none' }}>soulful_baking_shamini</a>
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Soulful Baking Shamini. All rights reserved.</p>
          <p style={{ marginTop: '0.25rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>
            Developed with <Heart size={10} style={{ fill: 'var(--gold-primary)', color: 'var(--gold-primary)' }} /> for bakers globally
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
