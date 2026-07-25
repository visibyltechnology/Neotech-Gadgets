import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { collection, doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { sendRegistrationOTPEmail } from '../utils/email';
import toast from 'react-hot-toast';
import Footer from '../components/Footer';

const NT = {
  bg: '#0E0E10', card: '#161618', border: '#2A2A30',
  primary: '#D42B2B', textMain: '#E8E8F0', textMuted: '#707080',
};

export default function VerifyOTP() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');
  const navigate = useNavigate();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(null);
  const intervalRef = useRef(null);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  const startTimer = useCallback((expiresAtMs) => {
    stopTimer();
    const tick = () => {
      const diff = expiresAtMs - Date.now();
      if (diff <= 0) { setTimeLeft(0); stopTimer(); }
      else { setTimeLeft(Math.floor(diff / 1000)); }
    };
    tick();
    intervalRef.current = setInterval(tick, 1000);
  }, [stopTimer]);

  useEffect(() => {
    const dataStr = sessionStorage.getItem('pendingRegistration');
    const otpExpStr = sessionStorage.getItem('otpExpiresAt');
    if (!email || !dataStr || !otpExpStr) {
      toast.error('Session expired or invalid. Please register again.');
      navigate('/register');
      return;
    }
    const expiresAt = new Date(otpExpStr).getTime();
    startTimer(expiresAt);
    setIsPageLoading(false);
    return stopTimer;
  }, [email, navigate, startTimer, stopTimer]);

  const formatTime = (seconds) => {
    if (seconds === null) return '--:--';
    if (seconds === 0) return 'Expired';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;
    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);
    if (element.nextSibling && element.value) element.nextSibling.focus();
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && e.target.previousSibling) e.target.previousSibling.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;
    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) { if (i < 6) newOtp[i] = pastedData[i]; }
    setOtp(newOtp);
    setTimeout(() => {
      const inputs = document.querySelectorAll('.otp-input');
      const nextIndex = Math.min(pastedData.length, 5);
      if (inputs[nextIndex]) inputs[nextIndex].focus();
    }, 0);
  };

  const verifyOTP = async (e) => {
    e.preventDefault();
    const enteredCode = otp.join('');
    if (enteredCode.length !== 6) { setError('Please enter the 6-digit code.'); toast.error('Please enter the 6-digit code.'); return; }
    if (timeLeft === 0) { setError('OTP has expired. Please request a new one.'); toast.error('OTP has expired.'); return; }

    setLoading(true);
    setError('');
    try {
      const storedOTP = sessionStorage.getItem('registrationOTP');
      const dataStr = sessionStorage.getItem('pendingRegistration');
      if (!storedOTP || !dataStr) throw new Error('Session expired. Please register again.');
      if (enteredCode !== storedOTP) {
        setError('Invalid OTP code.');
        toast.error('Invalid OTP code.');
        setLoading(false);
        return;
      }
      const pendingData = JSON.parse(dataStr);

      let user;
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, pendingData.email, pendingData.password);
        user = userCredential.user;
      } catch (authErr) {
        if (authErr.code === 'auth/email-already-in-use') {
          try {
            const { signInWithEmailAndPassword } = await import('firebase/auth');
            const userCredential = await signInWithEmailAndPassword(auth, pendingData.email, pendingData.password);
            user = userCredential.user;
          } catch (signInErr) {
            if (signInErr.code === 'auth/invalid-credential' || signInErr.code === 'auth/wrong-password') {
              throw new Error('An account with this email already exists, but the password entered during registration does not match. Please go to the Login page to sign in or reset your password.');
            }
            throw signInErr;
          }
        } else {
          throw authErr;
        }
      }

      await setDoc(doc(db, 'users', user.uid), {
        firstName: pendingData.firstName, lastName: pendingData.lastName, phone: pendingData.phone,
        email: pendingData.email, isAdmin: false, isEmailVerified: true, createdAt: new Date().toISOString()
      }, { merge: true });
      sessionStorage.removeItem('pendingRegistration');
      sessionStorage.removeItem('registrationOTP');
      sessionStorage.removeItem('otpExpiresAt');
      toast.success('Account successfully created and verified!');
      window.location.href = '/';
    } catch (err) {
      console.error(err);
      let errorMsg = err.message || 'Failed to verify OTP. Please try again.';
      if (err.code === 'auth/invalid-credential') {
        errorMsg = 'Invalid account credentials. Please try logging in directly.';
      } else if (err.message.includes('Firebase:')) {
        errorMsg = err.message.replace(/Firebase:\s*(.*?)\s*\(auth.*\)./, '$1');
      }
      setError(errorMsg);
      toast.error(errorMsg);
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    try {
      const dataStr = sessionStorage.getItem('pendingRegistration');
      if (!dataStr) { setError('Session expired. Please register again.'); toast.error('Session expired. Please register again.'); navigate('/register'); return; }
      const pendingData = JSON.parse(dataStr);
      const newOtpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const newExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
      sessionStorage.setItem('registrationOTP', newOtpCode);
      sessionStorage.setItem('otpExpiresAt', newExpiresAt.toISOString());
      try {
        const sent = await sendRegistrationOTPEmail(email, pendingData.firstName || 'Customer', newOtpCode);
        if (sent !== false) { toast.success('A new OTP has been sent to your email.'); }
        else { throw new Error('Email sending returned false'); }
      } catch (emailErr) { console.error('Email resend error:', emailErr); toast.error('Failed to send OTP email.'); }
      setOtp(['', '', '', '', '', '']);
      startTimer(newExpiresAt.getTime());
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to resend OTP. Please try again later.');
      toast.error('Failed to resend OTP.');
    } finally { setResending(false); }
  };

  const isExpired = timeLeft === 0;

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: NT.bg }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem' }}>
        <div style={{ width: '100%', maxWidth: 480 }}>

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
            <div style={{ background: 'linear-gradient(135deg,#1A1A1E,#161618)', borderBottom: `1px solid ${NT.border}`, padding: '1.75rem 2rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div className="bg-circuit" style={{ position: 'absolute', inset: 0, opacity: 0.5, pointerEvents: 'none' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(212,43,43,0.1)', border: '1px solid rgba(212,43,43,0.3)', color: '#FF6060', padding: '3px 12px', borderRadius: 99, fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'Rajdhani, sans-serif', marginBottom: 10 }}>
                  <i className="fa-solid fa-envelope" /> Email Verification
                </div>
                <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.6rem', fontWeight: 800, color: NT.textMain, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 6px' }}>
                  Verify Your Email
                </h1>
                <p style={{ color: NT.textMuted, fontSize: '0.8rem' }}>
                  We sent a 6-digit code to <strong style={{ color: NT.textMain }}>{email}</strong>
                </p>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              {error && (
                <div style={{ background: 'rgba(212,43,43,0.08)', border: '1px solid rgba(212,43,43,0.3)', color: '#FF6060', padding: '0.75rem 1rem', borderRadius: 10, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: '0.8rem', fontWeight: 500 }}>
                  <i className="fas fa-exclamation-circle" /> {error}
                </div>
              )}

              {/* Timer */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: '1.75rem',
                fontFamily: 'Rajdhani, sans-serif', fontSize: '1.5rem', fontWeight: 800,
                color: isExpired ? NT.primary : timeLeft !== null && timeLeft < 60 ? '#F0A500' : NT.textMain,
                letterSpacing: '0.1em',
              }}>
                <i className={`fas fa-${isExpired ? 'times-circle' : 'clock'}`} style={{ fontSize: '1rem', color: isExpired ? NT.primary : '#60a5fa' }} />
                {isPageLoading ? '--:--' : formatTime(timeLeft)}
              </div>

              <form onSubmit={verifyOTP}>
                {/* OTP inputs */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: '1.75rem' }}>
                  {otp.map((data, index) => (
                    <input
                      key={index}
                      type="text"
                      maxLength="1"
                      value={data}
                      onChange={e => handleChange(e.target, index)}
                      onKeyDown={e => handleKeyDown(e, index)}
                      onPaste={index === 0 ? handlePaste : undefined}
                      onFocus={e => e.target.select()}
                      disabled={isPageLoading}
                      className="otp-input"
                      style={{
                        width: 48, height: 58, textAlign: 'center',
                        fontFamily: 'Rajdhani, sans-serif', fontSize: '1.5rem', fontWeight: 800, color: data ? NT.primary : NT.textMain,
                        background: data ? 'rgba(212,43,43,0.06)' : NT.bg,
                        border: `2px solid ${data ? NT.primary : NT.border}`,
                        borderRadius: 12, outline: 'none', transition: 'all 0.2s',
                        boxShadow: data ? '0 0 12px rgba(212,43,43,0.15)' : 'none',
                        opacity: isPageLoading ? 0.5 : 1,
                      }}
                      onInput={e => { e.target.style.borderColor = e.target.value ? NT.primary : NT.border; e.target.style.background = e.target.value ? 'rgba(212,43,43,0.06)' : NT.bg; }}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading || isPageLoading}
                  style={{
                    width: '100%', background: loading ? '#2A2A30' : 'linear-gradient(135deg,#D42B2B,#A01E1E)', color: '#fff',
                    fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.12em',
                    textTransform: 'uppercase', border: 'none', borderRadius: 12, padding: '1rem',
                    cursor: (loading || isPageLoading) ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: loading ? 'none' : '0 6px 24px rgba(212,43,43,0.35)',
                    transition: 'all 0.3s', opacity: (loading || isPageLoading) ? 0.7 : 1,
                  }}
                >
                  {loading ? (
                    <><i className="fas fa-spinner fa-spin" /> Verifying...</>
                  ) : (
                    <><i className="fas fa-check-circle" /> Verify Email</>
                  )}
                </button>
              </form>

              <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: `1px solid ${NT.border}`, textAlign: 'center' }}>
                <p style={{ fontSize: '0.8rem', color: NT.textMuted }}>
                  Didn't receive the code?{' '}
                  <button
                    onClick={handleResend}
                    disabled={resending || isPageLoading}
                    style={{ color: NT.primary, fontWeight: 700, background: 'none', border: 'none', cursor: (resending || isPageLoading) ? 'not-allowed' : 'pointer', fontSize: 'inherit', opacity: (resending || isPageLoading) ? 0.5 : 1, textDecoration: 'underline', textUnderlineOffset: 2, transition: 'color 0.2s' }}
                    onMouseEnter={e => { if (!resending) e.currentTarget.style.color = '#FF3030'; }}
                    onMouseLeave={e => e.currentTarget.style.color = NT.primary}
                  >
                    {resending ? 'Sending...' : 'Resend Code'}
                  </button>
                </p>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: NT.textMuted, fontWeight: 600 }}>
              <i className="fas fa-shield-alt" style={{ marginRight: 5, color: '#60a5fa' }} /> Secure Verification
            </span>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
