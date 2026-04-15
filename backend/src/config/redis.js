import Redis from 'ioredis';

let redisClient = null;

export async function connectRedis() {
  return new Promise((resolve, reject) => {
    const client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
      lazyConnect: true,
      connectTimeout: 3000,
      retryStrategy: () => null, // don't retry
    });
    const timeout = setTimeout(() => {
      client.disconnect();
      reject(new Error('Redis connection timed out'));
    }, 4000);
    client.connect()
      .then(() => {
        clearTimeout(timeout);
        redisClient = client;
        console.log('✅ Redis connected');
        resolve();
      })
      .catch((err) => {
        clearTimeout(timeout);
        client.disconnect();
        reject(err);
      });
  });
}

export function getRedisClient() {
  if (!redisClient) throw new Error('Redis not connected');
  return redisClient;
}

export function getRedisConnection() {
  return new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
  });
}
