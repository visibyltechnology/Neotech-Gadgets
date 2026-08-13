import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import Footer from '../components/Footer';

export default function GoodMoodDeals() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dealEndTime, setDealEndTime] = useState(null);
    const [time, setTime] = useState({ h: 0, m: 0, s: 0 });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const snap = await getDoc(doc(db, 'site_settings', 'general'));
                if (snap.exists() && snap.data().goodMoodDealsEnd) {
                    setDealEndTime(new Date(snap.data().goodMoodDealsEnd).getTime());
                }
            } catch (err) {
                console.error("Failed to fetch settings:", err);
            }
        };
        fetchSettings();
    }, []);

    useEffect(() => {
        if (!dealEndTime) return;
        const id = setInterval(() => {
            const diff = Math.max(0, dealEndTime - Date.now());
            setTime({
                h: Math.floor(diff / 3600000),
                m: Math.floor((diff % 3600000) / 60000),
                s: Math.floor((diff % 60000) / 1000),
            });
        }, 1000);
        return () => clearInterval(id);
    }, [dealEndTime]);
    const pad = n => String(n).padStart(2, '0');
    const dealActive = !!(dealEndTime && dealEndTime > Date.now());

    useEffect(() => {
        setLoading(true);
        const unsubscribe = onSnapshot(collection(db, 'products'), (snap) => {
            const items = snap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter(p => p.folder === 'Good Mood Deals');
            setProducts(items);
            setLoading(false);
        }, (error) => {
            console.error('Error fetching products:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <div style={{ background: '#0E0E10', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{
                background: 'linear-gradient(135deg, #161618 0%, #1e1b2e 100%)',
                borderBottom: '1px solid #2A2A30',
                padding: '3rem 0', position: 'relative', overflow: 'hidden'
            }}>
                <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1.5rem', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <Link to="/" style={{ alignSelf: 'flex-start', color: '#888', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                        <ArrowLeft size={16} /> Back to Home
                    </Link>
                    
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(212,43,43,0.1)', border: '1px solid rgba(212,43,43,0.3)', color: '#FF6060', padding: '6px 14px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>
                        <i className="fa-solid fa-bolt"></i> Flash Deals
                    </div>
                    
                    <h1 style={{ color: '#fff', fontSize: '3rem', fontWeight: 900, margin: '0 0 1rem 0', letterSpacing: '-0.03em' }}>Good Mood Deals</h1>
                    
                    {dealActive ? (
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', padding: '1rem 2rem', borderRadius: '1rem', border: '1px solid #333' }}>
                            <Clock className="text-brandRed" size={24} />
                            <div style={{ display: 'flex', gap: '0.5rem', fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>
                                <span>{pad(time.h)}</span><span style={{ color: '#555' }}>:</span>
                                <span>{pad(time.m)}</span><span style={{ color: '#555' }}>:</span>
                                <span>{pad(time.s)}</span>
                            </div>
                        </div>
                    ) : (
                        <div style={{ color: '#FF6060', fontWeight: 700, padding: '1rem', background: 'rgba(212,43,43,0.1)', borderRadius: '0.5rem' }}>
                            These deals have expired. Check back later!
                        </div>
                    )}
                </div>
            </div>

            <div style={{ flex: 1, padding: '4rem 1.5rem', maxWidth: '80rem', margin: '0 auto', width: '100%' }}>
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
                        <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '2rem', color: '#D42B2B' }}></i>
                    </div>
                ) : products.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#888', padding: '4rem 0' }}>
                        <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '1rem' }}>No active deals found</h2>
                        <p>There are currently no products available in the Good Mood Deals section.</p>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                        gap: '1.5rem'
                    }}>
                        {products.map(product => (
                            <Link key={product.id} to={`/products/${product.id}`} style={{
                                textDecoration: 'none',
                                background: '#1A1A1E',
                                borderRadius: '1rem',
                                overflow: 'hidden',
                                border: '1px solid #2A2A30',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.borderColor = '#4A4A55';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.borderColor = '#2A2A30';
                            }}>
                                <div style={{ position: 'relative', paddingTop: '100%' }}>
                                    <img 
                                        src={product.img || product.images?.[0]} 
                                        alt={product.name}
                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                    {product.dealOnly && (
                                        <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(124, 58, 237, 0.9)', color: '#fff', fontSize: '0.65rem', fontWeight: 800, padding: '4px 8px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                            Deal Only
                                        </div>
                                    )}
                                </div>
                                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                                    <h3 style={{ margin: 0, color: '#fff', fontSize: '1rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                        {product.name}
                                    </h3>
                                    <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        {product.pss && dealActive && Number(product.pss) < Number(product.price) && (
                                            <span style={{ color: '#888', textDecoration: 'line-through', fontSize: '0.85rem' }}>
                                                ₦{Number(product.price).toLocaleString()}
                                            </span>
                                        )}
                                        <span style={{ color: '#FF3030', fontSize: '1.25rem', fontWeight: 800 }}>
                                            ₦{Number(product.pss && dealActive && Number(product.pss) > 0 ? product.pss : product.price).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
}
