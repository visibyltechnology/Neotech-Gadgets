import { useState, useEffect } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import Footer from '../components/Footer';
import { listenToCategories, DEFAULT_CATEGORIES } from '../utils/categoryService';
import { listenToBrands, DEFAULT_BRANDS } from '../utils/brandService';
import { ProductCard, SkeletonCard } from '../components/ProductCard';

function pathToCategory(pathname) {
    if (pathname.includes('phones')) return 'Phones';
    if (pathname.includes('laptops')) return 'Laptops';
    if (pathname.includes('gaming')) return 'Gaming';
    return null;
}

function normalizeBrand(brand) {
    if (!brand) return '';
    let b = brand.trim().toLowerCase();
    
    if (b.includes('hisense')) return 'Hisense';
    if (b.includes('tcl')) return 'TCL';
    if (b.includes('lg')) return 'LG';
    if (b.includes('samsung')) return 'Samsung';
    if (b.includes('royal')) return 'Royal';
    if (b.includes('thermocool') || b.includes('haier')) return 'Thermocool';
    if (b.includes('panasonic')) return 'Panasonic';
    if (b.includes('apple') || b.includes('iphone')) return 'Apple';
    if (b.includes('sony')) return 'Sony';
    if (b.includes('hp')) return 'HP';
    
    return b.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

const CustomCheckbox = ({ checked }) => (
    <div style={{
        width: 18, height: 18,
        border: checked ? 'none' : '1.5px solid #2A2A30',
        borderRadius: 4,
        background: checked ? '#D42B2B' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, transition: 'all 0.2s',
    }}>
        {checked && <i className="fas fa-check" style={{ color: '#fff', fontSize: '0.6rem' }}></i>}
    </div>
);

export default function Shop() {
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const navigate = useNavigate();

    const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
    const [brands, setBrands] = useState(DEFAULT_BRANDS);

    const [activeCategories, setActiveCategories] = useState([]);
    const [activeBrands, setActiveBrands] = useState([]);
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [currentPage, setCurrentPage] = useState(1);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState('Popularity');

    useEffect(() => {
        const unsubscribe = listenToCategories((cats) => {
            setCategories(cats.length > 0 ? cats : DEFAULT_CATEGORIES);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const unsubscribe = listenToBrands((brandList) => {
            setBrands(brandList.length > 0 ? brandList : DEFAULT_BRANDS);
        });
        return () => unsubscribe();
    }, []);

    const ensureInventoryFields = (product) => ({
        ...product,
        inventory_status: product.inventory_status || 'in_stock',
        items_left: product.items_left !== undefined ? product.items_left : 5,
        unlimited_stock: product.unlimited_stock || false,
        is_hidden: product.is_hidden || false
    });

    useEffect(() => {
        setLoading(true);
        const unsubscribe = onSnapshot(collection(db, 'products'), (snap) => {
            let items = snap.docs.map(d => ensureInventoryFields({ id: d.id, ...d.data() })).filter(p => !p.is_hidden);
            
            if (items.length === 0) {
                items = [
                    { id: '1', name: 'iPhone 15 Pro Max 256GB', price: 1850000, category: 'Smartphones', brand: 'Apple', img: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&q=80', inventory_status: 'in_stock', items_left: 5, unlimited_stock: false, is_hidden: false, averageRating: 5, reviewCount: 124 },
                    { id: '2', name: 'Samsung Galaxy S24 Ultra', price: 1650000, category: 'Smartphones', brand: 'Samsung', img: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&q=80', inventory_status: 'in_stock', items_left: 11, unlimited_stock: false, is_hidden: false, averageRating: 4.8, reviewCount: 89 },
                    { id: '3', name: 'ROG Zephyrus G16 Gaming Laptop', price: 2450000, category: 'Laptops', brand: 'Asus', img: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500&q=80', inventory_status: 'in_stock', items_left: 2, unlimited_stock: false, is_hidden: false, averageRating: 4.9, reviewCount: 42 },
                    { id: '4', name: 'Sony WH-1000XM5 Wireless Headphones', price: 320000, category: 'Audio', brand: 'Sony', img: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&q=80', inventory_status: 'in_stock', items_left: 0, unlimited_stock: true, is_hidden: false, averageRating: 4.7, reviewCount: 215 }
                ];
            } else {
                items = items.map(ensureInventoryFields);
            }
            setProducts(items);
            setLoading(false);
        }, (error) => {
            console.error('Error fetching products:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const cat = searchParams.get('cat') || pathToCategory(location.pathname);
        if (cat) {
            const match = categories.find(c => c.name.toLowerCase() === cat.toLowerCase())?.name;
            if (match) setActiveCategories([match]);
            setSearch('');
            setActiveBrands([]);
        }
        
        const searchQ = searchParams.get('search');
        if (searchQ) {
            setSearch(searchQ);
            setActiveCategories([]);
            setActiveBrands([]);
        }
    }, [location.search, location.pathname, searchParams, categories]);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, activeCategories, activeBrands]);

    const filtered = products.filter(p => {
        const matchCat = activeCategories.length === 0 || activeCategories.includes(p.category);
        const normalizedBrand = normalizeBrand(p.brand);
        const matchBrand = activeBrands.length === 0 || activeBrands.includes(normalizedBrand);
        
        const searchTerms = search.toLowerCase().trim().split(/\s+/).filter(Boolean);
        const searchableText = `${p.name || ''} ${normalizedBrand} ${p.category || ''} ${p.tag || ''} ${p.description || ''}`.toLowerCase();
        const matchSearch = searchTerms.length === 0 || searchTerms.every(term => searchableText.includes(term));
        
        return matchCat && matchBrand && matchSearch;
    });

    const sorted = [...filtered].sort((a, b) => {
        switch(sortBy) {
            case 'Price: Low to High': return (Number(a.price) || 0) - (Number(b.price) || 0);
            case 'Price: High to Low': return (Number(b.price) || 0) - (Number(a.price) || 0);
            case 'Newest Arrivals': return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
            case 'Popularity': default: return 0;
        }
    });

    const itemsPerPage = 100;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = sorted.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sorted.length / itemsPerPage);

    return (
        <div style={{ background: '#0E0E10', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Page Header */}
            <div style={{
                background: '#161618',
                borderBottom: '1px solid #2A2A30',
                padding: '2.5rem 0', position: 'relative', overflow: 'hidden'
            }}>
                <div className="bg-circuit" style={{ position: 'absolute', inset: 0, opacity: 0.5, pointerEvents: 'none' }} />
                <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1.5rem', position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                background: 'rgba(212,43,43,0.1)', border: '1px solid rgba(212,43,43,0.3)',
                                color: '#FF6060', padding: '5px 12px', borderRadius: 99,
                                fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.15em',
                                textTransform: 'uppercase', fontFamily: 'Rajdhani, sans-serif', marginBottom: '1rem',
                            }}>
                                <i className="fa-solid fa-bolt"></i> Premium Catalog
                            </div>
                            <h1 style={{
                                fontFamily: 'Rajdhani, sans-serif', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
                                fontWeight: 800, color: '#E8E8F0', textTransform: 'uppercase', letterSpacing: '0.05em'
                            }}>
                                {search ? `Search: ${search}` : activeCategories.length === 0 ? 'All Products' : activeCategories.join(', ')}
                            </h1>
                            <p style={{ color: '#707080', fontSize: '0.85rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <i className="fas fa-check-circle" style={{ color: '#D42B2B' }}></i>
                                100% Genuine Brands • Manufacturer Warranty
                            </p>
                        </div>
                        <div style={{ position: 'relative', width: '100%', maxWidth: 360 }}>
                            <i className="fas fa-search" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#505060' }}></i>
                            <input
                                type="text"
                                placeholder="Filter within catalog..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{
                                    width: '100%', background: '#1E1E22', border: '1px solid #2A2A30',
                                    color: '#E8E8F0', borderRadius: 12, padding: '0.85rem 1rem 0.85rem 2.8rem',
                                    fontSize: '0.85rem', outline: 'none', transition: 'all 0.2s'
                                }}
                                onFocus={e => e.target.style.borderColor = '#D42B2B'}
                                onBlur={e => e.target.style.borderColor = '#2A2A30'}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-4 sm:px-6" style={{ maxWidth: '80rem', margin: '0 auto', paddingTop: '2rem', paddingBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '2rem', flex: 1, width: '100%' }}>
                
                {/* ── Sidebar Filters ── */}
                <div style={{ width: '100%', flexShrink: 0 }} className="sm:max-w-[260px]">
                    <div style={{ background: '#161618', border: '1px solid #2A2A30', borderRadius: 16, overflow: 'hidden', position: 'sticky', top: 100 }}>
                        {/* Categories */}
                        <div style={{ padding: '1rem', borderBottom: '1px solid #2A2A30', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 800, fontSize: '0.8rem', color: '#E8E8F0', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                                Categories
                            </span>
                            <i className="fas fa-layer-group" style={{ color: '#505060', fontSize: '0.8rem' }}></i>
                        </div>
                        <div style={{ padding: '0.75rem', maxHeight: 240, overflowY: 'auto' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.6rem 0.5rem', cursor: 'pointer', borderRadius: 8, transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#1E1E22'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                <input 
                                    type="checkbox" style={{ display: 'none' }}
                                    checked={activeCategories.length === categories.filter(c => c.name !== 'All').length && activeCategories.length > 0}
                                    onChange={(e) => {
                                        if (e.target.checked) setActiveCategories(categories.filter(c => c.name !== 'All').map(c => c.name));
                                        else setActiveCategories([]);
                                        setCurrentPage(1);
                                    }}
                                />
                                <CustomCheckbox checked={activeCategories.length === categories.filter(c => c.name !== 'All').length && activeCategories.length > 0} />
                                <span style={{ fontSize: '0.85rem', color: activeCategories.length > 0 && activeCategories.length === categories.length -1 ? '#C8C8D4' : '#707080', fontWeight: 500 }}>All</span>
                            </label>
                            {categories.filter(c => c.name !== 'All').map(cat => (
                                <label key={cat.id || cat.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.6rem 0.5rem', cursor: 'pointer', borderRadius: 8, transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#1E1E22'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <input 
                                        type="checkbox" style={{ display: 'none' }}
                                        checked={activeCategories.includes(cat.name)}
                                        onChange={(e) => {
                                            if (e.target.checked) setActiveCategories(prev => [...prev, cat.name]);
                                            else setActiveCategories(prev => prev.filter(c => c !== cat.name));
                                            setCurrentPage(1);
                                        }}
                                    />
                                    <CustomCheckbox checked={activeCategories.includes(cat.name)} />
                                    <span style={{ fontSize: '0.85rem', color: activeCategories.includes(cat.name) ? '#C8C8D4' : '#707080', fontWeight: 500 }}>{cat.name}</span>
                                </label>
                            ))}
                        </div>

                        {/* Brands */}
                        <div style={{ padding: '1rem', borderTop: '1px solid #2A2A30', borderBottom: '1px solid #2A2A30', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 800, fontSize: '0.8rem', color: '#E8E8F0', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                                Brands
                            </span>
                            <i className="fas fa-tag" style={{ color: '#505060', fontSize: '0.8rem' }}></i>
                        </div>
                        <div style={{ padding: '0.75rem', maxHeight: 240, overflowY: 'auto' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.6rem 0.5rem', cursor: 'pointer', borderRadius: 8, transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#1E1E22'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                <input 
                                    type="checkbox" style={{ display: 'none' }}
                                    checked={activeBrands.length === brands.length && activeBrands.length > 0}
                                    onChange={(e) => {
                                        if (e.target.checked) setActiveBrands(brands.map(b => b.name));
                                        else setActiveBrands([]);
                                        setCurrentPage(1);
                                    }}
                                />
                                <CustomCheckbox checked={activeBrands.length === brands.length && activeBrands.length > 0} />
                                <span style={{ fontSize: '0.85rem', color: activeBrands.length === brands.length && activeBrands.length > 0 ? '#C8C8D4' : '#707080', fontWeight: 500 }}>All</span>
                            </label>
                            {brands.map(brand => (
                                <label key={brand.id || brand.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.6rem 0.5rem', cursor: 'pointer', borderRadius: 8, transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#1E1E22'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <input 
                                        type="checkbox" style={{ display: 'none' }}
                                        checked={activeBrands.includes(brand.name)}
                                        onChange={(e) => {
                                            if (e.target.checked) setActiveBrands(prev => [...prev, brand.name]);
                                            else setActiveBrands(prev => prev.filter(b => b !== brand.name));
                                            setCurrentPage(1);
                                        }}
                                    />
                                    <CustomCheckbox checked={activeBrands.includes(brand.name)} />
                                    <span style={{ fontSize: '0.85rem', color: activeBrands.includes(brand.name) ? '#C8C8D4' : '#707080', fontWeight: 500 }}>{brand.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Main Product Grid ── */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ background: '#161618', border: '1px solid #2A2A30', borderRadius: 16, padding: '1rem 1.5rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem' }}>
                        <p style={{ color: '#707080', fontSize: '0.85rem', fontWeight: 500 }}>
                            Showing <span style={{ color: '#C8C8D4', fontWeight: 700 }}>{sorted.length > 0 ? indexOfFirstItem + 1 : 0}–{Math.min(indexOfLastItem, sorted.length)}</span> of <span style={{ color: '#C8C8D4', fontWeight: 700 }}>{sorted.length}</span> items
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#1E1E22', border: '1px solid #2A2A30', borderRadius: 10, padding: '0.4rem 1rem' }}>
                            <span style={{ fontSize: '0.7rem', color: '#505060', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sort:</span>
                            <select 
                                value={sortBy}
                                onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                                style={{ background: 'transparent', color: '#E8E8F0', border: 'none', outline: 'none', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                                <option style={{ background: '#1E1E22' }}>Popularity</option>
                                <option style={{ background: '#1E1E22' }}>Newest Arrivals</option>
                                <option style={{ background: '#1E1E22' }}>Price: Low to High</option>
                                <option style={{ background: '#1E1E22' }}>Price: High to Low</option>
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
                            {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div style={{ background: '#161618', border: '1px solid #2A2A30', borderRadius: 20, padding: '4rem 2rem', textAlign: 'center' }}>
                            <div style={{ width: 64, height: 64, background: '#1E1E22', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                <i className="fas fa-search" style={{ color: '#505060', fontSize: '1.5rem' }}></i>
                            </div>
                            <h3 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.5rem', fontWeight: 800, color: '#E8E8F0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>No products found</h3>
                            <p style={{ color: '#707080', fontSize: '0.85rem', maxWidth: 320, margin: '0 auto 2rem' }}>We couldn't find any items matching your criteria. Try adjusting your filters or search terms.</p>
                            <button 
                                onClick={() => { setSearch(''); setActiveCategories([]); setActiveBrands([]); }}
                                style={{ background: 'linear-gradient(135deg,#D42B2B,#A01E1E)', color: '#fff', border: 'none', borderRadius: 10, padding: '0.85rem 2rem', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer' }}
                            >
                                Clear Filters
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
                            {currentItems.map((p) => (
                                <ProductCard
                                    key={p.id}
                                    product={p}
                                    onClick={() => navigate(`/products/${p.id}`)}
                                />
                            ))}
                        </div>
                    )}
                    
                    {!loading && totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem', marginTop: '3rem' }}>
                            <button 
                                disabled={currentPage === 1}
                                onClick={() => { setCurrentPage(prev => prev - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                style={{ background: currentPage === 1 ? '#1E1E22' : '#161618', color: currentPage === 1 ? '#505060' : '#C8C8D4', border: '1px solid #2A2A30', borderRadius: 10, padding: '0.75rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.15em', textTransform: 'uppercase', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                            >
                                <i className="fas fa-chevron-left"></i> Prev
                            </button>
                            <span style={{ fontSize: '0.85rem', color: '#707080', fontWeight: 600 }}>
                                Page <span style={{ color: '#E8E8F0' }}>{currentPage}</span> of {totalPages}
                            </span>
                            <button 
                                disabled={currentPage === totalPages}
                                onClick={() => { setCurrentPage(prev => prev + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                style={{ background: currentPage === totalPages ? '#1E1E22' : '#161618', color: currentPage === totalPages ? '#505060' : '#C8C8D4', border: '1px solid #2A2A30', borderRadius: 10, padding: '0.75rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.15em', textTransform: 'uppercase', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                            >
                                Next <i className="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
}
