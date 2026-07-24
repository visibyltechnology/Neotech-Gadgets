import { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import useAuthStore from './store/useAuthStore';
import { Toaster } from 'react-hot-toast';
import ScrollToTop from './components/ScrollToTop';
import ReturnToTopButton from './components/ReturnToTopButton';
import './index.css';

// Lazy load pages for performance
const Home          = lazy(() => import('./pages/Home'));
const Shop          = lazy(() => import('./pages/Shop'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Login         = lazy(() => import('./pages/Login'));
const Register      = lazy(() => import('./pages/Register'));
import VerifyOTP from './pages/VerifyOTP';
const ForgotPassword= lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Profile       = lazy(() => import('./pages/Profile'));
const Cart          = lazy(() => import('./pages/Cart'));
const Notifications = lazy(() => import('./pages/Notifications'));
const DeliveryPortal= lazy(() => import('./pages/DeliveryPortal'));
const Terms          = lazy(() => import('./pages/Terms'));
const PrivacyPolicy  = lazy(() => import('./pages/PrivacyPolicy'));

const AdminLayout      = lazy(() => import('./pages/Admin/AdminLayout'));
const ProductManager   = lazy(() => import('./pages/Admin/ProductManager'));
const CategoryManager  = lazy(() => import('./pages/Admin/CategoryManager'));
const BrandManager     = lazy(() => import('./pages/Admin/BrandManager'));
const ProductForm      = lazy(() => import('./pages/Admin/ProductForm'));
const AdminOrders      = lazy(() => import('./pages/Admin/AdminOrders'));
const AdminUsers       = lazy(() => import('./pages/Admin/AdminUsers'));
const SiteSettings     = lazy(() => import('./pages/Admin/SiteSettings'));

/* ─── Page-level Suspense mini-loader ─── */
const Loader = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    gap: '16px',
    background: '#0E0E10',
  }}>
    <style>{`
      @keyframes ntSpin   { to { transform: rotate(360deg); } }
      @keyframes ntFadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
      .nt-ring {
        width: 44px; height: 44px;
        border: 3px solid rgba(212,43,43,0.2);
        border-top-color: #D42B2B;
        border-radius: 50%;
        animation: ntSpin 0.8s cubic-bezier(0.4,0,0.6,1) infinite;
      }
      .nt-loader-text { animation: ntFadeUp 0.5s ease forwards; }
    `}</style>
    <div className="nt-ring"></div>
    <div className="nt-loader-text" style={{ textAlign: 'center', lineHeight: 1 }}>
      <span style={{
        fontFamily: 'Rajdhani, sans-serif',
        fontSize: '1rem',
        fontWeight: 700,
        letterSpacing: '0.2em',
        background: 'linear-gradient(135deg, #FF3030 30%, #C8C8D4 70%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        textTransform: 'uppercase',
      }}>NeoTech</span>
      <span style={{ color: '#505060', fontSize: '0.65rem', letterSpacing: '0.3em', display: 'block', marginTop: 4, textTransform: 'uppercase' }}>Gadgets</span>
    </div>
  </div>
);

/* ─── Full-page splash screen (auth init) ─── */
const SplashScreen = () => (
  <div
    style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#0E0E10',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}
  >
    <style>{`
      @keyframes splashSpin   { to { transform: rotate(360deg); } }
      @keyframes splashPulseRing { 0%,100% { transform:scale(1); opacity:.1; } 50% { transform:scale(1.3); opacity:.05; } }
      @keyframes splashBar    { from { width:0; } to { width:100%; } }
      @keyframes splashFadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
      @keyframes splashGlowRed { 0%,100% { text-shadow: 0 0 24px rgba(212,43,43,0.4); } 50% { text-shadow: 0 0 48px rgba(255,48,48,0.7), 0 0 80px rgba(212,43,43,0.3); } }
      @keyframes splashDot    { 0%,100%{ transform:scaleY(1); opacity:.5; } 50%{ transform:scaleY(1.8); opacity:1; } }
      @keyframes circuitAnim  { 0%,100% { opacity:0.08; } 50% { opacity:0.2; } }

      .splash-ring-outer {
        position:absolute; width:280px; height:280px;
        border-radius:50%; border:1px solid rgba(212,43,43,0.15);
        animation: splashPulseRing 3.5s ease-in-out infinite;
      }
      .splash-ring-mid {
        position:absolute; width:200px; height:200px;
        border-radius:50%; border:1.5px solid rgba(212,43,43,0.2);
        animation: splashPulseRing 3.5s ease-in-out infinite 0.6s;
      }
      .splash-ring-inner {
        position:absolute; width:120px; height:120px;
        border-radius:50%; border:2px solid rgba(212,43,43,0.3);
        animation: splashPulseRing 3.5s ease-in-out infinite 1.2s;
      }
      .splash-spinner {
        width:64px; height:64px;
        border-radius:50%;
        border:2.5px solid rgba(22,22,24,1);
        border-top-color:#D42B2B;
        border-right-color:#C8C8D4;
        animation: splashSpin 1s cubic-bezier(0.4,0,0.6,1) infinite;
      }
      .splash-wordmark { animation: splashFadeUp 0.8s 0.3s cubic-bezier(0.16,1,0.3,1) both; }
      .splash-tagline  { animation: splashFadeUp 0.8s 0.6s cubic-bezier(0.16,1,0.3,1) both; }
      .splash-bar-track {
        width:200px; height:3px;
        background:#1E1E22; border-radius:99px; overflow:hidden;
        animation: splashFadeUp 0.8s 0.9s cubic-bezier(0.16,1,0.3,1) both;
      }
      .splash-bar-fill {
        height:100%;
        background:linear-gradient(90deg, #D42B2B, #C8C8D4, #D42B2B);
        background-size:200% 100%;
        border-radius:99px;
        animation: splashBar 2.4s 1s cubic-bezier(0.4,0,0.2,1) forwards;
        width:0;
      }
      .splash-brand {
        font-family:'Rajdhani',sans-serif;
        background:linear-gradient(135deg,#FF3030 30%,#C8C8D4 70%);
        -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
        animation: splashGlowRed 2.5s ease-in-out infinite;
      }
      .splash-dot {
        display:inline-block; width:5px; border-radius:99px; background:#D42B2B;
      }
      .splash-dot:nth-child(1){ animation: splashDot 1s ease-in-out infinite 0s; }
      .splash-dot:nth-child(2){ animation: splashDot 1s ease-in-out infinite 0.2s; }
      .splash-dot:nth-child(3){ animation: splashDot 1s ease-in-out infinite 0.4s; }
      .splash-circuit { animation: circuitAnim 3s ease-in-out infinite; }
    `}</style>

    {/* Ambient red glow blobs */}
    <div style={{ position:'absolute', top:'-15%', right:'-10%', width:400, height:400, borderRadius:'50%', background:'rgba(212,43,43,0.04)', filter:'blur(80px)', pointerEvents:'none' }} />
    <div style={{ position:'absolute', bottom:'-15%', left:'-10%', width:360, height:360, borderRadius:'50%', background:'rgba(160,30,30,0.03)', filter:'blur(80px)', pointerEvents:'none' }} />

    {/* Circuit texture overlay */}
    <div className="splash-circuit" style={{ position:'absolute', inset:0, backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cpath d='M10 10 h10 v10 h10 M40 10 h10 v10 h-10 M10 40 h10 v10 h10 M40 40 h10 v10 h-10' stroke='%23D42B2B' stroke-width='0.6' fill='none'/%3E%3Ccircle cx='10' cy='10' r='1.5' fill='%23D42B2B'/%3E%3Ccircle cx='50' cy='10' r='1.5' fill='%23D42B2B'/%3E%3Ccircle cx='10' cy='50' r='1.5' fill='%23D42B2B'/%3E%3Ccircle cx='50' cy='50' r='1.5' fill='%23D42B2B'/%3E%3C/svg%3E\")", pointerEvents:'none', }} />

    {/* Pulse rings */}
    <div className="splash-ring-outer" />
    <div className="splash-ring-mid" />
    <div className="splash-ring-inner" />

    {/* Center content */}
    <div style={{ position:'relative', display:'flex', flexDirection:'column', alignItems:'center', gap:20 }}>
      <div className="splash-spinner" />

      <div className="splash-wordmark" style={{ textAlign:'center', lineHeight:1 }}>
        <div style={{ fontSize:'2.8rem', fontWeight:800, lineHeight:1, letterSpacing:'0.06em' }}>
          <span className="splash-brand">NeoTech</span>
        </div>
        <div style={{ fontFamily:'Rajdhani,sans-serif', fontSize:'0.75rem', fontWeight:600, letterSpacing:'0.5em', color:'#C8C8D4', marginTop:6, textTransform:'uppercase' }}>
          Gadgets
        </div>
        <div style={{ width:60, height:2, background:'linear-gradient(90deg,transparent,#D42B2B,transparent)', margin:'8px auto 0' }} />
      </div>

      <div className="splash-tagline" style={{ fontSize:'0.6rem', color:'#505060', letterSpacing:'0.25em', textTransform:'uppercase', textAlign:'center', maxWidth:240 }}>
        Smarter Tech. Better Life.
      </div>

      <div className="splash-bar-track">
        <div className="splash-bar-fill" />
      </div>

      <div style={{ display:'flex', gap:6, alignItems:'center', height:16 }}>
        <div className="splash-dot" style={{ height:8 }} />
        <div className="splash-dot" style={{ height:12 }} />
        <div className="splash-dot" style={{ height:8 }} />
      </div>
    </div>
  </div>
);

function App() {
  const { user, isAdmin, init, loading } = useAuthStore();

  useEffect(() => { init(); }, [init]);

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <Router>
      <ScrollToTop />
      <ReturnToTopButton />
      <Navbar />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1E1E22',
            color: '#E8E8F0',
            border: '1px solid #2A2A30',
            borderRadius: '10px',
            fontSize: '0.875rem',
            fontFamily: 'Inter, sans-serif',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          },
          success: { iconTheme: { primary: '#D42B2B', secondary: '#E8E8F0' } },
          error:   { iconTheme: { primary: '#FF3030', secondary: '#E8E8F0' } },
        }}
      />
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/"               element={<Home />} />
          <Route path="/products"       element={<Shop />} />
          <Route path="/products/:id"   element={<ProductDetail />} />
          <Route path="/shop"           element={<Shop />} />

          {/* Electronics category routes */}
          <Route path="/phones"         element={<Shop />} />
          <Route path="/laptops"        element={<Shop />} />
          <Route path="/gaming"         element={<Shop />} />
          <Route path="/audio"          element={<Shop />} />
          <Route path="/tvs"            element={<Shop />} />
          <Route path="/accessories"    element={<Shop />} />

          <Route path="/login"          element={<Login />} />
          <Route path="/register"       element={<Register />} />
          <Route path="/verify-otp"     element={<VerifyOTP />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password"  element={<ResetPassword />} />
          <Route path="/profile"        element={user ? <Profile /> : <Navigate to="/login" />} />
          <Route path="/cart"           element={<Cart />} />
          <Route path="/notifications"  element={user ? <Notifications /> : <Navigate to="/login" />} />
          <Route path="/delivery"       element={<DeliveryPortal />} />
          <Route path="/terms"          element={<Terms />} />
          <Route path="/privacy"        element={<PrivacyPolicy />} />

          <Route path="/admin" element={user && isAdmin ? <AdminLayout /> : <Navigate to="/" />}>
            <Route index              element={<ProductManager />} />
            <Route path="categories"  element={<CategoryManager />} />
            <Route path="brands"      element={<BrandManager />} />
            <Route path="new"         element={<ProductForm />} />
            <Route path="edit/:id"    element={<ProductForm />} />
            <Route path="orders"      element={<AdminOrders />} />
            <Route path="users"       element={<AdminUsers />} />
            <Route path="settings"    element={<SiteSettings />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
