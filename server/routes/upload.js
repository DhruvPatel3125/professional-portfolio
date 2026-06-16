import express from 'express';
import multer from 'multer';
import { requireAdmin } from '../middlewares/authMiddleware.js';
import cloudinary from '../config/cloudinary.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Print config to console on module load
const cConfig = cloudinary.config();
console.log('[Cloudinary] Initialized with:', {
  cloud_name: cConfig.cloud_name,
  api_key: cConfig.api_key,
  has_secret: !!cConfig.api_secret
});

router.post('/', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'portfolio' },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return res.status(500).json({ 
            error: 'Cloudinary upload failed.', 
            details: error.message || error 
          });
        }
        res.json({
          success: true,
          url: result.secure_url
        });
      }
    );

    uploadStream.end(req.file.buffer);
  } catch (err) {
    console.error('Upload handler error:', err);
    res.status(500).json({ error: 'Server error during upload.' });
  }
});

export default router;
