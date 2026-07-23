/**
 * Order Status Constants and Helpers
 */

export const ORDER_STATUSES = {
  PENDING_PAYMENT: 'pending_payment',
  PAYMENT_RECEIVED: 'payment_received',
  DISPATCHED: 'dispatched',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const ORDER_STATUS_CONFIG = {
  pending_payment: {
    step: 1,
    label: 'Order Placed',
    accent: 'gray',
    bgColor: '#f3f4f6',
    textColor: '#6b7280',
    icon: '📋',
    description: 'Your order has been received and is awaiting payment'
  },
  payment_received: {
    step: 2,
    label: 'Payment Confirmed',
    accent: 'green',
    bgColor: '#ecfdf5',
    textColor: '#059669',
    icon: '✅',
    description: 'Payment received. Your package is being prepared'
  },
  dispatched: {
    step: 3,
    label: 'Package Shipped',
    accent: 'blue',
    bgColor: '#eff6ff',
    textColor: '#0284c7',
    icon: '📦',
    description: 'Your package is on its way to you'
  },
  out_for_delivery: {
    step: 4,
    label: 'Out for Delivery',
    accent: 'amber',
    bgColor: '#fffbeb',
    textColor: '#d97706',
    icon: '🚚',
    description: 'Your package is arriving today'
  },
  completed: {
    step: 5,
    label: 'Delivered',
    accent: 'green',
    bgColor: '#ecfdf5',
    textColor: '#059669',
    icon: '🎉',
    description: 'Your order has been successfully delivered'
  },
  cancelled: {
    step: 0,
    label: 'Cancelled',
    accent: 'red',
    bgColor: '#fef2f2',
    textColor: '#dc2626',
    icon: '❌',
    description: 'Your order has been cancelled'
  }
};

/**
 * Get order status configuration
 * @param {string} status - Order status key
 */
export const getOrderStatusConfig = (status) => {
  return ORDER_STATUS_CONFIG[status] || ORDER_STATUS_CONFIG.pending_payment;
};

/**
 * Get stepper step from status
 * @param {string} status - Order status
 */
export const getStepFromStatus = (status) => {
  const config = getOrderStatusConfig(status);
  return config.step;
};

/**
 * Map multiple order statuses to their steps
 * @param {Array} statuses - Array of order statuses
 */
export const getStepperStages = (statuses) => {
  return statuses.map(status => getOrderStatusConfig(status));
};

/**
 * Determine if a status is a terminal status
 * @param {string} status - Order status
 */
export const isTerminalStatus = (status) => {
  return status === ORDER_STATUSES.COMPLETED || status === ORDER_STATUSES.CANCELLED;
};

/**
 * Get color class for status
 * @param {string} status - Order status
 */
export const getStatusColorClass = (status) => {
  const colorMap = {
    gray: 'bg-gray-100 text-gray-800',
    green: 'bg-green-100 text-green-800',
    blue: 'bg-blue-100 text-blue-800',
    amber: 'bg-amber-100 text-amber-800',
    red: 'bg-red-100 text-red-800'
  };
  const config = getOrderStatusConfig(status);
  return colorMap[config.accent] || colorMap.gray;
};

/**
 * Format order ID for display
 * @param {string} orderId - Order ID
 */
export const formatOrderId = (orderId) => {
  if (!orderId) return 'N/A';
  if (orderId.startsWith('ORD-')) return orderId;
  return `ORD-${orderId.substring(0, 8).toUpperCase()}`;
};

/**
 * Format timestamp
 * @param {Date|Timestamp} timestamp - Timestamp
 */
export const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'N/A';
  
  let date;
  if (timestamp.toDate) {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    date = new Date(timestamp);
  }

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  } else if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
};

/**
 * Calculate order total
 * @param {Array} items - Order items
 */
export const calculateOrderTotal = (items) => {
  if (!items || !Array.isArray(items)) return 0;
  
  return items.reduce((total, item) => {
    const itemPrice = item.price || 0;
    const itemQuantity = item.quantity || 1;
    return total + (itemPrice * itemQuantity);
  }, 0);
};

/**
 * Format currency
 * @param {number} amount - Amount in Naira
 */
export const formatCurrency = (amount) => {
  return '₦' + Math.ceil(Number(amount) || 0).toLocaleString('en-NG');
};

export default {
  ORDER_STATUSES,
  ORDER_STATUS_CONFIG,
  getOrderStatusConfig,
  getStepFromStatus,
  getStepperStages,
  isTerminalStatus,
  getStatusColorClass,
  formatOrderId,
  formatTimestamp,
  calculateOrderTotal,
  formatCurrency
};
