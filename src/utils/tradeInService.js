import { collection, onSnapshot, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
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
    // Sort by order first, then by type, brand (sub category), and name (model)
    devices.sort((a, b) => {
      const orderA = typeof a.order === 'number' ? a.order : 999999;
      const orderB = typeof b.order === 'number' ? b.order : 999999;
      if (orderA !== orderB) return orderA - orderB;
      const typeA = a.deviceType || '';
      const typeB = b.deviceType || '';
      if (typeA < typeB) return -1;
      if (typeA > typeB) return 1;
      const brandA = a.brand || '';
      const brandB = b.brand || '';
      if (brandA < brandB) return -1;
      if (brandA > brandB) return 1;
      return (a.name || '').localeCompare(b.name || '');
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
  const data = {
    name: device.name.trim(),
    brand: device.brand.trim(),
    deviceType: device.deviceType,
    priceBrandNew: Number(device.priceBrandNew) || 0,
    priceExcellent: Number(device.priceExcellent) || 0,
    priceVeryGood: Number(device.priceVeryGood) || 0,
    priceGood: Number(device.priceGood) || 0,
    priceFair: Number(device.priceFair) || 0,
    updatedAt: new Date().toISOString()
  };
  if (device.order !== undefined) {
    data.order = device.order;
  } else if (!device.id) {
    data.order = Date.now();
  }
  await setDoc(deviceRef, data, { merge: true });
};

/**
 * Delete a trade-in device
 */
export const deleteTradeInDevice = async (id) => {
  await deleteDoc(doc(db, 'tradeInDevices', id));
};

/**
 * Update the order of all devices in bulk
 */
export const updateAllDeviceOrders = async (orderedDevices) => {
  const batch = writeBatch(db);
  orderedDevices.forEach((device, index) => {
    batch.update(doc(db, 'tradeInDevices', device.id), { order: index });
  });
  await batch.commit();
};
