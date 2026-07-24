import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import useAuthStore from '../store/useAuthStore';
import useCartStore from '../store/useCartStore';
import toast from 'react-hot-toast';
import NotificationBell from './NotificationBell';

export default function Navbar() {
    const [search, setSearch] = useState('');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [tickerText, setTickerText] = useState('Premium Smartphones · Laptops · Tablets · iPhone · Accessories · Power Banks — Nationwide Delivery');
    const [scrolled, setScrolled] = useState(false);
    const { user, isAdmin, logout } = useAuthStore();
    const items = useCartStore((s) => s.items);
    const cartCount = items.reduce((t, i) => t + (i.quantity || 1), 0);
    const navigate = useNavigate();
    const location = useLocation();

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    // Scroll shadow with glassmorphism transition
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 60);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const docRef = doc(db, 'settings', 'site_settings');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists() && docSnap.data().tickerMessages) {
                    setTickerText(docSnap.data().tickerMessages.join('     ·     '));
                }
            } catch (error) {
                console.error("Error fetching ticker settings:", error);
            }
        };
        fetchSettings();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (search.trim()) {
            navigate(`/products?search=${encodeURIComponent(search.trim())}`);
            setSearch('');
            setMobileMenuOpen(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        toast.success('Signed out successfully');
        setMobileMenuOpen(false);
    };

    const isActive = (path) => location.pathname === path;

    return (
        <>
            {/* TOP ANNOUNCEMENT BANNER */}
            <div className="ticker-bar" role="marquee" aria-label="Promotions">
                <div className="ticker-track">
                    <span className="ticker-item">{tickerText}</span>
                    <span className="ticker-item">{tickerText}</span>
                    <span className="ticker-item">{tickerText}</span>
                </div>
            </div>

            {/* PRIMARY NAVBAR */}
            <nav 
                className="navbar" 
                role="navigation" 
                style={scrolled ? { background: 'rgba(11,11,14,0.96)', boxShadow: '0 4px 24px rgba(0,0,0,0.5)' } : {}}
            >
                <div className="container nav-inner">
                    {/* Brand */}
                    <Link to="/" className="brand" aria-label="NeoTech Gadgets Home">
                        <div className="brand-icon">
                            <i className="fa-solid fa-microchip"></i>
                        </div>
                        <div>
                            <div className="brand-name">NEO<em>TECH</em></div>
                            <span className="brand-sub">Smarter Tech · Better Life</span>
                        </div>
                    </Link>

                    {/* Menu */}
                    <ul className="nav-menu" role="list">
                        <li><Link to="/" className={isActive('/') ? 'active' : ''}>Home</Link></li>
                        <li><Link to="/products?cat=Smartphones" className={location.search.includes('Smartphones') ? 'active' : ''}>Phones</Link></li>
                        <li><Link to="/products?cat=Laptops" className={location.search.includes('Laptops') ? 'active' : ''}>Laptops</Link></li>
                        <li><Link to="/products?cat=Tablets" className={location.search.includes('Tablets') ? 'active' : ''}>Tablets</Link></li>
                        <li><Link to="/products?cat=iPhone" className={location.search.includes('iPhone') ? 'active' : ''}>iPhone</Link></li>
                        <li><Link to="/products" className={isActive('/products') && !location.search ? 'active' : ''}>Shop All</Link></li>
                    </ul>

                    {/* Right Actions */}
                    <div className="nav-right">
                        <form onSubmit={handleSearch} className="search-pill">
                            <i className="fa-solid fa-magnifying-glass"></i>
                            <input 
                                type="search" 
                                placeholder="Search products…" 
                                aria-label="Search products"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </form>

                        {user ? (
                            <div className="hidden sm:flex items-center gap-2">
                                {isAdmin && (
                                    <Link to="/admin" className="nav-icon-btn text-brandRed" aria-label="Admin Panel" title="Admin Panel">
                                        <i className="fa-solid fa-cog"></i>
                                    </Link>
                                )}
                                <Link to="/profile" className="nav-icon-btn" aria-label="Account" title="My Profile">
                                    <i className="fa-solid fa-user"></i>
                                </Link>
                                <button onClick={handleLogout} className="nav-icon-btn text-brandRed hover:text-red-500" aria-label="Logout" title="Logout">
                                    <i className="fa-solid fa-sign-out-alt"></i>
                                </button>
                            </div>
                        ) : (
                            <Link to="/login" className="nav-icon-btn hidden sm:flex" aria-label="Login">
                                <i className="fa-solid fa-user"></i>
                            </Link>
                        )}

                        <div className="hidden sm:block">
                            <NotificationBell userId={user?.uid} isMobile={false} />
                        </div>

                        <Link to="/cart" className="nav-icon-btn" aria-label="Cart">
                            <i className="fa-solid fa-cart-shopping"></i>
                            {cartCount > 0 && <span className="badge">{cartCount}</span>}
                        </Link>

                        <Link to="/products" className="nav-shop-btn">
                            <i className="fa-solid fa-bag-shopping"></i> Shop Now
                        </Link>

                        {/* Mobile Menu Toggle */}
                        <button 
                            className="nav-icon-btn md:hidden" 
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label="Toggle mobile menu"
                        >
                            <i className={`fa-solid ${mobileMenuOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
                        </button>
                    </div>
                </div>

                {/* MOBILE NAVIGATION DROPDOWN */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-[#1C1C24] px-4 pt-4 pb-8 space-y-2 overflow-y-auto max-h-[85vh] bg-[#0B0B0E]">
                        {/* Mobile Search */}
                        <form onSubmit={handleSearch} className="relative mb-6">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search gadgets..."
                                className="w-full bg-[#161618] text-white pl-4 pr-12 py-3.5 rounded-xl text-sm border border-[#2A2A30] focus:border-brandRed outline-none font-medium"
                            />
                            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-brandRed p-2">
                                <i className="fa-solid fa-magnifying-glass"></i>
                            </button>
                        </form>

                        <div className="space-y-1">
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-3 px-2">Navigation</p>
                            <Link to="/" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${isActive('/') ? 'bg-[#1E1E28] text-[#fff] border border-[#D42B2B]' : 'text-gray-300 hover:text-white hover:bg-[#161618]'}`}>
                                <i className="fas fa-home w-5 text-center text-[#D42B2B]"></i> Home
                            </Link>
                            <Link to="/products" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${isActive('/products') && !location.search ? 'bg-[#1E1E28] text-[#fff] border border-[#D42B2B]' : 'text-gray-300 hover:text-white hover:bg-[#161618]'}`}>
                                <i className="fas fa-mobile-screen w-5 text-center text-[#D42B2B]"></i> Shop All Gadgets
                            </Link>
                        </div>

                        <div className="pt-4 mt-2 border-t border-[#1C1C24]">
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-3 px-2">Categories</p>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { label: 'Phones', to: '/products?cat=Smartphones', icon: 'fa-mobile' },
                                    { label: 'Laptops', to: '/products?cat=Laptops', icon: 'fa-laptop' },
                                    { label: 'Tablets', to: '/products?cat=Tablets', icon: 'fa-tablet-screen-button' },
                                    { label: 'iPhone', to: '/products?cat=iPhone', icon: 'fa-mobile-screen' },
                                ].map(l => (
                                    <Link key={l.to} to={l.to} className="flex flex-col items-center justify-center gap-2 bg-[#111116] border border-[#22222E] rounded-xl p-3 text-gray-400 hover:text-white hover:border-[#D42B2B] transition-all">
                                        <i className={`fa-solid ${l.icon} text-lg text-[#D42B2B]`}></i>
                                        <span className="text-[10px] font-bold uppercase tracking-wider">{l.label}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 mt-4 border-t border-[#1C1C24] space-y-1">
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-3 px-2">Account</p>
                            {user ? (
                                <>
                                    <Link to="/profile" className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white rounded-xl hover:bg-[#161618] text-sm font-bold transition-all">
                                        <i className="fas fa-user w-5 text-center text-gray-500"></i> My Profile
                                    </Link>
                                    <Link to="/cart" className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white rounded-xl hover:bg-[#161618] text-sm font-bold transition-all">
                                        <i className="fas fa-bag-shopping w-5 text-center text-gray-500"></i> Cart ({cartCount})
                                    </Link>
                                    <div className="px-2 py-1">
                                        <NotificationBell userId={user.uid} isMobile={true} />
                                    </div>
                                    {isAdmin && (
                                        <Link to="/admin" className="flex items-center gap-3 px-4 py-3 text-[#D42B2B] font-black rounded-xl bg-[rgba(212,43,43,0.1)] border border-[rgba(212,43,43,0.2)] text-sm transition-all mt-2">
                                            <i className="fas fa-cog w-5 text-center"></i> Admin Panel
                                        </Link>
                                    )}
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-3 w-full text-left px-4 py-3 text-red-500 font-bold hover:text-red-400 rounded-xl hover:bg-red-950/30 text-sm transition-all mt-2"
                                    >
                                        <i className="fas fa-sign-out-alt w-5 text-center"></i> Logout
                                    </button>
                                </>
                            ) : (
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <Link to="/login" className="flex items-center justify-center gap-2 py-3 font-black rounded-xl text-white text-xs uppercase tracking-wider" style={{ background: 'linear-gradient(135deg, #D42B2B 0%, #8A0E0E 100%)', boxShadow: '0 4px 12px rgba(212,43,43,0.4)' }}>
                                        Sign In
                                    </Link>
                                    <Link to="/register" className="flex items-center justify-center gap-2 py-3 font-bold rounded-xl bg-[#161618] border border-[#2A2A30] text-gray-300 text-xs uppercase tracking-wider">
                                        Register
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </nav>
        </>
    );
}
