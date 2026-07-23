import { useState, useEffect } from 'react';
import { Plus, Trash2, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { addBrand, updateBrand, deleteBrand, listenToBrands, DEFAULT_BRANDS } from '../../utils/brandService';

export default function BrandManager() {
  const [brands, setBrands] = useState([]);
  const [newBrandName, setNewBrandName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = listenToBrands((brandList) => {
      if (brandList.length === 0) {
        setBrands(DEFAULT_BRANDS);
      } else {
        setBrands(brandList.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAddBrand = async () => {
    if (!newBrandName.trim()) {
      toast.error('Brand name cannot be empty');
      return;
    }

    // Check if brand already exists
    if (brands.some(b => b.name.toLowerCase() === newBrandName.toLowerCase())) {
      toast.error('Brand already exists');
      return;
    }

    setLoading(true);
    try {
      await addBrand({
        name: newBrandName.trim(),
        createdAt: new Date()
      });
      toast.success(`Brand "${newBrandName}" added!`);
      setNewBrandName('');
    } catch (err) {
      console.error('Error adding brand:', err);
      toast.error('Failed to add brand');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBrand = async (brandId, brandName) => {
    if (!window.confirm(`Delete "${brandName}"? This cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      await deleteBrand(brandId);
      toast.success(`Brand "${brandName}" deleted!`);
    } catch (err) {
      console.error('Error deleting brand:', err);
      toast.error('Failed to delete brand');
    } finally {
      setLoading(false);
    }
  };

  const handleMoveBrand = async (index, direction) => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === brands.length - 1)
    ) {
      return;
    }

    const newBrands = [...brands];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newBrands[index], newBrands[targetIndex]] = [
      newBrands[targetIndex],
      newBrands[index]
    ];

    // Update order in all documents
    setLoading(true);
    try {
      for (let i = 0; i < newBrands.length; i++) {
        if (newBrands[i].id) {
          await updateBrand(newBrands[i].id, { order: i });
        }
      }
      toast.success('Brand order updated!');
    } catch (err) {
      console.error('Error updating brand order:', err);
      toast.error('Failed to update order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <i className="fas fa-trademark text-zeal-red"></i> Manage Brands
      </h2>

      {/* Add New Brand Form */}
      <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <label className="block text-sm font-bold text-gray-700 mb-3">Add New Brand</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newBrandName}
            onChange={(e) => setNewBrandName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddBrand()}
            placeholder="e.g., Samsung, LG, Apple..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-zeal-blue focus:border-transparent outline-none"
            disabled={loading}
          />
          <button
            onClick={handleAddBrand}
            disabled={loading || !newBrandName.trim()}
            className="bg-zeal-blue hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Plus size={18} /> Add
          </button>
        </div>
      </div>

      {/* Brands List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">
          {brands.length} Active Brands
        </h3>

        {brands.length === 0 ? (
          <p className="text-gray-500 text-center py-6">No brands yet. Add one above!</p>
        ) : (
          <div className="space-y-2 border border-gray-200 rounded-lg divide-y">
            {brands.map((brand, index) => (
              <div
                key={brand.id || brand.name}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <GripVertical size={18} className="text-gray-300 cursor-grab" />
                  <div>
                    <p className="font-bold text-gray-800">{brand.name}</p>
                    <p className="text-xs text-gray-400">
                      {brand.createdAt ? new Date(brand.createdAt.toDate?.() || brand.createdAt).toLocaleDateString() : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Move Buttons */}
                  <button
                    onClick={() => handleMoveBrand(index, 'up')}
                    disabled={index === 0 || loading}
                    className="p-2 hover:bg-gray-200 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move up"
                  >
                    <ChevronUp size={18} className="text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleMoveBrand(index, 'down')}
                    disabled={index === brands.length - 1 || loading}
                    className="p-2 hover:bg-gray-200 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move down"
                  >
                    <ChevronDown size={18} className="text-gray-600" />
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteBrand(brand.id, brand.name)}
                    disabled={loading}
                    className="p-2 hover:bg-red-100 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-red-600"
                    title="Delete brand"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 font-medium">
        <i className="fas fa-info-circle mr-2"></i>
        Brands automatically appear in Shop filters and product management. Reorder them by dragging or using the arrow buttons.
      </div>
    </div>
  );
}
