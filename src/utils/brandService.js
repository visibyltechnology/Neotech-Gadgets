import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

const BRANDS_COLLECTION = 'brands';

/**
 * Listen to all brands in real-time
 * @param {Function} onUpdate - Callback when brands change
 * @returns {Function} Unsubscribe function
 */
export const listenToBrands = (onUpdate) => {
  const q = query(collection(db, BRANDS_COLLECTION), orderBy('order', 'asc'));

  const mergeBrands = (dbBrands) => {
    const map = new Map();
    // Add defaults first
    DEFAULT_BRANDS.forEach(b => map.set(b.name.toLowerCase(), { ...b }));
    // Override/add DB brands
    dbBrands.forEach(b => map.set(b.name.toLowerCase(), { ...b }));
    return Array.from(map.values()).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  };

  return onSnapshot(q,
    (snap) => {
      const dbBrands = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      onUpdate(mergeBrands(dbBrands));
    },
    (err) => {
      // Likely a missing Firestore index — fall back to unordered query
      console.warn('[brandService] orderBy query failed, falling back:', err.message);
      const fallback = query(collection(db, BRANDS_COLLECTION));
      onSnapshot(fallback, (snap) => {
        const dbBrands = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        onUpdate(mergeBrands(dbBrands));
      });
    }
  );
};

/**
 * Add a new brand
 * @param {Object} brandData - { name }
 * @returns {Promise<string>} Brand ID
 */
export const addBrand = async (brandData) => {
  const docRef = await addDoc(collection(db, BRANDS_COLLECTION), {
    ...brandData,
    order: Date.now(),
    createdAt: new Date()
  });
  return docRef.id;
};

/**
 * Update a brand
 * @param {string} brandId - Brand ID
 * @param {Object} updates - Fields to update
 */
export const updateBrand = async (brandId, updates) => {
  await updateDoc(doc(db, BRANDS_COLLECTION, brandId), updates);
};

/**
 * Delete a brand
 * @param {string} brandId - Brand ID
 */
export const deleteBrand = async (brandId) => {
  await deleteDoc(doc(db, BRANDS_COLLECTION, brandId));
};

/**
 * Get default brands (fallback if Firestore is empty)
 */
export const DEFAULT_BRANDS = [
  { name: 'Apple', order: 0 },
  { name: 'Samsung', order: 1 },
  { name: 'Google', order: 2 },
  { name: 'Xiaomi', order: 3 },
  { name: 'OnePlus', order: 4 },
  { name: 'Sony', order: 5 },
  { name: 'Asus', order: 6 },
  { name: 'Dell', order: 7 },
  { name: 'HP', order: 8 },
  { name: 'Lenovo', order: 9 },
  { name: 'JBL', order: 10 },
  { name: 'Bose', order: 11 },
  { name: 'Anker', order: 12 },
  { name: 'Oraimo', order: 13 },
  { name: 'Logitech', order: 14 },
];
