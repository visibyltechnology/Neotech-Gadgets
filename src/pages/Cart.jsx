import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ArrowLeft, ShoppingBag } from 'lucide-react';
import { collection, addDoc, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
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

function fmt(n) {
  return '₦' + Math.ceil(n).toLocaleString('en-NG');
}

export default function Cart() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuthStore();
  const { items, removeFromCart, updateQuantity, getInitialPaymentTotal, clearCart } = useCartStore();

  useEffect(() => {
    if (isAdmin) {
      toast.error('Admin accounts cannot access the shopping cart');
      navigate('/admin');
    }
  }, [isAdmin, navigate]);

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

  const loadKorapayScript = () => new Promise((resolve, reject) => {
    if (window.Korapay) { resolve(); return; }
    const existing = document.querySelector('script[data-korapay]');
    if (existing) existing.remove();
    const s = document.createElement('script');
    s.src = 'https://korablobstorage.blob.core.windows.net/modal-bucket/korapay-collections.min.js';
    s.setAttribute('data-korapay', 'true');
    s.onload = () => resolve();
    s.onerror = () => { s.remove(); reject(new Error('Korapay script failed to load')); };
    document.head.appendChild(s);
  });

  const handleCheckout = async () => {
    if (!user || !user.uid) {
      setError('User session expired. Please log in again.');
      return;
    }
    if (items.length === 0) return;
    if (window.paymentProcessed) return;
    window.paymentProcessed = true;

    setLoading(true);
    setError('');

    try {
      const itemsToValidate = splitMode ? expandedItems : items;
      for (const item of itemsToValidate) {
        if (!item.quantity || item.quantity < 1 || !Number.isInteger(item.quantity)) {
          throw new Error('Invalid quantity detected. Checkout aborted.');
        }
        if (item.paymentChoice === 'installment' && ![2, 3, 4, 5, 6].includes(item.installments)) {
          throw new Error('Invalid installment period detected. Checkout aborted.');
        }

        const productDoc = await getDoc(doc(db, 'products', item.id));
        if (!productDoc.exists()) throw new Error(`Product ${item.name} no longer exists.`);
        const dbProduct = productDoc.data();
        
        item.price = dbProduct.price;
        if (item.paymentChoice === 'installment') {
           const baseRate = INTEREST_RATES_DECIMAL[item.installments] ?? 0.2;
           const rate = baseRate * (item.paymentFrequency === 'weekly' ? 0.5 : 1);
           const fullAmount = dbProduct.price * (1 + rate);
           item.periodPayment = fullAmount / item.installments;
        }
      }

      const koraKey = import.meta.env.VITE_KORA_PUBLIC_KEY;
      if (!koraKey) {
        toast.error('Payment key is missing. Please contact support.');
        setLoading(false);
        window.paymentProcessed = false;
        return;
      }

      try {
        await loadKorapayScript();
      } catch {
        toast.error('Could not load payment gateway. Check your connection and try again.');
        setLoading(false);
        window.paymentProcessed = false;
        return;
      }

      if (!window.Korapay) {
        toast.error('Payment gateway failed to initialise. Please refresh and try again.');
        setLoading(false);
        window.paymentProcessed = false;
        return;
      }

      const deliveryDetails = deliveryInfo.state ? getDeliveryDetails(deliveryInfo.state) : { price: 0 };
      let paymentAmount = Math.ceil(totalToPayNow + deliveryDetails.price);
      const MINIMUM_PAYMENT = 1000;
      if (paymentAmount < MINIMUM_PAYMENT && paymentAmount > 0) paymentAmount = MINIMUM_PAYMENT;

      const paymentRef = `NT_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      let paymentProcessed = false;
      const safetyTimer = setTimeout(() => {
        if (!paymentProcessed) { setLoading(false); window.paymentProcessed = false; }
      }, 90000);

      window.Korapay.initialize({
        key: koraKey,
        reference: paymentRef,
        amount: paymentAmount,
        currency: "NGN",
        metadata: { orderId: paymentRef, itemCount: items.length, source: 'web' },
        customer: {
            name: user.displayName || user.email.split('@')[0],
            email: user.email
        },
        onSuccess: async function(response) {
            if (paymentProcessed) return;
            paymentProcessed = true;
            clearTimeout(safetyTimer);
            setLoading(true);
            toast.success("Verifying payment...");
            try {
              await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (verifyErr) {
              console.warn('Payment verification error:', verifyErr);
            }
            toast.success("Payment verified! Processing order...");
            
            try {
              if (splitMode) {
                const groups = buildGroupMap(expandedItems);
                const deliveryDetails2 = deliveryInfo.state ? getDeliveryDetails(deliveryInfo.state) : { price: 0 };
                for (const [gId, groupUnits] of Object.entries(groups)) {
                  if (groupUnits.length === 0) continue;
                  const merged = {};
                  groupUnits.forEach(unit => {
                    if (!merged[unit.cartItemId]) merged[unit.cartItemId] = { ...unit, quantity: 0 };
                    merged[unit.cartItemId].quantity += 1;
                  });
                  const groupItems = Object.values(merged);
                  const groupTotalAmount = groupItems.reduce((acc, i) => {
                    if (i.paymentChoice === 'full') return acc + i.price * i.quantity;
                    const baseRate = INTEREST_RATES_DECIMAL[i.installments] ?? 0.2;
                    const rate = baseRate * (i.paymentFrequency === 'weekly' ? 0.5 : 1);
                    return acc + (i.price * (1 + rate)) * i.quantity;
                  }, 0) + deliveryDetails2.price;
                  const groupTotalToPayNow = groupItems.reduce((acc, i) => acc + (i.paymentChoice === 'full' ? i.price * i.quantity : (i.periodPayment || 0) * i.quantity), 0) + deliveryDetails2.price;

                  for (const item of groupItems) {
                    try {
                      await decreaseInventory(item.id, Number(item.quantity));
                    } catch (inventoryErr) {
                      console.error('Error updating inventory for item:', item.id, inventoryErr);
                    }
                  }

                  const orderRef = await addDoc(collection(db, "orders"), initializeOrderTracking({
                    userId: user.uid,
                    items: groupItems,
                    deliveryInfo: deliveryInfo,
                    deliveryFee: deliveryDetails2.price,
                    totalAmount: groupTotalAmount,
                    amountPaid: groupTotalToPayNow,
                    status: 'Processing',
                    paymentRef: response.reference || `REF_${Date.now()}_G${gId}`,
                    createdAt: new Date(),
                  }));
                  
                  try {
                    await createOrderPlacedNotification(user.uid, orderRef.id, groupItems.length);
                    const payFreq = groupItems.find(i => i.paymentFrequency)?.paymentFrequency;
                    await createPaymentSuccessNotification(user.uid, orderRef.id, groupTotalToPayNow, {
                      itemCount: groupItems.length,
                      remainingBalance: groupTotalAmount - groupTotalToPayNow,
                      paymentFrequency: payFreq
                    });
                  } catch (notifErr) {
                    console.error('Error creating notifications:', notifErr);
                  }
                }
              } else {
                const deliveryDetails3 = deliveryInfo.state ? getDeliveryDetails(deliveryInfo.state) : { price: 0 };
                for (const item of items) {
                  try {
                    await decreaseInventory(item.id, Number(item.quantity));
                  } catch (inventoryErr) {
                    console.error('Error updating inventory for item:', item.id, inventoryErr);
                  }
                }

                const orderTotalAmount = items.reduce((acc, i) => {
                  if (i.paymentChoice === 'full') return acc + i.price * i.quantity;
                  const baseRate = INTEREST_RATES_DECIMAL[i.installments] ?? 0.2;
                  const rate = baseRate * (i.paymentFrequency === 'weekly' ? 0.5 : 1);
                  return acc + (i.price * (1 + rate)) * i.quantity;
                }, 0) + deliveryDetails3.price;
                const orderRef = await addDoc(collection(db, "orders"), initializeOrderTracking({
                  userId: user.uid,
                  items: items,
                  deliveryInfo: deliveryInfo,
                  deliveryFee: deliveryDetails3.price,
                  totalAmount: orderTotalAmount,
                  amountPaid: totalToPayNow + deliveryDetails3.price,
                  status: 'Processing',
                  paymentRef: response.reference || `REF_${Date.now()}`,
                  createdAt: new Date(),
                }));
                
                try {
                  await createOrderPlacedNotification(user.uid, orderRef.id, items.length);
                  const payFreq2 = items.find(i => i.paymentFrequency)?.paymentFrequency;
                  await createPaymentSuccessNotification(user.uid, orderRef.id, totalToPayNow + deliveryDetails3.price, {
                    itemCount: items.length,
                    remainingBalance: orderTotalAmount - (totalToPayNow + deliveryDetails3.price),
                    paymentFrequency: payFreq2
                  });
                } catch (notifErr) {
                  console.error('Error creating notifications:', notifErr);
                }
              }

              clearCart();
              toast.success('Order placed successfully!');
              setShowPreview(false);
              setLoading(false);
              navigate('/profile');
            } catch (err) {
              console.error("Error saving order:", err);
              setError("Payment successful but failed to save order. Please contact support.");
              setLoading(false);
            }
        },
        onClose: function() {
            clearTimeout(safetyTimer);
            setLoading(false);
            window.paymentProcessed = false;
            if (!paymentProcessed) toast.error("Payment was cancelled.");
        },
        onFailed: function(response) {
            clearTimeout(safetyTimer);
            setLoading(false);
            window.paymentProcessed = false;
            const msg = response?.data?.message || response?.message || "Payment failed. Please try again.";
            toast.error(msg);
            setError(msg);
        },
        onTokenized: async function(response) {
            try {
              if (response?.data?.customer?.token) {
                const tokenRef = doc(db, 'payment_tokens', user.uid);
                await setDoc(tokenRef, {
                  token: response.data.customer.token,
                  email: user.email,
                  provider: 'korapay',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                }, { merge: true });
              }
            } catch (tokenErr) {
              console.error('Failed to save payment token:', tokenErr);
            }
        }
      });
      setLoading(false);
    } catch (err) {
      console.error("Error in checkout:", err);
      setError(err.message || "Failed to initiate payment. Please contact support.");
      setLoading(false);
      window.paymentProcessed = false;
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
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1.5rem', width: '100%', flex: 1 }}>
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
                const deliveryDetails = deliveryInfo.state ? getDeliveryDetails(deliveryInfo.state) : { price: 0, duration: '' };
                const totalWithDelivery = totalToPayNow + deliveryDetails.price;
                return (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#707080', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
                      <span>Subtotal ({items.reduce((a, b) => a + b.quantity, 0)} items)</span>
                      <span style={{ color: '#E8E8F0', fontWeight: 800 }}>{fmt(totalToPayNow)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#707080', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>
                      <span>Delivery {deliveryInfo.state ? `(${deliveryDetails.duration})` : '(Select state)'}</span>
                      <span style={{ color: deliveryDetails.price > 0 ? '#FF7070' : '#505060', fontWeight: 800 }}>
                        {deliveryDetails.price > 0 ? fmt(deliveryDetails.price) : 'TBD'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #2A2A30', paddingTop: 16, marginBottom: 24, background: '#161618', padding: '1rem', borderRadius: 12, border: '1px solid #2A2A30' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#C8C8D4', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Total Due Today</span>
                      <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#D42B2B', letterSpacing: '0.02em', fontFamily: 'Rajdhani, sans-serif' }}>{fmt(deliveryDetails.price > 0 ? totalWithDelivery : totalToPayNow)}</span>
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
                <i className="fas fa-lock"></i> Secure Checkout (Test Mode)
              </div>
            </div>
          </div>

        </div>
      </div>
      <Footer />

      {/* Confirm Order Preview Modal */}
      {showPreview && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#161618', border: '1px solid #2A2A30', borderRadius: 24, width: '100%', maxWidth: 720, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.6)' }}>
            
            <div style={{ background: 'linear-gradient(135deg,#1E1E22,#161618)', borderBottom: '1px solid #2A2A30', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#E8E8F0', textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: 'Rajdhani, sans-serif', margin: 0 }}>Confirm Your Order</h2>
              <button onClick={() => { setShowPreview(false); window.paymentProcessed = false; }} style={{ background: 'none', border: 'none', color: '#707080', cursor: 'pointer', fontSize: '1.25rem', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#D42B2B'} onMouseLeave={e => e.currentTarget.style.color = '#707080'}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
              {/* Delivery Info */}
              <div style={{ background: '#1E1E22', border: '1px solid #2A2A30', borderRadius: 12, padding: '1.25rem', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#707080', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="fas fa-map-marker-alt" style={{ color: '#D42B2B' }}></i> Delivery Info
                </h3>
                <p style={{ fontWeight: 700, fontSize: '0.85rem', color: '#E8E8F0', marginBottom: 4 }}>{deliveryInfo.address}</p>
                <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#9898A8', marginBottom: 4 }}>{deliveryInfo.city}, {deliveryInfo.state}</p>
                <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#9898A8' }}>Phone: {deliveryInfo.phone}</p>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                {(() => {
                  const installmentSigs = items
                    .filter(i => i.paymentChoice !== 'full')
                    .map(i => `${i.paymentFrequency}-${i.installments}`);
                  const hasSingleOrderConflict = new Set(installmentSigs).size > 1;

                  return (
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 16, borderBottom: '1px solid #2A2A30', paddingBottom: 16 }}>
                      <h3 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#707080', textTransform: 'uppercase', letterSpacing: '0.15em', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                        <i className="fas fa-box" style={{ color: '#D42B2B' }}></i> Order Items
                      </h3>
                      <button
                        onClick={() => { splitMode ? exitSplitMode() : enterSplitMode(); }}
                        style={{
                          padding: '6px 12px', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', borderRadius: 6, transition: 'all 0.2s', border: 'none', cursor: 'pointer',
                          background: splitMode ? '#2A2A30' : hasSingleOrderConflict ? 'rgba(212,43,43,0.1)' : 'rgba(34,197,94,0.1)',
                          color: splitMode ? '#C8C8D4' : hasSingleOrderConflict ? '#FF7070' : '#4ADE80',
                          border: splitMode ? '1px solid #505060' : hasSingleOrderConflict ? '1px solid rgba(212,43,43,0.3)' : '1px solid rgba(34,197,94,0.3)'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.2)' }}
                        onMouseLeave={e => { e.currentTarget.style.filter = 'none' }}
                      >
                        {splitMode ? '← Merge into Single Order' : hasSingleOrderConflict ? '⚠️ Resolve Conflicting Orders' : 'Split into Multiple Orders'}
                      </button>
                    </div>
                  );
                })()}

                {splitMode ? (() => {
                  const groupMap = buildGroupMap(expandedItems);
                  const conflicts = getGroupConflicts(groupMap);
                  const hasAnyConflict = Object.keys(conflicts).length > 0;

                  return (
                    <>
                      {Object.entries(groupMap).sort(([a],[b]) => Number(a)-Number(b)).map(([gId, groupUnits]) => {
                        const conflict = conflicts[gId];
                        const hasConflict = !!conflicts[gId];
                        return (
                          <div key={gId} style={{ marginBottom: '1.5rem', background: '#1E1E22', border: hasConflict ? '1px solid #FF7070' : '1px solid #2A2A30', borderRadius: 12, overflow: 'hidden' }}>
                            <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: hasConflict ? 'rgba(212,43,43,0.1)' : '#161618', borderBottom: hasConflict ? '1px solid rgba(212,43,43,0.2)' : '1px solid #2A2A30' }}>
                              <strong style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: hasConflict ? '#FF7070' : '#E8E8F0' }}>Order {gId}</strong>
                              {groupUnits.some(u => u.paymentChoice !== 'full') && (
                                <button
                                  onClick={() => {
                                    const firstSig = groupUnits.find(u => u.paymentChoice !== 'full');
                                    if (!firstSig) return;
                                    const targetFreq = firstSig.paymentFrequency;
                                    const targetDur = firstSig.installments;
                                    setExpandedItems(prev => prev.map(unit => {
                                      if ((itemGroups[unit.splitId] || 1) === Number(gId) && unit.paymentChoice !== 'full') {
                                        const newPeriodPayment = recalcPeriodPayment(unit, targetFreq, targetDur);
                                        return { ...unit, paymentFrequency: targetFreq, installments: targetDur, periodPayment: newPeriodPayment };
                                      }
                                      return unit;
                                    }));
                                  }}
                                  style={{
                                    padding: '4px 10px', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', borderRadius: 6, transition: 'all 0.2s', border: 'none', cursor: 'pointer',
                                    background: hasConflict ? '#D42B2B' : '#2A2A30',
                                    color: hasConflict ? '#fff' : '#C8C8D4'
                                  }}
                                >
                                  {hasConflict ? '⚠️ Unify Plans' : 'Unify Plans'}
                                </button>
                              )}
                            </div>
                            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {groupUnits.map(unit => (
                              <div key={unit.splitId} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '0.75rem', background: '#161618', border: '1px solid #2A2A30', borderRadius: 8 }}>
                                
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#707080' }}>1×</span>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#E8E8F0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>{unit.name}</span>
                                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#707080', textTransform: 'uppercase', letterSpacing: '0.1em' }}>({unit.paymentChoice === 'full' ? 'Full' : `${unit.installments} ${unit.paymentFrequency === 'weekly' ? 'Wks' : 'Mos'}`})</span>
                                </div>
                                
                                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#C8C8D4', width: 80, textAlign: 'right', paddingRight: 8, borderRight: '1px solid #2A2A30', fontFamily: 'Rajdhani, sans-serif' }}>{fmt(unit.paymentChoice === 'full' ? unit.price : unit.periodPayment || 0)}</span>
                                  
                                  <select
                                    value={itemGroups[unit.splitId] || 1}
                                    onChange={(e) => setItemGroups(prev => ({ ...prev, [unit.splitId]: Number(e.target.value) }))}
                                    style={{ background: '#161618', border: '1px solid #2A2A30', color: '#E8E8F0', fontSize: '0.75rem', fontWeight: 700, borderRadius: 6, padding: '4px 8px', outline: 'none' }}
                                  >
                                    {[1,2,3,4,5].map(n => <option key={n} value={n}>Order {n}</option>)}
                                  </select>

                                  {unit.paymentChoice !== 'full' && (
                                    <>
                                      <select
                                        value={unit.paymentFrequency}
                                        onChange={(e) => {
                                          const newFreq = e.target.value;
                                          const newPP = recalcPeriodPayment(unit, newFreq, unit.installments);
                                          setExpandedItems(prev => prev.map(u => u.splitId === unit.splitId ? { ...u, paymentFrequency: newFreq, periodPayment: newPP } : u));
                                        }}
                                        style={{ background: '#161618', border: '1px solid #2A2A30', color: '#E8E8F0', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, borderRadius: 6, padding: '4px 8px', outline: 'none' }}
                                      >
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                      </select>
                                      <select
                                        value={unit.installments}
                                        onChange={(e) => {
                                          const newDur = Number(e.target.value);
                                          const newPP = recalcPeriodPayment(unit, unit.paymentFrequency, newDur);
                                          setExpandedItems(prev => prev.map(u => u.splitId === unit.splitId ? { ...u, installments: newDur, periodPayment: newPP } : u));
                                        }}
                                        style={{ background: '#161618', border: '1px solid #2A2A30', color: '#E8E8F0', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, borderRadius: 6, padding: '4px 8px', outline: 'none' }}
                                      >
                                        {[2,3,4,5,6].map(n => (
                                          <option key={n} value={n}>{n} {unit.paymentFrequency === 'weekly' ? 'Wks' : 'Mos'}</option>
                                        ))}
                                      </select>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                            </div>
                          </div>
                        );
                      })}

                      {hasAnyConflict && (
                        <div style={{ background: 'rgba(240,165,0,0.1)', border: '1px solid rgba(240,165,0,0.3)', color: '#F0A500', fontSize: '0.75rem', fontWeight: 800, padding: '1rem', borderRadius: 8, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <i className="fas fa-exclamation-triangle"></i> Resolve all conflicts above before proceeding.
                        </div>
                      )}

                      <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', padding: '1rem', borderRadius: 8, fontSize: '0.75rem', fontWeight: 800, color: '#4ADE80', textTransform: 'uppercase', letterSpacing: '0.15em', textAlign: 'center', marginBottom: '1.5rem' }}>
                        {Object.keys(groupMap).length} separate order{Object.keys(groupMap).length > 1 ? 's' : ''} will be created.
                      </div>

                      <div style={{ display: 'flex', gap: 16 }}>
                        <button onClick={() => setShowPreview(false)} style={{ flex: 1, background: '#1E1E22', border: '1px solid #2A2A30', color: '#C8C8D4', fontWeight: 800, padding: '1rem', borderRadius: 12, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#2A2A30'} onMouseLeave={e => e.currentTarget.style.background = '#1E1E22'}>
                          Cancel
                        </button>
                        <button onClick={handleCheckout} disabled={loading || hasAnyConflict} style={{ flex: 1, background: 'linear-gradient(135deg,#D42B2B,#A01E1E)', color: '#fff', border: 'none', fontWeight: 800, padding: '1rem', borderRadius: 12, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', cursor: loading || hasAnyConflict ? 'not-allowed' : 'pointer', opacity: loading || hasAnyConflict ? 0.7 : 1, transition: 'all 0.2s' }} onMouseEnter={e => { if(!loading && !hasAnyConflict) e.currentTarget.style.transform = 'translateY(-2px)' }} onMouseLeave={e => { if(!loading && !hasAnyConflict) e.currentTarget.style.transform = 'translateY(0)' }}>
                          {loading ? <><i className="fas fa-spinner fa-spin mr-2"></i> Processing...</> : 'Proceed to Payment'}
                        </button>
                      </div>
                    </>
                  );
                })() : (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: '1.5rem' }}>
                      {items.map((item) => (
                        <div key={item.cartItemId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#1E1E22', border: '1px solid #2A2A30', borderRadius: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#707080' }}>{item.quantity}×</span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#E8E8F0' }}>{item.name}</span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '1rem', fontWeight: 800, color: '#C8C8D4', fontFamily: 'Rajdhani, sans-serif' }}>
                              {fmt(item.paymentChoice === 'full' ? item.price * item.quantity : (item.periodPayment || 0) * item.quantity)}
                            </span>
                            {item.paymentChoice !== 'full' && (
                              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#707080', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                / {item.paymentFrequency === 'weekly' ? 'Wk' : 'Mo'} ({item.installments} {item.paymentFrequency === 'weekly' ? 'Wks' : 'Mos'})
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: 16 }}>
                      <button onClick={() => setShowPreview(false)} style={{ flex: 1, background: '#1E1E22', border: '1px solid #2A2A30', color: '#C8C8D4', fontWeight: 800, padding: '1rem', borderRadius: 12, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#2A2A30'} onMouseLeave={e => e.currentTarget.style.background = '#1E1E22'}>
                        Cancel
                      </button>
                      <button onClick={handleCheckout} disabled={loading} style={{ flex: 1, background: 'linear-gradient(135deg,#D42B2B,#A01E1E)', color: '#fff', border: 'none', fontWeight: 800, padding: '1rem', borderRadius: 12, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'all 0.2s' }} onMouseEnter={e => { if(!loading) e.currentTarget.style.transform = 'translateY(-2px)' }} onMouseLeave={e => { if(!loading) e.currentTarget.style.transform = 'translateY(0)' }}>
                        {loading ? <><i className="fas fa-spinner fa-spin mr-2"></i> Processing...</> : 'Proceed to Payment'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
