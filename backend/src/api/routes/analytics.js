import express from 'express';
import { getAnalytics, getAccountAnalytics } from '../../controllers/analyticsController.js';
import { protect } from '../../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.get('/', getAnalytics);
router.get('/:accountId', getAccountAnalytics);

export default router;
