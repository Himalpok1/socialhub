import express from 'express';
import {
  getPosts,
  createPost,
  getPost,
  updatePost,
  deletePost,
  publishPost,
} from '../../controllers/postsController.js';
import { protect } from '../../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.get('/', getPosts);
router.post('/', createPost);
router.get('/:id', getPost);
router.put('/:id', updatePost);
router.delete('/:id', deletePost);
router.post('/:id/publish', publishPost);

export default router;
