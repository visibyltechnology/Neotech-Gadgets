const CLOUD_NAME = "drb9g2h5";
const UPLOAD_PRESET = "neotech";
const ASSET_FOLDER = "products";

/**
 * Upload an image file to Cloudinary.
 * Uses the unsigned "neotech" preset → products/ asset folder.
 * @param {File} file
 * @returns {Promise<string>} Secure URL of the uploaded image
 */
export const uploadImage = async (file) => {
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
  const formData = new FormData();

  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("asset_folder", ASSET_FOLDER);

  try {
    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(
        errData?.error?.message ||
          "Failed to upload image. Check your Cloud Name and Preset."
      );
    }

    const data = await response.json();
    return data.secure_url; // Hosted Cloudinary URL
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};
