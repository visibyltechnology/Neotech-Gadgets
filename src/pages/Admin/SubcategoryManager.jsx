import { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { listenToCategories } from '../../utils/categoryService';
import { addSubcategory, updateSubcategory, deleteSubcategory, listenToSubcategories } from '../../utils/subcategoryService';

export default function SubcategoryManager() {
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [subcategories, setSubcategories] = useState([]);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = listenToCategories((cats) => {
      const filtered = cats.filter(c => c.name !== 'All');
      setCategories(filtered);
      if (filtered.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(filtered[0].id || filtered[0].name);
      }
    });
    return () => unsubscribe();
  }, [selectedCategoryId]);

  useEffect(() => {
    if (!selectedCategoryId) return;
    const unsubscribe = listenToSubcategories(selectedCategoryId, (subcats) => {
      setSubcategories(subcats);
    });
    return () => unsubscribe();
  }, [selectedCategoryId]);

  const handleAddSubcategory = async () => {
    if (!newSubcategoryName.trim()) {
      toast.error('Subcategory name cannot be empty');
      return;
    }
    if (subcategories.some(s => s.name.toLowerCase() === newSubcategoryName.toLowerCase())) {
      toast.error('Subcategory already exists in this category');
      return;
    }
    setLoading(true);
    try {
      await addSubcategory({
        name: newSubcategoryName.trim(),
        categoryId: selectedCategoryId,
      });
      toast.success('Subcategory added!');
      setNewSubcategoryName('');
    } catch (err) {
      console.error(err);
      toast.error('Failed to add subcategory');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubcategory = async (subcat) => {
    if (!window.confirm(`Delete "${subcat.name}"? This cannot be undone.`)) return;
    setLoading(true);
    try {
      await deleteSubcategory(subcat.id);
      toast.success('Subcategory deleted!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete subcategory');
    } finally {
      setLoading(false);
    }
  };

  const handleMoveSubcategory = async (index, direction) => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === subcategories.length - 1)) return;
    const newSubcats = [...subcategories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newSubcats[index], newSubcats[targetIndex]] = [newSubcats[targetIndex], newSubcats[index]];
    setLoading(true);
    try {
      for (let i = 0; i < newSubcats.length; i++) {
        if (newSubcats[i].id) await updateSubcategory(newSubcats[i].id, { order: i });
      }
      toast.success('Order updated!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update order');
    } finally {
      setLoading(false);
    }
  };

  const selectedCategoryName = categories.find(c => (c.id || c.name) === selectedCategoryId)?.name || '';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
        <div className="w-10 h-10 bg-brandRed rounded-lg flex items-center justify-center">
          <Layers size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Manage Subcategories</h2>
          <p className="text-sm text-gray-500">Add subcategories nested under a parent category</p>
        </div>
      </div>

      {/* Select Category */}
      <div className="mb-5">
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Parent Category</label>
        {categories.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No categories found. Add categories first.</p>
        ) : (
          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 bg-white focus:ring-2 focus:ring-brandRed focus:border-brandRed outline-none text-sm"
          >
            {categories.map(cat => (
              <option key={cat.id || cat.name} value={cat.id || cat.name}>{cat.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Add New Subcategory */}
      <div className="mb-6 bg-gray-50 border border-gray-200 rounded-xl p-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Add Subcategory {selectedCategoryName && <span className="text-brandRed">to "{selectedCategoryName}"</span>}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newSubcategoryName}
            onChange={(e) => setNewSubcategoryName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddSubcategory()}
            placeholder="e.g. Gaming Laptops, Budget Phones..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 bg-white focus:ring-2 focus:ring-brandRed focus:border-brandRed outline-none text-sm"
            disabled={loading || !selectedCategoryId}
          />
          <button
            onClick={handleAddSubcategory}
            disabled={loading || !newSubcategoryName.trim() || !selectedCategoryId}
            className="flex items-center gap-1.5 bg-brandRed hover:bg-brandRedDark disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-2.5 px-5 rounded-lg transition-colors text-sm shrink-0"
          >
            <Plus size={16} /> Add
          </button>
        </div>
      </div>

      {/* Subcategories List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
            Subcategories
          </h3>
          <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">
            {subcategories.length}
          </span>
        </div>

        {subcategories.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <Layers size={28} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No subcategories yet for this category.</p>
            <p className="text-xs text-gray-400 mt-1">Type a name above and click Add.</p>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
            {subcategories.map((subcat, index) => (
              <div
                key={subcat.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <p className="font-semibold text-gray-800 text-sm">{subcat.name}</p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleMoveSubcategory(index, 'up')}
                    disabled={index === 0 || loading}
                    className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move up"
                  >
                    <ChevronUp size={16} className="text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleMoveSubcategory(index, 'down')}
                    disabled={index === subcategories.length - 1 || loading}
                    className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move down"
                  >
                    <ChevronDown size={16} className="text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleDeleteSubcategory(subcat)}
                    disabled={loading}
                    className="p-1.5 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 text-red-500"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info tip */}
      <div className="mt-5 p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700 font-medium flex items-start gap-2">
        <i className="fas fa-info-circle mt-0.5 shrink-0"></i>
        <span>Subcategories appear as filters in the shop when the parent category is selected. They also appear as a dropdown in the Add Product form.</span>
      </div>
    </div>
  );
}
