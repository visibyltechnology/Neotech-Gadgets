import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  getDocs, 
  orderBy,
  Timestamp,
  onSnapshot,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Notification Types
 */
export const NOTIFICATION_TYPES = {
  PAYMENT_SUCCESS: 'PAYMENT_SUCCESS',
  ORDER_OTP: 'ORDER_OTP',
  TRACKING_UPDATE: 'TRACKING_UPDATE',
  ORDER_PLACED: 'ORDER_PLACED',
  GENERAL: 'GENERAL',
  CART_REMINDER: 'CART_REMINDER',
  STOCK_ALERT: 'STOCK_ALERT'
};

/**
 * Order Status Mapping for Stepper
 */
export const ORDER_STATUS_STEPS = {
  Pending: { step: 1, label: 'Order Placed', accent: 'gray' },
  Paid: { step: 2, label: 'Payment Confirmed', accent: 'green' },
  Processing: { step: 3, label: 'Processing', accent: 'blue' },
  Shipped: { step: 4, label: 'Package Shipped', accent: 'blue' },
  Delivered: { step: 5, label: 'Delivered', accent: 'green' },
  Cancelled: { step: 6, label: 'Cancelled', accent: 'red' },
  Returned: { step: 7, label: 'Returned', accent: 'red' }
};

/**
 * Create a notification
 * @param {string} userId - User ID
 * @param {string} type - Notification type (from NOTIFICATION_TYPES)
 * @param {Object} data - Notification data
 * @returns {Promise<string>} - Notification ID
 */
export const createNotification = async (userId, type, data) => {
  try {
    const notificationData = {
      user_id: userId,
      type: type,
      title: data.title || '',
      message: data.message || '',
      status: 'unread',
      metadata: data.metadata || {},
      created_at: Timestamp.now()
    };

    const docRef = await addDoc(
      collection(db, 'notifications'),
      notificationData
    );

    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw new Error('Failed to create notification');
  }
};

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const notifRef = doc(db, 'notifications', notificationId);
    await updateDoc(notifRef, {
      status: 'read',
      read_at: Timestamp.now()
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read
 * @param {string} userId - User ID
 */
export const markAllNotificationsAsRead = async (userId) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('user_id', '==', userId),
      where('status', '==', 'unread')
    );
    const querySnapshot = await getDocs(q);
    
    const batch = [];
    querySnapshot.forEach((doc) => {
      batch.push(
        updateDoc(doc.ref, {
          status: 'read',
          read_at: Timestamp.now()
        })
      );
    });

    await Promise.all(batch);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * Get user notifications with real-time listener
 * @param {string} userId - User ID
 * @param {Function} callback - Callback function with notifications
 * @returns {Function} - Unsubscribe function
 */
export const subscribeToUserNotifications = (userId, callback) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('user_id', '==', userId),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const notifications = [];
      querySnapshot.forEach((doc) => {
        notifications.push({ id: doc.id, ...doc.data() });
      });
      // Sort by created_at in descending order (newest first)
      notifications.sort((a, b) => {
        const timeA = a.created_at?.toMillis?.() || 0;
        const timeB = b.created_at?.toMillis?.() || 0;
        return timeB - timeA;
      });
      callback(notifications);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error subscribing to notifications:', error);
    throw error;
  }
};

/**
 * Get user notifications (one-time fetch)
 * @param {string} userId - User ID
 * @param {number} limitCount - Limit number of notifications
 */
export const getUserNotifications = async (userId, limitCount = 20) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('user_id', '==', userId),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const notifications = [];
    querySnapshot.forEach((doc) => {
      notifications.push({ id: doc.id, ...doc.data() });
    });

    // Sort by created_at in descending order (newest first)
    notifications.sort((a, b) => {
      const timeA = a.created_at?.toMillis?.() || 0;
      const timeB = b.created_at?.toMillis?.() || 0;
      return timeB - timeA;
    });

    return notifications;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

/**
 * Get unread notification count
 * @param {string} userId - User ID
 */
export const getUnreadNotificationCount = async (userId) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('user_id', '==', userId),
      where('status', '==', 'unread')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

/**
 * Subscribe to unread notification count with real-time listener
 * @param {string} userId - User ID
 * @param {Function} callback - Callback with count
 * @returns {Function} - Unsubscribe function
 */
export const subscribeToUnreadCount = (userId, callback) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('user_id', '==', userId),
      where('status', '==', 'unread')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      callback(querySnapshot.size);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error subscribing to unread count:', error);
    throw error;
  }
};

/**
 * Create payment success notification
 * @param {string} userId - User ID
 * @param {string} orderId - Order ID
 * @param {number} amount - Payment amount
 * @param {Object} orderData - Order data (items, total, etc.)
 */
export const createPaymentSuccessNotification = async (userId, orderId, amount, orderData = {}) => {
  // Prevent duplicate notifications within 5 seconds
  try {
    const recentNotifs = await getDocs(
      query(
        collection(db, 'notifications'),
        where('user_id', '==', userId),
        where('type', '==', NOTIFICATION_TYPES.PAYMENT_SUCCESS),
        where('metadata.order_id', '==', orderId),
        orderBy('created_at', 'desc'),
        limit(1)
      )
    );

    if (recentNotifs.size > 0) {
      const lastNotif = recentNotifs.docs[0].data();
      const timeDiff = Date.now() - lastNotif.created_at.toDate().getTime();
      // Skip if notif created within 5 seconds
      if (timeDiff < 5000 && Math.abs(lastNotif.metadata.amount - amount) < 10) {
        console.log('Duplicate payment notification blocked');
        return lastNotif.id;
      }
    }
  } catch (err) {
    console.warn('Could not check for duplicates:', err);
  }

  // Build rich message with order details
  const roundedAmount = Math.ceil(amount);
  const itemsInfo = orderData.itemCount ? `${orderData.itemCount} item${orderData.itemCount > 1 ? 's' : ''}` : 'items';
  const isInstallment = orderData.paymentFrequency ? `(${orderData.paymentFrequency === 'weekly' ? 'weekly' : 'monthly'} payment)` : '';
  const remainingText = orderData.remainingBalance > 0 
    ? `\nRemaining Balance: ₦${Math.ceil(orderData.remainingBalance).toLocaleString()}`
    : '\n✓ Order fully paid';

  return createNotification(userId, NOTIFICATION_TYPES.PAYMENT_SUCCESS, {
    title: 'Payment Confirmed! 💳',
    message: `Payment of ₦${roundedAmount.toLocaleString()} received for ${itemsInfo} ${isInstallment}.${remainingText}`,
    metadata: {
      order_id: orderId,
      amount: roundedAmount,
      item_count: orderData.itemCount,
      remaining_balance: orderData.remainingBalance,
      payment_frequency: orderData.paymentFrequency,
      timestamp: new Date().toISOString()
    }
  });
};

/**
 * Create order OTP notification
 * @param {string} userId - User ID
 * @param {string} orderId - Order ID
 * @param {string} otpCode - OTP code
 */
export const createOrderOTPNotification = async (userId, orderId, otpCode) => {
  // Send email notification (non-blocking)
  sendOrderOTPEmail(userId, orderId, otpCode).catch(err =>
    console.error('[notificationService] sendOrderOTPEmail failed:', err)
  );

  return createNotification(userId, NOTIFICATION_TYPES.ORDER_OTP, {
    title: 'Your Package is Out for Delivery! 🚚',
    message: `Your order is on its way. Share this OTP with your dispatch rider: ${otpCode}`,
    metadata: {
      order_id: orderId,
      otp_code: otpCode,
      timestamp: new Date().toISOString()
    }
  });
};

/**
 * Create tracking update notification
 * @param {string} userId - User ID
 * @param {string} orderId - Order ID
 * @param {string} status - Tracking status
 * @param {string} location - Location update
 */
export const createTrackingUpdateNotification = async (userId, orderId, status, location) => {
  const statusInfo = ORDER_STATUS_STEPS[status] || { label: 'Update', accent: 'blue' };

  // Send email notification (non-blocking)
  sendTrackingUpdateEmail(userId, orderId, status, location || '').catch(err =>
    console.error('[notificationService] sendTrackingUpdateEmail failed:', err)
  );

  return createNotification(userId, NOTIFICATION_TYPES.TRACKING_UPDATE, {
    title: `Order Update: ${statusInfo.label} 📦`,
    message: location || `Your order status has been updated to: ${statusInfo.label}`,
    metadata: {
      order_id: orderId,
      tracking_status: status,
      location: location,
      timestamp: new Date().toISOString()
    }
  });
};

/**
 * Create order placed notification
 * @param {string} userId - User ID
 * @param {string} orderId - Order ID
 * @param {number} itemCount - Number of items
 */
export const createOrderPlacedNotification = async (userId, orderId, itemCount) => {
  return createNotification(userId, NOTIFICATION_TYPES.ORDER_PLACED, {
    title: 'Order Placed Successfully! ✅',
    message: `Your order #${orderId} with ${itemCount} item${itemCount > 1 ? 's' : ''} has been received. Waiting for payment confirmation.`,
    metadata: {
      order_id: orderId,
      item_count: itemCount,
      timestamp: new Date().toISOString()
    }
  });
};

/**
 * Delete a notification
 * @param {string} notificationId - Notification ID
 */
export const deleteNotification = async (notificationId) => {
  try {
    // Soft delete - just mark as deleted
    const notifRef = doc(db, 'notifications', notificationId);
    await updateDoc(notifRef, {
      is_deleted: true,
      deleted_at: Timestamp.now()
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

export default {
  NOTIFICATION_TYPES,
  ORDER_STATUS_STEPS,
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  subscribeToUserNotifications,
  getUserNotifications,
  getUnreadNotificationCount,
  subscribeToUnreadCount,
  createPaymentSuccessNotification,
  createOrderOTPNotification,
  createTrackingUpdateNotification,
  createOrderPlacedNotification,
  deleteNotification
};
