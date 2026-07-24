import { collection, addDoc, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from './src/firebase.js';

const products = [
  {
    name: "MacBook Pro 16-inch (M3 Max)",
    price: 3500000,
    category: "Laptops",
    brand: "Apple",
    averageRating: 4.9,
    reviews: 120,
    tag: "hot",
    featured: true,
    stock: 15,
    img: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    description: "The ultimate pro laptop. M3 Max chip, stunning Liquid Retina XDR display, and up to 22 hours of battery life."
  },
  {
    name: "iPhone 15 Pro Max - 256GB",
    price: 1800000,
    category: "Smartphones",
    brand: "Apple",
    averageRating: 4.8,
    reviews: 85,
    tag: "new",
    featured: true,
    stock: 25,
    img: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    description: "Forged in titanium. A17 Pro chip. 48MP Main camera. USB-C."
  },
  {
    name: "Samsung Galaxy S24 Ultra",
    price: 1750000,
    category: "Smartphones",
    brand: "Samsung",
    averageRating: 4.7,
    reviews: 64,
    tag: "hot",
    featured: true,
    stock: 10,
    img: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    description: "Galaxy AI is here. Welcome to the era of mobile AI."
  },
  {
    name: "Sony WH-1000XM5 Wireless Headphones",
    price: 350000,
    category: "Audio",
    brand: "Sony",
    averageRating: 4.8,
    reviews: 210,
    tag: "",
    featured: false,
    stock: 40,
    img: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    description: "Industry-leading noise cancellation with multiple microphones."
  },
  {
    name: "iPad Air (5th Generation)",
    price: 850000,
    category: "Tablets",
    brand: "Apple",
    averageRating: 4.6,
    reviews: 90,
    tag: "new",
    featured: false,
    stock: 20,
    img: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    description: "Light. Bright. Full of might. Supercharged by the Apple M1 chip."
  },
  {
    name: "Anker 737 Power Bank (PowerCore 24K)",
    price: 120000,
    category: "Power Banks",
    brand: "Anker",
    averageRating: 4.5,
    reviews: 45,
    tag: "hot",
    featured: true,
    stock: 50,
    img: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    description: "Ultra-powerful 24,000mAh portable charger with 140W output."
  }
];

async function seed() {
  console.log("Seeding products...");
  const colRef = collection(db, "products");
  
  // Optional: clear existing (skip for now to avoid deleting user's own data if they added some)
  
  let count = 0;
  for (const prod of products) {
    try {
      await addDoc(colRef, prod);
      count++;
    } catch (e) {
      console.error("Error adding product", prod.name, e);
    }
  }
  
  console.log(`Successfully added ${count} products.`);
  process.exit(0);
}

seed();
