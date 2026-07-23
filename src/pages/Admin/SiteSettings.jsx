import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import toast from 'react-hot-toast';
import { Save, Plus, Trash2, Settings as SettingsIcon, LayoutTemplate, MessageSquare } from 'lucide-react';

export default function SiteSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [tickerMessages, setTickerMessages] = useState([
        "⚡ Best Deals on Electronics & Home Appliances — Limited Offers, Shop Now!",
        "🚚 Enjoy Fast Delivery Across Lagos — Free Shipping on Orders From ₦999,999.99!"
    ]);

    const [heroSlides, setHeroSlides] = useState([
        {
            title: "Upgrade Your Living Space",
            subtitle: "Premium Air Conditioners, Televisions, and Home Appliances from world-class brands.",
            buttonText: "Shop Appliances",
            link: "/products",
            image: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&w=1920&q=80"
        }
    ]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const docRef = doc(db, 'settings', 'site_settings');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.tickerMessages) setTickerMessages(data.tickerMessages);
                    if (data.heroSlides) setHeroSlides(data.heroSlides);
                }
            } catch (error) {
                console.error("Error loading settings:", error);
                toast.error("Failed to load settings.");
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, 'settings', 'site_settings'), {
                tickerMessages,
                heroSlides
            }, { merge: true });
            toast.success("Settings saved successfully!");
        } catch (error) {
            console.error("Error saving settings:", error);
            toast.error("Failed to save settings.");
        } finally {
            setSaving(false);
        }
    };

    // Ticker Handlers
    const addTicker = () => setTickerMessages([...tickerMessages, ""]);
    const updateTicker = (idx, val) => {
        const newArr = [...tickerMessages];
        newArr[idx] = val;
        setTickerMessages(newArr);
    };
    const removeTicker = (idx) => setTickerMessages(tickerMessages.filter((_, i) => i !== idx));

    // Slide Handlers
    const addSlide = () => {
        if (heroSlides.length >= 7) {
            toast.error("Maximum of 7 slides allowed.");
            return;
        }
        setHeroSlides([...heroSlides, { title: "", subtitle: "", buttonText: "", link: "", image: "" }]);
    };
    const updateSlide = (idx, field, val) => {
        const newArr = [...heroSlides];
        newArr[idx][field] = val;
        setHeroSlides(newArr);
    };
    const removeSlide = (idx) => setHeroSlides(heroSlides.filter((_, i) => i !== idx));

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <i className="fas fa-circle-notch fa-spin text-4xl mb-4 text-brandLime"></i>
            <h2 className="text-xl font-bold font-display uppercase tracking-widest text-gray-500">Loading Settings...</h2>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-black font-display uppercase tracking-wider text-gray-900 flex items-center gap-3">
                        <SettingsIcon className="text-brandDark" /> Site Settings
                    </h1>
                    <p className="text-gray-500 text-sm font-medium mt-1">Manage Homepage content and Top Bar Messages.</p>
                </div>
                <button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="bg-brandDark hover:bg-brandBlack text-brandLime font-black py-3 px-6 rounded-xl text-sm uppercase tracking-widest transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                    {saving ? (
                        <><i className="fas fa-circle-notch fa-spin"></i> Saving...</>
                    ) : (
                        <><Save size={18} /> Save Settings</>
                    )}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Ticker Settings */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200 sticky top-8">
                        <div className="flex flex-col gap-2 mb-6 border-b border-gray-100 pb-4">
                            <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                                <MessageSquare size={16} className="text-brandLime" /> Ticker Messages
                            </h3>
                            <p className="text-xs text-gray-500 font-medium leading-relaxed">Messages shown in the top scrolling bar.</p>
                            <button onClick={addTicker} className="mt-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-sm text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1 w-full border border-gray-200">
                                <Plus size={14} /> Add Message
                            </button>
                        </div>
                        
                        <div className="flex flex-col gap-3">
                            {tickerMessages.map((msg, idx) => (
                                <div key={idx} className="flex flex-col gap-2 bg-gray-50 p-3 rounded-sm border border-gray-200 group relative pr-10">
                                    <textarea 
                                        value={msg} 
                                        onChange={(e) => updateTicker(idx, e.target.value)} 
                                        className="w-full bg-transparent border-none p-0 text-sm font-medium text-gray-700 outline-none resize-none min-h-[60px]"
                                        placeholder="Enter ticker message..."
                                    />
                                    <button onClick={() => removeTicker(idx)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors" title="Remove Message">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            {tickerMessages.length === 0 && (
                                <div className="text-center py-6 bg-gray-50 border border-dashed border-gray-200 rounded-sm">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No messages added</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Hero Carousel Settings */}
                <div className="lg:col-span-2">
                    <div className="bg-white p-6 sm:p-8 rounded-sm shadow-sm border border-gray-200">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-gray-100 pb-4">
                            <div>
                                <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest flex items-center gap-2 mb-1">
                                    <LayoutTemplate size={16} className="text-brandDark" /> Hero Carousel Slides
                                </h3>
                                <p className="text-xs text-gray-500 font-medium">Add up to 7 giant slides for the homepage hero section.</p>
                            </div>
                            <button onClick={addSlide} className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 border border-blue-200">
                                <Plus size={14} /> Add Slide ({heroSlides.length}/7)
                            </button>
                        </div>

                        <div className="flex flex-col gap-8">
                            {heroSlides.map((slide, idx) => (
                                <div key={idx} className="border border-gray-200 rounded-sm bg-gray-50 relative overflow-hidden group">
                                    <div className="bg-gray-100 border-b border-gray-200 px-4 py-3 flex justify-between items-center">
                                        <h4 className="font-black text-xs text-gray-500 uppercase tracking-widest">Slide #{idx + 1}</h4>
                                        <button onClick={() => removeSlide(idx)} className="text-xs font-bold text-red-600 hover:bg-red-100 px-2.5 py-1 rounded transition-colors flex items-center gap-1">
                                            <Trash2 size={12} /> Delete Slide
                                        </button>
                                    </div>
                                    
                                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Title</label>
                                            <input 
                                                type="text" 
                                                value={slide.title} 
                                                onChange={(e) => updateSlide(idx, 'title', e.target.value)} 
                                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-medium focus:border-brandLime outline-none transition-colors"
                                                placeholder="e.g. Upgrade Your Space"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Image URL</label>
                                            <input 
                                                type="text" 
                                                value={slide.image} 
                                                onChange={(e) => updateSlide(idx, 'image', e.target.value)} 
                                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-medium focus:border-brandLime outline-none transition-colors"
                                                placeholder="https://..."
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Subtitle</label>
                                            <textarea 
                                                value={slide.subtitle} 
                                                onChange={(e) => updateSlide(idx, 'subtitle', e.target.value)} 
                                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-medium focus:border-brandLime outline-none transition-colors resize-y min-h-[80px]"
                                                placeholder="A brief description of this slide..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Button Text</label>
                                            <input 
                                                type="text" 
                                                value={slide.buttonText} 
                                                onChange={(e) => updateSlide(idx, 'buttonText', e.target.value)} 
                                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-medium focus:border-brandLime outline-none transition-colors"
                                                placeholder="e.g. Shop Now"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Button Link</label>
                                            <input 
                                                type="text" 
                                                value={slide.link} 
                                                onChange={(e) => updateSlide(idx, 'link', e.target.value)} 
                                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-medium focus:border-brandLime outline-none transition-colors"
                                                placeholder="e.g. /products"
                                            />
                                        </div>
                                    </div>
                                    
                                    {/* Preview thumbnail if image URL exists */}
                                    {slide.image && (
                                        <div className="px-5 pb-5 pt-0">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Image Preview</label>
                                            <div className="w-full h-32 bg-gray-200 rounded-sm border border-gray-200 overflow-hidden relative">
                                                <img src={slide.image} alt="Preview" className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlNWU3ZWIiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbnZhbGlkIEltYWdlIFVSTDwvdGV4dD48L3N2Zz4='; }} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {heroSlides.length === 0 && (
                                <div className="text-center py-12 bg-gray-50 border border-dashed border-gray-200 rounded-sm">
                                    <LayoutTemplate size={32} className="mx-auto text-gray-300 mb-3" />
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No slides added</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
