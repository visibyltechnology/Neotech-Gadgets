import { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import Footer from '../components/Footer';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const NT = {
  bg: '#0E0E10', card: '#161618', border: '#2A2A30',
  primary: '#D42B2B', textMain: '#E8E8F0', textMuted: '#707080',
};

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email, { url: window.location.origin + '/login' });
      setEmailSent(true);
      toast.success('Password reset email sent!');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email address.');
      } else {
        setError('Failed to send reset email. Please try again.');
      }
      toast.error('Failed to send reset link.');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: NT.bg }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem' }}>
          <div style={{ width: '100%', maxWidth: 480, background: NT.card, border: `1px solid ${NT.border}`, borderRadius: 20, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.5)', textAlign: 'center', padding: '3.5rem 2.5rem' }}>
            <div style={{ width: 80, height: 80, background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <CheckCircle size={40} style={{ color: '#4ade80' }} strokeWidth={1.5} />
            </div>
            <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.6rem', fontWeight: 800, color: NT.textMain, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
              Check Your Email
            </h2>
            <p style={{ color: NT.textMuted, fontSize: '0.875rem', lineHeight: 1.7, marginBottom: '2rem' }}>
              We've sent a password reset link to <strong style={{ color: NT.textMain }}>{email}</strong>. Click the link in that email to create a new password.
            </p>
            <Link
              to="/login"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#D42B2B,#A01E1E)', color: '#fff', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.9rem 2.5rem', borderRadius: 12, textDecoration: 'none', boxShadow: '0 6px 24px rgba(212,43,43,0.35)', transition: 'all 0.25s' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 10px 32px rgba(212,43,43,0.5)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 6px 24px rgba(212,43,43,0.35)'; e.currentTarget.style.transform = 'none'; }}
            >
              Return to Login
            </Link>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: NT.bg }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem' }}>
        <div style={{ width: '100%', maxWidth: 460 }}>

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <Link to="/" style={{ display: 'inline-block', textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
                <div style={{ background: NT.card, border: `1px solid ${NT.border}`, borderRadius: 12, padding: '0.6rem 1rem', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <i className="fa-solid fa-microchip" style={{ color: NT.primary, fontSize: '1.1rem' }} />
                  <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.2rem', fontWeight: 800, color: NT.textMain, letterSpacing: '0.05em' }}>
                    NEO<span style={{ color: NT.primary }}>TECH</span>
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Card */}
          <div style={{ background: NT.card, border: `1px solid ${NT.border}`, borderRadius: 20, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}>
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg,#1A1A1E,#161618)', borderBottom: `1px solid ${NT.border}`, padding: '1.75rem 2rem', position: 'relative', overflow: 'hidden' }}>
              <div className="bg-circuit" style={{ position: 'absolute', inset: 0, opacity: 0.5, pointerEvents: 'none' }} />
              <Link
                to="/login"
                style={{ position: 'absolute', top: 16, right: 16, zIndex: 10, display: 'inline-flex', alignItems: 'center', gap: 5, color: NT.textMuted, fontSize: '0.7rem', fontWeight: 700, textDecoration: 'none', fontFamily: 'Rajdhani, sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = NT.textMain}
                onMouseLeave={e => e.currentTarget.style.color = NT.textMuted}
              >
                <ArrowLeft size={13} /> Back
              </Link>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(212,43,43,0.1)', border: '1px solid rgba(212,43,43,0.3)', color: '#FF6060', padding: '3px 12px', borderRadius: 99, fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'Rajdhani, sans-serif', marginBottom: 10 }}>
                  <i className="fa-solid fa-lock" /> Account Recovery
                </div>
                <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.6rem', fontWeight: 800, color: NT.textMain, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                  Reset Password
                </h1>
                <p style={{ color: NT.textMuted, fontSize: '0.8rem', marginTop: 4 }}>Enter your email to receive a reset link</p>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: '2rem' }}>
              {error && (
                <div style={{ background: 'rgba(212,43,43,0.08)', border: '1px solid rgba(212,43,43,0.3)', color: '#FF6060', padding: '0.75rem 1rem', borderRadius: 10, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', fontWeight: 500 }}>
                  <i className="fas fa-exclamation-circle" /> {error}
                </div>
              )}

              <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, color: NT.textMuted, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8, fontFamily: 'Rajdhani, sans-serif' }}>
                    Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: focused ? NT.primary : '#505060', transition: 'color 0.2s', pointerEvents: 'none' }} />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      onFocus={() => setFocused(true)}
                      onBlur={() => setFocused(false)}
                      style={{
                        width: '100%', background: NT.bg, border: `1px solid ${focused ? NT.primary : NT.border}`, borderRadius: 10,
                        padding: '0.75rem 1rem 0.75rem 2.5rem', color: NT.textMain, fontSize: '0.875rem',
                        fontFamily: 'Inter, sans-serif', outline: 'none', transition: 'all 0.2s',
                        boxShadow: focused ? '0 0 0 3px rgba(212,43,43,0.1)' : 'none',
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%', background: loading ? '#2A2A30' : 'linear-gradient(135deg,#D42B2B,#A01E1E)', color: '#fff',
                    fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.12em',
                    textTransform: 'uppercase', border: 'none', borderRadius: 12, padding: '1rem',
                    cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: loading ? 'none' : '0 6px 24px rgba(212,43,43,0.35)', transition: 'all 0.3s', opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? (
                    <><i className="fas fa-spinner fa-spin" /> Sending Code...</>
                  ) : (
                    <>Send Reset Code</>
                  )}
                </button>

                <div style={{ textAlign: 'center', paddingTop: '0.75rem', borderTop: `1px solid ${NT.border}` }}>
                  <Link to="/login" style={{ fontSize: '0.8rem', color: NT.textMuted, textDecoration: 'none', transition: 'color 0.2s', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                    onMouseEnter={e => e.currentTarget.style.color = NT.textMain}
                    onMouseLeave={e => e.currentTarget.style.color = NT.textMuted}
                  >
                    <ArrowLeft size={13} /> Back to Login
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
