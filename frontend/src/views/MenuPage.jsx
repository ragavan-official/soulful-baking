import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, MessageCircle, ChevronRight, ChevronLeft, Search, Sparkles, Filter, X, Menu, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import Logo from '../components/Logo';
import SEO from '../components/SEO';
import BlurText from '../components/BlurText';
import TiltedCard from '../components/TiltedCard';
import { API_BASE_URL, parseResponse } from '../config';

const WHATSAPP_NUMBER = '919042960912';

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

const Instagram = ({ size = 24, style }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 25 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 110,
      damping: 15
    }
  }
};

const MenuPage = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSlideIndices, setActiveSlideIndices] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedFlavours, setSelectedFlavours] = useState({});
  const [selectedBases, setSelectedBases] = useState({});
  const [selectedQuantities, setSelectedQuantities] = useState({});

  useEffect(() => {
    setActiveSlideIndices({});
  }, [searchQuery]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/menu`);
      const data = await parseResponse(res);
      if (!res.ok) throw new Error((data && data.message) || 'Failed to load menu');
      const items = Array.isArray(data) ? data : [];
      setMenuItems(items.filter(item => item.isAvailable));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDashboardClick = () => {
    if (user) {
      navigate(user.role === 'admin' || user.role === 'employee' ? '/admin' : '/account');
    } else {
      navigate('/login');
    }
  };

  const openWhatsApp = (item, selectedBase, selectedFlavour, selectedQty = 1) => {
    const hasFlavours = item.flavours && item.flavours.length > 0;
    const hasBases = item.bases && item.bases.length > 0;
    const isCake = hasFlavours || hasBases || item.category?.toLowerCase().includes('cake');
    const unitLabel = isCake ? 'Kg' : 'Qty';

    let total;
    if (hasBases && selectedFlavour) {
      total = selectedFlavour.price * selectedQty;
    } else if (hasFlavours && selectedFlavour) {
      total = selectedFlavour.price * selectedQty;
    } else {
      total = item.price * selectedQty;
    }

    let msg = `Hi! I'd like to order: *${item.name}*\n`;
    if (hasBases && selectedBase) {
      msg += `- Base Type: *${selectedBase.name}*\n`;
    }
    if (selectedFlavour) {
      msg += `- Flavour: *${selectedFlavour.name}*\n`;
    }
    msg += `- Quantity: *${selectedQty} ${unitLabel}*\n`;
    msg += `- Total Price: *₹${total}*`;

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const filtered = menuItems.filter(item => {
    const searchLow = searchQuery.toLowerCase();
    
    // Search in name, description, and bases
    let matchSearch = !searchQuery || item.name.toLowerCase().includes(searchLow) || item.description?.toLowerCase().includes(searchLow);
    if (!matchSearch && item.bases) {
       matchSearch = item.bases.some(b => b.name.toLowerCase().includes(searchLow) || b.flavours.some(f => f.name.toLowerCase().includes(searchLow)));
    }
    
    return matchSearch;
  });

  const categories = Array.from(new Set(filtered.map(i => i.name).filter(Boolean)));

  const menuSchema = {
    "@context": "https://schema.org",
    "@type": "Menu",
    "name": "Soulful Baking Cakes & Pastries Menu",
    "description": "Browse our selection of premium custom cakes, brownies, cupcakes, and handcrafted pastries.",
    "hasMenuItem": menuItems.map(item => ({
      "@type": "MenuItem",
      "name": item.name,
      "description": item.description,
      "offers": {
        "@type": "Offer",
        "price": item.price,
        "priceCurrency": "INR"
      }
    }))
  };

  return (
    <div className="home-page">
      <SEO 
        title="Signature Bakery Menu | Soulful Baking"
        description="Browse our delicious selection of premium custom cakes, brownies, cupcakes, and handcrafted pastries available at Soulful Baking."
        keywords="custom cake menu, order birthday cake, premium bakery items, cake catalogue"
        canonicalUrl="https://www.soulfulbaking.in/menu"
        schema={menuSchema}
      />
      {/* Navbar */}
      <header className={`home-navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="navbar-container">
          <Link to="/" className="navbar-logo">
            <Logo width={70} height={70} animate={false} />
            <span className="navbar-logo-text">Soulful Baking</span>
          </Link>

          <nav className="navbar-links-desktop">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/courses" className="nav-link">Courses</Link>
            <Link to="/menu" className="nav-link active">Menu</Link>
            <a href="/#story" className="nav-link">Our Story</a>
            <a href="/#contact" className="nav-link">Contact</a>
          </nav>

          <div className="navbar-actions">
            {user ? (
              <button onClick={handleDashboardClick} className="btn-navbar">Dashboard</button>
            ) : (
              <button onClick={() => navigate('/login')} className="btn-navbar">Sign In</button>
            )}
            <button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle Menu">
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="mobile-nav-menu">
            <Link to="/" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <Link to="/courses" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Courses</Link>
            <Link to="/menu" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Menu</Link>
            <a href="/#story" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Our Story</a>
            <a href="/#contact" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Contact</a>
            {user ? (
              <button onClick={() => { setMobileMenuOpen(false); handleDashboardClick(); }} className="btn-navbar" style={{ width: '100%', marginTop: '1rem' }}>Dashboard</button>
            ) : (
              <button onClick={() => { setMobileMenuOpen(false); navigate('/login'); }} className="btn-navbar" style={{ width: '100%', marginTop: '1rem' }}>Sign In</button>
            )}
          </div>
        )}
      </header>

      {/* Hero Banner */}
      <section className="menu-hero-banner">
        <div className="menu-hero-content">
          <span className="hero-badge">
            <Sparkles size={14} style={{ color: 'var(--gold-primary)' }} />
            Freshly Baked Daily
          </span>
          <h1 className="menu-hero-title">
            <span className="visually-hidden">Signature Bakery Menu from Soulful Baking</span>
            <span aria-hidden="true">
              <BlurText text="Our Menu" delay={0.08} />
            </span>
          </h1>
          <p className="menu-hero-desc">
            Every item is lovingly crafted with premium ingredients. Order via WhatsApp for same-day delivery.
          </p>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi! I\'d like to place an order.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp-hero"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.451 5.436 0 9.851-4.415 9.854-9.857.001-2.636-1.024-5.113-2.887-6.978C16.368 1.95 13.882.925 11.25.925c-5.438 0-9.853 4.414-9.856 9.856-.001 1.761.47 3.473 1.362 5.006l-1.012 3.7 3.8-.996zm13.155-7.142c-.29-.145-1.713-.847-1.978-.943-.265-.097-.459-.145-.651.145-.193.291-.748.944-.917 1.137-.168.193-.337.217-.627.072-2.91-1.454-4.81-3.411-5.585-4.743-.204-.352-.022-.544.15-.716.154-.155.337-.393.507-.589.17-.196.226-.338.338-.564.112-.226.056-.423-.028-.568-.084-.145-.651-1.568-.891-2.146-.233-.56-.47-.482-.651-.492-.168-.008-.362-.01-.555-.01-.193 0-.507.072-.772.361-.265.291-1.012.989-1.012 2.41 0 1.42 1.037 2.793 1.182 2.988.145.195 2.04 3.117 4.943 4.372.69.298 1.23.477 1.65.611.693.22 1.325.19 1.823.115.556-.083 1.713-.699 1.954-1.374.24-.675.24-1.253.168-1.374-.072-.12-.265-.193-.555-.338z"/>
            </svg>
            Order on WhatsApp
          </a>
        </div>
      </section>

      {/* Filter & Search Bar */}
      <section className="menu-controls-section">
        <div className="menu-controls-container">
          {/* Search */}
          <div className="menu-search-wrapper">
            <Search size={16} className="menu-search-icon" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="menu-search-input"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="menu-search-clear">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Pills Removed (Vertical Layout) */}
        </div>
      </section>

      {/* Menu Grid */}
      <section className="menu-grid-section">
        <div className="menu-grid-container">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>
              <div className="spinner" style={{ width: '40px', height: '40px', borderTopColor: 'var(--gold-primary)', margin: '0 auto 1rem' }} />
              <p>Loading our menu...</p>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--error)' }}>
              <p>{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="menu-empty-state">
              <ShoppingBag size={56} style={{ color: 'var(--gold-primary)', opacity: 0.3, marginBottom: '1rem' }} />
              <h3 style={{ fontFamily: 'var(--font-serif)' }}>
                {menuItems.length === 0 ? 'Menu Coming Soon!' : 'No Items Found'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                {menuItems.length === 0
                  ? 'Our menu is being prepared. Check back soon!'
                  : 'Try a different category or search term.'}
              </p>
            </div>
          ) : (
            <motion.div 
              className="menu-list-container"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', marginTop: '1.5rem' }}
            >
              {/* Build Slides for ALL Categories */}
              {categories.map(catName => {
                const itemsInCat = filtered.filter(item => item.name === catName);
                if (itemsInCat.length === 0) return null;

                const slides = [];
                itemsInCat.forEach(item => {
                  if (item.flavours && item.flavours.length > 0) {
                    slides.push({ type: 'item', item });
                  }
                  if (item.bases && item.bases.length > 0) {
                    item.bases.forEach(base => {
                      if (base.flavours && base.flavours.length > 0) {
                        slides.push({ type: 'base', item, base });
                      }
                    });
                  }
                });

                if (slides.length === 0) return null;
                const activeSlideIdx = activeSlideIndices[catName] || 0;
                const currentSlide = slides[activeSlideIdx] || slides[0];

                return (
                  <motion.div key={catName} variants={itemVariants} className="menu-category-section">
                    <div style={{ marginBottom: '0.8rem', paddingBottom: '0.4rem', borderBottom: '1px solid rgba(229,169,60,0.2)' }}>
                      <h2 className="menu-category-title" style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold-primary)', fontSize: '1.4rem', margin: 0 }}>
                        {catName}
                      </h2>
                      {currentSlide.type === 'base' ? (
                        <p style={{ color: 'var(--gold-light)', fontSize: '0.95rem', margin: '0.4rem 0 0 0', fontWeight: '500', letterSpacing: '0.5px' }}>
                          {currentSlide.base.name}
                        </p>
                      ) : (currentSlide.type === 'item' && currentSlide.item.bases && currentSlide.item.bases.length > 0) ? (
                        <p style={{ color: 'var(--gold-light)', fontSize: '0.95rem', margin: '0.4rem 0 0 0', fontWeight: '500', letterSpacing: '0.5px' }}>
                          {currentSlide.item.bases[0].name}
                        </p>
                      ) : null}
                    </div>
                    <div className="menu-list-table-wrapper" style={{ overflowX: 'auto', background: 'rgba(20, 10, 5, 0.45)', borderRadius: '12px', border: '1px solid var(--border-gold)' }}>
                      <table className="menu-list-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(229,169,60,0.15)', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            <th style={{ padding: '0.8rem 1rem' }}>Flavour</th>
                            <th style={{ padding: '0.8rem 1rem', width: '150px' }}>Quantity</th>
                            <th style={{ padding: '0.8rem 1rem', width: '120px' }}>Price</th>
                            <th style={{ padding: '0.8rem 1rem', width: '140px', textAlign: 'right' }}>Order</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentSlide.type === 'base' ? (
                            <React.Fragment>
                              {currentSlide.base.flavours.map((flav, fIdx) => {
                                const isCake = currentSlide.item.category?.toLowerCase().includes('cake') || currentSlide.item.name.toLowerCase().includes('cake');
                                const selectKey = `${currentSlide.item._id}-${currentSlide.base.name}-${flav.name}`;
                                const currentQty = selectedQuantities[selectKey] || 1;
                                const displayPrice = flav.price * currentQty;
                                
                                return (
                                  <tr key={`${currentSlide.item._id}-flav-${fIdx}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}>
                                    <td style={{ padding: '1rem', paddingLeft: '1.5rem' }}>
                                      <div style={{ fontWeight: '500', color: 'var(--text-primary)', fontSize: '0.95rem' }}>{flav.name}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                      <select
                                        value={currentQty}
                                        onChange={e => setSelectedQuantities(prev => ({ ...prev, [selectKey]: parseFloat(e.target.value) }))}
                                        style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid var(--border-gold)', color: 'var(--text-primary)', borderRadius: '6px', padding: '0.3rem 0.5rem', outline: 'none', fontSize: '0.8rem', cursor: 'pointer', width: '100px' }}
                                      >
                                        {isCake ? (
                                          <>
                                            <option value="0.5" style={{ background: '#130a06' }}>0.5 Kg</option>
                                            <option value="1" style={{ background: '#130a06' }}>1 Kg</option>
                                            <option value="1.5" style={{ background: '#130a06' }}>1.5 Kg</option>
                                            <option value="2" style={{ background: '#130a06' }}>2 Kg</option>
                                            <option value="3" style={{ background: '#130a06' }}>3 Kg</option>
                                            <option value="5" style={{ background: '#130a06' }}>5 Kg</option>
                                          </>
                                        ) : (
                                          <>
                                            <option value="1" style={{ background: '#130a06' }}>1 Qty</option>
                                            <option value="2" style={{ background: '#130a06' }}>2 Qty</option>
                                            <option value="3" style={{ background: '#130a06' }}>3 Qty</option>
                                            <option value="4" style={{ background: '#130a06' }}>4 Qty</option>
                                            <option value="5" style={{ background: '#130a06' }}>5 Qty</option>
                                          </>
                                        )}
                                      </select>
                                    </td>
                                    <td style={{ padding: '1rem', fontWeight: '600', color: 'var(--gold-light)', fontSize: '1rem' }}>
                                      ₹{displayPrice}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                      <button
                                        onClick={() => openWhatsApp(currentSlide.item, currentSlide.base, flav, currentQty)}
                                        style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)', border: 'none', color: '#fff', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', transition: 'transform 0.2s, box-shadow 0.2s' }}
                                      >
                                        <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.451 5.436 0 9.851-4.415 9.854-9.857.001-2.636-1.024-5.113-2.887-6.978C16.368 1.95 13.882.925 11.25.925c-5.438 0-9.853 4.414-9.856 9.856-.001 1.761.47 3.473 1.362 5.006l-1.012 3.7 3.8-.996zm13.155-7.142c-.29-.145-1.713-.847-1.978-.943-.265-.097-.459-.145-.651.145-.193.291-.748.944-.917 1.137-.168.193-.337.217-.627.072-2.91-1.454-4.81-3.411-5.585-4.743-.204-.352-.022-.544.15-.716.154-.155.337-.393.507-.589.17-.196.226-.338.338-.564.112-.226.056-.423-.028-.568-.084-.145-.651-1.568-.891-2.146-.233-.56-.47-.482-.651-.492-.168-.008-.362-.01-.555-.01-.193 0-.507.072-.772.361-.265.291-1.012.989-1.012 2.41 0 1.42 1.037 2.793 1.182 2.988.145.195 2.04 3.117 4.943 4.372.69.298 1.23.477 1.65.611.693.22 1.325.19 1.823.115.556-.083 1.713-.699 1.954-1.374.24-.675.24-1.253.168-1.374-.072-.12-.265-.193-.555-.338z"/>
                                        </svg>
                                        Order
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                              {currentSlide.base.flavours.length === 0 && (
                                <tr>
                                  <td colSpan="4" style={{ padding: '1rem', color: 'var(--text-secondary)' }}>No flavours added yet.</td>
                                </tr>
                              )}
                            </React.Fragment>
                          ) : (
                            <React.Fragment>
                              {currentSlide.item.flavours && currentSlide.item.flavours.map((flav, fIdx) => {
                                const isCake = currentSlide.item.category?.toLowerCase().includes('cake') || currentSlide.item.name.toLowerCase().includes('cake');
                                const selectKey = `${currentSlide.item._id}-legacy-${flav.name}`;
                                const currentQty = selectedQuantities[selectKey] || 1;
                                const displayPrice = flav.price * currentQty;
                                
                                return (
                                  <tr key={`${currentSlide.item._id}-legacy-${fIdx}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}>
                                    <td style={{ padding: '1rem', paddingLeft: '1.5rem' }}>
                                      <div style={{ fontWeight: '500', color: 'var(--text-primary)', fontSize: '0.95rem' }}>{flav.name}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                      <select
                                        value={currentQty}
                                        onChange={e => setSelectedQuantities(prev => ({ ...prev, [selectKey]: parseFloat(e.target.value) }))}
                                        style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid var(--border-gold)', color: 'var(--text-primary)', borderRadius: '6px', padding: '0.3rem 0.5rem', outline: 'none', fontSize: '0.8rem', cursor: 'pointer', width: '100px' }}
                                      >
                                        {isCake ? (
                                          <>
                                            <option value="0.5" style={{ background: '#130a06' }}>0.5 Kg</option>
                                            <option value="1" style={{ background: '#130a06' }}>1 Kg</option>
                                            <option value="1.5" style={{ background: '#130a06' }}>1.5 Kg</option>
                                            <option value="2" style={{ background: '#130a06' }}>2 Kg</option>
                                            <option value="3" style={{ background: '#130a06' }}>3 Kg</option>
                                            <option value="5" style={{ background: '#130a06' }}>5 Kg</option>
                                          </>
                                        ) : (
                                          <>
                                            <option value="1" style={{ background: '#130a06' }}>1 Qty</option>
                                            <option value="2" style={{ background: '#130a06' }}>2 Qty</option>
                                            <option value="3" style={{ background: '#130a06' }}>3 Qty</option>
                                            <option value="4" style={{ background: '#130a06' }}>4 Qty</option>
                                            <option value="5" style={{ background: '#130a06' }}>5 Qty</option>
                                          </>
                                        )}
                                      </select>
                                    </td>
                                    <td style={{ padding: '1rem', fontWeight: '600', color: 'var(--gold-light)', fontSize: '1rem' }}>
                                      ₹{displayPrice}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                      <button
                                        onClick={() => openWhatsApp(currentSlide.item, null, flav, currentQty)}
                                        style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)', border: 'none', color: '#fff', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', transition: 'transform 0.2s, box-shadow 0.2s' }}
                                      >
                                        <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.451 5.436 0 9.851-4.415 9.854-9.857.001-2.636-1.024-5.113-2.887-6.978C16.368 1.95 13.882.925 11.25.925c-5.438 0-9.853 4.414-9.856 9.856-.001 1.761.47 3.473 1.362 5.006l-1.012 3.7 3.8-.996zm13.155-7.142c-.29-.145-1.713-.847-1.978-.943-.265-.097-.459-.145-.651.145-.193.291-.748.944-.917 1.137-.168.193-.337.217-.627.072-2.91-1.454-4.81-3.411-5.585-4.743-.204-.352-.022-.544.15-.716.154-.155.337-.393.507-.589.17-.196.226-.338.338-.564.112-.226.056-.423-.028-.568-.084-.145-.651-1.568-.891-2.146-.233-.56-.47-.482-.651-.492-.168-.008-.362-.01-.555-.01-.193 0-.507.072-.772.361-.265.291-1.012.989-1.012 2.41 0 1.42 1.037 2.793 1.182 2.988.145.195 2.04 3.117 4.943 4.372.69.298 1.23.477 1.65.611.693.22 1.325.19 1.823.115.556-.083 1.713-.699 1.954-1.374.24-.675.24-1.253.168-1.374-.072-.12-.265-.193-.555-.338z"/>
                                        </svg>
                                        Order
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                              {(!currentSlide.item.flavours || currentSlide.item.flavours.length === 0) && (
                                <tr>
                                  <td colSpan="4" style={{ padding: '1rem', color: 'var(--text-secondary)' }}>No flavours added yet.</td>
                                </tr>
                              )}
                            </React.Fragment>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Bottom Carousel Navigation for Slides */}
                    {slides.length > 1 && (
                      <div className="menu-pagination-nav" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', borderTop: '1px solid rgba(229,169,60,0.2)', paddingTop: '1.5rem' }}>
                        <button 
                          onClick={() => {
                            if (activeSlideIdx > 0) {
                              setActiveSlideIndices(prev => ({ ...prev, [catName]: activeSlideIdx - 1 }));
                            }
                          }}
                          style={{ 
                            visibility: activeSlideIdx > 0 ? 'visible' : 'hidden',
                            background: 'rgba(22,12,7,0.8)', border: '1px solid var(--border-gold)', color: 'var(--gold-primary)', borderRadius: '8px', padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'var(--font-serif)', fontSize: '1rem' 
                          }}
                          onMouseOver={e => { e.currentTarget.style.background = 'var(--gold-primary)'; e.currentTarget.style.color = '#0a0503'; }}
                          onMouseOut={e => { e.currentTarget.style.background = 'rgba(22,12,7,0.8)'; e.currentTarget.style.color = 'var(--gold-primary)'; }}
                        >
                          <ChevronLeft size={20} />
                          Previous
                        </button>

                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                          {activeSlideIdx + 1} of {slides.length}
                        </span>

                        <button 
                          onClick={() => {
                            if (activeSlideIdx < slides.length - 1) {
                              setActiveSlideIndices(prev => ({ ...prev, [catName]: activeSlideIdx + 1 }));
                            }
                          }}
                          style={{ 
                            visibility: activeSlideIdx < slides.length - 1 ? 'visible' : 'hidden',
                            background: 'rgba(22,12,7,0.8)', border: '1px solid var(--border-gold)', color: 'var(--gold-primary)', borderRadius: '8px', padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'var(--font-serif)', fontSize: '1rem' 
                          }}
                          onMouseOver={e => { e.currentTarget.style.background = 'var(--gold-primary)'; e.currentTarget.style.color = '#0a0503'; }}
                          onMouseOut={e => { e.currentTarget.style.background = 'rgba(22,12,7,0.8)'; e.currentTarget.style.color = 'var(--gold-primary)'; }}
                        >
                          Next
                          <ChevronRight size={20} />
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="home-footer" style={{ marginTop: '5rem' }}>
        <div className="footer-container">
          <div className="footer-brand-section">
            <div className="footer-logo">
              <Logo width={90} height={90} animate={false} />
              <span className="footer-logo-text">Soulful Baking</span>
            </div>
            <p className="footer-tagline">
              Baking masterclasses designed to inspire your passion and elevate your dessert game to international standards.
            </p>
          </div>
          <div className="footer-links-section">
            <h4 className="footer-heading">Quick Links</h4>
            <ul className="footer-links-list">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/menu">Menu</Link></li>
              <li><Link to="/courses">Courses</Link></li>
            </ul>
          </div>
          <div className="footer-contact-section">
            <h4 className="footer-heading">Order via WhatsApp</h4>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp-footer"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.451 5.436 0 9.851-4.415 9.854-9.857.001-2.636-1.024-5.113-2.887-6.978C16.368 1.95 13.882.925 11.25.925c-5.438 0-9.853 4.414-9.856 9.856-.001 1.761.47 3.473 1.362 5.006l-1.012 3.7 3.8-.996zm13.155-7.142c-.29-.145-1.713-.847-1.978-.943-.265-.097-.459-.145-.651.145-.193.291-.748.944-.917 1.137-.168.193-.337.217-.627.072-2.91-1.454-4.81-3.411-5.585-4.743-.204-.352-.022-.544.15-.716.154-.155.337-.393.507-.589.17-.196.226-.338.338-.564.112-.226.056-.423-.028-.568-.084-.145-.651-1.568-.891-2.146-.233-.56-.47-.482-.651-.492-.168-.008-.362-.01-.555-.01-.193 0-.507.072-.772.361-.265.291-1.012.989-1.012 2.41 0 1.42 1.037 2.793 1.182 2.988.145.195 2.04 3.117 4.943 4.372.69.298 1.23.477 1.65.611.693.22 1.325.19 1.823.115.556-.083 1.713-.699 1.954-1.374.24-.675.24-1.253.168-1.374-.072-.12-.265-.193-.555-.338z"/>
              </svg>
              +91 90429 60912
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Soulful Baking Shamini. All rights reserved.</p>
          <p style={{ marginTop: '0.25rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>
            Developed with <Heart size={10} style={{ fill: 'var(--gold-primary)', color: 'var(--gold-primary)' }} /> for bakers globally
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MenuPage;
