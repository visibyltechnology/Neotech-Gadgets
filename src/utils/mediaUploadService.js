/**
 * Media Upload Service
 * Handles image uploads to Cloudinary for carousel, products, etc.
 */

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

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

const uploadToCloudinary = async (file, folderName) => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset || cloudName === 'your_cloud_name') {
    throw new Error("Cloudinary configuration missing. Please add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to .env file.");
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', folderName); // Cloudinary folder structure

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to upload to Cloudinary');
  }
  
  return data.secure_url;
};

export const uploadCarouselImage = async (file, name) => {
  const validation = validateImageFile(file);
  if (!validation.valid) throw new Error(validation.error);
  return await uploadToCloudinary(file, 'carousel');
};

export const uploadProductImage = async (file, productId, index = 0) => {
  const validation = validateImageFile(file);
  if (!validation.valid) throw new Error(validation.error);
  return await uploadToCloudinary(file, `products/${productId}`);
};

export const uploadProofOfDeliveryImage = async (file, orderId) => {
  const validation = validateImageFile(file);
  if (!validation.valid) throw new Error(validation.error);
  return await uploadToCloudinary(file, `proof_of_delivery/${orderId}`);
};

export const deleteImage = async (downloadURL) => {
  // Cloudinary unsigned uploads can't be deleted purely from frontend safely
  console.warn("Client-side deletion is not supported for unsigned Cloudinary uploads.");
  return Promise.resolve();
};

export const uploadImageFromURLOrFile = async (urlOrFile, folder = 'carousel', name) => {
  if (typeof urlOrFile === 'string') return urlOrFile;
  if (urlOrFile instanceof File) {
    return await uploadToCloudinary(urlOrFile, folder);
  }
  throw new Error('Invalid input: must be URL string or File object');
};

export const compressImage = async (file) => {
  return file;
};

export const uploadSwapDocument = async (file, userId, docType) => {
  const validation = validateImageFile(file);
  if (!validation.valid) throw new Error(validation.error);
  return await uploadToCloudinary(file, `swap_documents/${userId}`);
};

export default {
  uploadCarouselImage,
  uploadProductImage,
  uploadProofOfDeliveryImage,
  deleteImage,
  uploadImageFromURLOrFile,
  validateImageFile,
  compressImage,
  uploadSwapDocument,
  MAX_FILE_SIZE,
  ALLOWED_IMAGE_TYPES
};
