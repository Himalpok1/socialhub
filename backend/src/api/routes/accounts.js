import express from 'express';
import {
  getAccounts,
  connectAccount,
  handleCallback,
  disconnectAccount,
  refreshAccountToken,
} from '../../controllers/accountsController.js';
import { protect } from '../../middleware/auth.js';

const router = express.Router();

// Allow unauthenticated incoming callbacks and TikTok verification files
router.get('/callback/:platform', handleCallback);
router.get('/callback/:platform/:filename', (req, res, next) => {
  if (req.params.filename.endsWith('.txt') && process.env.TIKTOK_VERIFY_FILE === req.params.filename) {
    return res.type('text/plain').send(process.env.TIKTOK_VERIFY_CONTENT);
  }
  next();
});

router.use(protect);
router.get('/', getAccounts);
router.post('/connect/:platform', connectAccount);
router.delete('/:id', disconnectAccount);
router.post('/:id/refresh', refreshAccountToken);

export default router;
