import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { listenToTradeInDevices } from '../utils/tradeInService';
import { getPricingRules } from '../utils/pricingConfigService';
import { uploadSwapDocument } from '../utils/mediaUploadService';
import useAuthStore from '../store/useAuthStore';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';
import { 
  ArrowLeftRight, CheckCircle2, Package, ChevronRight, Star, Shield, Clock, 
  Zap, AlertCircle, RefreshCw, UploadCloud, FileText, Camera, CreditCard, ArrowLeft, DollarSign
} from 'lucide-react';

const DEVICE_CONDITIONS = [
  { value: 'brand_new', label: 'Brand new', desc: 'Completely unused, original seal intact, no activation.', color: '#8b5cf6' },
  { value: 'excellent', label: 'Excellent', desc: 'No scratches, battery health 86%+ (90%+ for iPhone 16+)', color: '#10b981' },
  { value: 'very_good', label: 'Very Good', desc: 'Light signs of wear, battery health 83%+ (86%+ for iPhone 16+)', color: '#3b82f6' },
  { value: 'good', label: 'Good', desc: 'Moderate scratches, battery health 82% or below, cracked back, or replaced battery', color: '#f59e0b' },
  { value: 'fair', label: 'Fair', desc: 'Two or more issues (cracked/replaced screen, no Face ID, battery 82% or below)', color: '#ef4444' },
];

const TRUST_BADGES = [
  { icon: <Shield size={22} className="text-brandRed" />, label: 'Fair Value Guaranteed' },
  { icon: <Clock size={22} className="text-brandRed" />, label: '24hr Response Time' },
  { icon: <Zap size={22} className="text-brandRed" />, label: 'Instant Quote Process' },
  { icon: <Star size={22} className="text-brandRed" />, label: '100% Genuine Products' },
];

export default function SwapPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetProductId = searchParams.get('targetProductId');
  const targetProductName = searchParams.get('targetProductName');
  
  const { user, loading: authLoading } = useAuthStore();

  const [tradeInCatalog, setTradeInCatalog] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [pricingRules, setPricingRules] = useState(null);
  
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [referenceId, setReferenceId] = useState('');

  // Step 1: Setup
  const [intent, setIntent] = useState(targetProductId ? 'swap' : 'sell'); // 'swap' or 'sell'
  const [numDevices, setNumDevices] = useState(1);

  // Step 2: Devices Array
  const [devices, setDevices] = useState([]);

  // Step 3: Identity & Contact
  const [contactInfo, setContactInfo] = useState({
    phone: '',
    location: '',
  });
  const [idCardFile, setIdCardFile] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);

  useEffect(() => {
    const unsub = listenToTradeInDevices(data => {
      setTradeInCatalog(data);
      setLoadingCatalog(false);
    });
    
    // Fetch pricing rules
    getPricingRules().then(rules => {
      setPricingRules(rules);
    });

    return () => unsub();
  }, []);

  // Initialize devices array when numDevices changes
  useEffect(() => {
    setDevices(Array.from({ length: numDevices }, () => ({
      tradeInDeviceId: '',
      condition: '',
      phoneStorage: '',
      batteryHealth: '',
      neatness: '10',
      repairedBefore: 'no',
      changedScreen: 'no',
      changedBattery: 'no',
      crackOnBody: 'no',
      faceIdWorking: 'yes',
      snapchatBanned: 'no',
      carrier: '',
      simType: '',
      // Laptop specific
      processor: '',
      ram: '',
      screenSize: '',
      keyboardFunctional: 'yes',
      screenIssues: 'no',
      // Watch specific
      caseSize: '',
      accessories: '',
      // Tablet specific
      connectivity: '',
      
      notes: ''
    })));
  }, [numDevices]);

  // Auth check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <RefreshCw className="animate-spin text-brandRed" size={40} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
        <div className="bg-gray-800 p-8 rounded-2xl max-w-md w-full text-center border border-gray-700 shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="text-brandRed" size={32} />
          </div>
          <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Login Required</h2>
          <p className="text-gray-400 mb-8">
            To ensure trust and security during trade-ins, please login or create an account to proceed with your Swap/Sell request.
          </p>
          <Link 
            to="/login?redirect=/swap" 
            className="w-full inline-flex justify-center items-center gap-2 bg-brandRed text-white py-3 px-6 rounded-xl font-bold uppercase tracking-wider hover:bg-red-700 transition-colors"
          >
            Log In / Sign Up
          </Link>
        </div>
      </div>
    );
  }

  const updateDeviceField = (index, field, value) => {
    const newDevices = [...devices];
    newDevices[index][field] = value;
    setDevices(newDevices);
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!intent) return toast.error("Please select Swap or Sell");
      if (numDevices < 1 || numDevices > 5) return toast.error("Invalid number of devices");
      setStep(2);
    } else if (step === 2) {
      // Validate all devices
      for (let i = 0; i < devices.length; i++) {
        const d = devices[i];
        if (!d.tradeInDeviceId) return toast.error(`Please select a device for Device ${i + 1}`);
        if (!d.condition) return toast.error(`Please select a condition for Device ${i + 1}`);
      }
      setStep(3);
    }
  };

  const calculateTotalEstimate = () => {
    if (!pricingRules) return { value: 0, manualReview: true };
    
    let total = 0;
    let manualReview = false;

    for (let i = 0; i < devices.length; i++) {
      const d = devices[i];
      const catalogDevice = tradeInCatalog.find(c => c.id === d.tradeInDeviceId);
      
      if (!catalogDevice || !catalogDevice.basePrice || catalogDevice.basePrice <= 0) {
        manualReview = true;
        break;
      }
      
      const multiplier = pricingRules[d.condition] || 0;
      if (multiplier === 0) {
         manualReview = true;
         break;
      }

      // Optional logic to further decrease price for cracks/repairs could go here.
      // For now, we strictly use the condition multiplier configured by admin.

      total += catalogDevice.basePrice * multiplier;
    }

    return { value: total, manualReview };
  };

  const { value: estimatedValue, manualReview } = calculateTotalEstimate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contactInfo.phone || !contactInfo.location) return toast.error('Please provide phone and location');
    if (!idCardFile) return toast.error('Government ID is required for verification');

    setSubmitting(true);
    try {
      // 1. Upload Documents
      let idCardUrl = '';
      let receiptUrl = '';
      
      try {
        idCardUrl = await uploadSwapDocument(idCardFile, user.uid, 'id_card');
        if (receiptFile) {
          receiptUrl = await uploadSwapDocument(receiptFile, user.uid, 'receipt');
        }
      } catch (uploadErr) {
        toast.error("Failed to upload documents. Please check file sizes.");
        setSubmitting(false);
        return;
      }

      // 2. Prepare devices data
      const devicesPayload = devices.map(d => {
        const catalogDevice = tradeInCatalog.find(c => c.id === d.tradeInDeviceId) || {};
        return {
          ...d,
          brand: catalogDevice.brand,
          name: catalogDevice.name,
          deviceType: catalogDevice.deviceType,
          basePrice: catalogDevice.basePrice
        };
      });

      // 3. Save to Firestore
      const newRefId = `SWP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const payload = {
        referenceId: newRefId,
        userId: user.uid,
        fullName: user.displayName || 'Customer',
        email: user.email,
        phone: contactInfo.phone,
        location: contactInfo.location,
        intent,
        targetProductId: intent === 'swap' ? targetProductId : null,
        targetProductName: intent === 'swap' ? targetProductName : null,
        estimatedValue: manualReview ? null : estimatedValue,
        devices: devicesPayload,
        idCardUrl,
        receiptUrl,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await addDoc(collection(db, 'swapRequests'), payload);
      setReferenceId(newRefId);
      setSubmitted(true);
    } catch (error) {
      console.error('Swap error:', error);
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderDeviceForm = (device, index) => {
    const catalogDevice = tradeInCatalog.find(c => c.id === device.tradeInDeviceId);
    const deviceType = catalogDevice?.deviceType || 'phone';
    const isApple = catalogDevice?.brand?.toLowerCase().includes('apple');

    return (
      <div key={index} className="bg-gray-800 border border-gray-700 rounded-2xl p-6 mb-6">
        <h3 className="text-xl font-black text-white uppercase tracking-tight mb-4 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brandRed flex items-center justify-center text-sm">{index + 1}</div>
          Device {index + 1} Details
        </h3>
        
        <div className="space-y-6">
          {/* Base Selection */}
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wide">Select Device Model *</label>
            <select
              required
              value={device.tradeInDeviceId}
              onChange={(e) => updateDeviceField(index, 'tradeInDeviceId', e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl py-3 px-4 focus:ring-2 focus:ring-brandRed outline-none transition-all"
            >
              <option value="">-- Choose your device --</option>
              {tradeInCatalog.map(item => (
                <option key={item.id} value={item.id}>
                  {item.brand} {item.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-300 mb-3 uppercase tracking-wide flex items-center gap-2">
              Device Condition * 
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DEVICE_CONDITIONS.map(cond => (
                <div 
                  key={cond.value}
                  onClick={() => updateDeviceField(index, 'condition', cond.value)}
                  className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${
                    device.condition === cond.value 
                      ? 'bg-gray-800 border-brandRed' 
                      : 'bg-gray-900 border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-white uppercase tracking-wider text-sm" style={{ color: device.condition === cond.value ? '#fff' : cond.color }}>{cond.label}</span>
                    {device.condition === cond.value && <CheckCircle2 className="text-brandRed" size={18} />}
                  </div>
                  <p className="text-xs text-gray-400 font-medium leading-relaxed">{cond.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Conditional Fields based on Device Type */}
          {catalogDevice && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-700">
              
              {/* PHONE FIELDS */}
              {deviceType === 'phone' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Storage (GB/TB)</label>
                    <input type="text" placeholder="e.g. 128GB" value={device.phoneStorage} onChange={(e) => updateDeviceField(index, 'phoneStorage', e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl py-2 px-4 focus:border-brandRed outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Battery Health (%)</label>
                    <input type="number" placeholder="e.g. 88" value={device.batteryHealth} onChange={(e) => updateDeviceField(index, 'batteryHealth', e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl py-2 px-4 focus:border-brandRed outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Carrier</label>
                    <select value={device.carrier} onChange={(e) => updateDeviceField(index, 'carrier', e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl py-2 px-4 focus:border-brandRed outline-none">
                      <option value="">Select...</option>
                      <option value="unlocked">Factory Unlocked</option>
                      <option value="locked">Network Locked</option>
                      <option value="chip">Requires Chip (e.g. Gevey)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">SIM Type</label>
                    <select value={device.simType} onChange={(e) => updateDeviceField(index, 'simType', e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl py-2 px-4 focus:border-brandRed outline-none">
                      <option value="">Select...</option>
                      <option value="physical">Physical SIM</option>
                      <option value="esim">eSIM Only</option>
                      <option value="dual">Dual SIM</option>
                    </select>
                  </div>
                </>
              )}

              {/* LAPTOP FIELDS */}
              {deviceType === 'laptop' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Processor</label>
                    <input type="text" placeholder="e.g. M1, Intel i7" value={device.processor} onChange={(e) => updateDeviceField(index, 'processor', e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl py-2 px-4 focus:border-brandRed outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">RAM</label>
                    <input type="text" placeholder="e.g. 16GB" value={device.ram} onChange={(e) => updateDeviceField(index, 'ram', e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl py-2 px-4 focus:border-brandRed outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Storage</label>
                    <input type="text" placeholder="e.g. 512GB SSD" value={device.phoneStorage} onChange={(e) => updateDeviceField(index, 'phoneStorage', e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl py-2 px-4 focus:border-brandRed outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Battery Cycle Count</label>
                    <input type="text" placeholder="e.g. 120" value={device.batteryHealth} onChange={(e) => updateDeviceField(index, 'batteryHealth', e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl py-2 px-4 focus:border-brandRed outline-none" />
                  </div>
                </>
              )}

              {/* TABLET FIELDS */}
              {deviceType === 'tablet' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Storage</label>
                    <input type="text" placeholder="e.g. 256GB" value={device.phoneStorage} onChange={(e) => updateDeviceField(index, 'phoneStorage', e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl py-2 px-4 focus:border-brandRed outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Connectivity</label>
                    <select value={device.connectivity} onChange={(e) => updateDeviceField(index, 'connectivity', e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl py-2 px-4 focus:border-brandRed outline-none">
                      <option value="">Select...</option>
                      <option value="wifi">Wi-Fi Only</option>
                      <option value="cellular">Wi-Fi + Cellular</option>
                    </select>
                  </div>
                </>
              )}

              {/* WATCH FIELDS */}
              {deviceType === 'watch' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Case Size</label>
                    <input type="text" placeholder="e.g. 45mm" value={device.caseSize} onChange={(e) => updateDeviceField(index, 'caseSize', e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl py-2 px-4 focus:border-brandRed outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Connectivity</label>
                    <select value={device.connectivity} onChange={(e) => updateDeviceField(index, 'connectivity', e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl py-2 px-4 focus:border-brandRed outline-none">
                      <option value="">Select...</option>
                      <option value="gps">GPS</option>
                      <option value="cellular">GPS + Cellular</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Battery Health (%)</label>
                    <input type="number" placeholder="e.g. 88" value={device.batteryHealth} onChange={(e) => updateDeviceField(index, 'batteryHealth', e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl py-2 px-4 focus:border-brandRed outline-none" />
                  </div>
                </>
              )}
            </div>
          )}

          {/* General Questions */}
          {catalogDevice && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-700">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Device Neatness (1-10)</label>
                <select value={device.neatness} onChange={(e) => updateDeviceField(index, 'neatness', e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl py-2 px-4 focus:border-brandRed outline-none">
                  {[...Array(10)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>).reverse()}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Has it been repaired before?</label>
                <select value={device.repairedBefore} onChange={(e) => updateDeviceField(index, 'repairedBefore', e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl py-2 px-4 focus:border-brandRed outline-none">
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>

              {deviceType !== 'laptop' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Changed Screen?</label>
                    <select value={device.changedScreen} onChange={(e) => updateDeviceField(index, 'changedScreen', e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl py-2 px-4 focus:border-brandRed outline-none">
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Changed Battery?</label>
                    <select value={device.changedBattery} onChange={(e) => updateDeviceField(index, 'changedBattery', e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl py-2 px-4 focus:border-brandRed outline-none">
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </div>
                </>
              )}

              {isApple && deviceType !== 'watch' && (
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Face ID / Touch ID works?</label>
                  <select value={device.faceIdWorking} onChange={(e) => updateDeviceField(index, 'faceIdWorking', e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl py-2 px-4 focus:border-brandRed outline-none">
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
              )}

              {deviceType === 'phone' && (
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Snapchat Banned?</label>
                  <select value={device.snapchatBanned} onChange={(e) => updateDeviceField(index, 'snapchatBanned', e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl py-2 px-4 focus:border-brandRed outline-none">
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Crack on Body?</label>
                <select value={device.crackOnBody} onChange={(e) => updateDeviceField(index, 'crackOnBody', e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl py-2 px-4 focus:border-brandRed outline-none">
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">More information on your device</label>
                <textarea 
                  rows={2} 
                  value={device.notes}
                  onChange={(e) => updateDeviceField(index, 'notes', e.target.value)}
                  placeholder="Any other details we should know?"
                  className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl py-3 px-4 focus:border-brandRed outline-none resize-none" 
                />
              </div>
            </div>
          )}

        </div>
      </div>
    );
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col">
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="bg-gray-800 p-8 md:p-12 rounded-3xl max-w-lg w-full text-center shadow-2xl border border-gray-700">
            <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="text-green-500" size={48} />
            </div>
            <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">Request Received!</h2>
            <p className="text-gray-400 mb-6">Your {intent} request has been submitted for review. Our team will evaluate the details and contact you shortly with a quotation.</p>
            
            <div className="bg-gray-900 border border-gray-700 p-4 rounded-xl inline-block mb-8 w-full">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Reference ID</p>
              <p className="font-mono text-xl font-bold text-brandRed bg-red-500/10 py-2 rounded-lg">{referenceId}</p>
            </div>

            <button onClick={() => navigate('/')} className="w-full bg-white text-gray-900 py-4 rounded-xl font-black uppercase tracking-wider hover:bg-gray-100 transition-colors">
              Return to Store
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col font-sans">
      
      {/* Hero Section */}
      <div className="bg-black py-16 px-4 border-b border-gray-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brandRed via-black to-black"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 text-brandRed mb-6">
            <ArrowLeftRight size={32} />
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tight mb-4">
            Swap or Sell Your Device
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto font-medium">
            Get the best market value for your old devices. Fill the detailed appraisal form below to get an accurate quotation from our experts.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow max-w-5xl mx-auto w-full px-4 py-12">
        
        {/* Stepper */}
        <div className="flex items-center justify-center mb-12 relative max-w-3xl mx-auto">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-800 -translate-y-1/2 z-0"></div>
          <div className="absolute top-1/2 left-0 h-1 bg-brandRed -translate-y-1/2 z-0 transition-all duration-500" style={{ width: `${(step - 1) * 50}%` }}></div>
          
          {[1, 2, 3].map(num => (
            <div key={num} className="relative z-10 flex flex-col items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all duration-300 ${
                step >= num ? 'bg-brandRed text-white shadow-[0_0_15px_rgba(212,43,43,0.4)]' : 'bg-gray-800 text-gray-500'
              }`}>
                {step > num ? <CheckCircle2 size={20} /> : num}
              </div>
              <span className={`mt-2 text-xs font-bold uppercase tracking-wider ${step >= num ? 'text-white' : 'text-gray-500'}`}>
                {num === 1 ? 'Setup' : num === 2 ? 'Devices' : 'Identity'}
              </span>
            </div>
          ))}
        </div>

        {loadingCatalog ? (
          <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-brandRed" size={40} /></div>
        ) : (
          <div className="max-w-3xl mx-auto">
            
            {/* STEP 1: Setup */}
            {step === 1 && (
              <div className="bg-gray-800 border border-gray-700 rounded-3xl p-6 md:p-10 shadow-2xl">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-8 text-center">Let's Get Started</h2>
                
                <div className="space-y-8">
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-4 uppercase tracking-widest text-center">What do you want to do?</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div 
                        onClick={() => setIntent('swap')}
                        className={`cursor-pointer p-6 rounded-2xl border-2 flex flex-col items-center text-center transition-all ${intent === 'swap' ? 'bg-red-500/10 border-brandRed' : 'bg-gray-900 border-gray-700 hover:border-gray-600'}`}
                      >
                        <ArrowLeftRight size={32} className={`mb-3 ${intent === 'swap' ? 'text-brandRed' : 'text-gray-500'}`} />
                        <h3 className="font-black text-white text-lg uppercase tracking-wide mb-1">Swap Device</h3>
                        <p className="text-sm text-gray-400">Trade-in your old device for a new one</p>
                      </div>
                      <div 
                        onClick={() => setIntent('sell')}
                        className={`cursor-pointer p-6 rounded-2xl border-2 flex flex-col items-center text-center transition-all ${intent === 'sell' ? 'bg-emerald-500/10 border-emerald-500' : 'bg-gray-900 border-gray-700 hover:border-gray-600'}`}
                      >
                        <DollarSign size={32} className={`mb-3 ${intent === 'sell' ? 'text-emerald-500' : 'text-gray-500'}`} />
                        <h3 className="font-black text-white text-lg uppercase tracking-wide mb-1">Sell for Cash</h3>
                        <p className="text-sm text-gray-400">Get paid instantly for your old device</p>
                      </div>
                    </div>
                  </div>

                  {intent === 'swap' && targetProductName && (
                    <div className="bg-brandRed/10 border border-brandRed/20 p-4 rounded-xl text-center">
                      <p className="text-sm text-red-200">You are swapping for:</p>
                      <p className="text-lg font-black text-white uppercase tracking-wide">{targetProductName}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-4 uppercase tracking-widest text-center">Number of Devices to Trade-in</label>
                    <div className="flex items-center justify-center gap-4">
                      <button onClick={() => setNumDevices(Math.max(1, numDevices - 1))} className="w-12 h-12 rounded-xl bg-gray-700 text-white font-bold text-xl hover:bg-gray-600 transition">-</button>
                      <div className="w-20 text-center font-black text-4xl text-white">{numDevices}</div>
                      <button onClick={() => setNumDevices(Math.min(5, numDevices + 1))} className="w-12 h-12 rounded-xl bg-gray-700 text-white font-bold text-xl hover:bg-gray-600 transition">+</button>
                    </div>
                  </div>
                </div>

                <div className="mt-10">
                  <button onClick={handleNextStep} className="w-full bg-brandRed text-white py-4 rounded-xl font-black uppercase tracking-wider hover:bg-red-700 transition-colors flex items-center justify-center gap-2">
                    Continue to Device Details <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Device Forms */}
            {step === 2 && (
              <div>
                <div className="mb-6 flex items-center justify-between">
                  <button onClick={() => setStep(1)} className="text-gray-400 hover:text-white flex items-center gap-1 font-bold text-sm uppercase tracking-wider"><ArrowLeft size={16}/> Back</button>
                  <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Step 2 of 3</p>
                </div>

                {devices.map((device, i) => renderDeviceForm(device, i))}

                <button onClick={handleNextStep} className="w-full bg-brandRed text-white py-4 rounded-xl font-black uppercase tracking-wider hover:bg-red-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-500/20">
                  Continue to Identity Verification <ChevronRight size={20} />
                </button>
              </div>
            )}

            {/* STEP 3: Identity & Submit */}
            {step === 3 && (
              <div>
                <div className="mb-6 flex items-center justify-between">
                  <button onClick={() => setStep(2)} className="text-gray-400 hover:text-white flex items-center gap-1 font-bold text-sm uppercase tracking-wider"><ArrowLeft size={16}/> Back</button>
                  <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Step 3 of 3</p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {/* Identity Uploads */}
                  <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 md:p-8">
                    <h3 className="text-xl font-black text-white uppercase tracking-tight mb-6 flex items-center gap-3">
                      <Shield className="text-brandRed" /> Identity Verification
                    </h3>
                    <p className="text-gray-400 text-sm mb-6">To prevent fraud and comply with regulations, we require a valid government-issued ID.</p>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-bold text-white mb-2">Upload Government ID <span className="text-brandRed">*</span></label>
                        <p className="text-xs text-gray-500 mb-3">Passport, Driver's License, or National ID</p>
                        <div className="relative border-2 border-dashed border-gray-600 rounded-xl p-6 text-center hover:bg-gray-700/50 transition-colors">
                          <input 
                            type="file" 
                            accept="image/*"
                            required
                            onChange={(e) => setIdCardFile(e.target.files[0])}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          {idCardFile ? (
                            <div className="flex flex-col items-center">
                              <CheckCircle2 className="text-green-500 mb-2" size={32} />
                              <p className="text-green-500 font-bold">{idCardFile.name}</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              <CreditCard className="text-gray-400 mb-2" size={32} />
                              <p className="text-gray-300 font-bold">Click or drag ID image here</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-white mb-2">Upload Product Receipt (Optional)</label>
                        <p className="text-xs text-gray-500 mb-3">Providing a receipt increases your quotation value.</p>
                        <div className="relative border-2 border-dashed border-gray-600 rounded-xl p-6 text-center hover:bg-gray-700/50 transition-colors">
                          <input 
                            type="file" 
                            accept="image/*,.pdf"
                            onChange={(e) => setReceiptFile(e.target.files[0])}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          {receiptFile ? (
                            <div className="flex flex-col items-center">
                              <CheckCircle2 className="text-green-500 mb-2" size={32} />
                              <p className="text-green-500 font-bold">{receiptFile.name}</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              <FileText className="text-gray-400 mb-2" size={32} />
                              <p className="text-gray-300 font-bold">Click or drag receipt here</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 md:p-8">
                    <h3 className="text-xl font-black text-white uppercase tracking-tight mb-6">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Full Name</label>
                        <input type="text" disabled value={user.displayName || ''} className="w-full bg-gray-900 border border-gray-700 text-gray-500 rounded-xl py-3 px-4 outline-none opacity-70" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Email Address</label>
                        <input type="email" disabled value={user.email || ''} className="w-full bg-gray-900 border border-gray-700 text-gray-500 rounded-xl py-3 px-4 outline-none opacity-70" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Phone Number *</label>
                        <input required type="tel" value={contactInfo.phone} onChange={e => setContactInfo({...contactInfo, phone: e.target.value})} placeholder="e.g., 08012345678" className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl py-3 px-4 focus:border-brandRed outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">City / Location *</label>
                        <input required type="text" value={contactInfo.location} onChange={e => setContactInfo({...contactInfo, location: e.target.value})} placeholder="e.g., Ikeja, Lagos" className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl py-3 px-4 focus:border-brandRed outline-none" />
                      </div>
                    </div>
                  </div>

                  {!manualReview ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-2xl flex items-start gap-4">
                      <DollarSign className="text-emerald-500 flex-shrink-0 mt-1" size={24} />
                      <div className="w-full">
                        <h4 className="font-bold text-white uppercase tracking-wider mb-1">Instant Estimate</h4>
                        <div className="text-3xl font-black text-emerald-400 mb-2">
                          ₦{estimatedValue.toLocaleString()}
                        </div>
                        <p className="text-sm text-emerald-200/70 leading-relaxed">
                          This is an estimated {intent === 'sell' ? 'cash offer' : 'swap valuation'} based on your inputs. Our team will verify the devices upon receipt to confirm this value.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-brandRed/10 border border-brandRed/30 p-6 rounded-2xl flex items-start gap-4">
                      <AlertCircle className="text-brandRed flex-shrink-0 mt-1" size={24} />
                      <div>
                        <h4 className="font-bold text-white uppercase tracking-wider mb-1">Manual Appraisal Required</h4>
                        <p className="text-sm text-red-200 leading-relaxed">
                          Because of the devices or conditions selected, an instant quote is not available. Our experts will manually review your answers to provide an accurate {intent === 'sell' ? 'cash offer' : 'swap valuation'} within 24 hours.
                        </p>
                      </div>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="w-full bg-white text-gray-900 py-4 rounded-xl font-black uppercase tracking-wider hover:bg-gray-100 transition-colors flex justify-center items-center gap-2 shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {submitting ? <RefreshCw className="animate-spin" size={24} /> : 'Submit for Appraisal'}
                  </button>
                </form>
              </div>
            )}

          </div>
        )}

      </div>

      <Footer />
    </div>
  );
}
