import express from 'express';
import { protect } from '../../middleware/auth.js';
import { uploadMediaMulter } from '../../config/cloudinary.js';

const router = express.Router();

router.post('/', protect, uploadMediaMulter.single('media'), (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided.' });
    }

    // Determine the type purely based on Cloudinary's detected resource_type
    const resourceType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';

    res.status(201).json({
      success: true,
      media: {
        url: req.file.path, // The Cloudinary URL
        type: resourceType,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
