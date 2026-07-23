import { create } from 'zustand';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase';

const useAuthStore = create((set) => ({
  user: null,
  isAdmin: false,
  loading: true,
  init: () => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // Logged out — resolve immediately
        set({ user: null, isAdmin: false, loading: false });
        return;
      }

      // User present — mark as loading while we fetch admin status from Firestore
      set({ user, isAdmin: false, loading: true });

      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('../firebase');
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const data = userDoc.exists() ? userDoc.data() : {};
        const isAdmin = data.isAdmin === true || data.role === 'admin';
        set({ isAdmin, loading: false });
      } catch (err) {
        console.error('Failed to fetch admin status:', err);
        set({ isAdmin: false, loading: false });
      }
    });
  },
  logout: async () => {
    await signOut(auth);
    set({ user: null, isAdmin: false });
  }
}));

export default useAuthStore;
