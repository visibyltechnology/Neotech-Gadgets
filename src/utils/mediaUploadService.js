import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';

/**
 * Media Upload Service
 * Handles image uploads to Firebase Storage for carousel, products, etc.
 */

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const CAROUSEL_FOLDER = 'carousel';
const PRODUCT_FOLDER = 'products';
const PROOF_OF_DELIVERY_FOLDER = 'proof_of_delivery';

/**
 * Validate image file
 * @param {File} file - File to validate
 * @returns {Object} { valid: boolean, error: string }
 */
export const validateImageFile = (file) => {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` };
  }

  return { valid: true };
};

/**
 * Upload carousel image
 * @param {File} file - Image file to upload
 * @param {string} name - Name/identifier for the image
 * @returns {Promise<string>} Download URL of uploaded image
 */
export const uploadCarouselImage = async (file, name) => {
  try {
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Create unique filename
    const timestamp = Date.now();
    const filename = `${CAROUSEL_FOLDER}/${name}_${timestamp}`;
    const storageRef = ref(storage, filename);

    // Upload file
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
      cacheControl: 'public, max-age=31536000' // 1 year cache
    });

    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading carousel image:', error);
    throw new Error(`Failed to upload carousel image: ${error.message}`);
  }
};

/**
 * Upload product image
 * @param {File} file - Image file to upload
 * @param {string} productId - Product ID
 * @param {number} index - Image index (for multiple images per product)
 * @returns {Promise<string>} Download URL
 */
export const uploadProductImage = async (file, productId, index = 0) => {
  try {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const timestamp = Date.now();
    const filename = `${PRODUCT_FOLDER}/${productId}_${index}_${timestamp}`;
    const storageRef = ref(storage, filename);

    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
      cacheControl: 'public, max-age=31536000'
    });

    return await getDownloadURL(snapshot.ref);
  } catch (error) {
    console.error('Error uploading product image:', error);
    throw new Error(`Failed to upload product image: ${error.message}`);
  }
};

/**
 * Upload proof of delivery image
 * @param {File} file - Image file to upload
 * @param {string} orderId - Order ID
 * @returns {Promise<string>} Download URL
 */
export const uploadProofOfDeliveryImage = async (file, orderId) => {
  try {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const timestamp = Date.now();
    const filename = `${PROOF_OF_DELIVERY_FOLDER}/${orderId}_${timestamp}`;
    const storageRef = ref(storage, filename);

    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
      cacheControl: 'public, max-age=31536000'
    });

    return await getDownloadURL(snapshot.ref);
  } catch (error) {
    console.error('Error uploading proof of delivery:', error);
    throw new Error(`Failed to upload proof of delivery: ${error.message}`);
  }
};

/**
 * Delete image from storage
 * @param {string} downloadURL - Full download URL of image to delete
 * @returns {Promise<void>}
 */
export const deleteImage = async (downloadURL) => {
  try {
    if (!downloadURL) {
      throw new Error('No URL provided');
    }

    // Extract the path from the download URL
    const parts = downloadURL.split('/');
    const fileIndex = parts.findIndex(p => p === 'o');
    if (fileIndex === -1) {
      throw new Error('Invalid download URL');
    }

    const filePath = decodeURIComponent(parts[fileIndex + 1].split('?')[0]);
    const fileRef = ref(storage, filePath);

    await deleteObject(fileRef);
  } catch (error) {
    console.error('Error deleting image:', error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
};

/**
 * Upload image from URL (if external URL provided)
 * Falls back to local upload if needed
 * @param {string} urlOrFile - URL or File object
 * @param {string} folder - Folder to save in
 * @param {string} name - Name/identifier
 * @returns {Promise<string>} Download URL
 */
export const uploadImageFromURLOrFile = async (urlOrFile, folder = CAROUSEL_FOLDER, name) => {
  try {
    // If it's a string (URL), return it as-is (assuming it's already a valid URL)
    if (typeof urlOrFile === 'string') {
      // In production, you might want to validate the URL
      // or cache it by downloading and re-uploading
      return urlOrFile;
    }

    // If it's a File object, upload it
    if (urlOrFile instanceof File) {
      const timestamp = Date.now();
      const filename = `${folder}/${name || 'image'}_${timestamp}`;
      const storageRef = ref(storage, filename);

      const snapshot = await uploadBytes(storageRef, urlOrFile, {
        contentType: urlOrFile.type,
        cacheControl: 'public, max-age=31536000'
      });

      return await getDownloadURL(snapshot.ref);
    }

    throw new Error('Invalid input: must be URL string or File object');
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

/**
 * Compress image before upload (for optimization)
 * Note: This is a basic implementation. In production, use imagemin or similar
 * @param {File} file - File to compress
 * @returns {Promise<File>} Compressed file
 */
export const compressImage = async (file) => {
  // For now, just return the file as-is
  // In production, use a library like imagemin or image-js
  return file;
};

export default {
  uploadCarouselImage,
  uploadProductImage,
  uploadProofOfDeliveryImage,
  deleteImage,
  uploadImageFromURLOrFile,
  validateImageFile,
  compressImage,
  MAX_FILE_SIZE,
  ALLOWED_IMAGE_TYPES
};
