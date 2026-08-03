import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const devices = [
  // APPLE iPHONES (Prices in NGN approximate)
  { brand: 'Apple', name: 'iPhone 15 Pro Max', deviceType: 'phone', basePrice: 1500000 },
  { brand: 'Apple', name: 'iPhone 15 Pro', deviceType: 'phone', basePrice: 1300000 },
  { brand: 'Apple', name: 'iPhone 15 Plus', deviceType: 'phone', basePrice: 1100000 },
  { brand: 'Apple', name: 'iPhone 15', deviceType: 'phone', basePrice: 950000 },
  { brand: 'Apple', name: 'iPhone 14 Pro Max', deviceType: 'phone', basePrice: 1100000 },
  { brand: 'Apple', name: 'iPhone 14 Pro', deviceType: 'phone', basePrice: 950000 },
  { brand: 'Apple', name: 'iPhone 14 Plus', deviceType: 'phone', basePrice: 750000 },
  { brand: 'Apple', name: 'iPhone 14', deviceType: 'phone', basePrice: 650000 },
  { brand: 'Apple', name: 'iPhone 13 Pro Max', deviceType: 'phone', basePrice: 850000 },
  { brand: 'Apple', name: 'iPhone 13 Pro', deviceType: 'phone', basePrice: 750000 },
  { brand: 'Apple', name: 'iPhone 13', deviceType: 'phone', basePrice: 550000 },
  { brand: 'Apple', name: 'iPhone 12 Pro Max', deviceType: 'phone', basePrice: 600000 },
  { brand: 'Apple', name: 'iPhone 12 Pro', deviceType: 'phone', basePrice: 500000 },
  { brand: 'Apple', name: 'iPhone 12', deviceType: 'phone', basePrice: 400000 },
  { brand: 'Apple', name: 'iPhone 11 Pro Max', deviceType: 'phone', basePrice: 450000 },
  { brand: 'Apple', name: 'iPhone 11 Pro', deviceType: 'phone', basePrice: 380000 },
  { brand: 'Apple', name: 'iPhone 11', deviceType: 'phone', basePrice: 300000 },

  // APPLE iPADS
  { brand: 'Apple', name: 'iPad Pro 12.9 (M2)', deviceType: 'tablet', basePrice: 1400000 },
  { brand: 'Apple', name: 'iPad Pro 11 (M2)', deviceType: 'tablet', basePrice: 1100000 },
  { brand: 'Apple', name: 'iPad Air (M1)', deviceType: 'tablet', basePrice: 700000 },
  { brand: 'Apple', name: 'iPad (10th Gen)', deviceType: 'tablet', basePrice: 500000 },

  // APPLE MACBOOKS
  { brand: 'Apple', name: 'MacBook Pro 16" (M3 Max)', deviceType: 'laptop', basePrice: 4500000 },
  { brand: 'Apple', name: 'MacBook Pro 14" (M3 Pro)', deviceType: 'laptop', basePrice: 3200000 },
  { brand: 'Apple', name: 'MacBook Air 15" (M2)', deviceType: 'laptop', basePrice: 1800000 },
  { brand: 'Apple', name: 'MacBook Air 13" (M1)', deviceType: 'laptop', basePrice: 900000 },

  // APPLE WATCHES
  { brand: 'Apple', name: 'Apple Watch Ultra 2', deviceType: 'watch', basePrice: 1100000 },
  { brand: 'Apple', name: 'Apple Watch Series 9', deviceType: 'watch', basePrice: 550000 },
  { brand: 'Apple', name: 'Apple Watch SE (2nd Gen)', deviceType: 'watch', basePrice: 300000 },

  // SAMSUNG PHONES
  { brand: 'Samsung', name: 'Galaxy S24 Ultra', deviceType: 'phone', basePrice: 1800000 },
  { brand: 'Samsung', name: 'Galaxy S24+', deviceType: 'phone', basePrice: 1300000 },
  { brand: 'Samsung', name: 'Galaxy S24', deviceType: 'phone', basePrice: 1100000 },
  { brand: 'Samsung', name: 'Galaxy S23 Ultra', deviceType: 'phone', basePrice: 1200000 },
  { brand: 'Samsung', name: 'Galaxy S23+', deviceType: 'phone', basePrice: 950000 },
  { brand: 'Samsung', name: 'Galaxy S23', deviceType: 'phone', basePrice: 800000 },
  { brand: 'Samsung', name: 'Galaxy S22 Ultra', deviceType: 'phone', basePrice: 850000 },
  { brand: 'Samsung', name: 'Galaxy Z Fold 5', deviceType: 'phone', basePrice: 1500000 },
  { brand: 'Samsung', name: 'Galaxy Z Flip 5', deviceType: 'phone', basePrice: 900000 },

  // GOOGLE PIXELS
  { brand: 'Google', name: 'Pixel 8 Pro', deviceType: 'phone', basePrice: 1100000 },
  { brand: 'Google', name: 'Pixel 8', deviceType: 'phone', basePrice: 850000 },
  { brand: 'Google', name: 'Pixel 7 Pro', deviceType: 'phone', basePrice: 700000 },
  { brand: 'Google', name: 'Pixel 7', deviceType: 'phone', basePrice: 500000 },
];

export const generateId = (name) => {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
};

export const seedDatabase = async () => {
  console.log("Starting DB Seeding...");
  for (const device of devices) {
    const id = generateId(`${device.brand}-${device.name}`);
    const deviceRef = doc(db, 'tradeInDevices', id);
    await setDoc(deviceRef, {
      name: device.name,
      brand: device.brand,
      deviceType: device.deviceType,
      basePrice: device.basePrice,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log(`Seeded: ${device.brand} ${device.name}`);
  }
  console.log("Seeding Complete!");
};
