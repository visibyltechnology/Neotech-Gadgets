import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Helper to sanitize IDs
export const generateId = (name) => {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
};

/**
 * Listens to all trade-in devices from Firestore.
 */
export const listenToTradeInDevices = (callback) => {
  const q = collection(db, 'tradeInDevices');
  return onSnapshot(q, (snapshot) => {
    const devices = [];
    snapshot.forEach((doc) => {
      devices.push({ id: doc.id, ...doc.data() });
    });
    // Sort alphabetically by brand then name
    devices.sort((a, b) => {
      if (a.brand < b.brand) return -1;
      if (a.brand > b.brand) return 1;
      return a.name.localeCompare(b.name);
    });
    callback(devices);
  });
};

/**
 * Add or update a trade-in device
 */
export const saveTradeInDevice = async (device) => {
  if (!device.name || !device.brand || !device.deviceType) {
    throw new Error('Device name, brand, and device type are required');
  }
  const id = device.id || generateId(`${device.brand}-${device.name}`);
  const deviceRef = doc(db, 'tradeInDevices', id);
  await setDoc(deviceRef, {
    name: device.name.trim(),
    brand: device.brand.trim(),
    deviceType: device.deviceType,
    priceBrandNew: Number(device.priceBrandNew) || 0,
    priceExcellent: Number(device.priceExcellent) || 0,
    priceVeryGood: Number(device.priceVeryGood) || 0,
    priceGood: Number(device.priceGood) || 0,
    priceFair: Number(device.priceFair) || 0,
    updatedAt: new Date().toISOString()
  }, { merge: true });
};

/**
 * Delete a trade-in device
 */
export const deleteTradeInDevice = async (id) => {
  await deleteDoc(doc(db, 'tradeInDevices', id));
};
