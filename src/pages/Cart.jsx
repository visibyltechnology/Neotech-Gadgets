import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ArrowLeft, ShoppingBag, Upload, CreditCard, ShieldCheck, CheckCircle, Zap } from 'lucide-react';
import { collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';
import { nigeriaData } from '../data/locations';
import { getDeliveryDetails } from '../utils/deliveryPricing';

import { initializeOrderTracking } from '../utils/orderTrackingService';
import { decreaseInventory } from '../utils/inventoryService';
import { INTEREST_RATES_DECIMAL } from '../utils/interestRates';
import {
  createOrderPlacedNotification,
  createPaymentSuccessNotification
} from '../utils/notificationService';

// ── Klump BNPL
const KLUMP_PUBLIC_KEY = 'klp_pk_7e4780b45f194d81902b42f4ed2031f6b219fe82ec42464db113beea89c94967';
let klumpScriptPromise = null;
function loadKlumpScript() {
  if (klumpScriptPromise) return klumpScriptPromise;
  klumpScriptPromise = new Promise((resolve, reject) => {
    const scriptId = 'klump-js-script';
    if (document.getElementById(scriptId)) { resolve(); return; }
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://js.useklump.com/klump.js';
    script.onload = () => resolve();
    script.onerror = () => { klumpScriptPromise = null; reject(new Error('Failed to load Klump script')); };
    document.body.appendChild(script);
  });
  return klumpScriptPromise;
}
function getKlump() {
  try { return (0, eval)('Klump'); } catch (e) { return undefined; }
}

// ── Bank account details
const BANK_ACCOUNT = {
  bank: 'Premium Trust Bank',
  name: 'Neo Tech Gadget',
  number: '0040250513',
};


function fmt(n) {
  return '₦' + Math.ceil(n).toLocaleString('en-NG');
}


export default function Cart() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuthStore();
  const { items, removeFromCart, updateQuantity, getInitialPaymentTotal, clearCart } = useCartStore();
  const [klumpOpen, setKlumpOpen] = useState(false);

  useEffect(() => {
    // Admin access allowed for POS checkout
  }, [isAdmin]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState({
    address: '', city: '', state: '', landmark: '', phone: '', instructions: ''
  });

  const [profileData, setProfileData] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(-1);
  const [saveNewAddress, setSaveNewAddress] = useState(false);

  const [showPreview, setShowPreview] = useState(false);
  const [splitMode, setSplitMode] = useState(false);
  const [expandedItems, setExpandedItems] = useState([]);
  const [itemGroups, setItemGroups] = useState({});

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfileData(data);
          if (data.savedAddresses && data.savedAddresses.length > 0) {
            setSavedAddresses(data.savedAddresses);
            setSelectedAddressIndex(0);
            setDeliveryInfo({ ...data.savedAddresses[0], instructions: '' });
          } else if (data.phone) {
            setDeliveryInfo(prev => ({ ...prev, phone: data.phone }));
          }
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };
    fetchUserData();
  }, [user]);

  const getPaymentSignature = (item) => {
    if (item.paymentChoice === 'full') return 'full';
    return `${item.paymentFrequency}-${item.installments}`;
  };

  const getGroupConflicts = (groups) => {
    const conflicts = {};
    Object.entries(groups).forEach(([gId, groupItems]) => {
      const installmentSigs = groupItems
        .filter(i => i.paymentChoice !== 'full')
        .map(i => getPaymentSignature(i));
      const uniqueSigs = new Set(installmentSigs);
      if (uniqueSigs.size > 1) conflicts[gId] = [...uniqueSigs];
    });
    return conflicts;
  };

  const buildGroupMap = (expItems) => {
    return expItems.reduce((acc, item) => {
      const gId = itemGroups[item.splitId] || 1;
      if (!acc[gId]) acc[gId] = [];
      acc[gId].push(item);
      return acc;
    }, {});
  };

  const enterSplitMode = () => {
    const expanded = [];
    let sigToGroup = {};
    let groupCounter = 1;
    items.forEach(item => {
      const sig = getPaymentSignature(item);
      if (!sigToGroup[sig]) sigToGroup[sig] = groupCounter++;
      for (let i = 0; i < item.quantity; i++) {
        expanded.push({ ...item, quantity: 1, splitId: `${item.cartItemId}_${i}` });
      }
    });
    setExpandedItems(expanded);
    const newGroups = {};
    sigToGroup = {};
    groupCounter = 1;
    expanded.forEach(unit => {
      const sig = getPaymentSignature(unit);
      if (!sigToGroup[sig]) sigToGroup[sig] = groupCounter++;
      newGroups[unit.splitId] = sigToGroup[sig];
    });
    setItemGroups(newGroups);
    setSplitMode(true);
  };

  const exitSplitMode = () => {
    setSplitMode(false);
    setExpandedItems([]);
    setItemGroups({});
  };

  const recalcPeriodPayment = (item, targetFreq, targetDur) => {
    const baseRate = INTEREST_RATES_DECIMAL[targetDur] ?? 0.2;
    const rate = baseRate * (targetFreq === 'weekly' ? 0.5 : 1);
    const fullAmount = item.price * (1 + rate);
    return fullAmount / targetDur;
  };

  const totalToPayNow = getInitialPaymentTotal();

  // Payment method state
  const [payMethod, setPayMethod] = useState('bank_transfer'); // 'bank_transfer' | 'klump_bnpl'
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);

  // Klump z-index fix
  useEffect(() => {
    let interval;
    if (klumpOpen) {
      interval = setInterval(() => {
        document.querySelectorAll('iframe[src*="klump"], [id^="klump"]').forEach(el => {
          if (el.style) {
            el.style.setProperty('z-index', '2147483640', 'important');
            if (el.id === 'klump__checkout') {
              el.style.setProperty('position', 'fixed', 'important');
            }
          }
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [klumpOpen]);

  const handleReceiptChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setReceiptPreview(reader.result);
    reader.readAsDataURL(file);
  };


  // ── Klump BNPL handler
  const handleKlumpPayment = async () => {
    setLoading(true);
    setKlumpOpen(true);
    setError('');
    const shippingFee = 0; // Delivery is free
    const klumpItems = items.map(i => ({
      image_url: i.img || i.image || '',
      item_url: `${window.location.origin}/products/${i.id}`,
      name: i.name,
      unit_price: Math.ceil(i.price),
      quantity: i.quantity,
    }));
    const klumpSubtotal = klumpItems.reduce((acc, i) => acc + i.unit_price * i.quantity, 0);
    const klumpGrandTotal = klumpSubtotal;
    try {
      await loadKlumpScript();
      const KlumpCtor = getKlump();
      if (!KlumpCtor) throw new Error('Klump payment service unavailable. Check your connection.');
      new KlumpCtor({
        publicKey: KLUMP_PUBLIC_KEY,
        data: {
          amount: klumpGrandTotal,
          shipping_fee: shippingFee,
          currency: 'NGN',
          redirect_url: `${window.location.origin}/profile`,
          merchant_reference: `NT-${Date.now()}`,
          meta_data: {
            customer: user?.displayName || user?.email?.split('@')[0] || 'Customer',
            email: user?.email || '',
          },
          items: klumpItems,
        },
        onSuccess: async (data) => {
          setKlumpOpen(false);
          const klumpRef = data?.data?.reference || `NT-${Date.now()}`;
          await submitOrder(klumpRef);
        },
        onError: () => {
          setError('Klump payment failed or was declined. Please try again or choose Bank Transfer.');
          setLoading(false);
          setKlumpOpen(false);
        },
        onLoad: () => {
          // Klump overlay is now visible
        },
        onClose: () => {
          setLoading(false);
          setKlumpOpen(false);
        },
      });
    } catch (err) {
      setError(err.message || 'Failed to load Klump. Please check your connection.');
      setLoading(false);
      setKlumpOpen(false);
    }
  };

  // ── Submit order (bank transfer or after Klump)
  const submitOrder = async (klumpRef = null) => {
    setLoading(true);
    setError('');
    const isKlump = !!klumpRef;
    const deliveryDetails = { price: 0, duration: '' }; // Delivery is free

    try {
      // Validate & refresh prices
      for (const item of items) {
        const productDoc = await getDoc(doc(db, 'products', item.id));
        if (!productDoc.exists()) throw new Error(`Product ${item.name} no longer exists.`);
        const dbProduct = productDoc.data();
        item.price = dbProduct.price;
        if (item.paymentChoice === 'installment') {
          const baseRate = INTEREST_RATES_DECIMAL[item.installments] ?? 0.2;
          const rate = baseRate * (item.paymentFrequency === 'weekly' ? 0.5 : 1);
          item.periodPayment = (dbProduct.price * (1 + rate)) / item.installments;
        }
      }

      // Upload receipt for bank transfer
      let receiptUrl = '';
      if (!isKlump && payMethod === 'bank_transfer' && receiptFile) {
        const { uploadImage } = await import('../utils/uploadImage');
        receiptUrl = await uploadImage(receiptFile);
      }

      const isKlump = !!klumpRef;
      const isAdminCash = payMethod === 'admin_cash';

      const orderTotalAmount = items.reduce((acc, i) => {
        if (i.paymentChoice === 'full') return acc + i.price * i.quantity;
        const baseRate = INTEREST_RATES_DECIMAL[i.installments] ?? 0.2;
        const rate = baseRate * (i.paymentFrequency === 'weekly' ? 0.5 : 1);
        return acc + (i.price * (1 + rate)) * i.quantity;
      }, 0);

      for (const item of items) {
        try { await decreaseInventory(item.id, Number(item.quantity)); }
        catch (e) { console.error('Inventory error:', e); }
      }

      const orderRef = await addDoc(collection(db, 'orders'), initializeOrderTracking({
        userId: user.uid,
        items,
        deliveryInfo,
        deliveryFee: 0,
        totalAmount: orderTotalAmount,
        amountPaid: isKlump ? Math.ceil(totalToPayNow) : (isAdminCash ? orderTotalAmount : 0),
        status: isKlump ? 'Processing' : (isAdminCash ? 'Completed' : 'Pending Verification'),
        paymentMethod: isKlump ? 'klump_bnpl' : (isAdminCash ? 'admin_cash' : 'bank_transfer'),
        paymentRef: klumpRef || (isAdminCash ? `CASH-${Date.now()}` : `BT-${Date.now()}`),
        receiptUrl,
        createdAt: new Date(),
      }));

      try {
        await createOrderPlacedNotification(user.uid, orderRef.id, items.length);
        const payFreq = items.find(i => i.paymentFrequency)?.paymentFrequency;
        await createPaymentSuccessNotification(user.uid, orderRef.id, totalToPayNow, {
          itemCount: items.length,
          remainingBalance: orderTotalAmount - totalToPayNow,
          paymentFrequency: payFreq,
        });
      } catch (e) { console.error('Notification error:', e); }

      clearCart();
      toast.success(isKlump ? 'Order placed successfully!' : 'Order submitted! We will verify your receipt shortly.');
      setShowPreview(false);
      setLoading(false);
      navigate('/profile');
    } catch (err) {
      console.error('submitOrder error:', err);
      setError(err.message || 'Failed to place order. Please try again.');
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!user || !user.uid) { setError('User session expired. Please log in again.'); return; }
    if (items.length === 0) return;
    if (payMethod === 'bank_transfer' && !receiptFile) {
      setError('Please upload your payment receipt before placing the order.');
      return;
    }
    setError('');
    if (payMethod === 'klump_bnpl') {
      await handleKlumpPayment();
    } else {
      await submitOrder();
    }
  };


  const inputStyle = {
    width: '100%',
    background: '#1E1E22',
    border: '1px solid #2A2A30',
    color: '#E8E8F0',
    borderRadius: 8,
    padding: '0.75rem 1rem',
    fontSize: '0.85rem',
    outline: 'none',
    transition: 'all 0.25s ease',
    fontFamily: 'Inter, sans-serif',
  };

  if (items.length === 0) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0E0E10' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
          <ShoppingBag size={64} style={{ color: '#2A2A30', marginBottom: '1.5rem' }} />
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#E8E8F0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', fontFamily: 'Rajdhani, sans-serif' }}>Your Bag is Empty</h1>
          <p style={{ color: '#707080', fontSize: '0.85rem', marginBottom: '2rem' }}>Looks like you haven't added anything yet.</p>
          <Link to="/products" style={{ display: 'inline-block', background: 'linear-gradient(135deg,#D42B2B,#A01E1E)', color: '#fff', fontWeight: 800, padding: '1rem 2rem', borderRadius: 12, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.15em', textDecoration: 'none', boxShadow: '0 8px 24px rgba(212,43,43,0.3)', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(212,43,43,0.45)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(212,43,43,0.3)'; }}>
            Start Shopping
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0E0E10' }}>
      <div className="px-4 sm:px-6" style={{ maxWidth: '80rem', margin: '0 auto', paddingBottom: '2rem', paddingTop: '2rem', width: '100%', flex: 1 }}>
        <Link to="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', fontWeight: 700, color: '#707080', textTransform: 'uppercase', letterSpacing: '0.15em', textDecoration: 'none', transition: 'color 0.2s', marginBottom: '2rem' }} onMouseEnter={e => e.currentTarget.style.color = '#E8E8F0'} onMouseLeave={e => e.currentTarget.style.color = '#707080'}>
          <ArrowLeft size={16} /> Continue Shopping
        </Link>

        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', fontWeight: 800, color: '#E8E8F0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2rem', fontFamily: 'Rajdhani, sans-serif' }}>Shopping Bag</h1>

        {error && (
          <div style={{ background: 'rgba(212,43,43,0.1)', border: '1px solid rgba(212,43,43,0.3)', color: '#FF7070', padding: '1rem', borderRadius: 12, fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, marginBottom: '2rem' }}>
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'flex-start' }}>
          
          {/* Items List */}
          <div style={{ flex: '1 1 60%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {items.map((item) => (
              <div key={item.cartItemId} style={{ background: '#161618', border: '1px solid #2A2A30', borderRadius: 20, padding: '1.25rem', display: 'flex', gap: '1.25rem', position: 'relative' }}>
                <div style={{ width: 100, height: 100, background: 'linear-gradient(145deg,#1E1E22,#161618)', border: '1px solid #2A2A30', borderRadius: 12, display: 'flex', alignItems: 'center', justifyItems: 'center', padding: '0.5rem', flexShrink: 0 }}>
                  <img src={item.img} alt={item.name} loading="lazy" decoding="async" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <h3 style={{ fontWeight: 800, color: '#E8E8F0', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, fontFamily: 'Rajdhani, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {item.name}
                      </h3>
                      <p style={{ fontSize: '0.65rem', fontWeight: 800, color: '#707080', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Length: {item.length}</p>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.cartItemId)}
                      style={{ background: 'none', border: 'none', color: '#505060', cursor: 'pointer', padding: 4, transition: 'color 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#D42B2B'}
                      onMouseLeave={e => e.currentTarget.style.color = '#505060'}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', gap: 16 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {item.paymentChoice === 'installment' ? (
                        items.filter(i => i.paymentChoice === 'installment').length > 1 ? (
                          <div style={{ background: 'rgba(212,43,43,0.1)', border: '1px solid rgba(212,43,43,0.25)', color: '#FF7070', fontSize: '0.65rem', fontWeight: 600, padding: '0.5rem', borderRadius: 8, maxWidth: 240, lineHeight: 1.4 }}>
                            <strong style={{ display: 'block', marginBottom: 2, color: '#E8E8F0' }}><i className="fas fa-info-circle mr-1"></i> Multiple Installment Items</strong>
                            Payments will be combined into a single schedule during order review.
                          </div>
                        ) : (
                          <span style={{ display: 'inline-block', background: 'rgba(212,43,43,0.15)', border: '1px solid rgba(212,43,43,0.3)', color: '#FF7070', fontSize: '0.65rem', fontWeight: 800, padding: '4px 10px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '0.15em', width: 'max-content' }}>
                            {item.paymentFrequency === 'weekly' ? item.installments + ' Weekly Payments' : item.installments + ' Monthly Payments'}
                          </span>
                        )
                      ) : (
                        <span style={{ display: 'inline-block', background: '#1E1E22', border: '1px solid #2A2A30', color: '#9898A8', fontSize: '0.65rem', fontWeight: 800, padding: '4px 10px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '0.15em', width: 'max-content' }}>
                          Full Payment
                        </span>
                      )}
                      
                      <div style={{ display: 'flex', alignItems: 'center', background: '#1E1E22', border: '1px solid #2A2A30', borderRadius: 8, overflow: 'hidden', width: 'max-content' }}>
                        <button onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)} style={{ background: 'transparent', border: 'none', color: '#9898A8', padding: '6px 12px', cursor: 'pointer', fontWeight: 800, transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = '#2A2A30'; e.currentTarget.style.color = '#E8E8F0'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9898A8'; }}>-</button>
                        <span style={{ padding: '6px 12px', fontSize: '0.85rem', fontWeight: 800, color: '#E8E8F0', borderLeft: '1px solid #2A2A30', borderRight: '1px solid #2A2A30', minWidth: 40, textAlign: 'center' }}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)} style={{ background: 'transparent', border: 'none', color: '#9898A8', padding: '6px 12px', cursor: 'pointer', fontWeight: 800, transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = '#2A2A30'; e.currentTarget.style.color = '#E8E8F0'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9898A8'; }}>+</button>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      {item.paymentChoice === 'installment' ? (
                        <div>
                          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#E8E8F0', letterSpacing: '0.02em', fontFamily: 'Rajdhani, sans-serif' }}>{fmt((item.periodPayment || item.monthlyPayment || 0) * item.quantity)}</div>
                          <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#707080', textTransform: 'uppercase', letterSpacing: '0.15em' }}>/ {item.paymentFrequency === 'weekly' ? 'Week' : 'Month'}</div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#E8E8F0', letterSpacing: '0.02em', fontFamily: 'Rajdhani, sans-serif' }}>{fmt(item.price * item.quantity)}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Checkout Summary Sidebar */}
          <div style={{ width: '100%', flex: '1 1 340px', maxWidth: 420 }}>
            <div style={{ background: 'linear-gradient(135deg, #1A1A1E, #161618)', border: '1px solid #2A2A30', borderRadius: 24, padding: '2rem', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', position: 'sticky', top: 32 }}>
              
              <h2 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#D42B2B', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #2A2A30' }}>Delivery Information</h2>

              {/* Saved Addresses */}
              {savedAddresses.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#707080', textTransform: 'uppercase', letterSpacing: '0.15em', display: 'block', marginBottom: 8 }}>Saved Addresses</label>
                  <select
                    value={selectedAddressIndex}
                    onChange={(e) => {
                      const idx = Number(e.target.value);
                      setSelectedAddressIndex(idx);
                      if (idx >= 0) {
                        setDeliveryInfo({ ...savedAddresses[idx], instructions: deliveryInfo.instructions });
                        setSaveNewAddress(false);
                      } else {
                        setDeliveryInfo({ address: '', city: '', state: '', landmark: '', phone: profileData?.phone || '', instructions: deliveryInfo.instructions });
                      }
                    }}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    {savedAddresses.map((addr, idx) => (
                      <option key={idx} value={idx}>{addr.address}, {addr.city}</option>
                    ))}
                    <option value={-1}>+ Add New Address</option>
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: '1.5rem' }}>
                <input type="text" placeholder="Full Address *" value={deliveryInfo.address} onChange={(e) => { setDeliveryInfo({ ...deliveryInfo, address: e.target.value }); setSelectedAddressIndex(-1); }} style={inputStyle} onFocus={e => e.target.style.borderColor = '#D42B2B'} onBlur={e => e.target.style.borderColor = '#2A2A30'} />
                <div style={{ display: 'flex', gap: 12 }}>
                  <input type="text" value="Nigeria" disabled style={{ ...inputStyle, width: '33%', background: '#161618', color: '#505060', cursor: 'not-allowed' }} />
                  <select value={deliveryInfo.state} onChange={(e) => { setDeliveryInfo({ ...deliveryInfo, state: e.target.value, city: '' }); setSelectedAddressIndex(-1); }} style={{ ...inputStyle, width: '67%', cursor: 'pointer' }} onFocus={e => e.target.style.borderColor = '#D42B2B'} onBlur={e => e.target.style.borderColor = '#2A2A30'}>
                    <option value="">Select State *</option>
                    {(nigeriaData || []).map(s => <option key={s.state} value={s.state}>{s.state}</option>)}
                  </select>
                </div>
                <div>
                  <input type="text" list="lga-list" placeholder="LGA / City *" value={deliveryInfo.city} onChange={(e) => { setDeliveryInfo({ ...deliveryInfo, city: e.target.value }); setSelectedAddressIndex(-1); }} style={inputStyle} onFocus={e => e.target.style.borderColor = '#D42B2B'} onBlur={e => e.target.style.borderColor = '#2A2A30'} />
                  <datalist id="lga-list">
                    {((nigeriaData || []).find(s => s.state === deliveryInfo.state)?.lgas || []).map(lga => (
                      <option key={lga.name} value={lga.name} />
                    ))}
                  </datalist>
                </div>
                <input type="text" placeholder="Landmark (Optional)" value={deliveryInfo.landmark || ''} onChange={(e) => { setDeliveryInfo({ ...deliveryInfo, landmark: e.target.value }); setSelectedAddressIndex(-1); }} style={inputStyle} onFocus={e => e.target.style.borderColor = '#D42B2B'} onBlur={e => e.target.style.borderColor = '#2A2A30'} />
                <div>
                  <input type="tel" placeholder="WhatsApp Number (+234...) *" value={deliveryInfo.phone} onChange={(e) => { setDeliveryInfo({ ...deliveryInfo, phone: e.target.value }); setSelectedAddressIndex(-1); }} style={inputStyle} onFocus={e => e.target.style.borderColor = '#D42B2B'} onBlur={e => e.target.style.borderColor = '#2A2A30'} />
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#505060', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4, display: 'block' }}>Required for WhatsApp updates. Include country code (+234).</span>
                </div>
                <textarea placeholder="Additional Instructions (Optional)" value={deliveryInfo.instructions} onChange={(e) => setDeliveryInfo({ ...deliveryInfo, instructions: e.target.value })} style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} onFocus={e => e.target.style.borderColor = '#D42B2B'} onBlur={e => e.target.style.borderColor = '#2A2A30'}></textarea>
              </div>

              {selectedAddressIndex === -1 && savedAddresses.length < 3 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.5rem' }}>
                  <input type="checkbox" id="saveAddr" checked={saveNewAddress} onChange={(e) => setSaveNewAddress(e.target.checked)} style={{ cursor: 'pointer' }} />
                  <label htmlFor="saveAddr" style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9898A8', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}>Save this address for next time</label>
                </div>
              )}

              <h2 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#D42B2B', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #2A2A30', marginTop: '2rem' }}>Order Summary</h2>
              
              {(() => {
                return (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#707080', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
                      <span>Subtotal ({items.reduce((a, b) => a + b.quantity, 0)} items)</span>
                      <span style={{ color: '#E8E8F0', fontWeight: 800 }}>{fmt(totalToPayNow)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#707080', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>
                      <span>Delivery</span>
                      <span style={{ color: '#4ade80', fontWeight: 800 }}>FREE</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #2A2A30', paddingTop: 16, marginBottom: 24, background: '#161618', padding: '1rem', borderRadius: 12, border: '1px solid #2A2A30' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#C8C8D4', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Total Due Today</span>
                      <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#D42B2B', letterSpacing: '0.02em', fontFamily: 'Rajdhani, sans-serif' }}>{fmt(totalToPayNow)}</span>
                    </div>
                  </>
                );
              })()}

              {!user && (
                <div style={{ background: 'rgba(240,165,0,0.1)', border: '1px solid rgba(240,165,0,0.3)', color: '#F0A500', padding: '0.75rem', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                  <i className="fas fa-exclamation-triangle"></i> Login Required
                </div>
              )}

              <button
                onClick={async () => {
                  if (!user || !user.uid) {
                    navigate('/login');
                    return;
                  }
                  
                  setLoading(true);
                  try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (!userDoc.exists() || !userDoc.data().isEmailVerified) {
                      toast.error('Please verify your email before checking out.');
                      setError('Please verify your email before checking out.');
                      setLoading(false);
                      return;
                    }
                  } catch(e) {
                    console.error(e);
                  }

                  if (items.length === 0) { setLoading(false); return; }
                  if (!deliveryInfo.address || !deliveryInfo.city || !deliveryInfo.state || !deliveryInfo.phone) {
                    toast.error('Please fill out all required delivery fields.');
                    setError('Please fill out all required delivery fields.');
                    setLoading(false);
                    return;
                  }
                  setError('');

                  if (saveNewAddress) {
                    try {
                      const newAddr = { address: deliveryInfo.address, city: deliveryInfo.city, state: deliveryInfo.state, landmark: deliveryInfo.landmark || '', phone: deliveryInfo.phone };
                      const updatedAddresses = [...savedAddresses, newAddr].slice(0, 3);
                      await updateDoc(doc(db, 'users', user.uid), { savedAddresses: updatedAddresses });
                      setSavedAddresses(updatedAddresses);
                      setSaveNewAddress(false);
                    } catch (err) {
                      console.error('Error saving address:', err);
                    }
                  }

                  setLoading(false);
                  setShowPreview(true);
                }}
                disabled={loading}
                style={{
                  width: '100%', background: 'linear-gradient(135deg,#D42B2B,#A01E1E)', color: '#fff', border: 'none', padding: '1rem', borderRadius: 12, fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', transition: 'all 0.25s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, boxShadow: '0 8px 24px rgba(212,43,43,0.3)', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, fontFamily: 'Rajdhani, sans-serif'
                }}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(212,43,43,0.45)'; } }}
                onMouseLeave={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(212,43,43,0.3)'; } }}
              >
                {loading ? <><i className="fas fa-spinner fa-spin"></i> Please wait...</> : 'Review & Confirm Order'}
              </button>

              <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: '0.65rem', fontWeight: 800, color: '#707080', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                <i className="fas fa-lock"></i> Secured by Klump &amp; Bank Transfer
              </div>
            </div>
          </div>

        </div>
      </div>
      <Footer />

      {/* Klump cancel overlay */}
      {klumpOpen && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0,
          zIndex: 2147483647, display: 'flex', justifyContent: 'flex-end',
          padding: '12px 16px', pointerEvents: 'none',
        }}>
          <button
            onClick={() => {
              try {
                const klumpDiv = document.getElementById('klump__checkout');
                if (klumpDiv) klumpDiv.innerHTML = '';
                document.querySelectorAll('[id^="klump"]').forEach(el => { if (el.id !== 'klump__checkout') el.remove(); });
                document.querySelectorAll('iframe[src*="klump"]').forEach(el => el.remove());
                setKlumpOpen(false); setLoading(false);
                setError('Klump payment cancelled. Please choose Bank Transfer or try again.');
              } catch { window.location.reload(); }
            }}
            style={{ pointerEvents: 'auto', background: '#B30000', color: '#fff', border: 'none', borderRadius: '50px', padding: '12px 22px', fontWeight: 800, fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', gap: '8px' }}
          >âœ• Cancel Payment</button>
        </div>,
        document.body
      )}
      <div id="klump__checkout" style={{ display: klumpOpen ? 'block' : 'none' }}></div>

      {/* Confirm Order Modal */}
      {showPreview && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#161618', border: '1px solid #2A2A30', borderRadius: 24, width: '100%', maxWidth: 600, maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.7)' }}>

            {/* Modal Header */}
            <div style={{ background: 'linear-gradient(135deg,#1E1E22,#161618)', borderBottom: '1px solid #2A2A30', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#E8E8F0', textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: 'Rajdhani, sans-serif', margin: 0 }}>Confirm &amp; Pay</h2>
              <button onClick={() => { setShowPreview(false); setError(''); }} style={{ background: 'none', border: 'none', color: '#707080', cursor: 'pointer', fontSize: '1.25rem' }} onMouseEnter={e => e.currentTarget.style.color = '#D42B2B'} onMouseLeave={e => e.currentTarget.style.color = '#707080'}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* Payment Method Selection */}
              <div>
                <h3 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#707080', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12 }}>Choose Payment Method</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { id: 'bank_transfer', label: 'Direct Bank Transfer', icon: CreditCard, desc: 'Transfer to our account & upload receipt' },
                    { id: 'klump_bnpl', label: 'Klump — Buy Now, Pay Later', icon: ShieldCheck, desc: 'Pay in installments via Klump' },
                    ...(isAdmin ? [{ id: 'admin_cash', label: 'Admin POS / Cash', icon: Zap, desc: 'Direct order placement (Admin only)' }] : []),
                  ].map(m => (
                    <div key={m.id} onClick={() => { setPayMethod(m.id); setError(''); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', border: `2px solid ${payMethod === m.id ? '#D42B2B' : '#2A2A30'}`, borderRadius: 12, cursor: 'pointer', background: payMethod === m.id ? 'rgba(212,43,43,0.07)' : '#1E1E22', transition: 'all 0.2s' }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(212,43,43,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <m.icon size={18} color="#D42B2B" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#E8E8F0' }}>{m.label}</div>
                        <div style={{ fontSize: '0.7rem', color: '#707080' }}>{m.desc}</div>
                      </div>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${payMethod === m.id ? '#D42B2B' : '#505060'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {payMethod === m.id && <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#D42B2B' }}></div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bank Transfer Details */}
              {payMethod === 'bank_transfer' && (
                <div style={{ background: '#0E0E10', border: '1px solid #D42B2B', borderRadius: 14, padding: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#D42B2B', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CreditCard size={14} /> Account Details
                  </h4>
                  <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
                    {[['Bank', BANK_ACCOUNT.bank], ['Account Name', BANK_ACCOUNT.name]].map(([label, value]) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.75rem', color: '#707080' }}>{label}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#C8C8D4' }}>{value}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: '#707080' }}>Account No.</span>
                      <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#D42B2B', fontFamily: 'monospace', letterSpacing: '3px' }}>{BANK_ACCOUNT.number}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.7rem', color: '#9898A8', marginBottom: 12 }}>Transfer exactly <strong style={{ color: '#E8E8F0' }}>{fmt(totalToPayNow + (deliveryInfo.state ? getDeliveryDetails(deliveryInfo.state).price : 0))}</strong> and upload your receipt below.</p>
                  <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, background: '#1E1E22', border: `2px dashed ${receiptFile ? '#D42B2B' : '#2A2A30'}`, borderRadius: 10, padding: '1rem', cursor: 'pointer', transition: 'all 0.2s' }}>
                    {receiptPreview ? (
                      <img src={receiptPreview} alt="Receipt" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #D42B2B' }} />
                    ) : (
                      <Upload size={24} color="#D42B2B" />
                    )}
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: receiptFile ? '#4ADE80' : '#707080', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      {receiptFile ? `âœ“ ${receiptFile.name}` : 'Click to upload receipt *'}
                    </span>
                    <input type="file" accept="image/*,application/pdf" onChange={handleReceiptChange} style={{ display: 'none' }} />
                  </label>
                </div>
              )}

              {/* Klump Info */}
              {payMethod === 'klump_bnpl' && (
                <div style={{ background: '#0E0E10', border: '1px solid #2A2A30', borderRadius: 14, padding: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#D42B2B', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ShieldCheck size={14} /> Buy Now, Pay Later with Klump
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: '#9898A8', lineHeight: 1.6 }}>Pay for your order in easy installments. Klump handles the repayment schedule and your order ships immediately after approval.</p>
                  <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', background: '#1E1E22', borderRadius: 10, padding: '12px 16px', border: '1px solid #2A2A30' }}>
                    <span style={{ fontSize: '0.75rem', color: '#707080' }}>Order Total</span>
                    <span style={{ fontWeight: 800, color: '#D42B2B', fontSize: '1rem', fontFamily: 'Rajdhani, sans-serif' }}>{fmt(totalToPayNow + (deliveryInfo.state ? getDeliveryDetails(deliveryInfo.state).price : 0))}</span>
                  </div>
                </div>
              )}

              {/* Items Summary */}
              <div>
                <h3 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#707080', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="fas fa-box" style={{ color: '#D42B2B' }}></i> Order Items
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {items.map(item => (
                    <div key={item.cartItemId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem', background: '#1E1E22', border: '1px solid #2A2A30', borderRadius: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#707080' }}>{item.quantity}Ã—</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#E8E8F0' }}>{item.name}</span>
                      </div>
                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#C8C8D4', fontFamily: 'Rajdhani, sans-serif' }}>
                        {fmt(item.paymentChoice === 'full' ? item.price * item.quantity : (item.periodPayment || 0) * item.quantity)}
                        {item.paymentChoice !== 'full' && <span style={{ fontSize: '0.6rem', color: '#707080', fontFamily: 'Inter, sans-serif' }}>/{item.paymentFrequency === 'weekly' ? 'wk' : 'mo'}</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{ background: 'rgba(212,43,43,0.1)', border: '1px solid rgba(212,43,43,0.3)', color: '#FF7070', padding: '0.75rem', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="fas fa-exclamation-circle"></i> {error}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => { setShowPreview(false); setError(''); }} style={{ flex: 1, background: '#1E1E22', border: '1px solid #2A2A30', color: '#C8C8D4', fontWeight: 800, padding: '1rem', borderRadius: 12, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', cursor: 'pointer' }}>Cancel</button>
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  style={{ flex: 2, background: 'linear-gradient(135deg,#D42B2B,#A01E1E)', color: '#fff', border: 'none', fontWeight: 800, padding: '1rem', borderRadius: 12, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  {loading
                    ? <><i className="fas fa-spinner fa-spin"></i> Processing...</>
                    : <><Zap size={16} /> {payMethod === 'klump_bnpl' ? 'Pay with Klump' : 'Place Order'}</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

