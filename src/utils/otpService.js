import { collection, addDoc, query, where, getDocs, updateDoc, doc, Timestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * OTP Service - Handles OTP generation, storage, and verification
 */

const OTP_COLLECTION = 'otp_codes';
const OTP_EXPIRATION_MINUTES = 10;

/**
 * Generate a random 6-digit OTP
 * @returns {string} 6-digit OTP
 */
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Hash OTP using SHA-256 for secure storage
 * @param {string} otp - OTP to hash
 * @returns {Promise<string>} Hex-encoded hash
 */
export const hashOTP = async (otp) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(otp);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Verify OTP against its SHA-256 hash
 * @param {string} otp - Plain OTP
 * @param {string} hash - SHA-256 hex hash
 * @returns {Promise<boolean>}
 */
export const verifyOTPHash = async (otp, hash) => {
  const computedHash = await hashOTP(otp);
  return computedHash === hash;
};

/**
 * Generate and store OTP for user registration/email verification
 * @param {string} email - User email
 * @param {string} type - OTP type ('registration' | 'password_reset' | 'email_verification')
 * @returns {Promise<string>} The generated OTP (for demo/testing, in production send via SMS/Email)
 */
export const generateAndStoreOTP = async (email, type = 'registration') => {
  try {
    const otp = generateOTP();
    const hashedOTP = await hashOTP(otp);
    const expiresAt = Timestamp.fromDate(
      new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000)
    );

    await addDoc(collection(db, OTP_COLLECTION), {
      email,
      type,
      otp_hash: hashedOTP,
      created_at: Timestamp.now(),
      expires_at: expiresAt,
      verified: false,
      attempts: 0,
      max_attempts: 5
    });

    return otp; // In production, don't return OTP, send via SMS/Email
  } catch (error) {
    console.error('Error generating OTP:', error);
    throw new Error('Failed to generate OTP');
  }
};

/**
 * Verify OTP for user
 * @param {string} email - User email
 * @param {string} otp - OTP to verify
 * @param {string} type - OTP type
 * @returns {Promise<boolean>}
 */
export const verifyOTP = async (email, otp, type = 'registration') => {
  try {
    const q = query(
      collection(db, OTP_COLLECTION),
      where('email', '==', email),
      where('type', '==', type),
      where('verified', '==', false)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      throw new Error('No active OTP found for this email');
    }

    const otpDoc = snapshot.docs[0];
    const data = otpDoc.data();

    // Check if OTP has expired
    if (data.expires_at.toDate() < new Date()) {
      throw new Error('OTP has expired');
    }

    // Check max attempts
    if (data.attempts >= data.max_attempts) {
      await deleteDoc(otpDoc.ref);
      throw new Error('Maximum OTP attempts exceeded. Please request a new OTP');
    }

    // Verify OTP
    if (!await verifyOTPHash(otp, data.otp_hash)) {
      // Increment attempts
      await updateDoc(otpDoc.ref, {
        attempts: data.attempts + 1
      });
      throw new Error('Invalid OTP. Please try again');
    }

    // Mark as verified
    await updateDoc(otpDoc.ref, {
      verified: true,
      verified_at: Timestamp.now()
    });

    return true;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    throw error;
  }
};

/**
 * Generate OTP for delivery verification
 * @param {string} orderId - Order ID
 * @param {string} deliveryEmail - Delivery contact email
 * @returns {Promise<string>} Generated OTP
 */
export const generateDeliveryOTP = async (orderId, deliveryEmail) => {
  try {
    const otp = generateOTP();
    const hashedOTP = await hashOTP(otp);
    const expiresAt = Timestamp.fromDate(
      new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000)
    );

    await addDoc(collection(db, OTP_COLLECTION), {
      order_id: orderId,
      email: deliveryEmail,
      type: 'delivery_verification',
      otp_hash: hashedOTP,
      created_at: Timestamp.now(),
      expires_at: expiresAt,
      verified: false,
      attempts: 0,
      max_attempts: 5
    });

    return otp;
  } catch (error) {
    console.error('Error generating delivery OTP:', error);
    throw new Error('Failed to generate delivery OTP');
  }
};

/**
 * Verify delivery OTP
 * @param {string} orderId - Order ID
 * @param {string} otp - OTP to verify
 * @returns {Promise<boolean>}
 */
export const verifyDeliveryOTP = async (orderId, otp) => {
  try {
    const q = query(
      collection(db, OTP_COLLECTION),
      where('order_id', '==', orderId),
      where('type', '==', 'delivery_verification'),
      where('verified', '==', false)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      throw new Error('No active delivery OTP found for this order');
    }

    const otpDoc = snapshot.docs[0];
    const data = otpDoc.data();

    // Check if OTP has expired
    if (data.expires_at.toDate() < new Date()) {
      throw new Error('Delivery OTP has expired');
    }

    // Check max attempts
    if (data.attempts >= data.max_attempts) {
      await deleteDoc(otpDoc.ref);
      throw new Error('Maximum OTP attempts exceeded');
    }

    // Verify OTP
    if (!await verifyOTPHash(otp, data.otp_hash)) {
      await updateDoc(otpDoc.ref, {
        attempts: data.attempts + 1
      });
      throw new Error('Invalid OTP');
    }

    // Mark as verified
    await updateDoc(otpDoc.ref, {
      verified: true,
      verified_at: Timestamp.now()
    });

    return true;
  } catch (error) {
    console.error('Error verifying delivery OTP:', error);
    throw error;
  }
};

/**
 * Clean up expired OTPs
 * Should be run periodically (e.g., via Cloud Function)
 */
export const cleanupExpiredOTPs = async () => {
  try {
    const q = query(
      collection(db, OTP_COLLECTION),
      where('expires_at', '<', Timestamp.now())
    );

    const snapshot = await getDocs(q);
    const batch = [];

    snapshot.forEach((doc) => {
      batch.push(deleteDoc(doc.ref));
    });

    await Promise.all(batch);
    console.log(`Cleaned up ${batch.length} expired OTPs`);
  } catch (error) {
    console.error('Error cleaning up expired OTPs:', error);
  }
};

export default {
  generateOTP,
  generateAndStoreOTP,
  verifyOTP,
  generateDeliveryOTP,
  verifyDeliveryOTP,
  cleanupExpiredOTPs,
  OTP_EXPIRATION_MINUTES
};
