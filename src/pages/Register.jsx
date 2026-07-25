import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { fetchSignInMethodsForEmail } from 'firebase/auth';
import Footer from '../components/Footer';
import LegalModal from '../components/LegalModal';
import { Eye, EyeOff, CheckCircle, UserPlus } from 'lucide-react';
import { sendRegistrationOTPEmail } from '../utils/email';
import toast from 'react-hot-toast';

const NT = {
  bg: '#0E0E10',
  card: '#161618',
  border: '#2A2A30',
  borderHover: 'rgba(212,43,43,0.45)',
  primary: '#D42B2B',
  primaryHover: '#FF3030',
  textMain: '#E8E8F0',
  textMuted: '#707080',
  textAccent: '#C8C8D4',
  inputBg: '#0E0E10',
};

function NTInput({ icon, label, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      {label && (
        <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, color: NT.textMuted, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6, fontFamily: 'Rajdhani, sans-serif' }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {icon && <i className={`fas ${icon}`} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: focused ? NT.primary : '#505060', fontSize: '0.8rem', transition: 'color 0.2s' }} />}
        <input
          {...props}
          onFocus={e => { setFocused(true); props.onFocus?.(e); }}
          onBlur={e => { setFocused(false); props.onBlur?.(e); }}
          style={{
            width: '100%',
            background: NT.inputBg,
            border: `1px solid ${focused ? NT.primary : NT.border}`,
            borderRadius: 10,
            padding: icon ? '0.75rem 1rem 0.75rem 2.5rem' : '0.75rem 1rem',
            color: NT.textMain,
            fontSize: '0.875rem',
            fontFamily: 'Inter, sans-serif',
            outline: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            boxShadow: focused ? `0 0 0 3px rgba(212,43,43,0.1)` : 'none',
            ...props.style,
          }}
        />
        {props.children}
      </div>
    </div>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', phone: '', email: '', password: '', confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [activeLegal, setActiveLegal] = useState(null);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      toast.error('Passwords do not match');
      return;
    }
    if (!agreedToTerms || !agreedToPrivacy) {
      setError('You must read and accept both the Terms of Service and Privacy Policy to continue.');
      toast.error('Please accept all terms and conditions.');
      return;
    }

    setLoading(true);
    try {
      try {
        const methods = await fetchSignInMethodsForEmail(auth, formData.email);
        if (methods && methods.length > 0) {
          setError('This email is already registered. Please login instead.');
          toast.error('This email is already registered.');
          setLoading(false);
          return;
        }
      } catch (checkErr) { /* ignored */ }

      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      try {
        await sendRegistrationOTPEmail(formData.email, formData.firstName, otpCode);
        toast.success('OTP sent! Check your email inbox (and spam folder).');
      } catch (emailErr) {
        console.error("EmailJS error:", emailErr);
        toast.error('Failed to send verification email. Please check your email address and try again.');
        setLoading(false);
        return;
      }

      sessionStorage.setItem('pendingRegistration', JSON.stringify(formData));
      sessionStorage.setItem('registrationOTP', otpCode);
      sessionStorage.setItem('otpExpiresAt', otpExpiresAt);

      setSuccessMessage('Verification email sent!');
      navigate(`/verify-otp?email=${encodeURIComponent(formData.email)}`);
    } catch (err) {
      console.error("Registration error:", err);
      if (err.message && err.message.toLowerCase().includes('offline')) {
        setError('Please check your internet connection and try again.');
        toast.error('Check your internet connection.');
      } else {
        let errorMsg = err.message || 'Registration failed. Please try again.';
        if (err.code === 'auth/email-already-in-use') {
          errorMsg = 'This email is already registered. Please go to the Login page to sign in.';
        } else if (err.message && err.message.includes('Firebase:')) {
          errorMsg = err.message.replace(/Firebase:\s*(.*?)\s*\(auth.*\)./, '$1');
        }
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: NT.bg }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem' }}>
        <div style={{ width: '100%', maxWidth: 520 }}>

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <Link to="/" style={{ display: 'inline-block', textDecoration: 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ background: NT.card, border: `1px solid ${NT.border}`, borderRadius: 16, padding: '0.75rem 1.25rem', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                  <i className="fa-solid fa-microchip" style={{ color: NT.primary, fontSize: '1.25rem' }} />
                  <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.4rem', fontWeight: 800, color: NT.textMain, letterSpacing: '0.05em' }}>
                    NEO<span style={{ color: NT.primary }}>TECH</span>
                  </span>
                </div>
                <span style={{ fontSize: '0.6rem', fontWeight: 700, color: NT.textMuted, textTransform: 'uppercase', letterSpacing: '0.2em', fontFamily: 'Rajdhani, sans-serif' }}>
                  Electronics & Solar
                </span>
              </div>
            </Link>
          </div>

          {/* Card */}
          <div style={{ background: NT.card, border: `1px solid ${NT.border}`, borderRadius: 20, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}>
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #1A1A1E, #161618)', borderBottom: `1px solid ${NT.border}`, padding: '1.75rem 2rem', position: 'relative', overflow: 'hidden' }}>
              <div className="bg-circuit" style={{ position: 'absolute', inset: 0, opacity: 0.5, pointerEvents: 'none' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(212,43,43,0.1)', border: '1px solid rgba(212,43,43,0.3)', color: '#FF6060', padding: '3px 12px', borderRadius: 99, fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'Rajdhani, sans-serif', marginBottom: 10 }}>
                  <i className="fa-solid fa-user-plus" /> New Account
                </div>
                <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.6rem', fontWeight: 800, color: NT.textMain, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                  Create Account
                </h1>
                <p style={{ color: NT.textMuted, fontSize: '0.8rem', marginTop: 4 }}>Join NeoTech Gadgets today</p>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: '2rem' }}>
              {error && (
                <div style={{ background: 'rgba(212,43,43,0.08)', border: '1px solid rgba(212,43,43,0.3)', color: '#FF6060', padding: '0.75rem 1rem', borderRadius: 10, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', fontWeight: 500 }}>
                  <i className="fas fa-exclamation-circle" /> {error}
                </div>
              )}

              {successMessage ? (
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', background: 'rgba(212,43,43,0.05)', border: '1px solid rgba(212,43,43,0.2)', borderRadius: 16, padding: '2rem' }}>
                    <CheckCircle size={52} style={{ color: '#4ade80' }} strokeWidth={1.5} />
                    <div>
                      <h3 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.2rem', fontWeight: 800, color: NT.textMain, textTransform: 'uppercase', marginBottom: 8 }}>Account Created!</h3>
                      <p style={{ color: '#4ade80', fontSize: '0.85rem', fontWeight: 500 }}>{successMessage}</p>
                      <p style={{ color: NT.textMuted, fontSize: '0.8rem', marginTop: 8 }}>A verification OTP has been sent to your email.</p>
                    </div>
                  </div>
                  <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: '1.5rem', background: 'linear-gradient(135deg,#D42B2B,#A01E1E)', color: '#fff', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.85rem 2rem', borderRadius: 12, textDecoration: 'none', boxShadow: '0 6px 24px rgba(212,43,43,0.35)' }}>
                    Go to Login <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.7rem' }} />
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                  {/* Name Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <NTInputWrapper label="First Name" icon="fa-user" name="firstName" value={formData.firstName} placeholder="John" required onChange={handleChange} type="text" />
                    <NTInputWrapper label="Last Name" icon="fa-user" name="lastName" value={formData.lastName} placeholder="Doe" required onChange={handleChange} type="text" />
                  </div>

                  <NTInputWrapper label="Phone Number" icon="fa-phone" name="phone" value={formData.phone} placeholder="+234 800 000 0000" required onChange={handleChange} type="tel" />
                  <NTInputWrapper label="Email Address" icon="fa-envelope" name="email" value={formData.email} placeholder="you@example.com" required onChange={handleChange} type="email" />

                  {/* Password */}
                  <PasswordField label="Password" name="password" value={formData.password} placeholder="Create a strong password" show={showPassword} onToggle={() => setShowPassword(v => !v)} onChange={handleChange} />

                  {/* Confirm Password */}
                  <div>
                    <PasswordField label="Confirm Password" name="confirmPassword" value={formData.confirmPassword} placeholder="Repeat your password" show={showConfirmPassword} onToggle={() => setShowConfirmPassword(v => !v)} onChange={handleChange} />
                    {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                      <p style={{ color: '#FF6060', fontSize: '0.7rem', fontWeight: 500, marginTop: 6 }}>
                        <i className="fas fa-times-circle" style={{ marginRight: 4 }} /> Passwords do not match
                      </p>
                    )}
                    {formData.confirmPassword && formData.password === formData.confirmPassword && formData.password.length >= 6 && (
                      <p style={{ color: '#4ade80', fontSize: '0.7rem', fontWeight: 500, marginTop: 6 }}>
                        <i className="fas fa-check-circle" style={{ marginRight: 4 }} /> Passwords match
                      </p>
                    )}
                  </div>

                  {/* Legal Checkboxes */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
                    <LegalCheckbox
                      agreed={agreedToTerms}
                      label="Terms of Service"
                      onRead={() => setActiveLegal('terms')}
                    />
                    <LegalCheckbox
                      agreed={agreedToPrivacy}
                      label="Privacy Policy"
                      onRead={() => setActiveLegal('privacy')}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: '100%', background: loading ? '#2A2A30' : 'linear-gradient(135deg,#D42B2B,#A01E1E)',
                      color: '#fff', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '0.85rem',
                      letterSpacing: '0.12em', textTransform: 'uppercase', border: 'none', borderRadius: 12,
                      padding: '1rem', cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      boxShadow: loading ? 'none' : '0 6px 24px rgba(212,43,43,0.35)',
                      transition: 'all 0.3s ease', opacity: loading ? 0.7 : 1, marginTop: 4,
                    }}
                  >
                    {loading ? (
                      <><i className="fas fa-spinner fa-spin" /> Creating Account...</>
                    ) : (
                      <><UserPlus size={16} /> Create My Account</>
                    )}
                  </button>

                  <div style={{ paddingTop: '1rem', borderTop: `1px solid ${NT.border}`, textAlign: 'center' }}>
                    <p style={{ fontSize: '0.8rem', color: NT.textMuted }}>
                      Already have an account?{' '}
                      <Link to="/login" style={{ color: NT.primary, fontWeight: 700, textDecoration: 'none' }}>
                        Sign In
                      </Link>
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Trust Badges */}
          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '2rem', fontSize: '0.7rem', color: NT.textMuted, fontWeight: 600 }}>
            <span><i className="fas fa-lock" style={{ marginRight: 4, color: '#4ade80' }} /> Secure Registration</span>
            <span><i className="fas fa-shield-alt" style={{ marginRight: 4, color: NT.primary }} /> 100% Safe</span>
          </div>
        </div>
      </div>

      <Footer />

      {activeLegal && (
        <LegalModal
          type={activeLegal}
          onClose={() => setActiveLegal(null)}
          onAccept={(type) => {
            if (type === 'terms') setAgreedToTerms(true);
            if (type === 'privacy') setAgreedToPrivacy(true);
          }}
        />
      )}
    </main>
  );
}

// Helper sub-components
function NTInputWrapper({ label, icon, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      {label && (
        <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, color: '#707080', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6, fontFamily: 'Rajdhani, sans-serif' }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {icon && <i className={`fas ${icon}`} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: focused ? '#D42B2B' : '#505060', fontSize: '0.8rem', transition: 'color 0.2s', pointerEvents: 'none' }} />}
        <input
          {...props}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%', background: '#0E0E10', border: `1px solid ${focused ? '#D42B2B' : '#2A2A30'}`, borderRadius: 10,
            padding: icon ? '0.75rem 1rem 0.75rem 2.5rem' : '0.75rem 1rem',
            color: '#E8E8F0', fontSize: '0.875rem', fontFamily: 'Inter, sans-serif', outline: 'none',
            transition: 'all 0.2s', boxShadow: focused ? '0 0 0 3px rgba(212,43,43,0.1)' : 'none',
          }}
        />
      </div>
    </div>
  );
}

function PasswordField({ label, name, value, placeholder, show, onToggle, onChange }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, color: '#707080', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6, fontFamily: 'Rajdhani, sans-serif' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <i className="fas fa-lock" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: focused ? '#D42B2B' : '#505060', fontSize: '0.8rem', transition: 'color 0.2s', pointerEvents: 'none' }} />
        <input
          type={show ? 'text' : 'password'}
          name={name} value={value} placeholder={placeholder} minLength="6" required onChange={onChange}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            width: '100%', background: '#0E0E10', border: `1px solid ${focused ? '#D42B2B' : '#2A2A30'}`, borderRadius: 10,
            padding: '0.75rem 3rem 0.75rem 2.5rem',
            color: '#E8E8F0', fontSize: '0.875rem', fontFamily: 'Inter, sans-serif', outline: 'none',
            transition: 'all 0.2s', boxShadow: focused ? '0 0 0 3px rgba(212,43,43,0.1)' : 'none',
          }}
        />
        <button
          type="button" onClick={onToggle}
          style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#505060', padding: 4, transition: 'color 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.color = '#C8C8D4'}
          onMouseLeave={e => e.currentTarget.style.color = '#505060'}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

function LegalCheckbox({ agreed, label, onRead }) {
  return (
    <div
      onClick={() => !agreed && onRead()}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12, padding: '0.85rem 1rem', borderRadius: 12,
        border: `1px solid ${agreed ? 'rgba(74,222,128,0.4)' : '#2A2A30'}`,
        background: agreed ? 'rgba(74,222,128,0.04)' : 'rgba(14,14,16,0.5)',
        cursor: agreed ? 'default' : 'pointer', transition: 'all 0.2s',
      }}
    >
      <div style={{
        width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1,
        background: agreed ? '#4ade80' : 'transparent',
        border: agreed ? 'none' : '1.5px solid #2A2A30',
        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
      }}>
        {agreed && <i className="fas fa-check" style={{ fontSize: '0.6rem', color: '#0E0E10' }} />}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '0.75rem', color: agreed ? '#E8E8F0' : '#707080', fontWeight: 600 }}>
          I have read and agree to the{' '}
          <button type="button" onClick={e => { e.stopPropagation(); onRead(); }} style={{ color: '#D42B2B', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 'inherit', textDecoration: 'underline', textUnderlineOffset: 2 }}>
            {label}
          </button>
        </p>
        <p style={{ fontSize: '0.6rem', color: agreed ? '#4ade80' : '#505060', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif' }}>
          {agreed ? <><i className="fas fa-check-circle" style={{ marginRight: 4 }} />Accepted</> : <><i className="fas fa-lock" style={{ marginRight: 4 }} />Click to read & accept</>}
        </p>
      </div>
    </div>
  );
}
