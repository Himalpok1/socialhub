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

router.use(protect);
router.get('/', getAccounts);
router.post('/connect/:platform', connectAccount);
router.get('/callback/:platform', handleCallback);
router.delete('/:id', disconnectAccount);
router.post('/:id/refresh', refreshAccountToken);

export default router;
