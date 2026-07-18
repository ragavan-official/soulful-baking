import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, MessageCircle, ChevronRight, Search, Sparkles, Filter, X, Menu, Heart } from 'lucide-react';
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

const MenuPage = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedFlavours, setSelectedFlavours] = useState({});
  const [selectedQuantities, setSelectedQuantities] = useState({});

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
      navigate(user.role === 'admin' ? '/admin' : '/account');
    } else {
      navigate('/login');
    }
  };

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

  // Build category list dynamically
  const categories = ['All', ...Array.from(new Set(menuItems.map(i => i.category).filter(Boolean)))];

  const filtered = menuItems.filter(item => {
    const matchCat = activeCategory === 'All' || item.category === activeCategory;
    const matchSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

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
            <Logo width={45} height={45} animate={false} />
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
              Our <span className="highlight-text"><BlurText text="Menu" delay={0.08} /></span>
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

          {/* Category Pills */}
          <div className="menu-category-pills">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`menu-cat-pill ${activeCategory === cat ? 'active' : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>
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
            <div className="menu-items-grid">
              {filtered.map(item => {
                const hasFlavours = item.flavours && item.flavours.length > 0;
                const currentFlavour = hasFlavours ? (selectedFlavours[item._id] || item.flavours[0]) : null;
                const currentQty = hasFlavours ? (selectedQuantities[item._id] || 1) : 1;
                const displayPrice = hasFlavours && currentFlavour ? currentFlavour.price * currentQty : item.price;

                return (
                  <TiltedCard key={item._id} className="menu-item-card">
                    <div className="menu-item-image-wrapper">
                      {item.image ? (
                        <img src={getMediaUrl(item.image)} alt={item.name} className="menu-item-image" />
                      ) : (
                        <div className="menu-item-image-placeholder">
                          <ShoppingBag size={36} style={{ color: 'var(--gold-primary)', opacity: 0.4 }} />
                        </div>
                      )}
                      <span className="menu-item-category-badge">{item.category}</span>
                    </div>

                    <div className="menu-item-body">
                      <div className="menu-item-header" style={{ alignItems: 'flex-start' }}>
                        <h3 className="menu-item-name">{item.name}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <span className="menu-item-price">₹{displayPrice}</span>
                          {hasFlavours && currentFlavour && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                              (₹{currentFlavour.price}/Kg)
                            </span>
                          )}
                        </div>
                      </div>

                      {item.description && (
                        <p className="menu-item-desc" style={{ marginBottom: hasFlavours ? '0.25rem' : '1rem' }}>{item.description}</p>
                      )}

                      {hasFlavours && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', margin: '0.5rem 0 1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--border-gold)' }}>
                          {/* Flavour dropdown */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Select Flavour</label>
                            <select
                              value={currentFlavour?.name || ''}
                              onChange={e => {
                                const selectedFlav = item.flavours.find(f => f.name === e.target.value);
                                setSelectedFlavours(prev => ({ ...prev, [item._id]: selectedFlav }));
                              }}
                              style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-gold)', color: 'var(--text-primary)', borderRadius: '6px', padding: '0.35rem 0.5rem', outline: 'none', fontSize: '0.85rem', cursor: 'pointer' }}
                            >
                              {item.flavours.map(f => (
                                <option key={f.name} value={f.name} style={{ background: '#130a06', color: 'var(--text-primary)' }}>
                                  {f.name} (₹{f.price}/Kg)
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Quantity weight dropdown */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Select Quantity (Weight)</label>
                            <select
                              value={currentQty}
                              onChange={e => {
                                setSelectedQuantities(prev => ({ ...prev, [item._id]: parseFloat(e.target.value) }));
                              }}
                              style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-gold)', color: 'var(--text-primary)', borderRadius: '6px', padding: '0.35rem 0.5rem', outline: 'none', fontSize: '0.85rem', cursor: 'pointer' }}
                            >
                              <option value="0.5" style={{ background: '#130a06' }}>0.5 Kg</option>
                              <option value="1" style={{ background: '#130a06' }}>1 Kg</option>
                              <option value="1.5" style={{ background: '#130a06' }}>1.5 Kg</option>
                              <option value="2" style={{ background: '#130a06' }}>2 Kg</option>
                              <option value="3" style={{ background: '#130a06' }}>3 Kg</option>
                              <option value="5" style={{ background: '#130a06' }}>5 Kg</option>
                            </select>
                          </div>
                        </div>
                      )}

                      <div className="menu-item-actions" style={{ marginTop: 'auto' }}>
                      <button
                        onClick={() => openWhatsApp(item, 'order')}
                        className="btn-menu-order"
                        title="Order via WhatsApp"
                      >
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" style={{ flexShrink: 0 }}>
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.451 5.436 0 9.851-4.415 9.854-9.857.001-2.636-1.024-5.113-2.887-6.978C16.368 1.95 13.882.925 11.25.925c-5.438 0-9.853 4.414-9.856 9.856-.001 1.761.47 3.473 1.362 5.006l-1.012 3.7 3.8-.996zm13.155-7.142c-.29-.145-1.713-.847-1.978-.943-.265-.097-.459-.145-.651.145-.193.291-.748.944-.917 1.137-.168.193-.337.217-.627.072-2.91-1.454-4.81-3.411-5.585-4.743-.204-.352-.022-.544.15-.716.154-.155.337-.393.507-.589.17-.196.226-.338.338-.564.112-.226.056-.423-.028-.568-.084-.145-.651-1.568-.891-2.146-.233-.56-.47-.482-.651-.492-.168-.008-.362-.01-.555-.01-.193 0-.507.072-.772.361-.265.291-1.012.989-1.012 2.41 0 1.42 1.037 2.793 1.182 2.988.145.195 2.04 3.117 4.943 4.372.69.298 1.23.477 1.65.611.693.22 1.325.19 1.823.115.556-.083 1.713-.699 1.954-1.374.24-.675.24-1.253.168-1.374-.072-.12-.265-.193-.555-.338z"/>
                        </svg>
                        Order Now
                      </button>
                      <button
                        onClick={() => openWhatsApp(item, 'details')}
                        className="btn-menu-details"
                        title="More details via WhatsApp"
                      >
                        <MessageCircle size={15} style={{ flexShrink: 0 }} />
                        More Details
                      </button>
                    </div>
                  </div>
                </TiltedCard>
              );
            })}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="home-footer" style={{ marginTop: '5rem' }}>
        <div className="footer-container">
          <div className="footer-brand-section">
            <div className="footer-logo">
              <Logo width={60} height={60} animate={false} />
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
