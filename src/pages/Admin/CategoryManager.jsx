import { useState, useEffect } from 'react';
import { Plus, Trash2, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { addCategory, updateCategory, deleteCategory, listenToCategories, DEFAULT_CATEGORIES } from '../../utils/categoryService';

export default function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = listenToCategories((cats) => {
      if (cats.length === 0) {
        setCategories(DEFAULT_CATEGORIES);
      } else {
        setCategories(cats.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Category name cannot be empty');
      return;
    }

    // Check if category already exists
    if (categories.some(c => c.name.toLowerCase() === newCategoryName.toLowerCase())) {
      toast.error('Category already exists');
      return;
    }

    setLoading(true);
    try {
      await addCategory({
        name: newCategoryName.trim(),
        createdAt: new Date()
      });
      toast.success(`Category "${newCategoryName}" added!`);
      setNewCategoryName('');
    } catch (err) {
      console.error('Error adding category:', err);
      toast.error('Failed to add category');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId, categoryName) => {
    if (categoryName === 'All') {
      toast.error('Cannot delete the "All" category');
      return;
    }

    if (!window.confirm(`Delete "${categoryName}"? This cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      await deleteCategory(categoryId);
      toast.success(`Category "${categoryName}" deleted!`);
    } catch (err) {
      console.error('Error deleting category:', err);
      toast.error('Failed to delete category');
    } finally {
      setLoading(false);
    }
  };

  const handleMoveCategory = async (index, direction) => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === categories.length - 1)
    ) {
      return;
    }

    const newCategories = [...categories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newCategories[index], newCategories[targetIndex]] = [
      newCategories[targetIndex],
      newCategories[index]
    ];

    // Update order in all documents
    setLoading(true);
    try {
      for (let i = 0; i < newCategories.length; i++) {
        if (newCategories[i].id) {
          await updateCategory(newCategories[i].id, { order: i });
        }
      }
      toast.success('Category order updated!');
    } catch (err) {
      console.error('Error updating category order:', err);
      toast.error('Failed to update order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <i className="fas fa-tag text-zeal-red"></i> Manage Categories
      </h2>

      {/* Add New Category Form */}
      <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <label className="block text-sm font-bold text-gray-700 mb-3">Add New Category</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
            placeholder="e.g., Home Appliances, Electronics..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-zeal-blue focus:border-transparent outline-none"
            disabled={loading}
          />
          <button
            onClick={handleAddCategory}
            disabled={loading || !newCategoryName.trim()}
            className="bg-zeal-blue hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Plus size={18} /> Add
          </button>
        </div>
      </div>

      {/* Categories List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">
          {categories.length} Active Categories
        </h3>

        {categories.length === 0 ? (
          <p className="text-gray-500 text-center py-6">No categories yet. Add one above!</p>
        ) : (
          <div className="space-y-2 border border-gray-200 rounded-lg divide-y">
            {categories.map((cat, index) => (
              <div
                key={cat.id || cat.name}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <GripVertical size={18} className="text-gray-300 cursor-grab" />
                  <div>
                    <p className="font-bold text-gray-800">{cat.name}</p>
                    <p className="text-xs text-gray-400">
                      {cat.createdAt ? new Date(cat.createdAt.toDate?.() || cat.createdAt).toLocaleDateString() : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Move Buttons */}
                  <button
                    onClick={() => handleMoveCategory(index, 'up')}
                    disabled={index === 0 || loading}
                    className="p-2 hover:bg-gray-200 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move up"
                  >
                    <ChevronUp size={18} className="text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleMoveCategory(index, 'down')}
                    disabled={index === categories.length - 1 || loading}
                    className="p-2 hover:bg-gray-200 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move down"
                  >
                    <ChevronDown size={18} className="text-gray-600" />
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteCategory(cat.id, cat.name)}
                    disabled={loading || cat.name === 'All'}
                    className="p-2 hover:bg-red-100 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-red-600"
                    title="Delete category"
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
        Categories automatically appear in Shop filters and product management. Reorder them by dragging or using the arrow buttons.
      </div>
    </div>
  );
}
