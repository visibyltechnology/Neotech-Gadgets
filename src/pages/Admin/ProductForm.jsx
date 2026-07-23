import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import {
  ArrowLeft, Save, Image as ImageIcon, AlertCircle,
  Tag, Ruler, DollarSign, Star, Upload, X, CheckCircle2, Sparkles, Infinity
} from 'lucide-react';
import { uploadImage } from '../../utils/uploadImage';
import { listenToCategories, DEFAULT_CATEGORIES, CATEGORY_STYLES } from '../../utils/categoryService';
import { listenToBrands, DEFAULT_BRANDS } from '../../utils/brandService';
import toast from 'react-hot-toast';



export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    length: '18"',
    brand: '',
    description: '',
    price: '',
    pss: '',
    tag: '',
    featured: false,
    featuredPosition: '',
    img: '',
    items_left: 0,
    unlimited_stock: false,
    inventory_status: 'in_stock',
    is_hidden: false
  });
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [productImages, setProductImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [showFeaturedModal, setShowFeaturedModal] = useState(false);
  const [positionInput, setPositionInput] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Load categories dynamically from Firestore
  useEffect(() => {
    const unsub = listenToCategories((cats) => {
      const list = cats.length > 0 ? cats : DEFAULT_CATEGORIES;
      setCategories(list);
      // Set default category to first non-All option if not editing
      if (!isEditing && !formData.category) {
        const first = list.find(c => c.name !== 'All');
        if (first) setFormData(prev => ({ ...prev, category: first.name }));
      }
    });
    return () => unsub();
  }, [isEditing]);

  // Load brands dynamically from Firestore
  useEffect(() => {
    const unsub = listenToBrands((brandList) => {
      setBrands(brandList.length > 0 ? brandList : DEFAULT_BRANDS);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (isEditing) {
      const fetchProduct = async () => {
        try {
          const docRef = doc(db, 'products', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setFormData(data);
            if (data.images && data.images.length > 0) {
              setProductImages(data.images.map(url => ({ file: null, url, isExisting: true })));
            } else if (data.img) {
              setProductImages([{ file: null, url: data.img, isExisting: true }]);
            }
            if (data.featured) {
              setPositionInput(data.featuredPosition || '');
            }
          } else {
            setError('Product not found');
          }
        } catch {
          setError('Failed to load product');
        }
      };
      fetchProduct();
    }
  }, [id, isEditing]);

  // Fetch featured products list
  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const q = query(collection(db, "products"), where("featured", "==", true));
        const snap = await getDocs(q);
        const featured = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.featuredPosition || 999) - (b.featuredPosition || 999));
        setFeaturedProducts(featured);
      } catch (err) {
        console.error('Error fetching featured products:', err);
      }
    };
    fetchFeatured();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const processFiles = (files) => {
    if (!files || files.length === 0) return;
    const newFiles = Array.from(files);
    
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
         setProductImages(prev => [...prev, { file, url: reader.result, isExisting: false }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = (e) => processFiles(e.target.files);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    processFiles(e.dataTransfer.files);
  };

  const clearImage = (index) => {
    setProductImages(prev => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Confirmation dialog
    const confirmMsg = isEditing 
      ? `Are you sure you want to update "${formData.name}"?` 
      : `Add "${formData.name}" to products?`;
    
    if (!window.confirm(confirmMsg)) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      let imageUrls = [];
      const existingUrls = productImages.filter(p => p.isExisting).map(p => p.url);
      imageUrls.push(...existingUrls);

      const newImages = productImages.filter(p => !p.isExisting);
      for (const img of newImages) {
        const url = await uploadImage(img.file);
        if (url) imageUrls.push(url);
      }

      if (imageUrls.length === 0) throw new Error('At least one product image is required');

      const payload = {
        ...formData,
        price: Number(formData.price),
        pss: Number(formData.pss || 0),
        brand: formData.brand || '',
        description: formData.description || '',
        tag: formData.tag || '',
        img: imageUrls[0] || '',
        images: imageUrls,
        featured: formData.featured,
        featuredPosition: formData.featured ? Number(positionInput) || 0 : '',
        items_left: Number(formData.items_left || 0),
        unlimited_stock: formData.unlimited_stock || false,
        inventory_status: formData.unlimited_stock ? 'in_stock' : (Number(formData.items_left || 0) === 0 ? 'out_of_stock' : (formData.inventory_status || 'in_stock')),
        is_hidden: Boolean(formData.is_hidden),
        updatedAt: new Date()
      };

      if (isEditing) {
        await updateDoc(doc(db, 'products', id), payload);
        toast.success('Product updated successfully!');
      } else {
        const newRef = doc(collection(db, 'products'));
        payload.createdAt = new Date();
        await setDoc(newRef, payload);
        toast.success('Product created successfully!');
      }
      navigate('/admin');
    } catch (err) {
      if (err.message?.toLowerCase().includes('offline')) {
        setError('Please check your internet connection and try again.');
      } else {
        setError(err.message || 'Failed to save product. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFeaturedToggle = () => {
    if (!formData.featured) {
      // Toggling ON - show modal for position
      setPositionInput(formData.featuredPosition || String(featuredProducts.length + 1));
      setShowFeaturedModal(true);
    } else {
      // Toggling OFF - just disable it
      setFormData(prev => ({ ...prev, featured: false, featuredPosition: '' }));
    }
  };

  const handleSetFeaturedPosition = () => {
    if (!positionInput || isNaN(positionInput)) {
      alert('Please enter a valid position number');
      return;
    }
    setFormData(prev => ({ 
      ...prev, 
      featured: true, 
      featuredPosition: positionInput 
    }));
    setShowFeaturedModal(false);
  };

  const catStyle = CATEGORY_STYLES[formData.category] || { bg: 'rgba(107,114,128,0.08)', text: '#6b7280', border: 'rgba(107,114,128,0.25)' };
  // Map CATEGORY_STYLES to the rgb-alpha format used in the form
  const catColor = {
    bg: catStyle.bg,
    text: catStyle.text,
    border: catStyle.border,
  };
  const hasDiscount = formData.pss && formData.price && Number(formData.pss) < Number(formData.price);
  const discountPct = hasDiscount
    ? Math.round(100 - (Number(formData.pss) / Number(formData.price)) * 100)
    : 0;

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      {/* Back link */}
      <Link
        to="/admin"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          fontSize: 12, fontWeight: 700, color: '#6b7280',
          textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.1em',
          marginBottom: 24, transition: 'color 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#dc2626'}
        onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}
      >
        <ArrowLeft size={15} /> Back to Products
      </Link>

      {/* Card */}
      <div style={{
        background: 'linear-gradient(135deg,#fff 0%,#f8f7ff 100%)',
        borderRadius: 20, border: '1px solid #e5e7eb',
        boxShadow: '0 8px 40px rgba(0,0,0,0.07)',
        overflow: 'hidden'
      }}>

        {/* Header banner */}
        <div style={{
          background: '#171717',
          padding: '28px 36px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 16
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <Sparkles size={18} color="#f59e0b" />
              <span style={{ color: '#f59e0b', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                Product Management
              </span>
            </div>
            <h1 style={{ margin: 0, color: '#fff', fontSize: 26, fontWeight: 900, letterSpacing: '-0.02em' }}>
              {isEditing ? '✏️ Edit Product' : '✨ Add New Product'}
            </h1>
          </div>
          {productImages.length > 0 && (
            <div style={{ display: 'flex', gap: 8 }}>
              {productImages.slice(0, 3).map((img, i) => (
                <div key={i} style={{
                  width: 64, height: 64, borderRadius: 12,
                  border: '2px solid rgba(255,255,255,0.2)',
                  overflow: 'hidden', background: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <img src={img.url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
              {productImages.length > 3 && (
                <div style={{
                  width: 64, height: 64, borderRadius: 12,
                  border: '2px solid rgba(255,255,255,0.2)',
                  overflow: 'hidden', background: 'rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 800, flexShrink: 0
                }}>
                  +{productImages.length - 3}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Form body */}
        <div style={{ padding: '36px' }}>
          {error && (
            <div style={{
              background: 'linear-gradient(135deg,#fef2f2,#fee2e2)',
              border: '1px solid #fca5a5', borderRadius: 12,
              padding: '14px 18px', marginBottom: 24,
              display: 'flex', alignItems: 'center', gap: 10,
              color: '#dc2626', fontWeight: 600, fontSize: 14
            }}>
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Product Name */}
            <FieldGroup label="Product Name" icon={<Tag size={14} />} accent="#e8fb1d">
              <input
                type="text" name="name" value={formData.name}
                onChange={handleChange} required
                placeholder="e.g. Samsung 65 inch 4K Smart TV"
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = '#e8fb1d'; e.target.style.boxShadow = '0 0 0 3px rgba(232,251,29,0.12)'; }}
                onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
              />
            </FieldGroup>

            {/* Category + Length + Tag */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <FieldGroup label="Category" icon={<Tag size={14} />} accent={catColor.text}>
                <div style={{ position: 'relative' }}>
                  <select
                    name="category" value={formData.category} onChange={handleChange}
                    style={{
                      ...inputStyle,
                      paddingLeft: 16, cursor: 'pointer',
                      background: catColor.bg,
                      borderColor: catColor.border,
                      color: catColor.text, fontWeight: 700,
                      appearance: 'none'
                    }}
                    onFocus={e => { e.target.style.boxShadow = `0 0 0 3px ${catColor.bg}`; }}
                    onBlur={e => { e.target.style.boxShadow = 'none'; }}
                  >
                    {categories
                      .filter(c => c.name !== 'All')
                      .map(c => <option key={c.id || c.name} value={c.name}>{c.name}</option>)}
                  </select>
                  <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: catColor.text }}>▾</div>
                </div>
              </FieldGroup>

              <FieldGroup label='Model/Specifications' icon={<Ruler size={14} />} accent="#059669">
                <input
                  type="text" name="length" value={formData.length}
                  onChange={handleChange} required placeholder='e.g. 18"'
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = '#059669'; e.target.style.boxShadow = '0 0 0 3px rgba(5,150,105,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
                />
              </FieldGroup>

              <FieldGroup label="Product Tag" icon={<Sparkles size={14} />} accent="#ec4899">
                <div style={{ position: 'relative' }}>
                  <select
                    name="tag" value={formData.tag || ''} onChange={handleChange}
                    style={{
                      ...inputStyle,
                      paddingLeft: 16, cursor: 'pointer',
                      appearance: 'none'
                    }}
                    onFocus={e => { e.target.style.borderColor = '#ec4899'; e.target.style.boxShadow = '0 0 0 3px rgba(236,72,153,0.12)'; }}
                    onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
                  >
                    <option value="">None</option>
                    <option value="Top Seller">Top Seller</option>
                    <option value="Official Warranty">Official Warranty</option>
                    <option value="Fast Moving">Fast Moving</option>
                    <option value="Best Deal">Best Deal</option>
                    <option value="Premium">Premium</option>
                    <option value="Budget Pick">Budget Pick</option>
                    <option value="Hot Sale">Hot Sale</option>
                    <option value="Clearance">Clearance</option>
                  </select>
                  <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6b7280' }}>▾</div>
                </div>
              </FieldGroup>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
              <FieldGroup label="Brand" icon={<Tag size={14} />} accent="#10b981">
                <div style={{ position: 'relative' }}>
                  <input
                    type="text" name="brand" value={formData.brand || ''}
                    onChange={handleChange}
                    list="brand-list"
                    placeholder="Select or type a brand…"
                    style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = '#10b981'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.12)'; }}
                    onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
                  />
                  <datalist id="brand-list">
                    {brands.map(b => <option key={b.id || b.name} value={b.name} />)}
                  </datalist>
                  {formData.brand && !brands.some(b => b.name === formData.brand) && (
                    <span style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: '#f59e0b', color: '#fff',
                      fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 99, letterSpacing: '0.06em'
                    }}>CUSTOM</span>
                  )}
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 11, color: '#9ca3af' }}>
                  Choose from the list or type a custom brand name
                </p>
              </FieldGroup>

              <FieldGroup label="Product Description / Features" icon={<Sparkles size={14} />} accent="#8b5cf6">
                <textarea
                  name="description" value={formData.description || ''}
                  onChange={handleChange} placeholder="Enter features separated by lines (e.g. Screen Size: 65 Inches)"
                  style={{...inputStyle, minHeight: '120px', resize: 'vertical'}}
                  onFocus={e => { e.target.style.borderColor = '#8b5cf6'; e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
                />
              </FieldGroup>
            </div>

            {/* Prices */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <FieldGroup label="Full Price (₦)" icon={<DollarSign size={14} />} accent="#1d4ed8">
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#6b7280', fontWeight: 700, fontSize: 14 }}>₦</span>
                  <input
                    type="number" name="price" value={formData.price}
                    onChange={handleChange} required placeholder="150000"
                    style={{ ...inputStyle, paddingLeft: 34 }}
                    onFocus={e => { e.target.style.borderColor = '#1d4ed8'; e.target.style.boxShadow = '0 0 0 3px rgba(29,78,216,0.12)'; }}
                    onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              </FieldGroup>

              <FieldGroup label="Sale Price (₦)" icon={<DollarSign size={14} />} accent="#dc2626">
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#6b7280', fontWeight: 700, fontSize: 14 }}>₦</span>
                  <input
                    type="number" name="pss" value={formData.pss}
                    onChange={handleChange} placeholder="Optional discount price"
                    style={{ ...inputStyle, paddingLeft: 34 }}
                    onFocus={e => { e.target.style.borderColor = '#dc2626'; e.target.style.boxShadow = '0 0 0 3px rgba(220,38,38,0.12)'; }}
                    onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
                  />
                  {hasDiscount && (
                    <span style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'linear-gradient(135deg,#dc2626,#ef4444)',
                      color: '#fff', fontSize: 10, fontWeight: 800,
                      padding: '2px 7px', borderRadius: 99, letterSpacing: '0.05em'
                    }}>
                      -{discountPct}% OFF
                    </span>
                  )}
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 11, color: '#9ca3af' }}>Leave empty if no sale</p>
              </FieldGroup>
            </div>

            {/* Inventory & Visibility */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <FieldGroup label="Items Left" icon={<Tag size={14} />} accent="#059669">
                <input
                  type="number" name="items_left" value={formData.items_left}
                  onChange={handleChange} required min="0" disabled={formData.unlimited_stock}
                  style={{...inputStyle, opacity: formData.unlimited_stock ? 0.6 : 1}}
                  onFocus={e => { e.target.style.borderColor = '#059669'; e.target.style.boxShadow = '0 0 0 3px rgba(5,150,105,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
                />
              </FieldGroup>
              <FieldGroup label="Unlimited Stock" icon={<Infinity size={14} />} accent="#059669">
                <div style={{ display: 'flex', alignItems: 'center', height: '42px', paddingLeft: 10, background: formData.unlimited_stock ? '#ecfdf5' : '#fff', border: `1px solid ${formData.unlimited_stock ? '#a7f3d0' : '#e5e7eb'}`, borderRadius: 10 }}>
                  <input
                    type="checkbox" name="unlimited_stock" checked={formData.unlimited_stock}
                    onChange={handleChange}
                    style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#059669' }}
                  />
                  <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 600, color: formData.unlimited_stock ? '#059669' : '#9ca3af' }}>Unlimited</span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 11, color: '#9ca3af' }}>Never runs out of stock</p>
              </FieldGroup>
              <FieldGroup label="Inventory Status" icon={<CheckCircle2 size={14} />} accent="#059669">
                <div style={{
                  display: 'flex', alignItems: 'center', height: '42px', paddingLeft: 12,
                  background: (formData.unlimited_stock || Number(formData.items_left || 0) > 0) ? '#ecfdf5' : '#fef2f2',
                  border: `1px solid ${(formData.unlimited_stock || Number(formData.items_left || 0) > 0) ? '#a7f3d0' : '#fca5a5'}`,
                  borderRadius: 10, fontWeight: 600, fontSize: 13,
                  color: (formData.unlimited_stock || Number(formData.items_left || 0) > 0) ? '#059669' : '#dc2626'
                }}>
                  <i className={`fas ${(formData.unlimited_stock || Number(formData.items_left || 0) > 0) ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2`}></i>
                  {formData.unlimited_stock || Number(formData.items_left || 0) > 0 ? 'In Stock' : 'Out of Stock'}
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 11, color: '#9ca3af' }}>
                  {formData.unlimited_stock ? 'Unlimited' : (Number(formData.items_left || 0) > 0 ? `${formData.items_left} available` : 'Out of stock')}
                </p>
              </FieldGroup>
              <FieldGroup label="Hidden from Shop" icon={<AlertCircle size={14} />} accent="#dc2626">
                <div style={{ display: 'flex', alignItems: 'center', height: '42px', paddingLeft: 10, background: formData.is_hidden ? '#fef2f2' : '#fff', border: `1px solid ${formData.is_hidden ? '#fca5a5' : '#e5e7eb'}`, borderRadius: 10 }}>
                  <input
                    type="checkbox" name="is_hidden" checked={formData.is_hidden}
                    onChange={handleChange}
                    style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#dc2626' }}
                  />
                  <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 600, color: formData.is_hidden ? '#dc2626' : '#374151' }}>Hide Product</span>
                </div>
              </FieldGroup>
            </div>

            {/* Image Upload */}
            <FieldGroup label={`Product Images (${productImages.length})`} icon={<ImageIcon size={14} />} accent="#f59e0b">
              <div
                onDrop={handleDrop}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? '#f59e0b' : '#d1d5db'}`,
                  borderRadius: 14,
                  padding: 40,
                  background: dragOver ? 'rgba(245,158,11,0.06)' : '#fafafa',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 16,
                  position: 'relative'
                }}
              >
                <div style={{
                  width: 56, height: 56, borderRadius: 12,
                  background: 'linear-gradient(135deg,#fef3c7,#fde68a)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Upload size={24} color="#f59e0b" />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#374151' }}>
                    Drop images here or <span style={{ color: '#f59e0b', textDecoration: 'underline' }}>browse</span>
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#9ca3af' }}>Upload multiple PNG, JPG, WEBP up to 10MB each</p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file" accept="image/*" multiple
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />

              {productImages.length > 0 && (
                <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '12px 0' }}>
                  {productImages.map((img, idx) => (
                    <div key={idx} style={{ position: 'relative', width: 80, height: 80, borderRadius: 8, overflow: 'hidden', border: '2px solid #e5e7eb', flexShrink: 0 }}>
                      <img src={img.url} alt={`Preview ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); clearImage(idx); }}
                        style={{
                          position: 'absolute', top: 4, right: 4,
                          width: 20, height: 20, borderRadius: 99,
                          background: '#dc2626', color: '#fff', border: 'none',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                      >
                        <X size={10} />
                      </button>
                      {idx === 0 && (
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#f59e0b', color: '#fff', fontSize: 9, fontWeight: 800, textAlign: 'center', padding: 2 }}>MAIN</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </FieldGroup>

            {/* Featured toggle */}
            <div
              onClick={handleFeaturedToggle}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '16px 20px', borderRadius: 14, cursor: 'pointer',
                border: `2px solid ${formData.featured ? 'rgba(245,158,11,0.4)' : '#e5e7eb'}`,
                background: formData.featured
                  ? 'linear-gradient(135deg,rgba(245,158,11,0.08),rgba(251,191,36,0.06))'
                  : '#f9fafb',
                transition: 'all 0.25s', userSelect: 'none'
              }}
            >
              <div style={{
                width: 48, height: 26, borderRadius: 99,
                background: formData.featured ? 'linear-gradient(135deg,#f59e0b,#fbbf24)' : '#d1d5db',
                position: 'relative', transition: 'all 0.25s', flexShrink: 0,
                boxShadow: formData.featured ? '0 2px 8px rgba(245,158,11,0.4)' : 'none'
              }}>
                <div style={{
                  position: 'absolute', top: 3, left: formData.featured ? 25 : 3,
                  width: 20, height: 20, borderRadius: 99, background: '#fff',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.25s'
                }} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14, color: '#111827' }}>
                  <Star size={16} color={formData.featured ? '#f59e0b' : '#9ca3af'} fill={formData.featured ? '#f59e0b' : 'none'} />
                  Feature on Homepage
                </div>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280' }}>
                  This product will appear in the featured section
                </p>
              </div>
              {formData.featured && (
                <span style={{
                  marginLeft: 'auto', background: 'linear-gradient(135deg,#f59e0b,#fbbf24)',
                  color: '#fff', fontSize: 10, fontWeight: 800,
                  padding: '3px 10px', borderRadius: 99, letterSpacing: '0.08em'
                }}>
                  FEATURED
                </span>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              style={{
                width: '100%', padding: '16px',
                background: loading
                  ? '#9ca3af'
                  : '#1E1E1E',
                color: '#e8fb1d', border: 'none', borderRadius: 14,
                fontSize: 14, fontWeight: 800, letterSpacing: '0.08em',
                textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                boxShadow: loading ? 'none' : '0 8px 24px rgba(232,251,29,0.35)',
                transition: 'all 0.2s',
                marginTop: 8
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(232,251,29,0.45)'; } }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(232,251,29,0.35)'; }}
            >
              {loading ? (
                <><i className="fas fa-circle-notch fa-spin" /> Saving...</>
              ) : (
                <><CheckCircle2 size={18} /> {isEditing ? 'Update Product' : 'Save Product'}</>
              )}
            </button>

            {/* Currently Featured Products */}
            {formData.featured && featuredProducts.length > 0 && (
              <div style={{
                background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: 12,
                padding: '14px 16px',
                fontSize: 12,
                color: '#92400e'
              }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Currently Featured Products:</div>
                {featuredProducts.map((p, i) => (
                  <div key={p.id} style={{ fontSize: 11, marginBottom: 4 }}>
                    #{p.featuredPosition || (i+1)} - {p.name}
                  </div>
                ))}
              </div>
            )}
          </form>

          {/* Featured Position Modal */}
          {showFeaturedModal && (
            <div style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1000
            }}>
              <div style={{
                background: '#fff', borderRadius: 16,
                padding: '28px', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
              }}>
                <h2 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 800, color: '#1a1a2e' }}>
                  Set Featured Position
                </h2>
                <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6b7280' }}>
                  Enter the position (1-12) where this product should appear in the featured section.
                  {featuredProducts.length > 0 && (
                    <> Currently {featuredProducts.length} products are featured.</>
                  )}
                </p>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={positionInput}
                  onChange={(e) => setPositionInput(e.target.value)}
                  style={{
                    width: '100%', padding: '12px', border: '1px solid #e5e7eb',
                    borderRadius: 8, fontSize: 14, marginBottom: 16,
                    boxSizing: 'border-box'
                  }}
                  placeholder="Position (1-12)"
                  autoFocus
                />
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={() => setShowFeaturedModal(false)}
                    style={{
                      flex: 1, padding: '12px', background: '#f3f4f6',
                      border: 'none', borderRadius: 8, cursor: 'pointer',
                      fontWeight: 700, color: '#374151', transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#e5e7eb'}
                    onMouseLeave={e => e.currentTarget.style.background = '#f3f4f6'}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSetFeaturedPosition}
                    style={{
                      flex: 1, padding: '12px',
                      background: 'linear-gradient(135deg,#f59e0b,#fbbf24)',
                      border: 'none', borderRadius: 8, cursor: 'pointer',
                      fontWeight: 700, color: '#fff', transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    Set Position
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FieldGroup({ label, icon, accent, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{
        display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
        letterSpacing: '0.12em', color: accent || '#374151'
      }}>
        {icon} {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%',
  background: '#fff',
  border: '1.5px solid #e5e7eb',
  borderRadius: 10,
  padding: '12px 16px',
  fontSize: 14,
  fontWeight: 500,
  color: '#111827',
  outline: 'none',
  transition: 'all 0.2s',
  boxSizing: 'border-box',
};
