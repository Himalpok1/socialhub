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

import { processPublish } from './worker.js';

export async function publishPostNow(postId) {
  // Execute the publish function instantly in the background without Redis
  try {
    processPublish({ postId }).catch(console.error);
    return true;
  } catch (err) {
    console.error('Failed to trigger background publish', err);
  }
}
