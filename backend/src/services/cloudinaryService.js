const { v2: cloudinary } = require('cloudinary');
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a local file to Cloudinary and delete the local copy.
 * @param {string} localPath  - Absolute path to the local file
 * @param {string} mimeType   - MIME type (to detect resource_type)
 * @param {string} folder     - Cloudinary folder name
 * @returns {Promise<{url: string, publicId: string}>}
 */
async function uploadToCloud(localPath, mimeType, folder = 'student-ai') {
  let resource_type = 'raw'; // default for docs
  if (mimeType.startsWith('audio/')) resource_type = 'video'; // Cloudinary uses 'video' for audio too
  if (mimeType.startsWith('video/')) resource_type = 'video';
  if (mimeType.startsWith('image/')) resource_type = 'image';

  const result = await cloudinary.uploader.upload(localPath, {
    resource_type,
    folder,
    use_filename: true,
    unique_filename: true,
  });

  // Delete local file after successful cloud upload
  try {
    if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
    console.log(`🗑️  [Cloudinary] Local file deleted: ${localPath}`);
  } catch (e) {
    console.warn(`⚠️  [Cloudinary] Could not delete local file: ${e.message}`);
  }

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
}

/**
 * Delete a file from Cloudinary by its public_id.
 * @param {string} publicId
 * @param {string} mimeType - Used to determine resource_type
 */
async function deleteFromCloud(publicId, mimeType = '') {
  if (!publicId) return;
  let resource_type = 'raw';
  if (mimeType.startsWith('audio/') || mimeType.startsWith('video/')) resource_type = 'video';
  if (mimeType.startsWith('image/')) resource_type = 'image';

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type });
    console.log(`🗑️  [Cloudinary] Cloud file deleted: ${publicId}`);
  } catch (e) {
    console.warn(`⚠️  [Cloudinary] Could not delete from cloud: ${e.message}`);
  }
}

module.exports = { uploadToCloud, deleteFromCloud };
