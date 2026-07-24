import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Footer from '../components/Footer';
import { ProductCard, SkeletonCard } from '../components/ProductCard';

const CATEGORIES = [
    { icon: 'fa-mobile-screen-button', label: 'Smartphones', link: '/products?cat=Smartphones' },
    { icon: 'fa-laptop',               label: 'Laptops',     link: '/products?cat=Laptops' },
    { icon: 'fa-mobile-screen',           label: 'iPhone',       link: '/products?cat=iPhone' },
    { icon: 'fa-tablet-screen-button', label: 'Tablets',     link: '/products?cat=Tablets' },
    { icon: 'fa-plug',                 label: 'Accessories', link: '/products?cat=Accessories' },
    { icon: 'fa-battery-full',         label: 'Power Banks', link: '/products?cat=Power%20Banks' },
];

export default function Home() {
    const [bestSelling, setBestSelling] = useState([]);
    const [featured, setFeatured] = useState([]);
    const [featLoading, setFeatLoading] = useState(true);
    const [newsletterSent, setNewsletterSent] = useState(false);
    const navigate = useNavigate();

    // ── Deal Countdown Timer ──
    const [time, setTime] = useState({ h: 9, m: 42, s: 17 });
    useEffect(() => {
        const end = Date.now() + (9 * 3600 + 42 * 60 + 17) * 1000;
        const id = setInterval(() => {
            const diff = Math.max(0, end - Date.now());
            setTime({
                h: Math.floor(diff / 3600000),
                m: Math.floor((diff % 3600000) / 60000),
                s: Math.floor((diff % 60000) / 1000),
            });
        }, 1000);
        return () => clearInterval(id);
    }, []);
    const pad = n => String(n).padStart(2, '0');

    // ── Data Fetching ──
    useEffect(() => {
        const fetchData = async () => {
            try {
                setFeatLoading(true);

                // Fetch high rated (mocking best sellers)
                const qRated = query(collection(db, "products"), where("averageRating", ">=", 4), limit(4));
                const snapRated = await getDocs(qRated);
                const highRated = snapRated.docs.map(d => ({ id: d.id, ...d.data() }));

                let bSellers = [...highRated];
                if (bSellers.length < 4) {
                    const qRecent = query(collection(db, "products"), limit(4 - bSellers.length));
                    const snapRecent = await getDocs(qRecent);
                    for (let d of snapRecent.docs) {
                        if (!bSellers.find(i => i.id === d.id)) bSellers.push({ id: d.id, ...d.data() });
                    }
                }

                // Fetch featured
                const qFeatured = query(collection(db, "products"), where("featured", "==", true), limit(3));
                const snapFeatured = await getDocs(qFeatured);
                let topPicks = snapFeatured.docs.map(d => ({ id: d.id, ...d.data() }));

                if (topPicks.length < 3) {
                    const qRecent2 = query(collection(db, "products"), limit(3 - topPicks.length));
                    const snapRecent2 = await getDocs(qRecent2);
                    for (let d of snapRecent2.docs) {
                        if (!topPicks.find(i => i.id === d.id)) topPicks.push({ id: d.id, ...d.data() });
                    }
                }

                if (bSellers.length > 0) setBestSelling(bSellers.slice(0, 4));
                if (topPicks.length > 0) setFeatured(topPicks.slice(0, 3));
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setFeatLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleNewsletter = (e) => {
        e.preventDefault();
        setNewsletterSent(true);
        setTimeout(() => setNewsletterSent(false), 3500);
    };

    return (
        <div>
            <main>
                <div className="container">
                    {/* ====================================================
                        HERO SECTION
                    ==================================================== */}
                    <section className="hero">
                        <div className="hero-card">
                            <div className="hero-pattern"></div>
                            <div className="glow-orb glow-orb-1"></div>
                            <div className="glow-orb glow-orb-2"></div>

                            <div className="hero-grid">
                                
                                {/* LEFT */}
                                <div className="fade-in-up">
                                    <div className="hero-eyebrow">
                                        <span className="dot"></span>
                                        <i className="fa-solid fa-bolt"></i> New Season Collection — 2026
                                    </div>
                                    <h1 className="hero-title">
                                        Nigeria's <span className="accent">Trusted Store</span> for UK Used &amp; Brand New Phones and Laptops
                                    </h1>
                                    <p className="hero-sub">
                                        Shop for iPhones, laptops and all phones accessories. Nationwide delivery.<br/>
                                        <span className="text-gray-400 font-semibold mt-2 inline-block">Buy now, or buy now and pay later with Klump</span>
                                    </p>
                                    
                                    <div className="hero-actions">
                                        <Link to="/products" className="btn-primary">
                                            Explore Catalog <i className="fa-solid fa-arrow-right"></i>
                                        </Link>
                                        <Link to="/products?cat=Smartphones" className="btn-ghost">
                                            <i className="fa-solid fa-mobile-screen"></i> Latest Phones
                                        </Link>
                                    </div>

                                    <div className="hero-stats">
                                        <div className="stat-item fade-in-up delay-2">
                                            <div className="stat-value">4,800<sup>+</sup></div>
                                            <div className="stat-label">Products</div>
                                        </div>
                                        <div className="stat-item fade-in-up delay-3">
                                            <div className="stat-value">28,000<sup>+</sup></div>
                                            <div className="stat-label">Happy Customers</div>
                                        </div>
                                        <div className="stat-item fade-in-up delay-4">
                                            <div className="stat-value">98<sup>%</sup></div>
                                            <div className="stat-label">5-Star Reviews</div>
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT */}
                                <div className="hero-visual fade-in-up delay-2">
                                    <div className="float-chip chip-top-left">
                                        <div className="float-chip-icon"><i className="fa-solid fa-shield-halved"></i></div>
                                        <div className="float-chip-text">
                                            <strong>Warranty</strong>
                                            <span>Manufacturer Guarantee</span>
                                        </div>
                                    </div>

                                    <div className="hero-phone-wrap">
                                        <div className="hero-phone-bg"></div>
                                        <div className="hero-phone-img">
                                            <img src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80" alt="Latest Flagship Smartphone" loading="eager" />
                                        </div>
                                    </div>

                                    <div className="float-chip chip-bot-right">
                                        <div className="float-chip-icon"><i className="fa-solid fa-credit-card"></i></div>
                                        <div className="float-chip-text">
                                            <strong>Pay Monthly</strong>
                                            <span>0% Interest Available</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Category Quick Bar */}
                        <div className="cat-bar" role="navigation" aria-label="Product categories">
                            {CATEGORIES.map(cat => (
                                <Link key={cat.label} to={cat.link} className="cat-item fade-in-up">
                                    <i className={`fa-solid ${cat.icon}`}></i>
                                    <span>{cat.label}</span>
                                </Link>
                            ))}
                        </div>
                    </section>

                    {/* ====================================================
                        DEAL BANNER
                    ==================================================== */}
                    <div className="deal-banner fade-in-up" role="region" aria-label="Flash deal">
                        <div className="deal-banner-glow"></div>
                        <div className="deal-meta">
                            <span className="deal-label"><i className="fa-solid fa-bolt"></i> Flash Deal of the Day</span>
                            <h2 className="deal-title">Good mood deals</h2>
                        </div>

                        <div className="deal-timer" aria-label="Countdown timer">
                            <div className="timer-block">
                                <span className="timer-num">{pad(time.h)}</span>
                                <span className="timer-label">Hours</span>
                            </div>
                            <div className="timer-block">
                                <span className="timer-num">{pad(time.m)}</span>
                                <span className="timer-label">Mins</span>
                            </div>
                            <div className="timer-block">
                                <span className="timer-num">{pad(time.s)}</span>
                                <span className="timer-label">Secs</span>
                            </div>
                        </div>

                        <Link to="/products" className="btn-primary" style={{ flexShrink: 0, padding: '0.85rem 1.75rem', fontSize: '0.85rem' }}>
                            Grab Deal <i className="fa-solid fa-arrow-right"></i>
                        </Link>
                    </div>

                    {/* ====================================================
                        TRENDING PRODUCTS
                    ==================================================== */}
                    <section aria-labelledby="trending-title" className="fade-in-up delay-1">
                        <div className="section-header">
                            <div className="section-label">
                                <div className="section-bar"></div>
                                <h2 className="section-title" id="trending-title">Trending Tech</h2>
                            </div>
                            <Link to="/products" className="section-link">View All <i className="fa-solid fa-chevron-right"></i></Link>
                        </div>

                        <div className="products-grid">
                            {featLoading ? (
                                [1, 2, 3, 4].map(i => <SkeletonCard key={i} />)
                            ) : (
                                bestSelling.map((product, idx) => (
                                    <ProductCard 
                                        key={product.id} 
                                        product={product} 
                                        tagLabel={idx === 0 ? 'Hot' : idx === 1 ? 'New' : null}
                                        onClick={() => navigate(`/products/${product.id}`)}
                                    />
                                ))
                            )}
                        </div>
                    </section>

                    {/* ====================================================
                        FEATURED COLLECTIONS
                    ==================================================== */}
                    <section aria-labelledby="featured-title" className="fade-in-up delay-1">
                        <div className="section-header">
                            <div className="section-label">
                                <div className="section-bar"></div>
                                <h2 className="section-title" id="featured-title">Featured Collections</h2>
                            </div>
                            <Link to="/products" className="section-link">Browse All <i className="fa-solid fa-chevron-right"></i></Link>
                        </div>

                        <div className="featured-grid">
                            {/* Wide card */}
                            <div className="featured-card" style={{ minHeight: 360 }}>
                                <div className="featured-img">
                                    <img src="https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=900&q=70" alt="Premium Tech Collection" />
                                </div>
                                <div className="featured-overlay"></div>
                                <div className="featured-content">
                                    <span className="featured-tag"><i className="fa-solid fa-fire"></i> Editor's Pick</span>
                                    <h3>Ultimate Productivity Bundle</h3>
                                    <p>MacBook Pro M3 Max + iPad Pro + AirPods Pro — built for creators.</p>
                                    <Link to="/products" className="btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '0.8rem' }}>Shop Bundle</Link>
                                </div>
                            </div>

                            {/* Stacked cards */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div className="featured-card" style={{ minHeight: 170 }}>
                                    <div className="featured-img">
                                        <img src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=70" alt="iPhone Products" />
                                    </div>
                                    <div className="featured-overlay"></div>
                                    <div className="featured-content">
                                        <span className="featured-tag"><i className="fa-solid fa-mobile-screen"></i> iPhone</span>
                                        <h3 style={{ fontSize: '1.1rem' }}>Premium iPhone</h3>
                                        <p style={{ marginBottom: '0.5rem' }}>Latest models & best deals.</p>
                                        <Link to="/products?cat=iPhone" className="section-link" style={{ fontSize: '0.7rem' }}>Explore <i className="fa-solid fa-arrow-right"></i></Link>
                                    </div>
                                </div>
                                <div className="featured-card" style={{ minHeight: 170 }}>
                                    <div className="featured-img">
                                        <img src="https://images.unsplash.com/photo-1592899677974-89c095bc68c3?auto=format&fit=crop&w=600&q=70" alt="Tech Accessories" />
                                    </div>
                                    <div className="featured-overlay"></div>
                                    <div className="featured-content">
                                        <span className="featured-tag" style={{ background: '#7C3AED' }}><i className="fa-solid fa-plug"></i> Accessories</span>
                                        <h3 style={{ fontSize: '1.1rem' }}>Essential Add-ons</h3>
                                        <p style={{ marginBottom: '0.5rem' }}>Chargers, cases, and more.</p>
                                        <Link to="/products?cat=Accessories" className="section-link" style={{ fontSize: '0.7rem', color: '#7C3AED' }}>Explore <i className="fa-solid fa-arrow-right"></i></Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ====================================================
                        VALUE PROPOSITIONS
                    ==================================================== */}
                    <section aria-label="Why choose NeoTech" style={{ marginTop: '5rem' }} className="fade-in-up delay-2">
                        <div className="section-header">
                            <div className="section-label">
                                <div className="section-bar"></div>
                                <h2 className="section-title">Why NeoTech?</h2>
                            </div>
                        </div>

                        <div className="props-grid">
                            <div className="prop-card">
                                <div className="prop-icon"><i className="fa-solid fa-credit-card"></i></div>
                                <h3 className="prop-title">Flexible Installments</h3>
                                <p className="prop-desc">Spread payments over 3–24 months with zero hidden fees. Get your device today, pay on your schedule.</p>
                            </div>
                            <div className="prop-card">
                                <div className="prop-icon"><i className="fa-solid fa-truck-fast"></i></div>
                                <h3 className="prop-title">Express Delivery</h3>
                                <p className="prop-desc">Same-day dispatch in Lagos. Nationwide door delivery with real-time tracking and full package insurance.</p>
                            </div>
                            <div className="prop-card">
                                <div className="prop-icon"><i className="fa-solid fa-shield-halved"></i></div>
                                <h3 className="prop-title">Official Warranty</h3>
                                <p className="prop-desc">Every device is 100% authentic, sealed in original packaging, backed by full manufacturer guarantee.</p>
                            </div>
                            <div className="prop-card">
                                <div className="prop-icon"><i className="fa-solid fa-headset"></i></div>
                                <h3 className="prop-title">24/7 Support</h3>
                                <p className="prop-desc">Our expert team is always available via WhatsApp, phone, or chat to assist you before and after purchase.</p>
                            </div>
                        </div>
                    </section>

                    {/* ====================================================
                        TESTIMONIALS
                    ==================================================== */}
                    <section className="testimonials-section fade-in-up delay-3" aria-labelledby="reviews-title">
                        <div className="section-header">
                            <div className="section-label">
                                <div className="section-bar"></div>
                                <h2 className="section-title" id="reviews-title">Customer Reviews</h2>
                            </div>
                            <Link to="/products" className="section-link">All Reviews <i className="fa-solid fa-chevron-right"></i></Link>
                        </div>

                        <div className="testi-grid">
                            <div className="testi-card">
                                <div className="testi-quote">"</div>
                                <p className="testi-text">Got my iPhone 15 Pro in 4 hours with same-day delivery. Installment plan was super easy to set up. NeoTech is the real deal!</p>
                                <div className="testi-stars">★★★★★</div>
                                <div className="testi-author">
                                    <div className="testi-avatar">AO</div>
                                    <div>
                                        <div className="testi-name">Adebayo Okafor</div>
                                        <div className="testi-role">Lagos, Nigeria</div>
                                    </div>
                                </div>
                            </div>
                            <div className="testi-card">
                                <div className="testi-quote">"</div>
                                <p className="testi-text">The monthly payment option made it possible for me to get a MacBook Pro I couldn't afford outright. Seamless process from start to finish.</p>
                                <div className="testi-stars">★★★★★</div>
                                <div className="testi-author">
                                    <div className="testi-avatar">CM</div>
                                    <div>
                                        <div className="testi-name">Chisom Madu</div>
                                        <div className="testi-role">Abuja, Nigeria</div>
                                    </div>
                                </div>
                            </div>
                            <div className="testi-card">
                                <div className="testi-quote">"</div>
                                <p className="testi-text">Excellent customer service — responded in minutes on WhatsApp. My order tracking was perfect. Will definitely buy again.</p>
                                <div className="testi-stars">★★★★★</div>
                                <div className="testi-author">
                                    <div className="testi-avatar">EI</div>
                                    <div>
                                        <div className="testi-name">Emeka Ike</div>
                                        <div className="testi-role">Port Harcourt, Nigeria</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ====================================================
                        NEWSLETTER
                    ==================================================== */}
                    <div className="fade-in-up delay-4" style={{ position: 'relative', overflow: 'hidden', background: '#111116', border: '1px solid #22222E', borderRadius: 24, padding: 'clamp(2.5rem,5vw,4rem)', textAlign: 'center', marginBottom: '5rem' }} role="region" aria-label="Newsletter signup">
                        <div style={{ position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)', width: 400, height: 400, background: 'radial-gradient(circle, rgba(212,43,43,0.15) 0%, transparent 70%)', pointerEvents: 'none' }}></div>
                        <h2 style={{ fontFamily: 'Rajdhani,sans-serif', fontSize: '2.5rem', fontWeight: 800, color: '#fff', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Stay Ahead of the Tech Curve</h2>
                        <p style={{ color: '#8888A0', marginBottom: '2rem', maxWidth: 500, margin: '0 auto 2rem' }}>Get exclusive deals, early access, and product drops straight to your inbox.</p>
                        
                        <form onSubmit={handleNewsletter} style={{ display: 'flex', gap: '0.75rem', maxWidth: 480, margin: '0 auto', flexDirection: 'column' }} className="sm:flex-row">
                            <input 
                                type="email" 
                                placeholder="Enter your email address" 
                                required 
                                aria-label="Email address"
                                style={{ flex: 1, width: '100%', padding: '1rem 1.5rem', background: '#181820', border: '1px solid #2C2C3A', borderRadius: 12, color: '#fff', outline: 'none' }}
                                onFocus={e => e.target.style.borderColor = '#D42B2B'}
                                onBlur={e => e.target.style.borderColor = '#2C2C3A'}
                            />
                            <button type="submit" className="btn-primary" style={{ padding: '1rem 2rem' }}>
                                {newsletterSent ? (
                                    <><i className="fa-solid fa-check"></i> Subscribed!</>
                                ) : (
                                    <><i className="fa-solid fa-paper-plane"></i> Subscribe</>
                                )}
                            </button>
                        </form>
                    </div>

                </div>
            </main>
            <Footer />
        </div>
    );
}
