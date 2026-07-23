import { useState, useEffect } from 'react';
import { collection, deleteDoc, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { Link } from 'react-router-dom';
import {
  Edit, Trash2, PlusCircle, Package, Star, Search,
  SlidersHorizontal, Ruler, BadgePercent, ArrowUpDown, Eye, EyeOff
} from 'lucide-react';
import { CATEGORY_STYLES, getDefaultStyle } from '../../utils/categoryService';

function normalizeBrand(brand) {
  if (!brand) return '';
  const b = brand.trim().toLowerCase();
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
  return brand.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

function CategoryBadge({ category }) {
  const s = CATEGORY_STYLES[category] || getDefaultStyle();
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: s.bg, color: s.text, border: `1px solid ${s.border}`,
      fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 99,
      textTransform: 'uppercase', letterSpacing: '0.08em'
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {category}
    </span>
  );
}

function ProductCard({ product, onDelete, onFeaturedToggle, onHiddenToggle }) {
  const [hovered, setHovered] = useState(false);
  const catStyle = CATEGORY_STYLES[product.category] || getDefaultStyle();
  const hasSale = product.pss && Number(product.pss) > 0 && Number(product.pss) < Number(product.price);
  const discount = hasSale
    ? Math.round(100 - (Number(product.pss) / Number(product.price)) * 100)
    : 0;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        borderRadius: 18,
        border: `1.5px solid ${hovered ? catStyle.border : '#e5e7eb'}`,
        boxShadow: hovered
          ? `0 12px 40px ${catStyle.glow}, 0 4px 16px rgba(0,0,0,0.06)`
          : '0 2px 12px rgba(0,0,0,0.05)',
        overflow: 'hidden',
        transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* Featured badge */}
      {product.featured && (
        <div style={{
          position: 'absolute', top: 12, left: 12, zIndex: 2,
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'linear-gradient(135deg,#f59e0b,#fbbf24)',
          color: '#fff', fontSize: 9, fontWeight: 900,
          padding: '3px 9px', borderRadius: 99, letterSpacing: '0.1em',
          boxShadow: '0 2px 8px rgba(245,158,11,0.4)'
        }}>
          <Star size={9} fill="#fff" /> FEATURED {product.featuredPosition ? `#${product.featuredPosition}` : ''}
        </div>
      )}

      {/* Sale badge */}
      {hasSale && (
        <div style={{
          position: 'absolute', top: 12, right: 12, zIndex: 2,
          background: 'linear-gradient(135deg,#dc2626,#ef4444)',
          color: '#fff', fontSize: 9, fontWeight: 900,
          padding: '3px 9px', borderRadius: 99, letterSpacing: '0.08em',
          boxShadow: '0 2px 8px rgba(220,38,38,0.4)'
        }}>
          -{discount}% OFF
        </div>
      )}

      {/* Hidden / Out of Stock Badges */}
      <div style={{ position: 'absolute', bottom: 12, left: 12, zIndex: 2, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {product.is_hidden && (
          <div style={{
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            color: '#fff', fontSize: 9, fontWeight: 800,
            padding: '4px 8px', borderRadius: 6, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 4
          }}>
            <EyeOff size={10} /> HIDDEN
          </div>
        )}
        {product.inventory_status === 'out_of_stock' && (
          <div style={{
            background: 'rgba(220,38,38,0.9)', backdropFilter: 'blur(4px)',
            color: '#fff', fontSize: 9, fontWeight: 800,
            padding: '4px 8px', borderRadius: 6, letterSpacing: '0.05em'
          }}>
            OUT OF STOCK
          </div>
        )}
      </div>

      {/* Image */}
      <div style={{
        height: 200, background: `linear-gradient(135deg,${catStyle.bg},#f9fafb)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', position: 'relative'
      }}>
        {product.img ? (
          <img
            src={product.img} alt={product.name} loading="lazy" decoding="async"
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              transform: hovered ? 'scale(1.05)' : 'scale(1)',
              transition: 'transform 0.35s ease'
            }}
          />
        ) : (
          <Package size={48} color={catStyle.text} style={{ opacity: 0.3 }} />
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Category */}
        <CategoryBadge category={product.category} />

        {/* Name */}
        <h3 style={{
          margin: 0, fontSize: 15, fontWeight: 800, color: '#111827',
          lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden'
        }}>
          {product.name}
        </h3>

        {/* Meta chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {product.length && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb',
              fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 8
            }}>
              <Ruler size={11} /> {product.length}
            </span>
          )}
          {hasSale && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
              fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 8
            }}>
              <BadgePercent size={11} /> Sale
            </span>
          )}
        </div>

        {/* Price */}
        <div style={{ marginTop: 'auto', paddingTop: 6 }}>
          {hasSale ? (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 20, fontWeight: 900, color: '#dc2626' }}>
                ₦{Number(product.pss).toLocaleString()}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#9ca3af', textDecoration: 'line-through' }}>
                ₦{Number(product.price).toLocaleString()}
              </span>
            </div>
          ) : (
            <span style={{ fontSize: 20, fontWeight: 900, color: '#111827' }}>
              ₦{Number(product.price).toLocaleString()}
            </span>
          )}
        </div>
      </div>

       {/* Action bar */}
       <div style={{
         padding: '12px 18px',
         background: '#f9fafb',
         borderTop: '1px solid #f3f4f6',
         display: 'flex', gap: 10
       }}>
         <Link
           to={`/admin/edit/${product.id}`}
           style={{
             flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
             padding: '9px 0', borderRadius: 10,
             background: hovered ? '#1E1E1E' : '#eff6ff',
             color: hovered ? '#fff' : '#1d4ed8',
             fontSize: 12, fontWeight: 700, textDecoration: 'none',
             border: '1.5px solid #bfdbfe',
             transition: 'all 0.2s',
             letterSpacing: '0.04em'
           }}
         >
           <Edit size={14} /> Edit
         </Link>
         <button
           onClick={() => onFeaturedToggle(product.id)}
           style={{
             flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
             padding: '9px 0', borderRadius: 10,
             background: product.featured ? '#dc2626' : '#10b981',
             color: '#fff',
             fontSize: 12, fontWeight: 700,
             border: `1.5px solid ${product.featured ? '#fecaca' : '#bbf7d0'}`,
             cursor: 'pointer', transition: 'all 0.2s',
             letterSpacing: '0.04em'
           }}
           onMouseEnter={e => { 
             e.currentTarget.style.background = product.featured 
               ? 'linear-gradient(135deg,#dc2626,#ef4444)' 
               : 'linear-gradient(135deg,#059669,#10b981)'; 
             e.currentTarget.style.color = '#fff'; 
             e.currentTarget.style.borderColor = product.featured 
               ? '#dc2626' 
               : '#059669'; 
           }}
           onMouseLeave={e => { 
             e.currentTarget.style.background = product.featured ? '#dc2626' : '#10b981'; 
             e.currentTarget.style.color = '#fff'; 
             e.currentTarget.style.borderColor = product.featured 
               ? '#fecaca' 
               : '#bbf7d0'; 
           }}
         >
           {product.featured ? (
             <>
               <Trash2 size={14} /> Unfeature
             </>
           ) : (
             <>
               <Star size={14} /> Feature
             </>
           )}
         </button>
         <button
           onClick={() => onHiddenToggle(product.id, product.is_hidden)}
           style={{
             display: 'flex', alignItems: 'center', justifyContent: 'center',
             width: 32, height: 32, borderRadius: 10, flexShrink: 0,
             background: product.is_hidden ? '#fef2f2' : '#fff',
             color: product.is_hidden ? '#dc2626' : '#6b7280',
             border: `1.5px solid ${product.is_hidden ? '#fecaca' : '#e5e7eb'}`,
             cursor: 'pointer', transition: 'all 0.2s',
           }}
           title={product.is_hidden ? "Unhide Product" : "Hide Product"}
           onMouseEnter={e => { e.currentTarget.style.borderColor = '#9ca3af'; }}
           onMouseLeave={e => { e.currentTarget.style.borderColor = product.is_hidden ? '#fecaca' : '#e5e7eb'; }}
         >
           {product.is_hidden ? <EyeOff size={14} /> : <Eye size={14} />}
         </button>
         <button
           onClick={() => onDelete(product.id)}
           style={{
             flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
             padding: '9px 0', borderRadius: 10,
             background: '#fff', color: '#dc2626',
             fontSize: 12, fontWeight: 700,
             border: '1.5px solid #fecaca',
             cursor: 'pointer', transition: 'all 0.2s',
             letterSpacing: '0.04em'
           }}
           onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg,#dc2626,#ef4444)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#dc2626'; }}
           onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.borderColor = '#fecaca'; }}
         >
           <Trash2 size={14} /> Delete
         </button>
       </div>
    </div>
  );
}

export default function ProductManager() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [filterBrand, setFilterBrand] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(collection(db, 'products'), (querySnapshot) => {
      const items = [];
      querySnapshot.forEach((d) => items.push({ id: d.id, ...d.data() }));
      setProducts(items);
      setLoading(false);
    }, (error) => {
      console.error('Error syncing products:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

   const handleDelete = async (id) => {
     const product = products.find(p => p.id === id);
     if (!product) return;

     let message = `⚠️ Delete "${product.name}"?\n\n`;
     if (product.featured) {
       message += '🌟 This is a FEATURED product';
       if (product.featuredPosition) {
         message += ` (Position #${product.featuredPosition})`;
       }
       message += '\n';
     }
     message += `Price: ₦${Number(product.price).toLocaleString()}\n\n`;
     message += 'This action cannot be undone.';

      if (window.confirm(message)) {
       try {
         await deleteDoc(doc(db, 'products', id));
       } catch (error) {
         console.error('Error deleting product:', error);
         alert('Failed to delete product. Please try again.');
       }
     }
   };

   const handleUpdateProduct = async (id, updates) => {
     try {
       await updateDoc(doc(db, 'products', id), updates);
     } catch (error) {
       console.error('Error updating product:', error);
       alert('Failed to update product. Please try again.');
     }
   };

   const handleHiddenToggle = async (productId, currentStatus) => {
     try {
       await updateDoc(doc(db, 'products', productId), { is_hidden: !currentStatus });
     } catch (error) {
       console.error('Error toggling visibility:', error);
       alert('Failed to toggle product visibility.');
     }
   };

   const handleFeaturedToggle = async (productId) => {
     const product = products.find(p => p.id === productId);
     if (!product) return;

     if (product.featured) {
       // Unfeature: just set featured to false and remove featuredPosition
       if (window.confirm(`⚠️ Remove "${product.name}" from featured products?\n\nThis action cannot be undone.`)) {
         try {
           await updateDoc(doc(db, 'products', productId), {
             featured: false,
             featuredPosition: null
           });
           setProducts(prev => prev.map(p => 
             p.id === productId ? {...p, featured: false, featuredPosition: null} : p
           ));
         } catch (error) {
           console.error('Error unfeaturing product:', error);
           alert('Failed to update product. Please try again.');
         }
       }
     } else {
       // Feature: ask for position
       const position = window.prompt(
         `Enter the position for "${product.name}" in the featured section (1 being the highest):\n` +
         `Current featured products: ${products.filter(p => p.featured).length}\n` +
         `Enter a number or leave blank for auto-position at the end.`
       );
       if (position === null) return; // user cancelled

       let pos = position.trim();
       if (pos === '') {
         // auto position at the end
         pos = products.filter(p => p.featured).length + 1;
       } else {
         const num = parseInt(pos, 10);
         if (isNaN(num) || num < 1) {
           alert('Please enter a valid positive number for position.');
           return;
         }
         pos = num;
       }

       if (window.confirm(`⚠️ Feature "${product.name}" at position #${pos}?\n\nThis will change the featured position of other products if needed.\n\nThis action cannot be undone.`)) {
         try {
           await updateDoc(doc(db, 'products', productId), {
             featured: true,
             featuredPosition: pos
           });
         } catch (error) {
           console.error('Error featuring product:', error);
           alert('Failed to update product. Please try again.');
         }
       }
     }
   };

   const brandSet = ['All', ...Array.from(new Set(products.map(p => normalizeBrand(p.brand)).filter(Boolean))).sort()];

   // Filter & sort
  const filtered = products
    .filter(p => {
      const q = search.toLowerCase();
      const pBrand = normalizeBrand(p.brand);
      const matchSearch = !q ||
        (p.name || '').toLowerCase().includes(q) ||
        pBrand.toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        (p.tag || '').toLowerCase().includes(q);
      const matchCat = filterCat === 'All' ? true : (filterCat === 'Featured' ? p.featured : p.category === filterCat);
      const matchBrand = filterBrand === 'All' || pBrand === filterBrand;
      return matchSearch && matchCat && matchBrand;
    })
    .sort((a, b) => {
      if (filterCat === 'Featured') {
        const posA = a.featuredPosition ?? Infinity;
        const posB = b.featuredPosition ?? Infinity;
        return posA - posB;
      }
      if (sortBy === 'price-asc') return Number(a.price) - Number(b.price);
      if (sortBy === 'price-desc') return Number(b.price) - Number(a.price);
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      // newest (default)
      return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
    });

  const stats = {
    total: products.length,
    featured: products.filter(p => p.featured).length,
    onSale: products.filter(p => p.pss && Number(p.pss) > 0 && Number(p.pss) < Number(p.price)).length,
  };

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', color: '#9ca3af' }}>
      <i className="fas fa-circle-notch fa-spin" style={{ fontSize: 40, marginBottom: 16, color: '#e8fb1d' }} />
      <h2 style={{ fontSize: 18, fontWeight: 800, color: '#6b7280', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Loading Products...</h2>
    </div>
  );

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: '#111827', letterSpacing: '-0.02em' }}>
            Manage Products
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
            {products.length} product{products.length !== 1 ? 's' : ''} in your catalogue
          </p>
        </div>
        <Link
          to="/admin/new"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#e8fb1d',
            color: '#171717', textDecoration: 'none',
            fontSize: 13, fontWeight: 800, padding: '12px 22px',
            borderRadius: 12, letterSpacing: '0.06em', textTransform: 'uppercase',
            boxShadow: '0 6px 20px rgba(232,251,29,0.35)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(232,251,29,0.45)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(232,251,29,0.35)'; }}
        >
          <PlusCircle size={18} /> Add New Product
        </Link>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Total Products', value: stats.total, color: '#171717', bg: '#f3f0ff', icon: '📦' },
          { label: 'Featured',       value: stats.featured, color: '#d97706', bg: '#fffbeb', icon: '⭐' },
          { label: 'On Sale',        value: stats.onSale,   color: '#dc2626', bg: '#fef2f2', icon: '🏷️' },
        ].map(s => (
          <div key={s.label} style={{
            background: s.bg, borderRadius: 14, padding: '16px 20px',
            border: `1px solid ${s.color}22`, display: 'flex', alignItems: 'center', gap: 14
          }}>
            <span style={{ fontSize: 28 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: 24, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{
        background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb',
        padding: '16px 20px', marginBottom: 24,
        display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products…"
            style={{
              width: '100%', padding: '9px 12px 9px 36px',
              border: '1.5px solid #e5e7eb', borderRadius: 10,
              fontSize: 13, fontWeight: 500, color: '#111827',
              outline: 'none', background: '#f9fafb', boxSizing: 'border-box'
            }}
            onFocus={e => { e.target.style.borderColor = '#e8fb1d'; e.target.style.background = '#fff'; }}
            onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; }}
          />
        </div>

        {/* Category filter */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', width: '100%' }}>
          <SlidersHorizontal size={15} style={{ color: '#9ca3af', alignSelf: 'center' }} />
          <span style={{ fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', alignSelf: 'center' }}>Category:</span>
          {['All', 'Featured', ...Object.keys(CATEGORY_STYLES)].map(cat => {
            const s = cat === 'All' ? null : CATEGORY_STYLES[cat];
            const active = filterCat === cat;
            return (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                style={{
                  padding: '6px 14px', borderRadius: 99, border: '1.5px solid',
                  fontSize: 11, fontWeight: 800, cursor: 'pointer',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  transition: 'all 0.15s',
                  background: active ? (s ? s.bg : '#111827') : '#f3f4f6',
                  borderColor: active ? (s ? s.border : '#111827') : '#e5e7eb',
                  color: active ? (s ? s.text : '#fff') : '#6b7280',
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Brand filter */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', width: '100%', borderTop: '1px solid #f3f4f6', paddingTop: 12 }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', alignSelf: 'center', marginRight: 2 }}>Brand:</span>
          {brandSet.map(brand => (
            <button
              key={brand}
              onClick={() => setFilterBrand(brand)}
              style={{
                padding: '5px 12px', borderRadius: 99, border: '1.5px solid',
                fontSize: 11, fontWeight: 800, cursor: 'pointer',
                letterSpacing: '0.05em', transition: 'all 0.15s',
                background: filterBrand === brand ? '#10b981' : '#f3f4f6',
                borderColor: filterBrand === brand ? '#059669' : '#e5e7eb',
                color: filterBrand === brand ? '#fff' : '#6b7280',
              }}
            >
              {brand}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div style={{ position: 'relative', marginLeft: 'auto' }}>
          <ArrowUpDown size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <select
            value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={{
              padding: '9px 12px 9px 30px', borderRadius: 10,
              border: '1.5px solid #e5e7eb', fontSize: 12, fontWeight: 600,
              color: '#374151', background: '#f9fafb', outline: 'none', cursor: 'pointer'
            }}
          >
            <option value="newest">Newest First</option>
            <option value="price-asc">Price: Low → High</option>
            <option value="price-desc">Price: High → Low</option>
            <option value="name">A → Z</option>
          </select>
        </div>
      </div>

      {/* Grid or Empty */}
      {filtered.length === 0 ? (
        <div style={{
          background: '#fff', borderRadius: 18, border: '1px solid #e5e7eb',
          padding: '64px 32px', textAlign: 'center'
        }}>
          <Package size={56} style={{ color: '#d1d5db', margin: '0 auto 16px' }} />
          <p style={{ color: '#6b7280', fontWeight: 600, fontSize: 16, margin: '0 0 20px' }}>
            {search || filterCat !== 'All' ? 'No products match your filters.' : 'No products found. Add some to get started!'}
          </p>
          {!search && filterCat === 'All' && (
            <Link
              to="/admin/new"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#e8fb1d',
                color: '#171717', textDecoration: 'none',
                fontSize: 13, fontWeight: 800, padding: '12px 24px', borderRadius: 12,
                letterSpacing: '0.06em', textTransform: 'uppercase'
              }}
            >
              <PlusCircle size={18} /> Add First Product
            </Link>
          )}
        </div>
      ) : (
        <>
          <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16, fontWeight: 600 }}>
            Showing {filtered.length} of {products.length} products
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 20
          }}>
       {filtered.map(product => (
         <ProductCard key={product.id} product={product} onDelete={handleDelete} onFeaturedToggle={handleFeaturedToggle} onHiddenToggle={handleHiddenToggle} />
       ))}
          </div>
        </>
      )}
    </div>
  );
}
