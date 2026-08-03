import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

const SUBCATEGORIES_COLLECTION = 'subcategories';

/**
 * Listen to subcategories for a specific category
 */
export const listenToSubcategories = (categoryId, onUpdate) => {
  const q = query(
    collection(db, SUBCATEGORIES_COLLECTION),
    where('categoryId', '==', categoryId),
    orderBy('order', 'asc')
  );

  return onSnapshot(q,
    (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      onUpdate(docs);
    },
    (err) => {
      console.warn('[subcategoryService] orderBy query failed, falling back:', err.message);
      const fallback = query(collection(db, SUBCATEGORIES_COLLECTION), where('categoryId', '==', categoryId));
      onSnapshot(fallback, (snap) => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        onUpdate(docs);
      });
    }
  );
};

/**
 * Listen to all subcategories (useful for Admin or Shop)
 */
export const listenToAllSubcategories = (onUpdate) => {
  const q = query(collection(db, SUBCATEGORIES_COLLECTION));
  return onSnapshot(q, (snap) => {
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    onUpdate(docs);
  });
};

export const addSubcategory = async (data) => {
  const docRef = await addDoc(collection(db, SUBCATEGORIES_COLLECTION), {
    ...data,
    order: Date.now(),
    createdAt: new Date()
  });
  return docRef.id;
};

export const updateSubcategory = async (id, updates) => {
  await updateDoc(doc(db, SUBCATEGORIES_COLLECTION, id), updates);
};

export const deleteSubcategory = async (id) => {
  await deleteDoc(doc(db, SUBCATEGORIES_COLLECTION, id));
};
