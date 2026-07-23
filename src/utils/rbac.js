/**
 * Role-Based Access Control (RBAC) Utilities
 * Provides middleware and helper functions for role-based access
 */

export const USER_ROLES = {
  ADMIN: 'admin',
  DELIVERY_RIDER: 'delivery_rider',
  CUSTOMER: 'customer'
};

/**
 * Check if user has admin role
 * @param {Object} user - User object from auth store
 * @returns {boolean}
 */
export const isAdmin = (userData) => {
  return userData?.isAdmin === true;
};

/**
 * Get user role based on user data
 * @param {Object} user - User object
 * @param {Object} userData - User data from Firestore
 * @returns {string} User role
 */
export const getUserRole = (user, userData) => {
  if (isAdmin(userData)) return USER_ROLES.ADMIN;
  if (userData?.role === USER_ROLES.DELIVERY_RIDER) return USER_ROLES.DELIVERY_RIDER;
  return USER_ROLES.CUSTOMER;
};

/**
 * Check if user can access cart/checkout
 * @param {Object} user - User object from auth store
 * @returns {boolean}
 */
export const canAccessCart = (userData) => {
  // Admin users should NOT have cart access
  return !isAdmin(userData);
};

/**
 * Check if user can access admin dashboard
 * @param {Object} user - User object from auth store
 * @returns {boolean}
 */
export const canAccessAdmin = (userData) => {
  return isAdmin(userData);
};

/**
 * Check if user can access delivery portal
 * @param {Object} userData - User data from Firestore
 * @returns {boolean}
 */
export const canAccessDeliveryPortal = (userData) => {
  return userData?.role === USER_ROLES.DELIVERY_RIDER;
};

/**
 * Prevent admin from interacting with cart
 * Should be called before any cart operations
 * @param {Object} user - User object
 * @throws {Error} If user is admin
 */
export const checkCartAccess = (userData) => {
  if (isAdmin(userData)) {
    throw new Error('Admin accounts cannot access cart or checkout functionality');
  }
};

export default {
  USER_ROLES,
  isAdmin,
  getUserRole,
  canAccessCart,
  canAccessAdmin,
  canAccessDeliveryPortal,
  checkCartAccess
};
