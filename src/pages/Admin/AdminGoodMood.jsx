import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, collection, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Save, Trash2, Flame, Search, Plus, X, Package, ExternalLink } from 'lucide-react';

export default function AdminGoodMood() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Good Mood Deals end time (ISO string stored in Firestore)
    const [goodMoodDealsEnd, setGoodMoodDealsEnd] = useState('');

    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Timer settings
                const docRef = doc(db, 'settings', 'site_settings');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.goodMoodDealsEnd) setGoodMoodDealsEnd(data.goodMoodDealsEnd);
                }

                // Fetch Products
                const pSnap = await getDocs(collection(db, 'products'));
                setProducts(pSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (error) {
                console.error("Error loading data:", error);
                toast.error("Failed to load settings or products.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, 'settings', 'site_settings'), {
                goodMoodDealsEnd: goodMoodDealsEnd || ''
            }, { merge: true });
            toast.success("Good Mood Deals settings saved successfully!");
        } catch (error) {
            console.error("Error saving settings:", error);
            toast.error("Failed to save settings.");
        } finally {
            setSaving(false);
        }
    };

    const toggleProductFolder = async (productId, add) => {
        try {
            const folderVal = add ? 'Good Mood Deals' : '';
            await updateDoc(doc(db, 'products', productId), { folder: folderVal });
            setProducts(prev => prev.map(p => p.id === productId ? { ...p, folder: folderVal } : p));
            toast.success(add ? "Added to Good Mood Deals" : "Removed from Good Mood Deals");
        } catch (err) {
            console.error("Error updating product folder:", err);
            toast.error("Failed to update product folder.");
        }
    };

    const updateDiscountPrice = async (productId, newPrice) => {
        try {
            const numericPrice = newPrice === '' ? '' : Number(newPrice);
            await updateDoc(doc(db, 'products', productId), { pss: numericPrice });
            toast.success("Discount price saved!");
        } catch (err) {
            console.error("Error updating discount price:", err);
            toast.error("Failed to save discount price.");
        }
    };

    const handleDeleteDealProduct = async (productId) => {
        if (!confirm('Delete this deal-only product permanently?')) return;
        try {
            await deleteDoc(doc(db, 'products', productId));
            setProducts(prev => prev.filter(p => p.id !== productId));
            toast.success('Product deleted.');
        } catch (err) {
            toast.error('Failed to delete product.');
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <i className="fas fa-circle-notch fa-spin text-4xl mb-4 text-brandLime"></i>
            <h2 className="text-xl font-bold font-display uppercase tracking-widest text-gray-500">Loading...</h2>
        </div>
    );

    const goodMoodProducts = products.filter(p => p.folder === 'Good Mood Deals');
    const searchResults = searchTerm 
        ? products.filter(p => 
            p.folder !== 'Good Mood Deals' && 
            p.name?.toLowerCase().includes(searchTerm.toLowerCase())
          ).slice(0, 15)
        : products.filter(p => p.folder !== 'Good Mood Deals').slice(0, 15);

    return (
        <div className="max-w-6xl mx-auto pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-black font-display uppercase tracking-wider text-gray-900 flex items-center gap-3">
                        <Flame className="text-amber-500" /> Good Mood Deals
                    </h1>
                    <p className="text-gray-500 text-sm font-medium mt-1">Manage the countdown timer and select products for the Flash Deals section.</p>
                </div>
                <button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="bg-brandDark hover:bg-brandBlack text-brandLime font-black py-3 px-6 rounded-xl text-sm uppercase tracking-widest transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                    {saving ? (
                        <><i className="fas fa-circle-notch fa-spin"></i> Saving...</>
                    ) : (
                        <><Save size={18} /> Save Timer</>
                    )}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Timer Section */}
                <div className="bg-white p-8 rounded-sm shadow-sm border border-amber-200 self-start">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-8 border-b border-gray-100 pb-6">
                        <span className="text-4xl">🔥</span>
                        <div>
                            <h3 className="text-lg font-black text-gray-800 uppercase tracking-widest">Countdown Timer</h3>
                            <p className="text-sm text-gray-500 font-medium mt-1">Set the exact date and time when the flash deals will expire. The homepage banner will automatically count down to this moment.</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-col gap-4">
                        <div className="flex-1 w-full">
                            <label className="block text-sm font-bold text-gray-700 uppercase tracking-widest mb-3">Deal End Date & Time</label>
                            <input
                                type="datetime-local"
                                value={goodMoodDealsEnd}
                                onChange={e => setGoodMoodDealsEnd(e.target.value)}
                                min={new Date().toISOString().slice(0, 16)}
                                className="w-full border-2 border-gray-200 rounded-sm px-4 py-4 text-base font-medium text-gray-800 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-200 transition-all"
                            />
                        </div>
                        {goodMoodDealsEnd && (
                            <div className="bg-amber-50 border-2 border-amber-200 rounded-sm px-6 py-4 text-sm font-bold text-amber-700 flex-shrink-0">
                                ⏱ Ends: {new Date(goodMoodDealsEnd).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}
                            </div>
                        )}
                        {goodMoodDealsEnd && (
                            <button
                                onClick={() => setGoodMoodDealsEnd('')}
                                className="text-sm font-bold text-red-500 hover:text-red-700 uppercase tracking-wider flex-shrink-0 flex items-center justify-center gap-2 h-12 px-4 hover:bg-red-50 rounded-sm transition-colors mt-2 border border-red-100"
                            >
                                <Trash2 size={16} /> Clear Timer
                            </button>
                        )}
                    </div>
                </div>

                {/* Product Selection Section */}
                <div className="bg-white p-8 rounded-sm shadow-sm border border-blue-200 self-start">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6 border-b border-gray-100 pb-6">
                        <span className="text-4xl">🏷️</span>
                        <div>
                            <h3 className="text-lg font-black text-gray-800 uppercase tracking-widest">Products in Deals Folder</h3>
                            <p className="text-sm text-gray-500 font-medium mt-1">Search and add products to the Good Mood Deals folder.</p>
                        </div>
                    </div>

                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search existing products to add or click to view all..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setTimeout(() => setIsSearchFocused(false), 150)}
                            className="w-full border-2 border-gray-200 rounded-sm pl-10 pr-4 py-3 text-sm font-medium text-gray-800 focus:outline-none focus:border-blue-400 transition-all"
                        />
                        {isSearchFocused && searchResults.length > 0 && (
                            <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border-2 border-gray-100 rounded-sm shadow-xl max-h-60 overflow-y-auto">
                                {searchResults.map(p => (
                                    <div key={p.id} className="flex items-center justify-between p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            {p.images?.[0] ? (
                                                <img src={p.images[0]} alt="" className="w-10 h-10 object-cover rounded-md border border-gray-200" />
                                            ) : (
                                                <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center border border-gray-200"><Package size={16} className="text-gray-400" /></div>
                                            )}
                                            <div>
                                                <p className="text-sm font-bold text-gray-800 line-clamp-1">{p.name}</p>
                                                <p className="text-xs font-medium text-gray-500">₦{p.price?.toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onMouseDown={(e) => {
                                                e.preventDefault(); // Prevent input blur
                                                toggleProductFolder(p.id, true);
                                                setSearchTerm('');
                                                setIsSearchFocused(false);
                                            }}
                                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors flex-shrink-0"
                                            title="Add to Good Mood Deals"
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                                Current Deals ({goodMoodProducts.length})
                            </h4>
                            <Link
                                to="/admin/new?goodMoodDeal=true"
                                className="flex items-center gap-1.5 text-xs font-black text-white bg-purple-600 hover:bg-purple-700 px-3 py-1.5 rounded-full uppercase tracking-wider transition-colors"
                            >
                                <ExternalLink size={13} /> Add Deal-Only Product
                            </Link>
                        </div>

                        {goodMoodProducts.length === 0 ? (
                            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-sm p-6 text-center text-sm font-bold text-gray-400">
                                No products are currently in the Good Mood Deals folder.
                            </div>
                        ) : (
                            <div className="max-h-[500px] overflow-y-auto pr-2 space-y-3">
                                {goodMoodProducts.map(p => (
                                    <div key={p.id} className={`flex flex-col gap-3 p-4 border rounded-sm ${p.dealOnly ? 'border-purple-100 bg-purple-50/30' : 'border-blue-100 bg-blue-50/30'}`}>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                {p.images?.[0] ? (
                                                    <img src={p.images[0]} alt="" className="w-12 h-12 object-cover rounded-md border border-gray-200" />
                                                ) : (
                                                    <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center border border-gray-200"><Package size={18} className="text-gray-400" /></div>
                                                )}
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-bold text-gray-800 line-clamp-1">{p.name}</p>
                                                        {p.dealOnly && (
                                                            <span className="text-[10px] font-black bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0">Deal Only</span>
                                                        )}
                                                    </div>
                                                    <p className={`text-xs font-medium mt-0.5 ${p.pss ? 'text-gray-400 line-through' : 'text-gray-600'}`}>
                                                        Original: ₦{p.price?.toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                            {p.dealOnly ? (
                                                <button 
                                                    onClick={() => handleDeleteDealProduct(p.id)}
                                                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors flex-shrink-0"
                                                    title="Delete deal-only product permanently"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => toggleProductFolder(p.id, false)}
                                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                                                    title="Remove from Good Mood Deals"
                                                >
                                                    <X size={16} />
                                                </button>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-center justify-between bg-white p-2 rounded-sm border border-gray-200">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Discount Price (₦)</label>
                                            <input 
                                                type="number" 
                                                placeholder="e.g. 50000" 
                                                value={p.pss || ''}
                                                onChange={(e) => {
                                                    setProducts(prev => prev.map(prod => prod.id === p.id ? { ...prod, pss: e.target.value } : prod));
                                                }}
                                                onBlur={(e) => updateDiscountPrice(p.id, e.target.value)}
                                                className="border-2 border-amber-100 bg-amber-50 rounded-sm px-3 py-1.5 text-sm font-black text-amber-700 w-32 focus:outline-none focus:border-amber-400 text-right"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
