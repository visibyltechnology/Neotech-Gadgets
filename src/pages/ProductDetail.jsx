import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, ChevronDown, CheckCircle, ShieldCheck } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Footer from '../components/Footer';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import toast from 'react-hot-toast';
import { collection, addDoc, onSnapshot, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { INTEREST_RATES_PERCENT } from '../utils/interestRates';

function fmt(n) {
  return '₦' + Math.ceil(n).toLocaleString('en-NG');
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCartStore();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedImg, setSelectedImg] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [showInstallment, setShowInstallment] = useState(false);
  const [installments, setInstallments] = useState(2);
  const [paymentFrequency, setPaymentFrequency] = useState('monthly');

  const { user } = useAuthStore();
  const [reviews, setReviews] = useState([]);
  const [newReviewText, setNewReviewText] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProduct({ id: docSnap.id, ...data });
          setSelectedImg(data.img || data.images?.[0] || '');
          if (data.hasConditionPricing) {
            setSelectedCondition('Brand New');
          }
        } else {
          setError("Product not found");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load product");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const q = query(collection(db, 'products', id, 'reviews'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedReviews = [];
      snapshot.forEach((doc) => {
        fetchedReviews.push({ id: doc.id, ...doc.data() });
      });
      setReviews(fetchedReviews);
    });
    return () => unsubscribe();
  }, [id]);

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0E0E10' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#505060' }}>
          <i className="fas fa-circle-notch fa-spin text-4xl mb-4" style={{ color: '#D42B2B' }}></i>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: 'Rajdhani, sans-serif' }}>Loading Product...</h2>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0E0E10' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#E8E8F0', marginBottom: '1rem', fontFamily: 'Rajdhani, sans-serif' }}>{error || 'Product Not Found'}</h2>
          <Link to="/products" style={{ color: '#D42B2B', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#FF3030'} onMouseLeave={e => e.currentTarget.style.color = '#D42B2B'}>
            <ArrowLeft size={16} /> Back to Shop
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  const basePrice = product.hasConditionPricing 
    ? (selectedCondition === 'Brand New' ? Number(product.priceBrandNew) : Number(product.priceUkUsed))
    : Number(product.price);
  
  const price = basePrice;
  const monthlyRate = INTEREST_RATES_PERCENT[installments] / 100;
  const rate        = monthlyRate * (paymentFrequency === 'weekly' ? 0.5 : 1);
  const displayRate = INTEREST_RATES_PERCENT[installments] * (paymentFrequency === 'weekly' ? 0.5 : 1);
  const total       = price * (1 + rate);
  
  const totalPeriods = installments;
  const periodPayment = total / totalPeriods;
  const interestAmt = total - price;

  const allImages = product.images && product.images.length > 0 ? product.images : [product.img].filter(Boolean);

  const getProductWithCondition = () => {
    if (!product.hasConditionPricing) return product;
    return { ...product, price: basePrice, selectedCondition };
  };

  const handleBuyOnce = () => {
    addToCart(getProductWithCondition(), 1, 'full', 1, price);
    navigate('/cart');
  };

  const handleInstallment = () => {
    addToCart(getProductWithCondition(), 1, 'installment', installments, periodPayment, paymentFrequency);
    navigate('/cart');
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be logged in to leave a review.');
      return;
    }
    if (!newReviewText.trim()) {
      toast.error('Review text cannot be empty.');
      return;
    }
    setIsSubmittingReview(true);
    try {
      await addDoc(collection(db, 'products', id, 'reviews'), {
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        rating: newRating,
        text: newReviewText.trim(),
        createdAt: serverTimestamp(),
      });
      toast.success('Review submitted successfully!');
      setNewReviewText('');
      setNewRating(5);
    } catch (err) {
      console.error('Error submitting review:', err);
      toast.error('Failed to submit review. Please try again.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const averageRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : 0;

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0E0E10' }}>
      <div className="px-4 sm:px-6" style={{ maxWidth: '80rem', mx: 'auto', paddingTop: '2rem', paddingBottom: '2rem', width: '100%', flex: 1 }}>
        
        {/* Breadcrumb / Back */}
        <div style={{ marginBottom: '1.5rem' }}>
          <Link to="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', fontWeight: 700, color: '#707080', textTransform: 'uppercase', letterSpacing: '0.15em', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#E8E8F0'} onMouseLeave={e => e.currentTarget.style.color = '#707080'}>
            <ArrowLeft size={14} /> Back to Products
          </Link>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3rem', lg: { gap: '4rem' } }}>
          
          {/* Image Column */}
          <div style={{ width: '100%', flex: '1 1 400px', maxWidth: '100%' }}>
            <div style={{
              position: 'sticky', top: 32,
              background: 'linear-gradient(135deg, #1A1A1E, #161618)',
              border: '1px solid #2A2A30', borderRadius: 24, padding: '2rem',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              minHeight: 400, boxShadow: '0 20px 40px rgba(0,0,0,0.5)', overflow: 'hidden',
            }}>
              <div className="bg-circuit" style={{ position: 'absolute', inset: 0, opacity: 0.2, pointerEvents: 'none' }}></div>
              
              <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <img src={selectedImg || product.img || product.images?.[0]} alt={product.name} loading="lazy" decoding="async" style={{ position: 'relative', zIndex: 10, maxWidth: '100%', maxHeight: 400, objectFit: 'contain', filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.4))' }} />
                {product.featured && (
                  <span style={{ position: 'absolute', top: 0, left: 0, zIndex: 20, background: '#F0A500', color: '#161618', fontSize: '0.6rem', fontWeight: 800, padding: '4px 10px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Featured
                  </span>
                )}
              </div>

              {allImages.length > 1 && (
                <div style={{ display: 'flex', gap: 12, marginTop: '1.5rem', position: 'relative', zIndex: 20, overflowX: 'auto', maxWidth: '100%', paddingBottom: 8, alignItems: 'center', justifyContent: 'center' }}>
                  {allImages.map((img, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setSelectedImg(img)}
                      style={{
                        width: 64, height: 64, borderRadius: 12, flexShrink: 0, overflow: 'hidden', transition: 'all 0.2s',
                        border: selectedImg === img ? '2px solid #D42B2B' : '2px solid #2A2A30',
                        opacity: selectedImg === img ? 1 : 0.6,
                        boxShadow: selectedImg === img ? '0 0 15px rgba(212,43,43,0.3)' : 'none',
                        background: 'transparent', cursor: 'pointer', padding: 0
                      }}
                      onMouseEnter={e => { if (selectedImg !== img) { e.currentTarget.style.opacity = 1; e.currentTarget.style.borderColor = '#505060'; } }}
                      onMouseLeave={e => { if (selectedImg !== img) { e.currentTarget.style.opacity = 0.6; e.currentTarget.style.borderColor = '#2A2A30'; } }}
                    >
                      <img src={img} alt={`${product.name} ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#fff' }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Info Column */}
          <div style={{ width: '100%', flex: '1 1 500px', maxWidth: '100%', padding: '0.5rem 0' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.65rem', fontWeight: 800, color: '#FF7070', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 12, background: 'rgba(212,43,43,0.1)', display: 'inline-block', padding: '4px 12px', borderRadius: 99, border: '1px solid rgba(212,43,43,0.2)' }}>
                {product.brand || product.category || 'NeoTech Partner'}
              </p>
              <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, color: '#E8E8F0', lineHeight: 1.1, marginBottom: 8, letterSpacing: '0.02em', textTransform: 'uppercase', fontFamily: 'Rajdhani, sans-serif' }}>
                {product.name}
              </h1>
              
              {/* Rating Summary */}
              {reviews.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', color: '#F0A500' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <i key={star} className={`fas fa-star ${star <= Math.round(averageRating) ? 'text-[#F0A500]' : 'text-[#2A2A30]'}`} style={{ fontSize: '0.85rem' }}></i>
                    ))}
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#C8C8D4' }}>{averageRating}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#707080' }}>({reviews.length} reviews)</span>
                </div>
              )}
              {product.length && (
                <span style={{ display: 'inline-block', background: '#1E1E22', color: '#9898A8', fontSize: '0.7rem', fontWeight: 700, padding: '4px 12px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16, border: '1px solid #2A2A30' }}>
                  {product.length}
                </span>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9898A8' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle size={14} color="#22c55e" /> In Stock</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ShieldCheck size={14} color="#D42B2B" /> Official Warranty</span>
              </div>
            </div>

            {product.hasConditionPricing && (
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#E8E8F0', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>Device Condition</p>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {['Brand New', 'UK Used'].map(condition => {
                    const isSelected = selectedCondition === condition;
                    return (
                      <button
                        key={condition}
                        onClick={() => setSelectedCondition(condition)}
                        style={{
                          flex: 1, padding: '1rem', borderRadius: 12, cursor: 'pointer',
                          background: isSelected ? 'rgba(212,43,43,0.1)' : '#161618',
                          border: `2px solid ${isSelected ? '#D42B2B' : '#2A2A30'}`,
                          color: isSelected ? '#fff' : '#C8C8D4', transition: 'all 0.2s',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4
                        }}
                      >
                        <span style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{condition}</span>
                        <span style={{ fontSize: '0.75rem', color: isSelected ? '#FF7070' : '#707080', fontWeight: 700 }}>
                          {fmt(condition === 'Brand New' ? product.priceBrandNew : product.priceUkUsed)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ borderTop: '1px solid #2A2A30', paddingTop: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 8 }}>
                <span style={{ fontSize: 'clamp(2.5rem, 4vw, 3.5rem)', fontWeight: 800, color: '#E8E8F0', letterSpacing: '0.02em', fontFamily: 'Rajdhani, sans-serif' }}>
                  {fmt(product.pss && product.pss > 0 ? product.pss : price)}
                </span>
                {(product.oldPrice || (product.pss && product.pss > 0 && product.pss < price)) && (
                  <span style={{ fontSize: '1.25rem', color: '#707080', textDecoration: 'line-through', fontWeight: 700, marginBottom: 10 }}>
                    {fmt(product.oldPrice || price)}
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.75rem', color: '#505060', fontWeight: 600, letterSpacing: '0.05em' }}>Delivery is processed after full payment is completed.</p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: '2rem' }}>
              <button 
                onClick={handleBuyOnce}
                style={{
                  width: '100%', background: 'linear-gradient(135deg,#D42B2B,#A01E1E)', color: '#fff',
                  border: 'none', padding: '1rem', borderRadius: 12, fontSize: '0.85rem', fontWeight: 800,
                  textTransform: 'uppercase', letterSpacing: '0.15em', transition: 'all 0.25s ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                  boxShadow: '0 8px 24px rgba(212,43,43,0.3)', cursor: 'pointer'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(212,43,43,0.45)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(212,43,43,0.3)'; }}
              >
                <ShoppingBag size={18} /> Buy Now
              </button>
              <button 
                onClick={() => navigate(`/swap?targetProductId=${product.id}`)}
                style={{
                  width: '100%', background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff',
                  border: 'none', padding: '1rem', borderRadius: 12, fontSize: '0.85rem', fontWeight: 800,
                  textTransform: 'uppercase', letterSpacing: '0.15em', transition: 'all 0.25s ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                  boxShadow: '0 8px 24px rgba(59,130,246,0.3)', cursor: 'pointer'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(59,130,246,0.45)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(59,130,246,0.3)'; }}
              >
                <RefreshCw size={18} /> Swap For This
              </button>
            </div>

            {/* Installment Payment Section */}
            <div style={{ background: '#161618', border: '1px solid #2A2A30', borderRadius: 16, overflow: 'hidden', boxShadow: '0 12px 32px rgba(0,0,0,0.5)' }}>
              <button
                style={{
                  width: '100%', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: '#1E1E22', border: 'none', cursor: 'pointer', transition: 'background 0.2s'
                }}
                onClick={() => setShowInstallment(v => !v)}
                onMouseEnter={e => e.currentTarget.style.background = '#2A2A30'}
                onMouseLeave={e => e.currentTarget.style.background = '#1E1E22'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(212,43,43,0.1)', border: '1px solid rgba(212,43,43,0.3)', color: '#FF7070', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fas fa-calendar-alt" style={{ fontSize: '0.85rem' }}></i>
                  </div>
                  <span style={{ fontWeight: 800, color: '#E8E8F0', textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: '0.85rem', fontFamily: 'Rajdhani, sans-serif' }}>Pay in Installments</span>
                </div>
                <ChevronDown size={20} color="#707080" style={{ transform: showInstallment ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
              </button>

              {showInstallment && (
                <div style={{ padding: '1.5rem', borderTop: '1px solid #2A2A30' }}>
                  
                  {/* Frequency Toggle */}
                  <div style={{ display: 'flex', background: '#1E1E22', padding: 6, borderRadius: 12, marginBottom: '1.5rem', width: '100%', maxWidth: 320, margin: '0 auto 1.5rem', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)', border: '1px solid #2A2A30' }}>
                    <button
                      style={{
                        flex: 1, padding: '0.5rem', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', borderRadius: 8, transition: 'all 0.2s', border: 'none', cursor: 'pointer',
                        background: paymentFrequency === 'monthly' ? '#D42B2B' : 'transparent',
                        color: paymentFrequency === 'monthly' ? '#fff' : '#707080',
                        boxShadow: paymentFrequency === 'monthly' ? '0 4px 12px rgba(212,43,43,0.3)' : 'none'
                      }}
                      onClick={() => setPaymentFrequency('monthly')}
                    >
                      Monthly
                    </button>
                    <button
                      style={{
                        flex: 1, padding: '0.5rem', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', borderRadius: 8, transition: 'all 0.2s', border: 'none', cursor: 'pointer',
                        background: paymentFrequency === 'weekly' ? '#D42B2B' : 'transparent',
                        color: paymentFrequency === 'weekly' ? '#fff' : '#707080',
                        boxShadow: paymentFrequency === 'weekly' ? '0 4px 12px rgba(212,43,43,0.3)' : 'none'
                      }}
                      onClick={() => setPaymentFrequency('weekly')}
                    >
                      Weekly
                    </button>
                  </div>

                  {/* Duration Selector */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: '#707080', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12, textAlign: 'center' }}>
                      Select Duration ({paymentFrequency === 'weekly' ? 'Weeks' : 'Months'})
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
                      {[2, 3, 4, 5, 6].map(n => (
                        <button
                          key={n}
                          style={{
                            width: 48, height: 48, borderRadius: 12, fontWeight: 800, fontSize: '1.1rem', transition: 'all 0.2s', border: '1px solid', cursor: 'pointer',
                            background: installments === n ? '#D42B2B' : '#1E1E22',
                            color: installments === n ? '#fff' : '#C8C8D4',
                            borderColor: installments === n ? '#FF7070' : '#2A2A30',
                            transform: installments === n ? 'translateY(-2px)' : 'none',
                            boxShadow: installments === n ? '0 8px 16px rgba(212,43,43,0.3)' : 'none'
                          }}
                          onClick={() => setInstallments(n)}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Breakdown */}
                  <div style={{ background: '#1E1E22', border: '1px solid #2A2A30', borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #2A2A30' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#707080' }}>Interest rate</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: displayRate > 0 ? '#E8E8F0' : '#D42B2B' }}>
                        {displayRate}% {displayRate === 0 && '🎉'}
                        {paymentFrequency === 'weekly' && INTEREST_RATES_PERCENT[installments] > 0 && (
                          <span style={{ marginLeft: 4, color: '#D42B2B', fontWeight: 700, fontSize: '0.65rem' }}>(½ of monthly)</span>
                        )}
                      </span>
                    </div>
                    {interestAmt > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #2A2A30' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#707080' }}>Interest added</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#E8E8F0' }}>{fmt(interestAmt)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #2A2A30' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#707080' }}>Total to pay</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#E8E8F0' }}>{fmt(total)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#9898A8' }}>{paymentFrequency === 'monthly' ? 'Monthly payment' : 'Weekly payment'}</span>
                      <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#D42B2B' }}>{fmt(periodPayment)} <span style={{ fontSize: '0.65rem', color: '#707080', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em' }}>/{paymentFrequency === 'weekly' ? 'wk' : 'mo'}</span></span>
                    </div>
                  </div>
                  
                  <div style={{ background: 'rgba(212,43,43,0.05)', border: '1px solid rgba(212,43,43,0.15)', borderRadius: 12, padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: 12 }}>
                    <i className="fas fa-info-circle" style={{ color: '#D42B2B', marginTop: 2 }}></i>
                    <p style={{ fontSize: '0.7rem', color: '#9898A8', fontWeight: 500, lineHeight: 1.6 }}>
                      <strong style={{ color: '#E8E8F0', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.65rem' }}>How multi-item orders work:</strong> Items with the exact same payment plan are processed together. Mixes of different plans require you to unify them or split them at checkout.
                    </p>
                  </div>

                  <button 
                    style={{
                      width: '100%', background: '#1E1E22', border: '1px solid #2A2A30', color: '#E8E8F0',
                      padding: '1rem', borderRadius: 12, fontSize: '0.75rem', fontWeight: 800,
                      textTransform: 'uppercase', letterSpacing: '0.15em', transition: 'all 0.25s ease',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer'
                    }}
                    onClick={handleInstallment}
                    onMouseEnter={e => { e.currentTarget.style.background = '#D42B2B'; e.currentTarget.style.borderColor = '#FF7070'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#1E1E22'; e.currentTarget.style.borderColor = '#2A2A30'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    Start {paymentFrequency === 'weekly' ? 'Weekly' : 'Monthly'} Plan
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* REVIEWS SECTION */}
        <div style={{ marginTop: '4rem', borderTop: '1px solid #2A2A30', paddingTop: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#E8E8F0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2rem', fontFamily: 'Rajdhani, sans-serif' }}>Customer Reviews</h2>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3rem' }}>
            {/* Reviews List */}
            <div style={{ width: '100%', flex: '1 1 60%' }}>
              {reviews.length === 0 ? (
                <div style={{ background: '#161618', border: '1px solid #2A2A30', borderRadius: 20, padding: '2rem', textAlign: 'center' }}>
                  <p style={{ color: '#707080', fontWeight: 500, fontSize: '0.85rem' }}>No reviews yet. Be the first to share your experience!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {reviews.map((review) => (
                    <div key={review.id} style={{ background: '#161618', border: '1px solid #2A2A30', borderRadius: 16, padding: '1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#1E1E22', color: '#D42B2B', border: '1px solid #2A2A30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase' }}>
                            {review.userName?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p style={{ fontWeight: 700, color: '#E8E8F0', fontSize: '0.85rem' }}>{review.userName || 'Anonymous'}</p>
                            <p style={{ fontSize: '0.65rem', color: '#707080', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                              {review.createdAt ? new Date(review.createdAt.toDate()).toLocaleDateString() : 'Just now'}
                            </p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', color: '#F0A500', fontSize: '0.75rem' }}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <i key={star} className={`fas fa-star ${star <= review.rating ? 'text-[#F0A500]' : 'text-[#2A2A30]'}`}></i>
                          ))}
                        </div>
                      </div>
                      <p style={{ color: '#9898A8', fontSize: '0.85rem', lineHeight: 1.6 }}>{review.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Leave a Review Form */}
            <div style={{ width: '100%', flex: '1 1 30%' }}>
              <div style={{ background: '#161618', border: '1px solid #2A2A30', borderRadius: 20, padding: '1.5rem', position: 'sticky', top: 32 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#E8E8F0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', fontFamily: 'Rajdhani, sans-serif' }}>Write a Review</h3>
                
                {!user ? (
                  <div style={{ background: '#1E1E22', border: '1px solid #2A2A30', borderRadius: 12, padding: '1.5rem', textAlign: 'center' }}>
                    <p style={{ color: '#707080', fontSize: '0.85rem', marginBottom: '1rem' }}>Please sign in to share your thoughts about this product.</p>
                    <Link to="/login" style={{ display: 'inline-block', background: '#D42B2B', color: '#fff', fontWeight: 800, padding: '0.75rem 1.5rem', borderRadius: 8, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', textDecoration: 'none' }}>Sign In</Link>
                  </div>
                ) : (
                  <form onSubmit={submitReview} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: '#707080', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>Your Rating</label>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setNewRating(star)}
                            style={{ fontSize: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', transition: 'transform 0.2s', padding: 0, color: star <= newRating ? '#F0A500' : '#2A2A30' }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                          >
                            <i className="fas fa-star"></i>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: '#707080', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>Your Comment</label>
                      <textarea
                        value={newReviewText}
                        onChange={(e) => setNewReviewText(e.target.value)}
                        placeholder="What did you like or dislike?"
                        rows="4"
                        style={{
                          width: '100%', background: '#1E1E22', border: '1px solid #2A2A30', borderRadius: 12, padding: '0.75rem', fontSize: '0.85rem', color: '#E8E8F0', resize: 'none', outline: 'none', transition: 'border-color 0.2s', fontFamily: 'Inter, sans-serif'
                        }}
                        onFocus={e => e.target.style.borderColor = '#D42B2B'}
                        onBlur={e => e.target.style.borderColor = '#2A2A30'}
                        required
                      ></textarea>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={isSubmittingReview}
                      style={{
                        width: '100%', background: '#D42B2B', color: '#fff', fontWeight: 800, padding: '0.75rem', borderRadius: 12, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', border: 'none', cursor: isSubmittingReview ? 'not-allowed' : 'pointer', opacity: isSubmittingReview ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.2s'
                      }}
                      onMouseEnter={e => { if (!isSubmittingReview) e.currentTarget.style.background = '#FF3030'; }}
                      onMouseLeave={e => { if (!isSubmittingReview) e.currentTarget.style.background = '#D42B2B'; }}
                    >
                      {isSubmittingReview ? (
                        <><i className="fas fa-circle-notch fa-spin"></i> Submitting...</>
                      ) : (
                        'Post Review'
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
      <Footer />
    </main>
  );
}
