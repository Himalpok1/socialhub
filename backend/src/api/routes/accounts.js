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

// TikTok Hardcoded Verifier
router.get('/callback/tiktok/tiktokJJ2pw9fEETT7TRA250Aa70LmrZDjK5Sv.txt', (req, res) => {
  res.type('text/plain').send('tiktok-developers-site-verification=JJ2pw9fEETT7TRA250Aa70LmrZDjK5Sv');
});

router.use(protect);
router.get('/', getAccounts);
router.post('/connect/:platform', connectAccount);
router.delete('/:id', disconnectAccount);
router.post('/:id/refresh', refreshAccountToken);

export default router;
