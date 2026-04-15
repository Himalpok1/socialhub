import { Worker } from 'bullmq';
import { getRedisConnection } from '../config/redis.js';
import Post from '../models/Post.js';
import SocialAccount from '../models/SocialAccount.js';
import { getAdapterForPlatform } from '../adapters/index.js';

async function processPublish(job) {
  const { postId } = job.data;
  console.log(`📤 Publishing post ${postId}...`);

  const post = await Post.findById(postId).populate('targetAccounts');
  if (!post) {
    console.error(`Post ${postId} not found`);
    return;
  }

  post.status = 'publishing';
  await post.save();

  const results = [];
  let hasSuccess = false;
  let hasFailure = false;

  for (const account of post.targetAccounts) {
    if (!account.isActive) continue;
    try {
      const adapter = getAdapterForPlatform(account.platform);
      const result = await adapter.publishPost(account, post);
      results.push({
        platform: account.platform,
        accountId: account._id.toString(),
        status: 'published',
        platformPostId: result.platformPostId,
        publishedAt: result.publishedAt,
      });
      hasSuccess = true;
      console.log(`✅ Published to ${account.platform}: ${result.platformPostId}`);
    } catch (err) {
      console.error(`❌ Failed to publish to ${account.platform}:`, err.message);
      results.push({
        platform: account.platform,
        accountId: account._id.toString(),
        status: 'failed',
        error: err.message,
      });
      hasFailure = true;
    }
  }

  post.platformResults = results;
  post.status = hasSuccess && hasFailure ? 'partial' : hasSuccess ? 'published' : 'failed';
  if (hasSuccess) post.publishedAt = new Date();
  await post.save();

  console.log(`📊 Post ${postId} done. Status: ${post.status}`);
}

export async function startWorkers() {
  const connection = getRedisConnection();

  // Schedule worker: fires when delay expires, moves to publish queue
  const scheduleWorker = new Worker(
    'schedule-post',
    async (job) => {
      const publishConn = getRedisConnection();
      const { Queue } = await import('bullmq');
      const pubQueue = new Queue('publish-post', { connection: publishConn });
      await pubQueue.add('publish', { postId: job.data.postId });
    },
    {
      connection: getRedisConnection(),
      concurrency: 5,
    }
  );

  // Publish worker
  const publishWorker = new Worker('publish-post', processPublish, {
    connection,
    concurrency: 3,
    limiter: { max: 10, duration: 60000 }, // 10 per minute
  });

  publishWorker.on('failed', async (job, err) => {
    console.error(`Job ${job.id} failed:`, err.message);
    if (job.attemptsMade >= 3) {
      // Mark post as failed after max retries
      await Post.findByIdAndUpdate(job.data.postId, { status: 'failed' });
    }
  });

  scheduleWorker.on('error', (err) => console.error('Schedule worker error:', err));
  publishWorker.on('error', (err) => console.error('Publish worker error:', err));

  console.log('✅ BullMQ workers started');
}
