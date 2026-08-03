import { useState, useEffect } from 'react';
import { Plus, Trash2, SlidersHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';
import { listenToCategories } from '../../utils/categoryService';
import { listenToAllSubcategories } from '../../utils/subcategoryService';
import { listenToBrands } from '../../utils/brandService';
import { addSpecification, deleteSpecification, listenToSpecifications } from '../../utils/specificationService';

export default function SpecificationManager() {
  const [categories, setCategories] = useState([]);
  const [allSubcategories, setAllSubcategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [specifications, setSpecifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form state
  const [specName, setSpecName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [options, setOptions] = useState([]);
  const [optionInput, setOptionInput] = useState('');

  useEffect(() => {
    const unsub1 = listenToCategories(cats => setCategories(cats.filter(c => c.name !== 'All')));
    const unsub2 = listenToAllSubcategories(subcats => setAllSubcategories(subcats));
    const unsub3 = listenToBrands(b => setBrands(b));
    const unsub4 = listenToSpecifications(specs => setSpecifications(specs));
    return () => { unsub1(); unsub2(); unsub3(); unsub4(); };
  }, []);

  const handleAddOption = () => {
    const trimmed = optionInput.trim();
    if (trimmed && !options.includes(trimmed)) {
      setOptions([...options, trimmed]);
      setOptionInput('');
    }
  };

  const handleRemoveOption = (opt) => {
    setOptions(options.filter(o => o !== opt));
  };

  const handleAddSpecification = async () => {
    if (!specName.trim()) {
      toast.error('Specification name is required');
      return;
    }
    if (options.length === 0) {
      toast.error('Add at least one option (e.g. "4GB", "128GB")');
      return;
    }

    setLoading(true);
    try {
      await addSpecification({
        name: specName.trim(),
        categoryId: selectedCategory || null,
        subcategoryId: selectedSubcategory || null,
        brandId: selectedBrand || null,
        options,
      });
      toast.success('Specification saved!');
      setSpecName('');
      setSelectedCategory('');
      setSelectedSubcategory('');
      setSelectedBrand('');
      setOptions([]);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save specification');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSpec = async (id) => {
    if (!window.confirm('Delete this specification? This cannot be undone.')) return;
    setLoading(true);
    try {
      await deleteSpecification(id);
      toast.success('Specification deleted');
    } catch {
      toast.error('Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  const filteredSubcategories = allSubcategories.filter(s => s.categoryId === selectedCategory);

  const inputClass = "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 bg-white focus:ring-2 focus:ring-brandRed focus:border-brandRed outline-none transition-all text-sm";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1.5";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
        <div className="w-10 h-10 bg-brandRed rounded-lg flex items-center justify-center">
          <SlidersHorizontal size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Manage Specifications</h2>
          <p className="text-sm text-gray-500">Define filterable product attributes for the shop</p>
        </div>
      </div>

      {/* Add Form */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-8">
        <h3 className="font-bold text-gray-800 text-base mb-4 flex items-center gap-2">
          <Plus size={16} className="text-brandRed" />
          Add New Specification
        </h3>

        {/* Name */}
        <div className="mb-4">
          <label className={labelClass}>Specification Name <span className="text-brandRed">*</span></label>
          <input
            type="text"
            placeholder="e.g. RAM, Storage, Screen Size, Color"
            value={specName}
            onChange={e => setSpecName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddOption()}
            className={inputClass}
          />
        </div>

        {/* Scope row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div>
            <label className={labelClass}>Target Category <span className="text-gray-400 font-normal">(optional)</span></label>
            <select
              value={selectedCategory}
              onChange={e => { setSelectedCategory(e.target.value); setSelectedSubcategory(''); }}
              className={inputClass}
            >
              <option value="">— All Categories —</option>
              {categories.map(c => (
                <option key={c.id || c.name} value={c.id || c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Target Subcategory <span className="text-gray-400 font-normal">(optional)</span></label>
            <select
              value={selectedSubcategory}
              onChange={e => setSelectedSubcategory(e.target.value)}
              disabled={!selectedCategory || filteredSubcategories.length === 0}
              className={`${inputClass} disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed`}
            >
              <option value="">— All Subcategories —</option>
              {filteredSubcategories.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Target Brand <span className="text-gray-400 font-normal">(optional)</span></label>
            <select
              value={selectedBrand}
              onChange={e => setSelectedBrand(e.target.value)}
              className={inputClass}
            >
              <option value="">— All Brands —</option>
              {brands.map(b => (
                <option key={b.id || b.name} value={b.id || b.name}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Options */}
        <div className="mb-5">
          <label className={labelClass}>Options <span className="text-brandRed">*</span></label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="e.g. 8GB — press Enter or click Add"
              value={optionInput}
              onChange={e => setOptionInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddOption(); } }}
              className={inputClass}
            />
            <button
              type="button"
              onClick={handleAddOption}
              disabled={!optionInput.trim()}
              className="shrink-0 bg-gray-800 hover:bg-gray-900 disabled:bg-gray-300 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
            >
              + Add
            </button>
          </div>

          {options.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {options.map(opt => (
                <span key={opt} className="inline-flex items-center gap-1.5 bg-brandRed text-white text-sm font-medium px-3 py-1 rounded-full">
                  {opt}
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(opt)}
                    className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                    title="Remove option"
                  >
                    <Trash2 size={12} />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No options added yet. Type a value above and click "+ Add".</p>
          )}
        </div>

        {/* Save button */}
        <button
          type="button"
          onClick={handleAddSpecification}
          disabled={loading || !specName.trim() || options.length === 0}
          className="flex items-center gap-2 bg-brandRed hover:bg-brandRedDark disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-2.5 px-6 rounded-lg transition-colors text-sm"
        >
          <Plus size={16} />
          {loading ? 'Saving...' : 'Save Specification'}
        </button>
      </div>

      {/* Existing Specifications */}
      <div>
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <span>Existing Specifications</span>
          <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">{specifications.length}</span>
        </h3>

        {specifications.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <SlidersHorizontal size={32} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No specifications yet. Add your first one above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {specifications.map(spec => (
              <div key={spec.id} className="border border-gray-200 rounded-xl p-4 flex justify-between items-start bg-white hover:border-gray-300 transition-colors">
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 text-base mb-1">{spec.name}</h4>
                  <div className="flex flex-wrap gap-1.5 mb-2 text-xs text-gray-500">
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      Cat: {categories.find(c => (c.id || c.name) === spec.categoryId)?.name || 'All'}
                    </span>
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      Subcat: {allSubcategories.find(s => s.id === spec.subcategoryId)?.name || 'All'}
                    </span>
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      Brand: {brands.find(b => (b.id || b.name) === spec.brandId)?.name || 'All'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(spec.options || []).map(o => (
                      <span key={o} className="bg-blue-50 text-blue-700 border border-blue-100 text-xs font-medium px-2.5 py-1 rounded-full">{o}</span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteSpec(spec.id)}
                  disabled={loading}
                  className="ml-3 text-red-500 hover:bg-red-50 disabled:opacity-50 p-2 rounded-lg transition-colors shrink-0"
                  title="Delete specification"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
