import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import Footer from '../components/Footer';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      const userDocRef = doc(db, 'users', userCredential.user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        if (userData.role === 'admin') {
          toast.success('Welcome back, Admin!');
          navigate('/admin');
          return;
        }
      }

      toast.success('Successfully logged in!');
      navigate('/shop');
    } catch (err) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password. Please try again.');
        toast.error('Invalid email or password.');
      } else if (err.message && err.message.toLowerCase().includes('offline')) {
        setError('Please check your internet connection and try again.');
        toast.error('Check your internet connection.');
      } else {
        setError('Failed to sign in. Please try again later.');
        toast.error('Failed to sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    background: '#1E1E22',
    border: '1px solid #2A2A30',
    color: '#E8E8F0',
    borderRadius: 12,
    padding: '0.875rem 1rem',
    fontSize: '0.875rem',
    outline: 'none',
    transition: 'all 0.25s ease',
    fontFamily: 'Inter, sans-serif',
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0E0E10' }}>
      {/* Page Body */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 1rem' }}>
        <div style={{ width: '100%', maxWidth: 440 }}>

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <Link to="/" style={{ display: 'inline-block', textDecoration: 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 68, height: 68, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#D42B2B,#A01E1E)',
                  border: '2px solid rgba(200,200,212,0.25)',
                  boxShadow: '0 0 40px rgba(212,43,43,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative',
                }}>
                  <i className="fa-solid fa-microchip" style={{ color: '#fff', fontSize: '1.5rem' }}></i>
                  {/* circuit dots */}
                  {[0,90,180,270].map(deg => (
                    <div key={deg} style={{
                      position: 'absolute',
                      width: 5, height: 5, borderRadius: '50%',
                      background: 'rgba(200,200,212,0.5)',
                      transform: `rotate(${deg}deg) translateY(-34px)`,
                    }} />
                  ))}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '2rem', fontWeight: 800, lineHeight: 1, letterSpacing: '0.05em' }}>
                    <span style={{ color: '#C8C8D4' }}>Neo</span>
                    <span style={{ color: '#D42B2B' }}>Tech</span>
                  </div>
                  <div style={{ fontSize: '0.6rem', color: '#505060', letterSpacing: '0.3em', textTransform: 'uppercase', marginTop: 3 }}>Gadgets</div>
                </div>
              </div>
            </Link>
          </div>

          {/* Card */}
          <div style={{
            background: '#161618',
            border: '1px solid #2A2A30',
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}>
            {/* Card Header */}
            <div style={{
              background: 'linear-gradient(135deg,rgba(212,43,43,0.1),rgba(22,22,24,0))',
              borderBottom: '1px solid #2A2A30',
              padding: '2rem',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Subtle circuit top-bar */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,transparent,#D42B2B,transparent)' }} />
              <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.8rem', fontWeight: 800, color: '#E8E8F0', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                Welcome Back
              </h1>
              <p style={{ color: '#707080', fontSize: '0.85rem' }}>Sign in to your NeoTech account</p>
            </div>

            {/* Card Body */}
            <div style={{ padding: '2rem' }}>
              {error && (
                <div style={{
                  background: 'rgba(212,43,43,0.1)',
                  border: '1px solid rgba(212,43,43,0.35)',
                  color: '#FF7070',
                  fontSize: '0.825rem', fontWeight: 500,
                  padding: '0.875rem 1rem', borderRadius: 10, marginBottom: '1.5rem',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <i className="fas fa-exclamation-circle"></i>
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Email */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', color: '#9898A8', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 8 }}>
                    Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <i className="fas fa-envelope" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#505060', fontSize: '0.8rem' }}></i>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      style={{ ...inputStyle, paddingLeft: '2.5rem' }}
                      onFocus={e => { e.target.style.borderColor = '#D42B2B'; e.target.style.boxShadow = '0 0 0 2px rgba(212,43,43,0.2)'; }}
                      onBlur={e => { e.target.style.borderColor = '#2A2A30'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <label style={{ fontSize: '0.65rem', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', color: '#9898A8', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                      Password
                    </label>
                    <a href="#" style={{ fontSize: '0.75rem', color: '#D42B2B', fontWeight: 600, textDecoration: 'none', transition: 'color 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#FF3030'}
                      onMouseLeave={e => e.currentTarget.style.color = '#D42B2B'}
                    >
                      Forgot Password?
                    </a>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <i className="fas fa-lock" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#505060', fontSize: '0.8rem' }}></i>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      style={{ ...inputStyle, paddingLeft: '2.5rem', paddingRight: '3rem' }}
                      onFocus={e => { e.target.style.borderColor = '#D42B2B'; e.target.style.boxShadow = '0 0 0 2px rgba(212,43,43,0.2)'; }}
                      onBlur={e => { e.target.style.borderColor = '#2A2A30'; e.target.style.boxShadow = 'none'; }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      style={{
                        position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#505060', transition: 'color 0.2s', display: 'flex', alignItems: 'center',
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#C8C8D4'}
                      onMouseLeave={e => e.currentTarget.style.color = '#505060'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    background: loading ? '#2A2A30' : 'linear-gradient(135deg,#D42B2B,#A01E1E)',
                    color: loading ? '#505060' : '#fff',
                    fontFamily: 'Rajdhani, sans-serif',
                    fontSize: '0.875rem', fontWeight: 800,
                    letterSpacing: '0.15em', textTransform: 'uppercase',
                    padding: '1rem', borderRadius: 12, border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    boxShadow: loading ? 'none' : '0 8px 24px rgba(212,43,43,0.35)',
                    transition: 'all 0.25s ease',
                    marginTop: 4,
                  }}
                  onMouseEnter={e => { if (!loading) { e.currentTarget.style.boxShadow = '0 12px 32px rgba(212,43,43,0.5)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = loading ? 'none' : '0 8px 24px rgba(212,43,43,0.35)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Signing In...
                    </>
                  ) : (
                    <>
                      <LogIn size={16} /> Sign In to Account
                    </>
                  )}
                </button>
              </form>

              <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #2A2A30', textAlign: 'center' }}>
                <p style={{ color: '#707080', fontSize: '0.875rem' }}>
                  Don't have an account?{' '}
                  <Link to="/register" style={{ color: '#D42B2B', fontWeight: 700, textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#FF3030'}
                    onMouseLeave={e => e.currentTarget.style.color = '#D42B2B'}
                  >
                    Create Account
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '2rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: '#505060' }}>
              <i className="fas fa-lock" style={{ color: '#D42B2B' }}></i> Secure Login
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: '#505060' }}>
              <i className="fas fa-shield-alt" style={{ color: '#9898A8' }}></i> 100% Safe
            </span>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
