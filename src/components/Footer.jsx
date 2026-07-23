import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
    const year = new Date().getFullYear();
    const [email, setEmail] = useState('');
    const [isSubscribed, setIsSubscribed] = useState(false);

    const WHATSAPP_LINK = 'https://wa.me/2347066514355?text=Hi%20NeoTech%20Gadgets%2C%20I%20want%20to%20enquire%20about%20a%20device.';

    const handleSubscribe = (e) => {
        e.preventDefault();
        if (email.trim()) {
            setIsSubscribed(true);
            setTimeout(() => { setIsSubscribed(false); setEmail(''); }, 4000);
        }
    };

    return (
        <footer
            className="mt-auto"
            style={{
                background: '#070709',
                borderTop: '1px solid rgba(212,43,43,0.2)',
                fontFamily: 'Inter, sans-serif',
            }}
        >
            {/* ── Newsletter Strip ── */}
            <div
                style={{
                    background: 'linear-gradient(135deg, rgba(212,43,43,0.05) 0%, rgba(14,14,18,1) 50%, rgba(212,43,43,0.05) 100%)',
                    borderBottom: '1px solid #1C1C24',
                    padding: '4rem 0',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,43,43,0.08)_0%,transparent_70%)] pointer-events-none"></div>

                <div className="max-w-[82rem] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-between gap-10 relative z-10">
                    <div className="text-center lg:text-left">
                        <span
                            className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg mb-4"
                            style={{
                                background: 'rgba(212,43,43,0.1)',
                                border: '1px solid rgba(212,43,43,0.25)',
                                color: '#FF6060',
                                fontFamily: 'Rajdhani, sans-serif',
                            }}
                        >
                            <i className="fa-solid fa-bolt text-[9px]"></i> Premium Tech & Gadgets
                        </span>
                        <h3
                            style={{
                                fontFamily: 'Rajdhani, sans-serif',
                                fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
                                fontWeight: 800,
                                color: '#fff',
                                letterSpacing: '0.04em',
                                lineHeight: 1.1,
                                textTransform: 'uppercase',
                            }}
                        >
                            Stay Ahead.{' '}
                            <span style={{ background: 'linear-gradient(135deg,#FF3030,#D42B2B)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', textShadow: '0 0 30px rgba(212,43,43,0.4)' }}>
                                Upgrade Smart.
                            </span>
                        </h3>
                        <p style={{ color: '#8888A0', fontSize: '0.9rem', marginTop: '0.75rem', maxWidth: '32rem', lineHeight: 1.6 }}>
                            Join our VIP list for exclusive drops on the latest iPhones, MacBooks, and smart devices.
                        </p>
                    </div>
                    <form
                        onSubmit={handleSubscribe}
                        className="flex w-full lg:w-auto rounded-2xl overflow-hidden shadow-2xl min-w-full sm:min-w-[440px] transition-all duration-300"
                        style={{ border: '1px solid #2A2A30', background: '#111116', boxShadow: '0 12px 40px rgba(0,0,0,0.6)' }}
                    >
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email address..."
                            style={{
                                flex: 1,
                                background: 'transparent',
                                border: 'none',
                                outline: 'none',
                                padding: '1.25rem 1.5rem',
                                color: '#fff',
                                fontSize: '0.9rem',
                                fontWeight: 500,
                            }}
                            className="placeholder-gray-500"
                        />
                        <button
                            type="submit"
                            className="px-8 font-black text-[0.8rem] uppercase tracking-[0.15em] flex-shrink-0 flex items-center justify-center min-w-[140px] text-white"
                            style={{
                                background: isSubscribed
                                    ? 'linear-gradient(135deg,#22c55e,#16a34a)'
                                    : 'linear-gradient(135deg,#D42B2B,#A01E1E)',
                                fontFamily: 'Rajdhani, sans-serif',
                                transition: 'all 0.3s',
                            }}
                        >
                            {isSubscribed ? (
                                <span className="flex items-center gap-2">
                                    <i className="fas fa-check-circle"></i>Done!
                                </span>
                            ) : 'Subscribe'}
                        </button>
                    </form>
                </div>
            </div>

            {/* ── Main Footer Layout ── */}
            <div className="max-w-[82rem] mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">

                    {/* Brand Meta Column */}
                    <div className="lg:col-span-4">
                        <Link to="/" className="inline-block group mb-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={{
                                        background: 'linear-gradient(135deg,#D42B2B,#A01E1E)',
                                        border: '1.5px solid rgba(255,255,255,0.1)',
                                        boxShadow: '0 0 20px rgba(212,43,43,0.4)',
                                    }}
                                >
                                    <i className="fa-solid fa-mobile-screen-button text-white text-[1.2rem]"></i>
                                </div>
                                <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.8rem', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.02em' }}>
                                    <span style={{ color: '#fff' }}>Neo</span>
                                    <span style={{ color: '#D42B2B' }}>Tech</span>
                                    <div style={{ fontSize: '0.55rem', color: '#8888A0', letterSpacing: '0.4em', textTransform: 'uppercase', marginTop: 4, fontWeight: 800 }}>Gadgets</div>
                                </div>
                            </div>
                        </Link>
                        <p style={{ color: '#8888A0', fontSize: '0.85rem', lineHeight: 1.8, maxWidth: '22rem', marginBottom: '1.75rem' }}>
                            Nigeria's premier destination for authentic smartphones, premium laptops, tablets and cutting-edge gadgets. We deliver excellence directly to your door.
                        </p>

                        {/* Social Bar */}
                        <div className="flex items-center gap-3">
                            {[
                                { icon: 'fa-whatsapp', href: WHATSAPP_LINK, fab: true },
                                { icon: 'fa-twitter', href: '#', fab: true },
                                { icon: 'fa-instagram', href: '#', fab: true },
                                { icon: 'fa-tiktok', href: '#', fab: true }
                            ].map((s, idx) => (
                                <a
                                    key={idx}
                                    href={s.href}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                        width: 42, height: 42,
                                        background: '#111116',
                                        border: '1px solid #22222E',
                                        borderRadius: 12,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: '#8888A0',
                                        fontSize: '1rem',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.background = 'linear-gradient(135deg,#D42B2B,#A01E1E)';
                                        e.currentTarget.style.borderColor = 'transparent';
                                        e.currentTarget.style.color = '#fff';
                                        e.currentTarget.style.transform = 'translateY(-4px) rotate(5deg)';
                                        e.currentTarget.style.boxShadow = '0 10px 20px rgba(212,43,43,0.3)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = '#111116';
                                        e.currentTarget.style.borderColor = '#22222E';
                                        e.currentTarget.style.color = '#8888A0';
                                        e.currentTarget.style.transform = 'translateY(0) rotate(0deg)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <i className={`${s.fab ? 'fab' : 'fas'} ${s.icon}`}></i>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="lg:col-span-2 md:pl-4">
                        <h4 style={{
                            color: '#fff', fontFamily: 'Rajdhani, sans-serif', fontWeight: 800,
                            fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.15em',
                            marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 10,
                        }}>
                            <span style={{ width: 4, height: 16, background: 'linear-gradient(to bottom, #D42B2B, #8A0E0E)', borderRadius: 99, display: 'inline-block' }}></span>
                            Store
                        </h4>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {[
                                { label: 'All Gadgets', to: '/products' },
                                { label: 'Smartphones', to: '/products?cat=Smartphones' },
                                { label: 'MacBooks & Laptops', to: '/products?cat=Laptops' },
                                { label: 'Tablets', to: '/products?cat=Tablets' },
                                { label: 'Premium Audio', to: '/products?cat=Audio' },
                            ].map((l, idx) => (
                                <li key={idx}>
                                    <Link
                                        to={l.to}
                                        className="group"
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 8,
                                            color: '#8888A0', fontSize: '0.85rem', fontWeight: 500,
                                            textDecoration: 'none', transition: 'all 0.2s',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.color = '#8888A0'; e.currentTarget.style.transform = 'translateX(0)'; }}
                                    >
                                        <i className="fas fa-angle-right" style={{ color: '#D42B2B', fontSize: '0.65rem' }}></i>
                                        {l.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Customer Service */}
                    <div className="lg:col-span-2">
                        <h4 style={{
                            color: '#fff', fontFamily: 'Rajdhani, sans-serif', fontWeight: 800,
                            fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.15em',
                            marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 10,
                        }}>
                            <span style={{ width: 4, height: 16, background: 'linear-gradient(to bottom, #D42B2B, #8A0E0E)', borderRadius: 99, display: 'inline-block' }}></span>
                            Support
                        </h4>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {[
                                { label: 'My Account', to: '/profile' },
                                { label: 'Track Delivery', to: '/delivery' },
                                { label: 'Warranty Claims', href: 'https://wa.me/2347066514355?text=Warranty' },
                                { label: 'Privacy Policy', to: '/privacy' },
                                { label: 'Terms & Conditions', to: '/terms' },
                            ].map((l, idx) => (
                                <li key={idx}>
                                    {l.href ? (
                                        <a
                                            href={l.href}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="group"
                                            style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#8888A0', fontSize: '0.85rem', fontWeight: 500, textDecoration: 'none', transition: 'all 0.2s' }}
                                            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.color = '#8888A0'; e.currentTarget.style.transform = 'translateX(0)'; }}
                                        >
                                            <i className="fas fa-angle-right" style={{ color: '#D42B2B', fontSize: '0.65rem' }}></i>
                                            {l.label}
                                        </a>
                                    ) : (
                                        <Link
                                            to={l.to}
                                            className="group"
                                            style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#8888A0', fontSize: '0.85rem', fontWeight: 500, textDecoration: 'none', transition: 'all 0.2s' }}
                                            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.color = '#8888A0'; e.currentTarget.style.transform = 'translateX(0)'; }}
                                        >
                                            <i className="fas fa-angle-right" style={{ color: '#D42B2B', fontSize: '0.65rem' }}></i>
                                            {l.label}
                                        </Link>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Location Card */}
                    <div
                        className="lg:col-span-4 self-start relative group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-brandRed/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
                        <div
                            style={{
                                background: 'linear-gradient(145deg, #161620, #0E0E12)',
                                border: '1px solid #22222E',
                                borderRadius: 20,
                                padding: '1.75rem',
                                position: 'relative',
                                zIndex: 1,
                            }}
                        >
                            <h4 style={{
                                color: '#fff', fontFamily: 'Rajdhani, sans-serif', fontWeight: 800,
                                fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.15em',
                                marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span style={{ width: 4, height: 16, background: 'linear-gradient(to bottom, #D42B2B, #8A0E0E)', borderRadius: 99, display: 'inline-block' }}></span>
                                    Experience Center
                                </span>
                                <span style={{ width: 8, height: 8, background: '#22c55e', borderRadius: '50%', boxShadow: '0 0 10px #22c55e', animation: 'pulse 2s infinite' }}></span>
                            </h4>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                    <div style={{ width: 38, height: 38, background: '#1C1C24', border: '1px solid #2A2A30', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <i className="fas fa-map-marker-alt" style={{ color: '#D42B2B', fontSize: '0.8rem' }}></i>
                                    </div>
                                    <p style={{ color: '#8888A0', fontSize: '0.8rem', lineHeight: 1.6, fontWeight: 500 }}>
                                        Shop 3, Aboderin Shopping Complex, beside California Luxury Hotel, Agbaje-Orita Challenge, Ibadan.
                                    </p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 38, height: 38, background: '#1C1C24', border: '1px solid #2A2A30', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <i className="fa-solid fa-phone" style={{ color: '#fff', fontSize: '0.8rem' }}></i>
                                    </div>
                                    <div>
                                        <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 700 }}>07066514355</div>
                                        <div style={{ color: '#8888A0', fontSize: '0.75rem', marginTop: 2 }}>General Enquiries</div>
                                    </div>
                                </div>

                                <a
                                    href={WHATSAPP_LINK}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                        background: 'linear-gradient(135deg,#16a34a,#15803d)',
                                        color: '#fff', fontSize: '0.8rem', fontWeight: 800,
                                        textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'Rajdhani, sans-serif',
                                        padding: '1rem',
                                        borderRadius: 14, textDecoration: 'none',
                                        transition: 'all 0.3s ease',
                                        marginTop: 8,
                                        boxShadow: '0 8px 20px rgba(22,163,74,0.2)',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(22,163,74,0.35)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(22,163,74,0.2)'; }}
                                >
                                    <i className="fab fa-whatsapp text-lg"></i>
                                    Chat Us on WhatsApp
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Category Cloud ── */}
                <div style={{ borderTop: '1px solid #1C1C24', paddingTop: '2.5rem', paddingBottom: '2.5rem' }}>
                    <div style={{ fontSize: '0.65rem', color: '#606075', fontFamily: 'Rajdhani, sans-serif', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.25em', marginBottom: '1.25rem' }}>
                        Popular Categories
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                        {[
                            'Smartphones', 'Tablets', 'Laptops',
                            'Audio', 'Accessories', 'Power Banks'
                        ].map((cat, idx) => (
                            <Link
                                key={idx}
                                to={`/products?cat=${encodeURIComponent(cat)}`}
                                style={{
                                    fontSize: '0.75rem', fontWeight: 600,
                                    color: '#8888A0',
                                    background: '#111116',
                                    border: '1px solid #22222E',
                                    borderRadius: 12, padding: '0.6rem 1.25rem',
                                    textDecoration: 'none',
                                    transition: 'all 0.25s ease',
                                    letterSpacing: '0.04em',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.background = 'rgba(212,43,43,0.1)';
                                    e.currentTarget.style.borderColor = 'rgba(212,43,43,0.4)';
                                    e.currentTarget.style.color = '#fff';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = '#111116';
                                    e.currentTarget.style.borderColor = '#22222E';
                                    e.currentTarget.style.color = '#8888A0';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                {cat}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* ── Bottom Bar ── */}
                <div style={{ borderTop: '1px solid #1C1C24', paddingTop: '2rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ fontSize: '0.8rem', color: '#606075', fontWeight: 500 }}>
                        © {year}{' '}
                        <span style={{ color: '#fff', fontWeight: 700 }}>NeoTech Gadgets Limited</span>.
                        All Rights Reserved.
                        <span style={{ margin: '0 12px', color: '#2A2A30' }}>|</span>
                        <Link to="/privacy" style={{ color: '#606075', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#606075'}>Privacy Policy</Link>
                        <span style={{ margin: '0 12px', color: '#2A2A30' }}>|</span>
                        <Link to="/terms" style={{ color: '#606075', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#606075'}>Terms of Service</Link>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#111116', border: '1px solid #22222E', borderRadius: 10, padding: '0.5rem 1rem' }}>
                            <i className="fa-solid fa-shield-halved" style={{ color: '#D42B2B', fontSize: '0.8rem' }}></i>
                            <span style={{ color: '#8888A0', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Secured Payment</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#111116', border: '1px solid #22222E', borderRadius: 10, padding: '0.5rem 1rem' }}>
                            <div style={{ display: 'flex', gap: 1, height: 14, width: 20, borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ background: '#15803d', flex: 1 }}></div>
                                <div style={{ background: '#fff', flex: 1 }}></div>
                                <div style={{ background: '#15803d', flex: 1 }}></div>
                            </div>
                            <span style={{ color: '#8888A0', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Registered Business</span>
                        </div>
                    </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: '2.5rem', fontSize: '0.6rem', fontFamily: 'Rajdhani, sans-serif', fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: '#2A2A30' }}>
                    PREMIUM GADGETS <span style={{ color: '#D42B2B', margin: '0 8px' }}>|</span> NATIONWIDE DELIVERY
                </div>
            </div>
        </footer>
    );
}
