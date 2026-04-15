import Post from '../models/Post.js';
import SocialAccount from '../models/SocialAccount.js';
import { schedulePost, publishPostNow } from '../jobs/postQueue.js';
import { AppError } from '../middleware/errorHandler.js';

export async function getPosts(req, res, next) {
  try {
    const { status, platform, page = 1, limit = 20 } = req.query;
    const filter = { user: req.user._id };
    if (status) filter.status = status;
    if (platform) filter.platforms = platform;

    const total = await Post.countDocuments(filter);
    const posts = await Post.find(filter)
      .populate('targetAccounts', 'platform accountName accountHandle accountAvatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, posts, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
}

export async function createPost(req, res, next) {
  try {
    const { content, platforms, targetAccounts, scheduledAt, media, hashtags, firstComment } = req.body;
    if (!content) throw new AppError('Content is required.', 400);
    if (!platforms?.length) throw new AppError('Select at least one platform.', 400);

    const post = await Post.create({
      user: req.user._id,
      content,
      platforms,
      targetAccounts,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      media: media || [],
      hashtags: hashtags || [],
      firstComment,
      status: scheduledAt ? 'scheduled' : 'draft',
    });

    // If scheduled, enqueue BullMQ job
    if (scheduledAt) {
      const delay = new Date(scheduledAt) - Date.now();
      if (delay > 0) {
        const job = await schedulePost(post._id.toString(), delay);
        post.jobId = job.id;
        await post.save();
      }
    }

    res.status(201).json({ success: true, post });
  } catch (err) {
    next(err);
  }
}

export async function getPost(req, res, next) {
  try {
    const post = await Post.findOne({ _id: req.params.id, user: req.user._id })
      .populate('targetAccounts', 'platform accountName accountHandle accountAvatar');
    if (!post) throw new AppError('Post not found.', 404);
    res.json({ success: true, post });
  } catch (err) {
    next(err);
  }
}

export async function updatePost(req, res, next) {
  try {
    const post = await Post.findOne({ _id: req.params.id, user: req.user._id });
    if (!post) throw new AppError('Post not found.', 404);
    if (['published', 'publishing'].includes(post.status)) {
      throw new AppError('Cannot edit a published post.', 400);
    }

    const { content, platforms, targetAccounts, scheduledAt, media, hashtags, firstComment } = req.body;
    if (content !== undefined) post.content = content;
    if (platforms !== undefined) post.platforms = platforms;
    if (targetAccounts !== undefined) post.targetAccounts = targetAccounts;
    if (media !== undefined) post.media = media;
    if (hashtags !== undefined) post.hashtags = hashtags;
    if (firstComment !== undefined) post.firstComment = firstComment;

    if (scheduledAt !== undefined) {
      post.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
      post.status = scheduledAt ? 'scheduled' : 'draft';
    }

    await post.save();
    res.json({ success: true, post });
  } catch (err) {
    next(err);
  }
}

export async function deletePost(req, res, next) {
  try {
    const post = await Post.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!post) throw new AppError('Post not found.', 404);
    res.json({ success: true, message: 'Post deleted.' });
  } catch (err) {
    next(err);
  }
}

export async function publishPost(req, res, next) {
  try {
    const post = await Post.findOne({ _id: req.params.id, user: req.user._id })
      .populate('targetAccounts');
    if (!post) throw new AppError('Post not found.', 404);
    if (post.status === 'publishing') throw new AppError('Post is already being published.', 400);
    if (post.status === 'published') throw new AppError('Post already published.', 400);

    post.status = 'publishing';
    await post.save();

    // Publish immediately
    publishPostNow(post._id.toString()).catch(console.error);

    res.json({ success: true, message: 'Publishing started.', post });
  } catch (err) {
    next(err);
  }
}
