import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

const SPECIFICATIONS_COLLECTION = 'specifications';

/**
 * Listen to all specifications
 */
export const listenToSpecifications = (onUpdate) => {
  const q = query(collection(db, SPECIFICATIONS_COLLECTION), orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, 
    (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      onUpdate(docs);
    },
    (err) => {
      console.warn('[specificationService] orderBy query failed, falling back:', err.message);
      const fallback = query(collection(db, SPECIFICATIONS_COLLECTION));
      onSnapshot(fallback, (snap) => {
         const docs = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
         onUpdate(docs);
      });
    }
  );
};

export const addSpecification = async (data) => {
  const docRef = await addDoc(collection(db, SPECIFICATIONS_COLLECTION), {
    ...data,
    createdAt: new Date()
  });
  return docRef.id;
};

export const updateSpecification = async (id, updates) => {
  await updateDoc(doc(db, SPECIFICATIONS_COLLECTION, id), updates);
};

export const deleteSpecification = async (id) => {
  await deleteDoc(doc(db, SPECIFICATIONS_COLLECTION, id));
};
