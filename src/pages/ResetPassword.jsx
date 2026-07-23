import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import axios from 'axios';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');
  const navigate = useNavigate();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!email) {
      navigate('/login');
    }
  }, [email, navigate]);

  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return false;

    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

    // Focus next input
    if (element.nextSibling && element.value) {
      element.nextSibling.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && e.target.previousSibling) {
        e.target.previousSibling.focus();
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const enteredCode = otp.join('');
    
    if (enteredCode.length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      toast.error('Invalid OTP code.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      toast.error('Passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      toast.error('Password too short.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:3001/api/reset-password', {
        email,
        otp: enteredCode,
        newPassword,
        project: 'Mayjay Concepts'
      });

      if (response.data.success) {
        toast.success('Password successfully reset! You can now log in.');
        navigate('/login');
      }
    } catch (err) {
      console.error('Reset Password Error:', err);
      const errorMessage = err.response?.data?.error || 'Failed to reset password. Ensure the service is running.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-grow bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          
          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-block">
              <div className="font-display text-4xl font-black tracking-tighter">
                <span className="text-brandDark">MAY</span><span className="text-brandLime">JAY</span>
              </div>
            </Link>
            <p className="text-gray-500 text-sm mt-2 font-medium">Concepts</p>
          </div>

          {/* Card */}
          <div className="bg-white border border-gray-200 shadow-lg rounded-sm overflow-hidden">
            <div className="bg-brandDark px-8 py-6 text-white text-center">
              <h1 className="text-2xl font-black uppercase tracking-wide font-display">Reset Password</h1>
              <p className="text-gray-400 text-sm font-medium mt-1">Enter the 6-digit code sent to <strong>{email}</strong></p>
            </div>

            <div className="px-8 py-8">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-4 py-3 rounded-sm mb-6 flex items-center gap-2 justify-center">
                  <i className="fas fa-exclamation-circle text-red-500"></i> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* OTP Inputs */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 text-center">
                    Verification Code
                  </label>
                  <div className="flex justify-center gap-2 mb-4">
                    {otp.map((data, index) => (
                      <input
                        key={index}
                        type="text"
                        maxLength="1"
                        value={data}
                        onChange={(e) => handleOtpChange(e.target, index)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        onFocus={(e) => e.target.select()}
                        className="w-10 h-12 text-xl text-center border border-gray-300 focus:border-brandLime outline-none rounded-sm font-black bg-gray-50 focus:bg-white text-brandDark transition-all shadow-sm"
                      />
                    ))}
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      required
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 focus:border-brandLime outline-none text-sm font-medium transition-colors rounded-sm bg-gray-50 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 focus:border-brandLime outline-none text-sm font-medium transition-colors rounded-sm bg-gray-50 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(v => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="w-full bg-brandDark hover:bg-brandBlack disabled:opacity-60 text-brandLime font-black py-4 rounded-sm uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-3 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                  {loading ? (
                    <><i className="fas fa-spinner fa-spin"></i> Resetting...</>
                  ) : (
                    <><i className="fas fa-check-circle"></i> Reset Password</>
                  )}
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
      <Footer />
    </main>
  );
}
