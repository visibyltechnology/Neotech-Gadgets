import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { verifyDeliveryOTP } from '../utils/otpService';
import { confirmDelivery, validateDeliveryToken } from '../utils/orderTrackingService';
import { uploadProofOfDeliveryImage } from '../utils/mediaUploadService';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

export default function DeliveryPortal() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order');
  const token = searchParams.get('token');

  const [order, setOrder] = useState(null);
  const [otp, setOtp] = useState('');
  const [proofImage, setProofImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [error, setError] = useState('');

  // Validate token and fetch order
  useEffect(() => {
    const validateAndFetch = async () => {
      try {
        if (!orderId || !token) {
          setError('Invalid delivery portal link');
          return;
        }

        // Validate token
        const isValid = await validateDeliveryToken(orderId, token);
        if (!isValid) {
          setError('This delivery link is expired or invalid');
          return;
        }

        // Fetch order
        const orderRef = doc(db, 'orders', orderId);
        const orderSnap = await getDoc(orderRef);

        if (!orderSnap.exists()) {
          setError('Order not found');
          return;
        }

        setOrder(orderSnap.data());
      } catch (err) {
        setError(`Error loading delivery: ${err.message}`);
      }
    };

    validateAndFetch();
  }, [orderId, token]);

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!otp.trim()) {
        throw new Error('Please enter the OTP');
      }

      await verifyDeliveryOTP(orderId, otp);
      setOtpVerified(true);
      toast.success('OTP verified! Now upload proof of delivery (optional).');
    } catch (err) {
      setError(err.message || 'Failed to verify OTP');
      toast.error('Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size and type
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    setProofImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleDeliveryConfirm = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let imageUrl = null;
      if (proofImage) {
        toast.loading('Uploading proof of delivery...');
        imageUrl = await uploadProofOfDeliveryImage(proofImage, orderId);
      }

      // Confirm delivery
      await confirmDelivery(orderId, imageUrl, 'rider_' + Date.now());
      toast.dismiss();
      toast.success('Delivery confirmed! Thank you.');

      // Reset form
      setProofImage(null);
      setPreviewUrl('');
      setOtp('');
      setOtpVerified(false);
      setOrder(prev => ({ ...prev, tracking_status: 'Delivered' }));
    } catch (err) {
      setError(err.message || 'Failed to confirm delivery');
      toast.error('Error confirming delivery');
    } finally {
      setLoading(false);
    }
  };

  if (error && !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-sm w-full text-center border-t-4 border-red-500">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500 text-2xl">
            <i className="fas fa-times"></i>
          </div>
          <h1 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-wide">Link Error</h1>
          <p className="text-sm font-medium text-gray-500 mb-6 leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <i className="fas fa-circle-notch fa-spin text-4xl text-brandDark mb-4"></i>
        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Loading Delivery Details...</p>
      </div>
    );
  }

  if (order.tracking_status === 'Delivered') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-sm w-full text-center border-t-4 border-green-500">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500 text-4xl shadow-inner">
            <i className="fas fa-check"></i>
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-wide">Delivered</h1>
          <p className="text-sm font-medium text-gray-500 mb-6">This order has already been successfully delivered.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 font-sans">
      <div className="max-w-md mx-auto">
        
        {/* Branding Header */}
        <div className="text-center mb-8">
          <div className="font-display text-3xl font-black tracking-tighter mb-2">
            <span className="text-brandDark">MAYJAY</span><span className="text-brandLime">CONCEPTS</span>
          </div>
          <h1 className="text-sm font-black text-gray-400 uppercase tracking-widest">Rider Portal</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          
          {/* Order Summary Card */}
          <div className="bg-brandBlack text-white p-6 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-10">
              <i className="fas fa-box text-9xl"></i>
            </div>
            <div className="relative z-10">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Order ID</div>
              <div className="font-mono text-sm font-bold bg-white/10 inline-block px-2 py-1 rounded mb-4">#{orderId.slice(0, 12)}</div>
              
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Customer Address</div>
              <div className="text-sm font-medium leading-snug mb-4">
                {order.deliveryInfo?.address}, {order.deliveryInfo?.city}
              </div>

              <div className="flex justify-between items-end border-t border-white/10 pt-4 mt-2">
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Status</div>
                  <div className="text-sm font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span> {order.tracking_status}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Amount Paid</div>
                  <div className="font-display text-lg font-black text-green-400">₦{(order.amountPaid || 0).toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            {!otpVerified ? (
              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 text-center">
                    Enter Customer OTP
                  </label>
                  <input
                    type="text"
                    maxLength="6"
                    placeholder="• • • • • •"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl text-center text-3xl font-black tracking-[0.5em] focus:outline-none focus:border-brandDark focus:bg-white transition-colors shadow-inner"
                  />
                  <p className="text-[10px] font-bold text-gray-400 mt-3 text-center uppercase tracking-wider">
                    <i className="fas fa-lock mr-1"></i> Ask the customer for their 6-digit code
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-xs font-bold flex items-center gap-2">
                    <i className="fas fa-exclamation-circle text-red-500 text-base"></i> {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full bg-brandDark hover:bg-brandBlack disabled:opacity-50 text-brandLime font-black py-4 rounded-xl transition-all shadow-lg hover:shadow-xl text-sm uppercase tracking-widest flex justify-center items-center gap-2"
                >
                  {loading ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-shield-check"></i>}
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleDeliveryConfirm} className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-500 shrink-0">
                    <i className="fas fa-check text-xl"></i>
                  </div>
                  <div>
                    <div className="text-sm font-black text-green-800 uppercase tracking-wide">OTP Verified</div>
                    <div className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Identity confirmed</div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                    Upload Proof of Delivery <span className="text-gray-300 font-medium">(Optional)</span>
                  </label>
                  
                  {!previewUrl ? (
                    <label className="block border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-brandLime hover:bg-brandLime/5 transition-colors group">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mx-auto mb-3 group-hover:bg-brandLime/20 group-hover:text-brandDark transition-colors">
                        <i className="fas fa-camera text-xl"></i>
                      </div>
                      <div className="text-gray-600 font-bold text-sm mb-1">Take a photo or upload</div>
                      <div className="text-xs font-medium text-gray-400">Capture the package at the door</div>
                    </label>
                  ) : (
                    <div className="relative rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-50">
                      <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setProofImage(null);
                          setPreviewUrl('');
                        }}
                        className="absolute top-3 right-3 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm shadow-lg hover:bg-red-600 transition-colors"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                      <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                        Proof Attached
                      </div>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-xs font-bold flex items-center gap-2">
                    <i className="fas fa-exclamation-circle text-red-500 text-base"></i> {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-black py-4 rounded-xl transition-all shadow-lg hover:shadow-xl text-sm uppercase tracking-widest flex justify-center items-center gap-2"
                >
                  {loading ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-check-double"></i>}
                  {loading ? 'Confirming...' : 'Complete Delivery'}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="mt-8 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          <i className="fas fa-shield-alt mr-1"></i> Secured by MAYJAY Delivery System
        </div>
      </div>
    </div>
  );
}
