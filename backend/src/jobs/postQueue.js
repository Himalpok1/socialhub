import { Queue } from 'bullmq';
import { getRedisConnection } from '../config/redis.js';

let scheduleQueue = null;
let publishQueue = null;

export function getScheduleQueue() {
  if (!scheduleQueue) {
    scheduleQueue = new Queue('schedule-post', { connection: getRedisConnection() });
  }
  return scheduleQueue;
}

export function getPublishQueue() {
  if (!publishQueue) {
    publishQueue = new Queue('publish-post', { connection: getRedisConnection() });
  }
  return publishQueue;
}

export async function schedulePost(postId, delayMs) {
  const queue = getScheduleQueue();
  return queue.add('schedule', { postId }, { delay: delayMs, jobId: `schedule_${postId}` });
}

export async function publishPostNow(postId) {
  const queue = getPublishQueue();
  return queue.add('publish', { postId }, { jobId: `publish_${postId}_${Date.now()}` });
}
