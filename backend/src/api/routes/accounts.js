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

// Dynamic TikTok Verifier (Handles ANY randomly generated file!)
router.get('/callback/tiktok/:filename', (req, res, next) => {
  const file = req.params.filename;
  if (file.startsWith('tiktok') && file.endsWith('.txt')) {
    // Extract the random hash (e.g., 'JJ2...' from 'tiktokJJ2....txt')
    const hash = file.substring(6, file.length - 4);
    return res.type('text/plain').send(`tiktok-developers-site-verification=${hash}`);
  }
  next();
});

router.use(protect);
router.get('/', getAccounts);
router.post('/connect/:platform', connectAccount);
router.delete('/:id', disconnectAccount);
router.post('/:id/refresh', refreshAccountToken);

export default router;
