import { doc, updateDoc, getDoc, Timestamp, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Inventory Management Service
 * Handles product stock, visibility, and inventory status
 */

export const INVENTORY_STATUS = {
  IN_STOCK: 'in_stock',
  OUT_OF_STOCK: 'out_of_stock',
  DISCONTINUED: 'discontinued'
};

/**
 * Initialize product with inventory fields
 * Should be called when creating a new product
 * @param {Object} product - Product data
 * @returns {Object} Product with inventory fields
 */
export const initializeProductInventory = (product) => {
  return {
    ...product,
    inventory_status: INVENTORY_STATUS.IN_STOCK,
    items_left: product.items_left || 0,
    unlimited_stock: product.unlimited_stock || false,
    is_hidden: false,
    created_at: Timestamp.now(),
    updated_at: Timestamp.now()
  };
};

/**
 * Update product inventory status
 * @param {string} productId - Product ID
 * @param {number} itemsLeft - Number of items left in stock
 */
export const updateInventoryStatus = async (productId, itemsLeft) => {
  try {
    const productRef = doc(db, 'products', productId);
    
    // Determine inventory status based on items_left
    let inventoryStatus = INVENTORY_STATUS.IN_STOCK;
    if (itemsLeft <= 0) {
      inventoryStatus = INVENTORY_STATUS.OUT_OF_STOCK;
    }

    await updateDoc(productRef, {
      items_left: itemsLeft,
      inventory_status: inventoryStatus,
      updated_at: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating inventory status:', error);
    throw new Error('Failed to update inventory status');
  }
};

/**
 * Atomically decrease product inventory using a Firestore transaction.
 * Prevents race conditions (two buyers purchasing the last item simultaneously).
 * @param {string} productId - Product ID
 * @param {number} quantity - Quantity to decrease
 * @returns {Promise<number>} New stock level
 */
export const decreaseInventory = async (productId, quantity = 1) => {
  try {
    const productRef = doc(db, 'products', productId);
    let newItems;

    await runTransaction(db, async (transaction) => {
      const productSnap = await transaction.get(productRef);

      if (!productSnap.exists()) {
        throw new Error('Product not found');
      }

      const product = productSnap.data();

      // Skip for unlimited stock products
      if (product.unlimited_stock) {
        newItems = product.items_left || 0;
        return;
      }

      const currentItems = product.items_left || 0;
      if (currentItems < quantity) {
        throw new Error(`Insufficient stock for "${product.name || productId}". Only ${currentItems} left.`);
      }

      newItems = currentItems - quantity;
      const inventoryStatus = newItems <= 0 ? INVENTORY_STATUS.OUT_OF_STOCK : INVENTORY_STATUS.IN_STOCK;

      transaction.update(productRef, {
        items_left: newItems,
        inventory_status: inventoryStatus,
        updated_at: Timestamp.now()
      });
    });

    return newItems;
  } catch (error) {
    console.error('Error decreasing inventory:', error);
    throw error;
  }
};

/**
 * Increase product inventory
 * @param {string} productId - Product ID
 * @param {number} quantity - Quantity to increase
 */
export const increaseInventory = async (productId, quantity = 1) => {
  try {
    const productRef = doc(db, 'products', productId);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {
      throw new Error('Product not found');
    }

    const currentItems = productSnap.data().items_left || 0;
    const newItems = currentItems + quantity;

    await updateInventoryStatus(productId, newItems);
    return newItems;
  } catch (error) {
    console.error('Error increasing inventory:', error);
    throw error;
  }
};

/**
 * Set product visibility
 * @param {string} productId - Product ID
 * @param {boolean} isVisible - Whether product should be visible
 */
export const setProductVisibility = async (productId, isVisible) => {
  try {
    const productRef = doc(db, 'products', productId);

    await updateDoc(productRef, {
      is_hidden: !isVisible,
      updated_at: Timestamp.now()
    });
  } catch (error) {
    console.error('Error setting product visibility:', error);
    throw new Error('Failed to set product visibility');
  }
};

/**
 * Set product status
 * @param {string} productId - Product ID
 * @param {string} status - Inventory status (from INVENTORY_STATUS)
 */
export const setInventoryStatus = async (productId, status) => {
  try {
    const validStatuses = Object.values(INVENTORY_STATUS);
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid inventory status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const productRef = doc(db, 'products', productId);

    await updateDoc(productRef, {
      inventory_status: status,
      updated_at: Timestamp.now()
    });
  } catch (error) {
    console.error('Error setting inventory status:', error);
    throw error;
  }
};

/**
 * Check if product is in stock
 * @param {Object} product - Product object
 * @returns {boolean}
 */
export const isProductInStock = (product) => {
  // Default to in stock if fields are missing
  const status = product?.inventory_status || INVENTORY_STATUS.IN_STOCK;
  const unlimitedStock = product?.unlimited_stock || false;
  const itemsLeft = product?.items_left !== undefined ? product.items_left : 5;
  const isHidden = product?.is_hidden || false;
  
  return status === INVENTORY_STATUS.IN_STOCK && 
         (unlimitedStock || itemsLeft > 0) && 
         !isHidden;
};

/**
 * Get stock display text
 * @param {Object} product - Product object
 * @returns {string} Display text for stock status
 */
export const getStockDisplayText = (product) => {
  if (!isProductInStock(product)) {
    return 'Out of Stock';
  }
  
  if (product?.unlimited_stock) {
    return 'In Stock';
  }
  
  const itemsLeft = product?.items_left || 0;
  return `In Stock (${itemsLeft})`;
};

/**
 * Check if product is available for purchase
 * @param {Object} product - Product object
 * @returns {boolean}
 */
export const isProductAvailable = (product) => {
  return !product?.is_hidden && 
         product?.inventory_status !== INVENTORY_STATUS.DISCONTINUED;
};

export default {
  INVENTORY_STATUS,
  initializeProductInventory,
  updateInventoryStatus,
  decreaseInventory,
  increaseInventory,
  setProductVisibility,
  setInventoryStatus,
  isProductInStock,
  isProductAvailable,
  getStockDisplayText
};
