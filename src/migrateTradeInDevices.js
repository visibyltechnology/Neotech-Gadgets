import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export const migrateTradeInDevices = async () => {
  console.log("Starting Trade-In Migration...");
  try {
    const q = collection(db, 'tradeInDevices');
    const snapshot = await getDocs(q);
    
    let count = 0;
    for (const document of snapshot.docs) {
      const data = document.data();
      
      // If it already has priceBrandNew, skip it to avoid overwriting
      if (data.priceBrandNew !== undefined) continue;

      const basePrice = data.basePrice || 0;

      // Old multipliers
      const newPrices = {
        priceBrandNew: Math.round(basePrice * 1.0),
        priceExcellent: Math.round(basePrice * 0.9),
        priceVeryGood: Math.round(basePrice * 0.8),
        priceGood: Math.round(basePrice * 0.65),
        priceFair: Math.round(basePrice * 0.45)
      };

      const deviceRef = doc(db, 'tradeInDevices', document.id);
      await setDoc(deviceRef, {
        ...data,
        ...newPrices,
      }, { merge: true });
      
      count++;
    }
    console.log(`Migration Complete! Updated ${count} devices.`);
  } catch (err) {
    console.error("Migration Failed:", err);
  }
};
