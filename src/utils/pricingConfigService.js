import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Default multipliers if none exist in the database
export const DEFAULT_PRICING_RULES = {
  brand_new: 1.0,     // 100% of base price
  excellent: 0.9,     // 90%
  very_good: 0.8,     // 80%
  good: 0.65,         // 65%
  fair: 0.45,         // 45%
};

/**
 * Fetch the global pricing rules from Firestore.
 * If they don't exist, it creates them using defaults.
 */
export const getPricingRules = async () => {
  try {
    const rulesRef = doc(db, 'settings', 'pricingRules');
    const docSnap = await getDoc(rulesRef);

    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      // Create defaults
      await setDoc(rulesRef, DEFAULT_PRICING_RULES);
      return DEFAULT_PRICING_RULES;
    }
  } catch (error) {
    console.error('Error fetching pricing rules:', error);
    return DEFAULT_PRICING_RULES;
  }
};

/**
 * Update the global pricing rules in Firestore
 */
export const updatePricingRules = async (newRules) => {
  const rulesRef = doc(db, 'settings', 'pricingRules');
  await setDoc(rulesRef, newRules, { merge: true });
};
