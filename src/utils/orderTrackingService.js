import { doc, updateDoc, getDoc, Timestamp, addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { generateDeliveryOTP } from './otpService';
import { createOrderOTPNotification, createTrackingUpdateNotification } from './notificationService';

/**
 * Order Tracking Service
 * Handles order status tracking and delivery management
 */

export const ORDER_STATUS = {
  PENDING: 'Pending',
  PAID: 'Paid',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  RETURNED: 'Returned'
};

/**
 * Initialize order with tracking fields
 * Should be called when creating a new order
 * @param {Object} order - Order data
 * @param {number} deliveryDays - Days until delivery (default: 3)
 * @returns {Object} Order with tracking fields
 */
export const initializeOrderTracking = (order, deliveryDays = 3) => {
  const deliveryDueDate = new Date();
  deliveryDueDate.setDate(deliveryDueDate.getDate() + deliveryDays);

  return {
    ...order,
    tracking_status: ORDER_STATUS.PENDING,
    delivery_due_date: Timestamp.fromDate(deliveryDueDate),
    delivery_otp: null,
    delivery_otp_hash: null,
    delivery_token: null,
    proof_of_delivery_image: null,
    delivery_confirmed_at: null,
    delivery_confirmed_by: null,
    created_at: Timestamp.now(),
    updated_at: Timestamp.now(),
    status_history: [
      {
        status: ORDER_STATUS.PENDING,
        timestamp: Timestamp.now(),
        notes: 'Order created'
      }
    ]
  };
};

/**
 * Update order tracking status
 * @param {string} orderId - Order ID
 * @param {string} newStatus - New status (from ORDER_STATUS)
 * @param {string} notes - Optional notes about the status change
 */
export const updateOrderStatus = async (orderId, newStatus, notes = '') => {
  try {
    const validStatuses = Object.values(ORDER_STATUS);
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid order status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      throw new Error('Order not found');
    }

    const statusHistory = orderSnap.data().status_history || [];
    statusHistory.push({
      status: newStatus,
      timestamp: Timestamp.now(),
      notes
    });

    await updateDoc(orderRef, {
      tracking_status: newStatus,
      status_history: statusHistory,
      updated_at: Timestamp.now()
    });

    try {
      const orderData = orderSnap.data();
      const userId = orderData.userId || orderData.user_id;
      if (userId) {
        await createTrackingUpdateNotification(userId, orderId, newStatus, notes);
      }
    } catch (notifErr) {
      console.error('Failed to create tracking update notification:', notifErr);
    }
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

/**
 * Mark order as shipped and generate delivery OTP
 * @param {string} orderId - Order ID
 * @param {string} deliveryEmail - Delivery email address
 * @returns {Promise<string>} Generated OTP
 */
export const shipOrder = async (orderId, deliveryEmail) => {
  try {
    // Generate OTP for delivery verification
    const otp = await generateDeliveryOTP(orderId, deliveryEmail);

    // Update order status
    await updateOrderStatus(
      orderId,
      ORDER_STATUS.SHIPPED,
      `Order shipped. Delivery OTP sent to ${deliveryEmail}`
    );

    // Update order with OTP (in production, hash the OTP)
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      delivery_otp: otp, // In production, store hashed OTP only
      delivery_token: generateDeliveryToken(orderId),
      updated_at: Timestamp.now()
    });

    // Notify user via notifications collection (if order has user info)
    try {
      const orderSnap = await getDoc(orderRef);
      const orderData = orderSnap.exists() ? orderSnap.data() : null;
      const userId = orderData?.userId || orderData?.user_id || null;
      if (userId) {
        await createOrderOTPNotification(userId, orderId, otp);
      }
    } catch (notifErr) {
      // Log but don't fail the whole operation
      console.error('Failed to create order OTP notification:', notifErr);
    }

    return otp;
  } catch (error) {
    console.error('Error shipping order:', error);
    throw error;
  }
};

/**
 * Generate unique delivery token for rider portal link
 * @param {string} orderId - Order ID
 * @returns {string} Unique token
 */
export const generateDeliveryToken = (orderId) => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substr(2, 9);
  return `${orderId}_${timestamp}_${randomStr}`;
};

/**
 * Confirm delivery and upload proof image
 * @param {string} orderId - Order ID
 * @param {string} imageUrl - URL of proof of delivery image
 * @param {string} riderId - ID of delivery rider confirming
 */
export const confirmDelivery = async (orderId, imageUrl, riderId) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    
    await updateDoc(orderRef, {
      tracking_status: ORDER_STATUS.DELIVERED,
      proof_of_delivery_image: imageUrl,
      delivery_confirmed_at: Timestamp.now(),
      delivery_confirmed_by: riderId,
      updated_at: Timestamp.now()
    });

    // Add status to history
    await updateOrderStatus(orderId, ORDER_STATUS.DELIVERED, 'Delivery confirmed by rider');
  } catch (error) {
    console.error('Error confirming delivery:', error);
    throw error;
  }
};

/**
 * Get order with tracking information
 * @param {string} orderId - Order ID
 * @returns {Promise<Object>} Order data with tracking info
 */
export const getOrderTracking = async (orderId) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      throw new Error('Order not found');
    }

    return orderSnap.data();
  } catch (error) {
    console.error('Error getting order tracking:', error);
    throw error;
  }
};

/**
 * Validate delivery token
 * @param {string} orderId - Order ID
 * @param {string} token - Delivery token to validate
 * @returns {Promise<boolean>}
 */
export const validateDeliveryToken = async (orderId, token) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      return false;
    }

    const order = orderSnap.data();
    return order.delivery_token === token && order.tracking_status === ORDER_STATUS.SHIPPED;
  } catch (error) {
    console.error('Error validating delivery token:', error);
    return false;
  }
};

/**
 * Get delivery-related orders
 * Used for delivery rider portal
 * @param {string} riderEmail - Rider email
 * @returns {Promise<Array>} Array of orders
 */
export const getDeliveriesForRider = async (riderEmail) => {
  try {
    // This would be more complex in production
    // You'd want to query orders assigned to this rider
    // For now, returning placeholder
    return [];
  } catch (error) {
    console.error('Error getting rider deliveries:', error);
    throw error;
  }
};

export default {
  ORDER_STATUS,
  initializeOrderTracking,
  updateOrderStatus,
  shipOrder,
  confirmDelivery,
  getOrderTracking,
  validateDeliveryToken,
  getDeliveriesForRider,
  generateDeliveryToken
};
