import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  MapPin, Phone, Mail, ArrowRight, Sparkles, 
  Award, Shield, BookOpen, Compass, ChevronRight, Menu, X, Heart, ShoppingBag, MessageCircle,
  ShieldCheck, Leaf, Info
} from 'lucide-react';
import Logo from '../components/Logo';
import BlurText from '../components/BlurText';
import ShinyText from '../components/ShinyText';
import SEO from '../components/SEO';
import TiltedCard from '../components/TiltedCard';
import ScrollReveal from '../components/ScrollReveal';
import SplitText from '../components/SplitText';
import { API_BASE_URL, parseResponse } from '../config';

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
import heroCardCake from '../assets/hero_card_cake.jpg';
import cameraCake from '../assets/camera_cake.jpg';
import storyDessert from '../assets/story_dessert.png';
import cakeStrawberry from '../assets/cake_strawberry.png';
import cakeLayered from '../assets/cake_layered.png';
import cakeBrownie from '../assets/cake_brownie.png';
import fondantFigurines from '../assets/fondant_figurines.jpg';
import cupcakeBouquet from '../assets/cupcake_bouquet.jpg';
import cupOfLove from '../assets/cup_of_love.jpg';
import peacockCake from '../assets/peacock_cake.jpg';
import sculptedBarbieDoll from '../assets/sculpted_barbie_doll.jpg';
import sculptedHangingHeart from '../assets/sculpted_hanging_heart.jpg';
import sculptedWhiteHeart from '../assets/sculpted_white_heart.jpg';
import sculptedPregnantLady from '../assets/sculpted_pregnant_lady.jpg';
import sculptedBonsaiWaterfall from '../assets/sculpted_bonsai_waterfall.jpg';
import sculptedFlowerVase from '../assets/sculpted_flower_vase.jpg';
import promiseFreshFruitCake from '../assets/promise_fresh_fruit_cake.jpg';
import workPregnantLady from '../assets/work_pregnant_lady.jpg';
import workCricketer from '../assets/work_cricketer.jpg';
import workMinion from '../assets/work_minion.jpg';
import workRedDressGirl from '../assets/work_red_dress_girl.jpg';
import workSoccerBoy from '../assets/work_soccer_boy.jpg';
import fondantCouple from '../assets/fondant_couple.jpg';
import fondantPeppaPig from '../assets/fondant_peppa_pig.jpg';
import shaminiFounder from '../assets/shamini_founder.jpg';

const WHATSAPP_NUMBER = '919042960912';

const getMediaUrl = (keyOrUrl) => {
  if (!keyOrUrl) return '';
  if (keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://')) {
    try { const u = new URL(keyOrUrl); return `${API_BASE_URL}${u.pathname}`; } catch { return keyOrUrl; }
  }
  return `${API_BASE_URL}/api/media/${keyOrUrl}`;
};

const resolveGalleryImg = (keyOrUrl) => {
  if (!keyOrUrl) return '';
  if (keyOrUrl === 'work_pregnant_lady.jpg') return workPregnantLady;
  if (keyOrUrl === 'work_cricketer.jpg') return workCricketer;
  if (keyOrUrl === 'work_minion.jpg') return workMinion;
  if (keyOrUrl === 'work_red_dress_girl.jpg') return workRedDressGirl;
  if (keyOrUrl === 'work_soccer_boy.jpg') return workSoccerBoy;
  return getMediaUrl(keyOrUrl);
};

const Home = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [featuredMenu, setFeaturedMenu] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [selectedFlavours, setSelectedFlavours] = useState({});
  const [selectedQuantities, setSelectedQuantities] = useState({});
  const [lightboxImage, setLightboxImage] = useState(null);

  const openWhatsApp = (item, type = 'order') => {
    const hasFlavours = item.flavours && item.flavours.length > 0;
    const selectedFlavour = hasFlavours ? (selectedFlavours[item._id] || item.flavours[0]) : null;
    const selectedQty = hasFlavours ? (selectedQuantities[item._id] || 1) : 1;

    let msg = '';
    if (type === 'order') {
      if (hasFlavours && selectedFlavour) {
        const total = selectedFlavour.price * selectedQty;
        msg = `Hi! I'd like to order: *${item.name}*\n- Flavour: *${selectedFlavour.name}*\n- Quantity: *${selectedQty} Kg*\n- Total Price: *₹${total}*`;
      } else {
        msg = `Hi! I'd like to order: *${item.name}* (₹${item.price})`;
      }
    } else {
      if (hasFlavours && selectedFlavour) {
        msg = `Hi! I'd like to know more about: *${item.name}*\n- Flavour: *${selectedFlavour.name}*\n- Quantity: *${selectedQty} Kg*`;
      } else {
        msg = `Hi! I'd like to know more about: *${item.name}*`;
      }
    }
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
  };

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

  const [galleryItems, setGalleryItems] = useState([]);

  useEffect(() => {
    const fetchFeaturedMenu = async () => {
      try {
        setMenuLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/menu`);
        const data = await parseResponse(res);
        if (res.ok) {
          // Show up to 4 available items on the home page
          const items = Array.isArray(data) ? data : [];
          setFeaturedMenu(items.filter(i => i.isAvailable).slice(0, 4));
        }
      } catch (err) {
        console.error('Could not load menu preview:', err);
      } finally {
        setMenuLoading(false);
      }
    };
    fetchFeaturedMenu();
  }, []);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/gallery`);
        const data = await parseResponse(res);
        if (res.ok && Array.isArray(data)) {
          setGalleryItems(data);
        }
      } catch (err) {
        console.error('Could not load gallery items:', err);
      }
    };
    fetchGallery();
  }, []);

  const handleDashboardClick = () => {
    if (user) {
      if (user.role === 'admin' || user.role === 'employee') {
        navigate('/admin');
      } else {
        navigate('/account');
      }
    } else {
      navigate('/login');
    }
  };

  const homeSchema = {
    "@context": "https://schema.org",
    "@type": "Bakery",
    "name": "Soulful Baking",
    "image": "https://www.soulfulbaking.in/logo.png",
    "@id": "https://www.soulfulbaking.in/#bakery",
    "url": "https://www.soulfulbaking.in",
    "email": "query@soulfulbaking.in",
    "telephone": "+918124032128",
    "priceRange": "$$",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Alapakkam, New Perungalathur",
      "addressLocality": "Chennai",
      "postalCode": "600063",
      "addressCountry": "IN"
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
      ],
      "opens": "09:00",
      "closes": "21:00"
    }
  };

  return (
    <div className="home-page">
      <SEO 
        title="Soulful Baking – Online Baking Courses | Cake, Brownie & Cookie Classes"
        description="Learn professional baking with Soulful Baking. Explore online baking courses, cake recipes, baking classes, and premium bakery products."
        keywords="online baking course, cake making course, brownie course, cookie course, Soulful Baking, baking classes"
        canonicalUrl="https://www.soulfulbaking.in/"
        ogImage="https://www.soulfulbaking.in/logo.png"
        schema={homeSchema}
      />
      {/* Header / Navbar */}
      <header className={`home-navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="navbar-container">
          <Link to="/" className="navbar-logo">
            <Logo width={70} height={70} animate={false} />
            <span className="navbar-logo-text">Soulful Baking</span>
          </Link>

          <nav className="navbar-links-desktop">
            <Link to="/" className="nav-link active">Home</Link>
            <Link to="/courses" className="nav-link">Courses</Link>
            <Link to="/menu" className="nav-link">Menu</Link>
            <a href="#sweet-moments" className="nav-link">Sweet Moments</a>
            <a href="#story" className="nav-link">Our Story</a>
            <a href="#promise" className="nav-link">Our Promise</a>
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
            <Link to="/menu" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Menu</Link>
            <a href="#story" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Our Story</a>
            <a href="#promise" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Our Promise</a>
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
      <section 
        className="hero-section"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(7, 4, 3, 0.94) 0%, rgba(7, 4, 3, 0.84) 45%, rgba(7, 4, 3, 0.55) 85%, rgba(7, 4, 3, 0.75) 100%), url(${heroDessert})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="hero-container">
          <div className="hero-content">
            <span className="hero-badge">
              <Sparkles size={14} style={{ color: 'var(--gold-primary)' }} />
              <ShinyText text="ONLINE BAKING ACADEMY" speed={3.5} />
            </span>
            <h1 className="hero-title">
              <span className="visually-hidden">Learn Professional Online Baking Courses from Soulful Baking</span>
              <span aria-hidden="true">
                <SplitText text="Master the Art of Baking" delay={0.06} />
              </span>
            </h1>
            <p className="hero-description">
              Master the art of baking and cake decorating with step-by-step tutorials by Shamini Arun. Learn professional recipes, cake structure, sculpting, and realistic fondant figurines, all in one place.
            </p>
            <div className="hero-cta-buttons">
              <button onClick={() => navigate('/courses')} className="btn-primary-glow">
                Explore Masterclasses
                <ArrowRight size={18} />
              </button>
              <a href="#sweet-moments" className="btn-secondary-outline">
                Sweet Moments
              </a>
            </div>
          </div>

          <div className="hero-image-wrapper">
            <div className="hero-image-backdrop"></div>
            <TiltedCard maxRotation={10} scale={1.03}>
              <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '24px' }}>
                <img 
                  src={heroCardCake} 
                  alt="Custom handcrafted fondant cake" 
                  className="hero-image"
                />
              </div>
            </TiltedCard>
          </div>
        </div>
      </section>

      {/* Sweet Moments Section */}
      <section id="sweet-moments" className="sweet-moments-section">
        <div className="sweet-moments-container">
          <ScrollReveal y={30} delay={0.1}>
            <div className="sweet-moments-content">
              <span className="hero-badge" style={{ marginBottom: '1rem' }}>
                <Sparkles size={14} style={{ color: 'var(--gold-primary)' }} />
                <ShinyText text="OUR PHILOSOPHY" speed={3.5} />
              </span>
              <h2 className="sweet-moments-title">Sweet Moments</h2>
              <div className="sweet-moments-text">
                <p>
                  At Soulful Baking, we believe baking is more than a skill; it’s an art. Every cake tells a story, and every creation reflects passion, creativity, and craftsmanship. Our Online Baking Academy is designed to help aspiring bakers transform their passion into professional expertise.
                </p>
                <p>
                  Whether you’re just beginning your baking journey or looking to master advanced cake artistry, our carefully curated courses guide you every step of the way. Learn professional recipes, cake structure, sculpting, realistic fondant figurines, and intricate decorating techniques through detailed, easy-to-follow lessons. With expert guidance from Shamini Arun, you’ll gain the confidence, knowledge, and skills to create bakery-quality cakes that are as beautiful as they are delicious.
                </p>
              </div>
            </div>
          </ScrollReveal>
          <ScrollReveal y={30} delay={0.2}>
            <div className="sweet-moments-image-wrapper">
              <TiltedCard maxRotation={10} scale={1.03}>
                <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '24px' }}>
                  <img 
                    src={cameraCake} 
                    alt="Custom Canon camera cake sculpting" 
                    className="sweet-moments-image"
                  />
                </div>
              </TiltedCard>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Story & Features Section */}
      <section 
        id="story" 
        className="story-section"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(7, 4, 3, 0.94) 0%, rgba(7, 4, 3, 0.86) 45%, rgba(7, 4, 3, 0.55) 85%, rgba(7, 4, 3, 0.8) 100%), url(${storyDessert})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center left',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="story-container">
          <div className="story-image-column">
            <ScrollReveal y={40} delay={0.1}>
              <TiltedCard maxRotation={12} scale={1.03}>
                <div className="story-image-card" style={{ position: 'relative' }}>
                  <img 
                    src={shaminiFounder} 
                    alt="Shamini Arun - Founder & Master Baker of Soulful Baking" 
                    className="story-image"
                  />
                  <div 
                    style={{
                      position: 'absolute',
                      bottom: '1rem',
                      left: '1rem',
                      background: 'rgba(10, 5, 3, 0.85)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid var(--border-gold)',
                      borderRadius: '50px',
                      padding: '0.4rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.82rem',
                      color: 'var(--gold-light)',
                      fontWeight: '600',
                      boxShadow: '0 8px 20px rgba(0,0,0,0.5)'
                    }}
                  >
                    <Sparkles size={14} style={{ color: 'var(--gold-primary)' }} />
                    Shamini Arun • Founder
                  </div>
                </div>
              </TiltedCard>
            </ScrollReveal>
          </div>

          <div className="story-content-column">
            <ScrollReveal y={40} delay={0.25}>
              <span className="section-subtitle">
                <ShinyText text="MY STORY • EST. JUNE 17, 2024" speed={3} />
              </span>
              <h2 className="section-title">
                <SplitText text="Crafted with Love," delay={0.06} />{' '}
                <span className="highlight-text">
                  <BlurText text="Baked with Purpose" delay={0.08} />
                </span>
              </h2>

              <p className="story-text story-intro">
                Hi, I’m <strong>Shamini Arun</strong>, the founder of <strong>Soulful Baking</strong>, established on June 17, 2024.
              </p>

              <p className="story-text">
                My baking journey began when I was just 14 years old. What started as a simple hobby soon became a lifelong passion. I spent years learning, experimenting, and improving my skills, one cake at a time.
              </p>

              <p className="story-text">
                Although I graduated in Computer Science Engineering and began my career in IT, my heart was always drawn to creativity. After marriage, I chose to dedicate my time to my family, but my love for baking never faded.
              </p>

              <p className="story-text">
                For many years, I baked only for my family and friends. Seeing their smiles and hearing their appreciation brought me immense joy, but I never imagined turning my passion into a business.
              </p>

              <div className="story-quote-box">
                <p className="story-quote-intro">Then one day, a friend said something that changed my life:</p>
                <blockquote className="story-quote">
                  “Why don’t you start a baking business? That way, we can enjoy your cakes whenever we want!”
                </blockquote>
              </div>

              <p className="story-text">
                Those simple words planted a seed. They made me realize that my passion could bring happiness not only to my loved ones but also to many others.
              </p>

              <p className="story-text story-highlight-paragraph">
                And that’s how <strong>Soulful Baking</strong> was born on June 17, 2024.
              </p>

              <p className="story-text">
                With determination, continuous learning, and countless hours of practice, I transformed my passion into my profession. Today, Soulful Baking is more than just a cake studio; it’s a place where creativity, artistry, and heartfelt craftsmanship come together.
              </p>

              <p className="story-text">
                I specialize in custom cakes, fondant sculptures, and artistic cake designs, and I’m passionate about mentoring aspiring bakers through online and hands-on masterclasses. Every cake I create reflects my commitment to quality, creativity, and attention to detail.
              </p>

              <p className="story-text">
                My vision is simple: to help people celebrate life’s special moments with unforgettable cakes and to inspire aspiring bakers to become confident cake artists.
              </p>

              <div className="story-outro-card">
                <Heart size={20} className="story-heart-icon" />
                <p className="story-outro-text">
                  Thank you for being a part of my journey. Welcome to Soulful Baking, where every creation is made with love, passion, and purpose.
                </p>
              </div>

              <div className="story-cta-group">
                <button onClick={() => navigate('/courses')} className="btn-secondary-link">
                  Browse Masterclasses <ChevronRight size={18} className="btn-arrow-animate" />
                </button>
                <button onClick={() => navigate('/menu')} className="btn-secondary-link">
                  Explore Custom Cakes & Menu <ChevronRight size={18} className="btn-arrow-animate" />
                </button>
              </div>
            </ScrollReveal>
          </div>
        </div>

        {/* Feature Cards */}
        <ScrollReveal y={30} delay={0.15}>
          <div className="features-grid-container">
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <Compass size={24} />
                </div>
                <h3 className="feature-title">Baking Fundamentals</h3>
                <p className="feature-desc">Build a strong foundation by mastering essential baking techniques, ingredient handling, measuring methods, mixing, baking, and finishing skills.</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <Sparkles size={24} />
                </div>
                <h3 className="feature-title">The Science Behind Baking</h3>
                <p className="feature-desc">Understand the chemistry behind every bake, from how ingredients interact to how temperature, gluten, and leavening agents create the perfect texture, structure, and flavour.</p>
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
        </ScrollReveal>
      </section>

      {/* Our Promise Section */}
      <section id="promise" className="promise-section">
        <div className="promise-container">
          <ScrollReveal y={40} delay={0.1}>
            <div className="promise-image-column">
              <TiltedCard maxRotation={10} scale={1.03}>
                <div 
                  className="promise-image-card" 
                  onClick={() => setLightboxImage({ src: promiseFreshFruitCake, title: 'Fresh Seasonal Fruit Compote Cake' })}
                  title="Click to view full photo"
                >
                  <img 
                    src={promiseFreshFruitCake} 
                    alt="Fresh Fruit Layer Cake made with Scratch Compote" 
                    className="promise-image"
                  />
                </div>
              </TiltedCard>
            </div>
          </ScrollReveal>

          <div className="promise-content-column">
            <ScrollReveal y={40} delay={0.2}>
              <span className="section-subtitle">
                <ShinyText text="PURITY • QUALITY • AUTHENTICITY" speed={3} />
              </span>
              <h2 className="section-title">Our Promise</h2>

              <div className="promise-card-group">
                <div className="promise-item-card">
                  <div className="promise-icon-wrapper">
                    <ShieldCheck size={22} style={{ color: 'var(--gold-primary)' }} />
                  </div>
                  <div className="promise-item-text">
                    <h4>Scratch-Made Fillings & Pure Ingredients</h4>
                    <p>
                      At <strong>Soulful Baking</strong>, we believe great cakes begin with real ingredients. Every filling is made from scratch in our kitchen; we never use store-bought fillings, pre-mixes, or chemical volumizers.
                    </p>
                  </div>
                </div>

                <div className="promise-item-card">
                  <div className="promise-icon-wrapper">
                    <Leaf size={22} style={{ color: '#4ade80' }} />
                  </div>
                  <div className="promise-item-text">
                    <h4>Fresh Fruit Compotes & Authentic Flavour</h4>
                    <p>
                      For our fruit cakes, we don’t use ready-made fruit crushes or artificial fillings. Instead, we prepare fresh fruit compotes using seasonal fruits to deliver authentic flavour in every bite.
                    </p>
                  </div>
                </div>

                <div className="promise-notice-card">
                  <Info size={20} className="notice-icon" />
                  <p className="notice-text">
                    <strong>Please note:</strong> Fresh fruit cake prices may vary depending on the current market price and seasonal availability of fruits.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Signature Delicacies Section */}
      <section id="delicacies" className="delicacies-section">
        <ScrollReveal y={30} delay={0.1}>
          <div className="section-header">
            <span className="section-subtitle">Handcrafted Classics</span>
            <h2 className="section-title text-center">Our Signature Delicacies</h2>
            <p className="section-desc">
              Explore the culinary art of premium cake design and rich pastries. Here is a glimpse of what you will learn to craft.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal y={40} delay={0.2}>
        <div className="signature-showcase-container">
          {/* Feature 1: Signature Cupcake Bouquet */}
          <ScrollReveal y={40} delay={0.15}>
            <div className="signature-row">
              <div className="signature-img-box">
                <img src={cupcakeBouquet} alt="Signature Cupcake Bouquet" />
                <span className="signature-badge">Edible Floral Artistry</span>
              </div>
              <div className="signature-content-box">
                <h3 className="signature-item-title">Signature Cupcake Bouquet</h3>
                <p className="signature-item-text">
                  Why gift a flower bouquet when you can gift one you can eat? Our Signature Cupcake Bouquet is where baking meets artistry. Handcrafted with realistic buttercream flowers, each bouquet is made fresh to order using delicious cupcakes.
                </p>
                <p className="signature-item-text">
                  A beautiful and unique gift for birthdays, anniversaries, baby showers, Mother’s Day, or any special occasion.
                </p>
                <blockquote className="signature-quote">
                  "Flowers are lovely, but edible flowers are unforgettable."
                </blockquote>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi! I'd like to place an order for Signature Cupcake Bouquet.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-signature-order"
                >
                  <MessageCircle size={18} />
                  <span>Order Now via WhatsApp</span>
                </a>
              </div>
            </div>
          </ScrollReveal>

          {/* Feature 2: Everlasting Cup of Love */}
          <ScrollReveal y={40} delay={0.15}>
            <div className="signature-row reverse">
              <div className="signature-img-box">
                <img src={cupOfLove} alt="Everlasting Cup of Love" />
                <span className="signature-badge">Pioneered Signature Creation</span>
              </div>
              <div className="signature-content-box">
                <h3 className="signature-item-title">Everlasting Cup of Love ❤️</h3>
                <p className="signature-item-text">
                  A cup full of love, featuring our signature Tres Leches topped with edible art. We created this unique concept on 14 February 2026 as one of Soulful Baking’s signature creations.
                </p>
                <p className="signature-item-text">
                  Based on our research, we’re proud to say that Soulful Baking pioneered this style in India.
                </p>
                <blockquote className="signature-quote">
                  "Pioneered in India by Soulful Baking. Edible art in every cup."
                </blockquote>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi! I'd like to place an order for Everlasting Cup of Love.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-signature-order"
                >
                  <MessageCircle size={18} />
                  <span>Order Now via WhatsApp</span>
                </a>
              </div>
            </div>
          </ScrollReveal>

          {/* Feature 3: Realistic Whipped Cream Peacock Cake */}
          <ScrollReveal y={40} delay={0.15}>
            <div className="signature-row">
              <div className="signature-img-box">
                <img src={peacockCake} alt="Realistic Whipped Cream Peacock Cake" />
                <span className="signature-badge">Whipped Cream Innovation</span>
              </div>
              <div className="signature-content-box">
                <h3 className="signature-item-title">Realistic Whipped Cream Peacock Cake</h3>
                <p className="signature-item-text">
                  When I searched for a realistic peacock cake made entirely with whipped cream, I couldn’t find any references online. So, on 16 July 2026, I challenged myself to create one for my client.
                </p>
                <p className="signature-item-text">
                  To this day, we haven’t found evidence of a similar design. Soulful Baking appears to be the first to create and share this style of realistic peacock tail using only whipped cream, without fondant.
                </p>
                <blockquote className="signature-quote">
                  "Pioneered by Soulful Baking. Pure realistic whipped cream tail without fondant."
                </blockquote>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi! I'd like to place an order for the Realistic Whipped Cream Peacock Cake.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-signature-order"
                >
                  <MessageCircle size={18} />
                  <span>Order Now via WhatsApp</span>
                </a>
              </div>
            </div>
          </ScrollReveal>

          {/* Feature 4: Structured and sculptured cakes */}
          <ScrollReveal y={40} delay={0.15}>
            <div className="signature-row reverse">
              <div className="signature-img-box signature-collage-container">
                <span className="signature-badge">6-Photo Showcase</span>
                <div className="signature-collage-grid">
                  <div 
                    className="collage-item collage-item-1" 
                    onClick={() => setLightboxImage({ src: sculptedBonsaiWaterfall, title: 'Bonsai & Waterfall Sculpture Cake' })}
                    title="Click to view photo"
                  >
                    <img src={sculptedBonsaiWaterfall} alt="Bonsai & Waterfall Sculpture Cake" />
                    <div className="collage-overlay">
                      <span className="collage-title">Bonsai & Waterfall</span>
                    </div>
                  </div>
                  <div 
                    className="collage-item collage-item-2" 
                    onClick={() => setLightboxImage({ src: sculptedHangingHeart, title: 'Suspended Red Ruffle Heart Cake' })}
                    title="Click to view photo"
                  >
                    <img src={sculptedHangingHeart} alt="Suspended Red Ruffle Heart Cake" />
                    <div className="collage-overlay">
                      <span className="collage-title">Suspended Heart</span>
                    </div>
                  </div>
                  <div 
                    className="collage-item collage-item-3" 
                    onClick={() => setLightboxImage({ src: sculptedFlowerVase, title: 'Sculpted Flower Vase & Acrylic Box Cake' })}
                    title="Click to view photo"
                  >
                    <img src={sculptedFlowerVase} alt="Sculpted Flower Vase & Acrylic Box Cake" />
                    <div className="collage-overlay">
                      <span className="collage-title">Flower Vase & Box</span>
                    </div>
                  </div>
                  <div 
                    className="collage-item collage-item-4" 
                    onClick={() => setLightboxImage({ src: sculptedBarbieDoll, title: '3D Sculpted Barbie Doll Cake' })}
                    title="Click to view photo"
                  >
                    <img src={sculptedBarbieDoll} alt="3D Sculpted Barbie Doll Cake" />
                    <div className="collage-overlay">
                      <span className="collage-title">3D Barbie Doll</span>
                    </div>
                  </div>
                  <div 
                    className="collage-item collage-item-5" 
                    onClick={() => setLightboxImage({ src: sculptedWhiteHeart, title: 'Standing White Lace & Pearl Heart Cake' })}
                    title="Click to view photo"
                  >
                    <img src={sculptedWhiteHeart} alt="Standing White Lace & Pearl Heart Cake" />
                    <div className="collage-overlay">
                      <span className="collage-title">Lace & Pearl Heart</span>
                    </div>
                  </div>
                  <div 
                    className="collage-item collage-item-6" 
                    onClick={() => setLightboxImage({ src: sculptedPregnantLady, title: 'Sculpted Maternity Belly Cake' })}
                    title="Click to view photo"
                  >
                    <img src={sculptedPregnantLady} alt="Sculpted Maternity Belly Cake" />
                    <div className="collage-overlay">
                      <span className="collage-title">Sculpted Maternity</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="signature-content-box">
                <h3 className="signature-item-title">Structured and sculptured cakes</h3>
                <p className="signature-item-text">
                  Looking for a unique structured or sculpted cake for your special occasion? Let Soulful Baking create a masterpiece that makes your celebration even more memorable.
                </p>
                <blockquote className="signature-quote">
                  "Gravity-defying structure. Unforgettable centerpiece."
                </blockquote>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi! I'd like to inquire about a custom Structured and sculptured cake.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-signature-order"
                >
                  <MessageCircle size={18} />
                  <span>Order Now via WhatsApp</span>
                </a>
              </div>
            </div>
          </ScrollReveal>

          {/* Feature 5: Handcrafted Fondant Figurines */}
          <ScrollReveal y={40} delay={0.15}>
            <div className="signature-row">
              <div className="signature-img-box signature-collage-container">
                <span className="signature-badge">6-Photo Showcase</span>
                <div className="signature-collage-grid">
                  <div 
                    className="collage-item collage-item-1" 
                    onClick={() => setLightboxImage({ src: workCricketer, title: 'Personalized Cricketer Fondant Figurine' })}
                    title="Click to view photo"
                  >
                    <img src={workCricketer} alt="Personalized Cricketer Fondant Figurine" />
                    <div className="collage-overlay">
                      <span className="collage-title">Custom Cricketer</span>
                    </div>
                  </div>
                  <div 
                    className="collage-item collage-item-2" 
                    onClick={() => setLightboxImage({ src: fondantCouple, title: 'Handcrafted Couple Portrait Figurine' })}
                    title="Click to view photo"
                  >
                    <img src={fondantCouple} alt="Handcrafted Couple Portrait Figurine" />
                    <div className="collage-overlay">
                      <span className="collage-title">Couple Portrait</span>
                    </div>
                  </div>
                  <div 
                    className="collage-item collage-item-3" 
                    onClick={() => setLightboxImage({ src: workMinion, title: 'Minion Birthday Figurine' })}
                    title="Click to view photo"
                  >
                    <img src={workMinion} alt="Minion Birthday Figurine" />
                    <div className="collage-overlay">
                      <span className="collage-title">Minion Figurine</span>
                    </div>
                  </div>
                  <div 
                    className="collage-item collage-item-4" 
                    onClick={() => setLightboxImage({ src: workRedDressGirl, title: 'Bespoke Doll in Red Dress' })}
                    title="Click to view photo"
                  >
                    <img src={workRedDressGirl} alt="Bespoke Doll in Red Dress" />
                    <div className="collage-overlay">
                      <span className="collage-title">Elegant Doll</span>
                    </div>
                  </div>
                  <div 
                    className="collage-item collage-item-5" 
                    onClick={() => setLightboxImage({ src: fondantPeppaPig, title: 'Peppa Pig Family Figurines' })}
                    title="Click to view photo"
                  >
                    <img src={fondantPeppaPig} alt="Peppa Pig Family Figurines" />
                    <div className="collage-overlay">
                      <span className="collage-title">Peppa Pig Family</span>
                    </div>
                  </div>
                  <div 
                    className="collage-item collage-item-6" 
                    onClick={() => setLightboxImage({ src: workPregnantLady, title: 'Motherhood & Baby Shower Figurine' })}
                    title="Click to view photo"
                  >
                    <img src={workPregnantLady} alt="Motherhood & Baby Shower Figurine" />
                    <div className="collage-overlay">
                      <span className="collage-title">Motherhood Figurine</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="signature-content-box">
                <h3 className="signature-item-title">Handcrafted Fondant Figurines</h3>
                <p className="signature-item-text">
                  Bring your favorite characters, sports passions, and cherished personal milestones to life with bespoke 3D fondant figurines. Every figurine is meticulously handcrafted with fine detail and edible artistry.
                </p>
                <blockquote className="signature-quote">
                  "Turning special moments and characters into handcrafted edible keepsakes."
                </blockquote>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi! I'd like to inquire about custom Handcrafted Fondant Figurines.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-signature-order"
                >
                  <MessageCircle size={18} />
                  <span>Order Now via WhatsApp</span>
                </a>
              </div>
            </div>
          </ScrollReveal>
        </div>
        </ScrollReveal>
      </section>

      {/* Custom Work Showcase Section (After Signature Delicacies) */}
      <section id="custom-work" className="custom-work-section">
        <ScrollReveal y={30} delay={0.1}>
          <div className="section-header">
            <h2 className="section-title text-center">Our Custom Work Showcase</h2>
            <p className="section-desc">
              From milestone celebrations to personalized sports & theme figurines, see how we transform memories and imagination into handcrafted edible art.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal y={40} delay={0.2}>
          <div className="work-gallery-grid">
            {galleryItems.length > 0 ? (
              galleryItems.map((item) => {
                const imgSrc = resolveGalleryImg(item.image);

                return (
                  <div key={item._id} className="work-card">
                    <div className="work-image-wrapper">
                      <img src={imgSrc} alt={item.title} referrerPolicy="no-referrer" />
                      <div className="work-card-overlay">
                        <span className="work-tag">{item.tag || 'Custom Work'}</span>
                        <h4 className="work-title">{item.title}</h4>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <>
                <div className="work-card">
                  <div className="work-image-wrapper">
                    <img src={workPregnantLady} alt="Maternity & Baby Shower Fondant Figurine" />
                    <div className="work-card-overlay">
                      <span className="work-tag">Baby Shower / Maternity</span>
                      <h4 className="work-title">Motherhood Celebration</h4>
                    </div>
                  </div>
                </div>

                <div className="work-card">
                  <div className="work-image-wrapper">
                    <img src={workCricketer} alt="Personalized Cricketer Fondant Figurine" />
                    <div className="work-card-overlay">
                      <span className="work-tag">Sports & Hobby Theme</span>
                      <h4 className="work-title">Custom Cricketer</h4>
                    </div>
                  </div>
                </div>

                <div className="work-card">
                  <div className="work-image-wrapper">
                    <img src={workMinion} alt="Minion Birthday Party Figurine" />
                    <div className="work-card-overlay">
                      <span className="work-tag">Cartoon & Theme Birthday</span>
                      <h4 className="work-title">Minion Birthday Bash</h4>
                    </div>
                  </div>
                </div>

                <div className="work-card">
                  <div className="work-image-wrapper">
                    <img src={workRedDressGirl} alt="Custom Portrait Figurine in Red Dress" />
                    <div className="work-card-overlay">
                      <span className="work-tag">Bespoke Portrait</span>
                      <h4 className="work-title">Elegant Doll Figurine</h4>
                    </div>
                  </div>
                </div>

                <div className="work-card">
                  <div className="work-image-wrapper">
                    <img src={workSoccerBoy} alt="Custom Football Player Figurine" />
                    <div className="work-card-overlay">
                      <span className="work-tag">Sports Fanatic</span>
                      <h4 className="work-title">Soccer Player Figurine</h4>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="work-cta-container text-center">
            <p className="work-cta-text">
              Have a unique character, portrait, or theme in mind for your upcoming cake?
            </p>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi! I would like to inquire about a custom fondant figurine / creation.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-custom-wa-cta"
            >
              <MessageCircle size={18} />
              <span>Discuss Your Custom Order on WhatsApp</span>
            </a>
          </div>
        </ScrollReveal>
      </section>



      {/* Academy FAQ Section (SEO optimization) */}
      <section className="faq-section">
        <ScrollReveal y={30} delay={0.1}>
          <h2 className="faq-title">Frequently Asked Questions</h2>
        </ScrollReveal>
        <ScrollReveal y={40} delay={0.2}>
          <div className="faq-grid">
            <div className="faq-card">
              <h4 className="faq-question">Are these classes suitable for absolute beginners?</h4>
              <p className="faq-answer">
                Yes, all our courses are structured to build skills from the ground up. We start with essential kitchen safety, oven calibration, and ingredient weight measurements before moving on to advanced decoration.
              </p>
            </div>
            <div className="faq-card">
              <h4 className="faq-question">How long do I get access to the video lessons?</h4>
              <p className="faq-answer">
                Course access is provided during the specific validity period of each enrolled course.
              </p>
            </div>
            <div className="faq-card">
              <h4 className="faq-question">What equipment do I need to start?</h4>
              <p className="faq-answer">
                To begin, a standard home oven (OTG or convection), a digital kitchen scale, a hand mixer, mixing bowls, and basic baking pans are sufficient. We guide you on specialized tools inside each course.
              </p>
            </div>
            <div className="faq-card">
              <h4 className="faq-question">How does student support work?</h4>
              <p className="faq-answer">
                You can ask questions directly inside the learning dashboard or contact our WhatsApp support line for quick feedback on your baking homework, texturing, or recipes.
              </p>
            </div>
            <div className="faq-card">
              <h4 className="faq-question">Can I access the courses on mobile devices?</h4>
              <p className="faq-answer">
                Absolutely! Our academy platform is fully responsive and optimized for mobile devices, tablets, and desktop computers. You can learn in your kitchen as you bake.
              </p>
            </div>
            <div className="faq-card">
              <h4 className="faq-question">Is a certificate provided after completion?</h4>
              <p className="faq-answer">
                Certificates of completion are awarded exclusively for our offline physical classes.
              </p>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Footer Section */}
      <footer id="contact" className="home-footer">
        <div className="footer-container">
          <div className="footer-brand-section">
            <div className="footer-logo">
              <Logo width={90} height={90} animate={false} />
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
                  Alapakkam, New Perungalathur,<br />
                  Chennai - 600063
                </span>
              </li>
              <li className="contact-item">
                <Phone size={18} className="contact-icon" />
                <span className="contact-text">
                  <strong>ph:</strong> <a href="tel:+919042960912" style={{ color: 'inherit', textDecoration: 'none' }}>+91 90429 60912</a>
                </span>
              </li>
              <li className="contact-item">
                <a 
                  href={`https://wa.me/${WHATSAPP_NUMBER}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'inherit', textDecoration: 'none' }}
                >
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
                </a>
              </li>
              <li className="contact-item">
                <Mail size={18} className="contact-icon" style={{ color: 'var(--gold-primary)' }} />
                <span className="contact-text">
                  <strong>email:</strong> <a href="mailto:query@soulfulbaking.in" style={{ color: 'var(--gold-primary)', textDecoration: 'none' }}>query@soulfulbaking.in</a>
                </span>
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

      {/* Lightbox Modal for Sculpted Cake Collage */}
      {lightboxImage && (
        <div className="lightbox-modal-backdrop" onClick={() => setLightboxImage(null)}>
          <div className="lightbox-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close-btn" onClick={() => setLightboxImage(null)} aria-label="Close modal">
              <X size={24} />
            </button>
            <img src={lightboxImage.src} alt={lightboxImage.title} className="lightbox-modal-image" />
            <div className="lightbox-caption">{lightboxImage.title}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
