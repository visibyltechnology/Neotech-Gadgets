import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

const CATEGORIES_COLLECTION = 'categories';

/**
 * Listen to all categories in real-time
 * @param {Function} onUpdate - Callback when categories change
 * @returns {Function} Unsubscribe function
 */
export const listenToCategories = (onUpdate) => {
  const q = query(collection(db, CATEGORIES_COLLECTION), orderBy('order', 'asc'));

  const mergeCats = (dbCats) => {
    const map = new Map();
    // Add defaults first
    DEFAULT_CATEGORIES.forEach(c => map.set(c.name.toLowerCase(), { ...c }));
    // Override/add DB categories
    dbCats.forEach(c => map.set(c.name.toLowerCase(), { ...c }));
    return Array.from(map.values()).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  };

  return onSnapshot(q,
    (snap) => {
      const dbCats = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      onUpdate(mergeCats(dbCats));
    },
    (err) => {
      // Likely a missing Firestore index — fall back to unordered query
      console.warn('[categoryService] orderBy query failed, falling back:', err.message);
      const fallback = query(collection(db, CATEGORIES_COLLECTION));
      onSnapshot(fallback, (snap) => {
        const dbCats = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        onUpdate(mergeCats(dbCats));
      });
    }
  );
};

/**
 * Add a new category
 * @param {Object} categoryData - { name, color (optional), icon (optional) }
 * @returns {Promise<string>} Category ID
 */
export const addCategory = async (categoryData) => {
  const docRef = await addDoc(collection(db, CATEGORIES_COLLECTION), {
    ...categoryData,
    order: Date.now(),
    createdAt: new Date()
  });
  return docRef.id;
};

/**
 * Update a category
 * @param {string} categoryId - Category ID
 * @param {Object} updates - Fields to update
 */
export const updateCategory = async (categoryId, updates) => {
  await updateDoc(doc(db, CATEGORIES_COLLECTION, categoryId), updates);
};

/**
 * Delete a category
 * @param {string} categoryId - Category ID
 */
export const deleteCategory = async (categoryId) => {
  await deleteDoc(doc(db, CATEGORIES_COLLECTION, categoryId));
};

/**
 * Get default categories (fallback if Firestore is empty)
 */
export const DEFAULT_CATEGORIES = [
  { name: 'All', order: 0 },
  { name: 'Smartphones', order: 1 },
  { name: 'Tablets', order: 2 },
  { name: 'Laptops', order: 3 },
  { name: 'iPhone', order: 4 },
  { name: 'Accessories', order: 5 },
  { name: 'Power Banks', order: 6 },
];

// Category color mapping for UI
export const CATEGORY_STYLES = {
  'Smartphones': { bg: '#ecf9ff', text: '#0891b2', border: '#a5f3fc', dot: '#0891b2', glow: 'rgba(6,182,212,0.15)' },
  'Tablets': { bg: '#f3e8ff', text: '#a855f7', border: '#e9d5ff', dot: '#a855f7', glow: 'rgba(168,85,247,0.15)' },
  'Laptops': { bg: '#eff6ff', text: '#3b82f6', border: '#bfdbfe', dot: '#3b82f6', glow: 'rgba(59,130,246,0.15)' },
  'iPhone': { bg: '#ffe2e6', text: '#f43f5e', border: '#ffbdc7', dot: '#f43f5e', glow: 'rgba(244,63,94,0.15)' },
  'Accessories': { bg: '#f3f0ff', text: '#7c3aed', border: '#ddd6fe', dot: '#7c3aed', glow: 'rgba(124,58,237,0.15)' },
  'Power Banks': { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0', dot: '#059669', glow: 'rgba(5,150,105,0.15)' },
  'All': { bg: '#f3f4f6', text: '#374151', border: '#e5e7eb', dot: '#6b7280', glow: 'rgba(0,0,0,0.08)' },
};

export const getDefaultStyle = () => ({ bg: '#f3f4f6', text: '#374151', border: '#e5e7eb', dot: '#6b7280', glow: 'rgba(0,0,0,0.08)' });
