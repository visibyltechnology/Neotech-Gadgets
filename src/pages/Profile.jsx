import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, runTransaction } from 'firebase/firestore';
import { auth, db } from '../firebase';
import useAuthStore from '../store/useAuthStore';
import Footer from '../components/Footer';
import { Package, Clock, CheckCircle, ShoppingBag, Search, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';
import OrderTrackingStepper from '../components/OrderTrackingStepper';
import { INTEREST_RATES_DECIMAL } from '../utils/interestRates';

const NT = {
  bg: '#0E0E10', card: '#161618', cardSub: '#1A1A1E',
  border: '#2A2A30', borderHover: 'rgba(212,43,43,0.45)',
  primary: '#D42B2B', textMain: '#E8E8F0', textMuted: '#707080', textAccent: '#C8C8D4',
};

function fmt(n) {
  return '₦' + Math.ceil(n).toLocaleString('en-NG');
}

function PaymentBadge({ paymentChoice, installments, paymentFrequency }) {
  const isInstallment = paymentChoice === 'installment';
  return (
    <span style={{
      display: 'inline-block', fontSize: '0.55rem', fontWeight: 800, padding: '3px 8px', borderRadius: 5,
      textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'Rajdhani, sans-serif',
      background: isInstallment ? 'rgba(96,165,250,0.12)' : 'rgba(74,222,128,0.1)',
      color: isInstallment ? '#60a5fa' : '#4ade80',
      border: isInstallment ? '1px solid rgba(96,165,250,0.3)' : '1px solid rgba(74,222,128,0.25)',
    }}>
      {isInstallment
        ? `${installments} ${paymentFrequency === 'weekly' ? 'Wkly' : 'Mthly'}`
        : 'Full Payment'}
    </span>
  );
}

export default function Profile() {
  const { user, isAdmin, loading: authLoading } = useAuthStore();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [customAmounts, setCustomAmounts] = useState({});

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Orders');
  const [sortBy, setSortBy] = useState('Date (Newest First)');
  const [expandedOrders, setExpandedOrders] = useState(new Set());

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setProfileData(docSnap.data());

        const q = query(collection(db, "orders"), where("userId", "==", user.uid));
        const orderSnap = await getDocs(q);
        const ordersData = orderSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        ordersData.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
        setOrders(ordersData);
      } catch (err) {
        console.error("Profile load error:", err);
        if (err.message && err.message.toLowerCase().includes('offline')) {
          setError('Please check your internet connection and try again.');
        } else {
          setError(`We encountered an issue loading your profile: ${err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleContinuePayment = async (order, amountToPay) => {
    if (!user) return;
    const koraKey = import.meta.env.VITE_KORA_PUBLIC_KEY;
    if (!koraKey) { toast.error("Payment gateway not configured"); return; }
    if (typeof amountToPay !== 'number' || isNaN(amountToPay) || amountToPay <= 0) { toast.error("Invalid payment amount."); return; }

    const balance = order.totalAmount - (order.amountPaid || 0);
    if (amountToPay > balance) { toast.error("Cannot pay more than the remaining balance."); return; }
    if (balance - amountToPay < 1000 && balance - amountToPay > 0) { toast.error("You cannot leave a balance below ₦1,000. Please pay the full remaining balance."); return; }
    if (amountToPay < 1000 && balance >= 1000) { toast.error("Minimum payment amount is ₦1,000."); return; }

    setLoading(true);
    try {
      window.Korapay.initialize({
        key: koraKey,
        reference: `NT_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        amount: Math.round(amountToPay),
        currency: "NGN",
        customer: { name: user.displayName || user.email.split('@')[0], email: user.email },
        onSuccess: async function(response) {
          toast.success("Verifying payment...");
          try {
            const verifyRes = await fetch('/api/verify-payment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reference: response.reference }) });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.verified) { toast.error('Payment verification failed.'); setLoading(false); return; }
          } catch (verifyErr) { console.warn('Payment verification API unreachable (dev mode):', verifyErr); }

          try {
            const orderRef = doc(db, 'orders', order.id);
            const newOrderState = await runTransaction(db, async (transaction) => {
              const orderDoc = await transaction.get(orderRef);
              if (!orderDoc.exists()) throw new Error("Order does not exist!");
              const currentOrder = orderDoc.data();
              const balance = currentOrder.totalAmount - currentOrder.amountPaid;
              if (amountToPay <= 0) throw new Error("Payment must be greater than 0");
              if (amountToPay > balance && balance > 0) throw new Error("Cannot pay more than the remaining balance");
              const newAmountPaid = currentOrder.amountPaid + amountToPay;
              const newStatus = (newAmountPaid >= currentOrder.totalAmount) ? 'Completed' : 'Processing (Installments)';
              transaction.update(orderRef, { amountPaid: newAmountPaid, status: newStatus });
              return { amountPaid: newAmountPaid, status: newStatus, finalAmount: amountToPay };
            });
            setOrders(orders.map(o => o.id === order.id ? { ...o, amountPaid: newOrderState.amountPaid, status: newOrderState.status } : o));
            toast.success('Payment recorded successfully!');
            setCustomAmounts(prev => { const next = { ...prev }; delete next[order.id]; return next; });
          } catch (err) {
            console.error("Error updating order:", err);
            toast.error(err.message || "Payment successful but failed to update order record.");
          } finally { setLoading(false); }
        },
        onClose: function() { setLoading(false); toast.error("Payment was cancelled."); },
        onFailed: function(response) { setLoading(false); toast.error(response?.data?.message || "Payment failed. Please try again."); }
      });
    } catch (err) {
      console.error("Error initializing payment:", err);
      toast.error("Failed to initialize payment gateway.");
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: NT.bg }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <div style={{ width: 48, height: 48, border: `3px solid ${NT.border}`, borderTopColor: NT.primary, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <p style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.8rem', fontWeight: 700, color: NT.textMuted, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Loading Profile...</p>
        </div>
      </main>
    );
  }

  if (!user) return null;

  const totalSpent = orders.reduce((sum, o) => sum + (o.amountPaid || 0), 0);
  const pendingBalance = orders.reduce((sum, o) => sum + Math.max(0, (o.totalAmount || 0) - (o.amountPaid || 0)), 0);

  const toggleOrderExpand = (id) => {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const filteredOrders = orders.filter(o => {
    if (statusFilter === 'Completed' && o.status !== 'Completed') return false;
    if (statusFilter === 'Processing (Installments)' && o.status === 'Completed') return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (o.id.toLowerCase().includes(term)) return true;
      if (o.items?.some(i => i.name.toLowerCase().includes(term))) return true;
      return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'Date (Newest First)') return b.createdAt?.toMillis() - a.createdAt?.toMillis();
    if (sortBy === 'Date (Oldest First)') return a.createdAt?.toMillis() - b.createdAt?.toMillis();
    if (sortBy === 'Total Amount (High to Low)') return b.totalAmount - a.totalAmount;
    if (sortBy === 'Total Amount (Low to High)') return a.totalAmount - b.totalAmount;
    return 0;
  });

  const STATS = [
    { label: 'Total Orders', value: orders.length, icon: 'fa-box', color: NT.primary },
    { label: 'Amount Paid', value: fmt(totalSpent), icon: 'fa-check-circle', color: '#4ade80' },
    { label: 'Pending Balance', value: fmt(pendingBalance), icon: 'fa-clock', color: pendingBalance > 0 ? '#F0A500' : '#4ade80' },
  ];

  const INFO_FIELDS = [
    { label: 'Full Name', icon: 'fa-user', value: `${profileData?.firstName || 'Admin'} ${profileData?.lastName || ''}`.trim() },
    { label: 'Email Address', icon: 'fa-envelope', value: profileData?.email || user.email },
    { label: 'Phone Number', icon: 'fa-phone', value: profileData?.phone || 'Not provided' },
    !isAdmin ? { label: 'Account Status', icon: 'fa-shield-alt', value: profileData?.isEmailVerified ? 'Verified' : 'Unverified', highlight: !profileData?.isEmailVerified } : null,
  ].filter(Boolean);

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: NT.bg }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '2.5rem 1.5rem', flex: 1, width: '100%' }}>

        {/* Page Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(212,43,43,0.1)', border: '1px solid rgba(212,43,43,0.3)', color: '#FF6060', padding: '4px 14px', borderRadius: 99, fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'Rajdhani, sans-serif', marginBottom: 12 }}>
            <i className="fa-solid fa-user" /> My Account
          </div>
          <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 800, color: NT.textMain, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>
            Welcome Back{profileData ? `, ${profileData.firstName}` : ''}!
          </h1>
          <p style={{ color: NT.textMuted, fontSize: '0.875rem' }}>Manage your orders, payments, and account settings</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(212,43,43,0.08)', border: '1px solid rgba(212,43,43,0.3)', color: '#FF6060', padding: '0.85rem 1.25rem', borderRadius: 12, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem' }}>
            <i className="fas fa-exclamation-circle" /> {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          {/* Stats */}
          {!isAdmin && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              {STATS.map(stat => (
                <div key={stat.label} style={{
                  background: NT.card, border: `1px solid ${NT.border}`, borderRadius: 16,
                  padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem',
                  transition: 'all 0.25s', boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = NT.borderHover; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = NT.border; e.currentTarget.style.transform = 'none'; }}
                >
                  <div style={{ width: 48, height: 48, background: `${stat.color}15`, border: `1px solid ${stat.color}30`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={`fas ${stat.icon}`} style={{ color: stat.color, fontSize: '1.2rem' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.6rem', fontWeight: 700, color: NT.textMuted, textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: 'Rajdhani, sans-serif', marginBottom: 4 }}>{stat.label}</p>
                    <p style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.5rem', fontWeight: 800, color: NT.textMain, lineHeight: 1 }}>{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Personal Info */}
          <div style={{ background: NT.card, border: `1px solid ${NT.border}`, borderRadius: 20, overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(135deg,#1A1A1E,#161618)', borderBottom: `1px solid ${NT.border}`, padding: '1.25rem 1.75rem', position: 'relative', overflow: 'hidden' }}>
              <div className="bg-circuit" style={{ position: 'absolute', inset: 0, opacity: 0.5, pointerEvents: 'none' }} />
              <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.8rem', fontWeight: 700, color: NT.textMain, textTransform: 'uppercase', letterSpacing: '0.2em', margin: 0, position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fa-solid fa-id-card" style={{ color: NT.primary }} /> Personal Information
              </h2>
            </div>
            <div style={{ padding: '1.75rem' }}>
              {profileData ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                  {INFO_FIELDS.map(field => (
                    <div key={field.label} style={{ background: NT.bg, border: `1px solid ${NT.border}`, borderRadius: 12, padding: '1rem 1.25rem', transition: 'border-color 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = NT.borderHover}
                      onMouseLeave={e => e.currentTarget.style.borderColor = NT.border}
                    >
                      <p style={{ fontSize: '0.55rem', fontWeight: 700, color: NT.textMuted, textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: 'Rajdhani, sans-serif', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <i className={`fas ${field.icon}`} style={{ color: NT.primary }} /> {field.label}
                      </p>
                      <p style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.95rem', fontWeight: 700, color: field.highlight ? '#F0A500' : NT.textMain }}>
                        {field.value}
                        {field.highlight === false && <i className="fas fa-check-circle" style={{ color: '#4ade80', marginLeft: 6, fontSize: '0.8rem' }} />}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: NT.textMuted, fontSize: '0.875rem' }}>No profile details found.</p>
              )}
            </div>
          </div>

          {/* Orders Section */}
          {!isAdmin && (
            <div style={{ background: NT.card, border: `1px solid ${NT.border}`, borderRadius: 20, overflow: 'hidden' }}>
              {/* Section Header */}
              <div style={{ background: 'linear-gradient(135deg,#1A1A1E,#161618)', borderBottom: `1px solid ${NT.border}`, padding: '1.25rem 1.75rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', position: 'relative', overflow: 'hidden' }}>
                <div className="bg-circuit" style={{ position: 'absolute', inset: 0, opacity: 0.5, pointerEvents: 'none' }} />
                <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.8rem', fontWeight: 700, color: NT.textMain, textTransform: 'uppercase', letterSpacing: '0.2em', margin: 0, position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="fa-solid fa-bag-shopping" style={{ color: NT.primary }} /> Order History & Payment Tracking
                </h2>

                {orders.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, position: 'relative', zIndex: 1 }}>
                    {/* Search */}
                    <div style={{ position: 'relative' }}>
                      <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#505060', pointerEvents: 'none' }} />
                      <input
                        type="text" placeholder="Search orders..." value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ background: NT.bg, border: `1px solid ${NT.border}`, borderRadius: 8, padding: '0.5rem 0.75rem 0.5rem 2rem', color: NT.textMain, fontSize: '0.75rem', fontFamily: 'Inter, sans-serif', outline: 'none', width: 180 }}
                        onFocus={e => e.target.style.borderColor = NT.primary}
                        onBlur={e => e.target.style.borderColor = NT.border}
                      />
                    </div>
                    {/* Status filter */}
                    <select
                      value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                      style={{ background: NT.bg, border: `1px solid ${NT.border}`, borderRadius: 8, padding: '0.5rem 0.75rem', color: NT.textMuted, fontSize: '0.75rem', fontFamily: 'Inter, sans-serif', outline: 'none', cursor: 'pointer' }}
                    >
                      <option>All Orders</option>
                      <option>Completed</option>
                      <option>Processing (Installments)</option>
                    </select>
                    {/* Sort */}
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6, background: NT.bg, border: `1px solid ${NT.border}`, borderRadius: 8, padding: '0.5rem 0.75rem' }}>
                      <SlidersHorizontal size={13} style={{ color: '#505060', flexShrink: 0 }} />
                      <select
                        value={sortBy} onChange={e => setSortBy(e.target.value)}
                        style={{ background: 'transparent', border: 'none', color: NT.textMuted, fontSize: '0.75rem', fontFamily: 'Inter, sans-serif', outline: 'none', cursor: 'pointer' }}
                      >
                        <option>Date (Newest First)</option>
                        <option>Date (Oldest First)</option>
                        <option>Total Amount (High to Low)</option>
                        <option>Total Amount (Low to High)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ padding: '1.75rem' }}>
                {filteredOrders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3.5rem 0' }}>
                    <ShoppingBag size={48} style={{ color: NT.border, marginBottom: '1rem', display: 'block', margin: '0 auto 1rem' }} />
                    <p style={{ color: NT.textMuted, fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                      You haven't placed any orders matching these criteria.
                    </p>
                    <Link
                      to="/products"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#D42B2B,#A01E1E)', color: '#fff', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.75rem 1.75rem', borderRadius: 10, textDecoration: 'none', boxShadow: '0 6px 20px rgba(212,43,43,0.3)' }}
                    >
                      <i className="fa-solid fa-bag-shopping" /> Start Shopping
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {filteredOrders.map(order => {
                      const pct = Math.min(100, Math.round((order.amountPaid / order.totalAmount) * 100));
                      const isComplete = order.amountPaid >= order.totalAmount;
                      const combinedPeriodPayment = order.items?.reduce((acc, i) => acc + (i.paymentChoice === 'installment' ? (i.periodPayment || i.monthlyPayment || 0) * i.quantity : 0), 0) || 0;
                      const isWeekly = order.items?.some(i => i.paymentFrequency === 'weekly');
                      const maxPeriods = Math.max(...(order.items?.map(i => i.paymentChoice === 'installment' ? i.installments : 0) || [0]));
                      const totalFullPayments = order.items?.reduce((acc, i) => acc + (i.paymentChoice === 'full' ? i.price * i.quantity : 0), 0) || 0;
                      const amountPaidTowardsInstallments = Math.max(0, order.amountPaid - totalFullPayments - (order.deliveryFee || 0));
                      const periodsPaid = combinedPeriodPayment > 0 ? Math.floor(amountPaidTowardsInstallments / combinedPeriodPayment) : 0;
                      const excessPaid = combinedPeriodPayment > 0 ? (amountPaidTowardsInstallments % combinedPeriodPayment) : 0;

                      let nextPaymentDate = null, timerText = '', isOverdue = false;
                      if (!isComplete && order.createdAt) {
                        nextPaymentDate = new Date(order.createdAt.toMillis());
                        if (isWeekly) nextPaymentDate.setDate(nextPaymentDate.getDate() + (periodsPaid + 1) * 7);
                        else nextPaymentDate.setMonth(nextPaymentDate.getMonth() + (periodsPaid + 1));
                        const diffDays = Math.ceil((nextPaymentDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                        if (diffDays < 0) { isOverdue = true; timerText = `Overdue by ${Math.abs(diffDays)} days`; }
                        else if (diffDays === 0) { timerText = `Due today!`; isOverdue = true; }
                        else { timerText = `Due in ${diffDays} days`; }
                      }

                      const balance = order.totalAmount - order.amountPaid;
                      let defaultCustomAmount = combinedPeriodPayment;
                      if (excessPaid > 0 && combinedPeriodPayment > 0) defaultCustomAmount = combinedPeriodPayment - excessPaid;
                      defaultCustomAmount = Math.min(balance, defaultCustomAmount);
                      const currentCustomAmount = customAmounts[order.id] !== undefined ? customAmounts[order.id] : defaultCustomAmount;
                      const isExpanded = expandedOrders.has(order.id);

                      return (
                        <div key={order.id} style={{
                          border: `1px solid ${isComplete ? 'rgba(74,222,128,0.2)' : NT.border}`,
                          borderRadius: 14, overflow: 'hidden', background: NT.cardSub, transition: 'border-color 0.2s',
                        }}>
                          {/* Order Header */}
                          <div
                            style={{
                              display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center',
                              gap: '0.75rem', padding: '1rem 1.25rem', cursor: 'pointer',
                              background: isExpanded ? 'rgba(212,43,43,0.04)' : 'transparent',
                              borderBottom: isExpanded ? `1px solid ${NT.border}` : 'none', transition: 'background 0.2s',
                            }}
                            onClick={() => toggleOrderExpand(order.id)}
                          >
                            <div>
                              <span style={{ fontSize: '0.6rem', fontWeight: 700, color: NT.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'Rajdhani, sans-serif', display: 'block', marginBottom: 3 }}>
                                {order.createdAt?.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </span>
                              <strong style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: NT.textAccent }}>
                                #{order.id.slice(0, 14)}
                              </strong>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 8,
                                fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Rajdhani, sans-serif',
                                background: isComplete ? 'rgba(74,222,128,0.1)' : 'rgba(240,165,0,0.1)',
                                color: isComplete ? '#4ade80' : '#F0A500',
                                border: isComplete ? '1px solid rgba(74,222,128,0.25)' : '1px solid rgba(240,165,0,0.25)',
                              }}>
                                {isComplete ? <CheckCircle size={12} /> : <Clock size={12} />} {order.status}
                              </span>
                              <div style={{ width: 28, height: 28, background: NT.bg, border: `1px solid ${NT.border}`, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: NT.textMuted, flexShrink: 0 }}>
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </div>
                            </div>
                          </div>

                          {/* Order Body */}
                          {isExpanded && (
                            <div>
                              {/* Tracking */}
                              <div style={{ padding: '1.25rem 1.5rem', borderBottom: `1px solid ${NT.border}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                  <h3 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.7rem', fontWeight: 700, color: NT.textMuted, textTransform: 'uppercase', letterSpacing: '0.15em', margin: 0 }}>
                                    Delivery Tracking
                                  </h3>
                                  <Link
                                    to={`/delivery?orderId=${order.id}`}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(212,43,43,0.1)', border: '1px solid rgba(212,43,43,0.3)', color: NT.primary, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: 8, textDecoration: 'none', transition: 'all 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(212,43,43,0.18)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(212,43,43,0.1)'}
                                  >
                                    Track <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.6rem' }} />
                                  </Link>
                                </div>
                                <OrderTrackingStepper
                                  status={
                                    order.status.toLowerCase() === 'completed' ? 'completed' :
                                    order.status.toLowerCase().includes('processing') ? 'payment_received' :
                                    'pending_payment'
                                  }
                                  showDescription={false}
                                />
                              </div>

                              {/* Items + Payment */}
                              <div style={{ display: 'flex', flexWrap: 'wrap', borderBottom: `1px solid ${NT.border}` }}>
                                {/* Items */}
                                <div style={{ flex: '1 1 280px', padding: '1.25rem 1.5rem', borderRight: `1px solid ${NT.border}` }}>
                                  <h3 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.65rem', fontWeight: 700, color: NT.textMuted, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1rem' }}>
                                    Items in Order
                                  </h3>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                    {order.items?.map((item, idx) => (
                                      <div key={idx} style={{ display: 'flex', gap: '0.75rem', paddingBottom: idx < order.items.length - 1 ? '0.85rem' : 0, borderBottom: idx < order.items.length - 1 ? `1px solid ${NT.border}` : 'none' }}>
                                        <div style={{ width: 56, height: 56, background: NT.bg, border: `1px solid ${NT.border}`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 4 }}>
                                          <img src={item.img} alt={item.name} loading="lazy" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                          <p style={{ fontWeight: 600, fontSize: '0.8rem', color: NT.textMain, marginBottom: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.35 }}>
                                            {item.name}
                                          </p>
                                          <p style={{ fontSize: '0.65rem', color: NT.textMuted, marginBottom: 6 }}>
                                            Qty: {item.quantity}{item.length && ` · Length: ${item.length}`}
                                          </p>
                                          <PaymentBadge paymentChoice={item.paymentChoice} installments={item.installments} paymentFrequency={item.paymentFrequency} />
                                          {item.paymentChoice === 'installment' && (item.periodPayment || item.monthlyPayment) ? (
                                            <p style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.8rem', fontWeight: 700, color: NT.textAccent, marginTop: 6 }}>
                                              {fmt((item.periodPayment || item.monthlyPayment) * item.quantity)}<span style={{ color: NT.textMuted, fontWeight: 500 }}>/{item.paymentFrequency === 'weekly' ? 'wk' : 'mo'}</span>
                                            </p>
                                          ) : item.paymentChoice === 'full' ? (
                                            <p style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.85rem', fontWeight: 700, color: NT.textMain, marginTop: 6 }}>
                                              {fmt(item.price * item.quantity)}
                                            </p>
                                          ) : null}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Payment Summary */}
                                <div style={{ width: 280, flexShrink: 0, padding: '1.25rem 1.5rem', background: NT.bg }}>
                                  <h3 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.65rem', fontWeight: 700, color: NT.textMuted, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1rem' }}>
                                    Payment Summary
                                  </h3>

                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: '0.8rem' }}>
                                    <span style={{ color: NT.textMuted }}>Order Total:</span>
                                    <strong style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: NT.textMain }}>{fmt(order.totalAmount)}</strong>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', fontSize: '0.8rem' }}>
                                    <span style={{ color: NT.textMuted }}>Paid So Far:</span>
                                    <strong style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: '#60a5fa' }}>{fmt(order.amountPaid)}</strong>
                                  </div>

                                  {/* Progress Bar */}
                                  <div style={{ width: '100%', background: NT.border, height: 5, borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
                                    <div style={{ height: '100%', width: `${pct}%`, background: isComplete ? '#4ade80' : 'linear-gradient(90deg,#D42B2B,#FF6060)', borderRadius: 99, transition: 'width 1s' }} />
                                  </div>
                                  <p style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', marginBottom: '1rem', color: isComplete ? '#4ade80' : NT.textMuted }}>
                                    {isComplete ? <><i className="fas fa-check-circle" style={{ marginRight: 4 }} />Fully Paid</> : `${pct}% paid · Balance: ${fmt(balance)}`}
                                  </p>

                                  {!isComplete && nextPaymentDate && (
                                    <div style={{ background: NT.card, border: `1px solid ${isOverdue ? 'rgba(212,43,43,0.3)' : NT.border}`, borderRadius: 10, padding: '0.75rem', textAlign: 'center', marginBottom: '1rem' }}>
                                      <p style={{ fontSize: '0.6rem', fontWeight: 700, color: NT.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'Rajdhani, sans-serif', marginBottom: 4 }}>Next Payment Due</p>
                                      <p style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.95rem', fontWeight: 800, color: NT.textMain, marginBottom: 5 }}>
                                        {nextPaymentDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                      </p>
                                      <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '2px 10px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'Rajdhani, sans-serif', background: isOverdue ? 'rgba(212,43,43,0.12)' : 'rgba(74,222,128,0.1)', color: isOverdue ? '#FF6060' : '#4ade80', border: isOverdue ? '1px solid rgba(212,43,43,0.3)' : '1px solid rgba(74,222,128,0.25)' }}>
                                        {timerText}
                                      </span>
                                    </div>
                                  )}

                                  {!isComplete && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                      <button
                                        onClick={() => handleContinuePayment(order, defaultCustomAmount)}
                                        disabled={loading}
                                        style={{ width: '100%', background: 'linear-gradient(135deg,#D42B2B,#A01E1E)', color: '#fff', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', border: 'none', borderRadius: 10, padding: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 14px rgba(212,43,43,0.3)', opacity: loading ? 0.7 : 1, transition: 'all 0.2s' }}
                                      >
                                        {loading ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-credit-card" />}
                                        Pay {fmt(defaultCustomAmount)}
                                      </button>

                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{ flex: 1, height: 1, background: NT.border }} />
                                        <span style={{ color: NT.textMuted, fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'Rajdhani, sans-serif', flexShrink: 0 }}>or custom</span>
                                        <div style={{ flex: 1, height: 1, background: NT.border }} />
                                      </div>

                                      <div style={{ display: 'flex', gap: 6 }}>
                                        <div style={{ flex: 1, position: 'relative' }}>
                                          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: NT.textMuted, fontSize: '0.85rem', fontWeight: 700, pointerEvents: 'none' }}>₦</span>
                                          <input
                                            type="number"
                                            value={currentCustomAmount}
                                            onChange={e => setCustomAmounts(prev => ({ ...prev, [order.id]: Number(e.target.value) }))}
                                            max={balance} min={1}
                                            style={{ width: '100%', background: NT.card, border: `1px solid ${NT.border}`, borderRadius: 9, padding: '0.6rem 0.75rem 0.6rem 1.6rem', color: NT.textMain, fontSize: '0.8rem', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, outline: 'none' }}
                                            onFocus={e => e.target.style.borderColor = NT.primary}
                                            onBlur={e => e.target.style.borderColor = NT.border}
                                          />
                                        </div>
                                        <button
                                          onClick={() => handleContinuePayment(order, currentCustomAmount)}
                                          disabled={loading || currentCustomAmount <= 0 || currentCustomAmount > balance}
                                          style={{ background: 'rgba(212,43,43,0.15)', border: '1px solid rgba(212,43,43,0.4)', color: NT.primary, fontFamily: 'Rajdhani, sans-serif', fontWeight: 800, fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 14px', borderRadius: 9, cursor: 'pointer', opacity: (loading || currentCustomAmount <= 0 || currentCustomAmount > balance) ? 0.5 : 1, transition: 'all 0.2s' }}
                                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(212,43,43,0.25)'}
                                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(212,43,43,0.15)'}
                                        >
                                          Pay
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Installment Schedule */}
                              {combinedPeriodPayment > 0 && (
                                <div style={{ padding: '1.25rem 1.5rem' }}>
                                  <div style={{ border: `1px solid ${NT.border}`, borderRadius: 12, overflow: 'hidden' }}>
                                    <div style={{ background: NT.bg, borderBottom: `1px solid ${NT.border}`, padding: '0.75rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                                      <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.7rem', fontWeight: 700, color: NT.textMuted, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                                        Payment Schedule — {maxPeriods} {isWeekly ? 'Weeks' : 'Months'}
                                      </span>
                                      <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.65rem', fontWeight: 700, color: NT.textAccent, background: NT.card, border: `1px solid ${NT.border}`, padding: '2px 10px', borderRadius: 6 }}>
                                        {periodsPaid} of {maxPeriods} paid · {fmt(combinedPeriodPayment)}/{isWeekly ? 'wk' : 'mo'}
                                      </span>
                                    </div>
                                    <div>
                                      {Array.from({ length: maxPeriods }).map((_, idx) => {
                                        const periodNum = idx + 1;
                                        let status = 'unpaid';
                                        if (periodsPaid >= periodNum) status = 'paid';
                                        else if (periodsPaid + 1 === periodNum && excessPaid > 0) status = 'partial';

                                        let periodDate = null;
                                        if (order.createdAt) {
                                          periodDate = new Date(order.createdAt.toMillis());
                                          if (isWeekly) periodDate.setDate(periodDate.getDate() + periodNum * 7);
                                          else periodDate.setMonth(periodDate.getMonth() + periodNum);
                                        }

                                        const dotColor = status === 'paid' ? '#4ade80' : status === 'partial' ? '#F0A500' : NT.border;
                                        const rowBg = status === 'paid' ? 'rgba(74,222,128,0.04)' : status === 'partial' ? 'rgba(240,165,0,0.04)' : 'transparent';
                                        const badgeColor = status === 'paid' ? { bg: 'rgba(74,222,128,0.1)', color: '#4ade80', border: 'rgba(74,222,128,0.25)' } : status === 'partial' ? { bg: 'rgba(240,165,0,0.1)', color: '#F0A500', border: 'rgba(240,165,0,0.25)' } : { bg: NT.bg, color: NT.textMuted, border: NT.border };
                                        const statusLabel = status === 'paid' ? 'Paid' : status === 'partial' ? 'Partial' : 'Pending';
                                        const statusIcon = status === 'paid' ? 'fa-check' : status === 'partial' ? 'fa-hourglass-half' : 'fa-circle';

                                        return (
                                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.75rem 1.25rem', background: rowBg, borderBottom: idx < maxPeriods - 1 ? `1px solid ${NT.border}` : 'none', transition: 'background 0.2s' }}>
                                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: dotColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, color: status === 'unpaid' ? NT.textMuted : '#0E0E10', flexShrink: 0, fontFamily: 'Rajdhani, sans-serif' }}>
                                              {periodNum}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                              <p style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.8rem', fontWeight: 700, color: NT.textMain, marginBottom: 2 }}>
                                                {isWeekly ? 'Week' : 'Month'} {periodNum}
                                                {status === 'partial' && <span style={{ marginLeft: 8, fontSize: '0.65rem', color: '#F0A500', fontWeight: 500 }}>Remaining: {fmt(combinedPeriodPayment - excessPaid)}</span>}
                                              </p>
                                              <p style={{ fontSize: '0.65rem', color: NT.textMuted, fontFamily: 'Rajdhani, sans-serif' }}>
                                                Due: {periodDate ? periodDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                              </p>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                              <p style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.85rem', fontWeight: 700, color: NT.textMain, marginBottom: 4 }}>
                                                {status === 'paid' ? fmt(combinedPeriodPayment) : status === 'partial' ? <span><span style={{ color: '#F0A500' }}>{fmt(excessPaid)}</span> <span style={{ fontSize: '0.65rem', color: NT.textMuted }}>of {fmt(combinedPeriodPayment)}</span></span> : fmt(combinedPeriodPayment)}
                                              </p>
                                              <span style={{ fontSize: '0.55rem', fontWeight: 800, padding: '2px 8px', borderRadius: 5, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Rajdhani, sans-serif', background: badgeColor.bg, color: badgeColor.color, border: `1px solid ${badgeColor.border}`, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                <i className={`fas ${statusIcon}`} style={{ fontSize: '0.5rem' }} /> {statusLabel}
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
      <Footer />
    </main>
  );
}
