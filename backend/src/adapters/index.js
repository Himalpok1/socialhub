import { FacebookAdapter } from './facebook.js';
import { InstagramAdapter } from './instagram.js';
import { TikTokAdapter } from './tiktok.js';

const adapters = {
  facebook: new FacebookAdapter(),
  instagram: new InstagramAdapter(),
  tiktok: new TikTokAdapter(),
};

export function getAdapterForPlatform(platform) {
  const adapter = adapters[platform];
  if (!adapter) throw new Error(`Unsupported platform: ${platform}`);
  return adapter;
}

export { FacebookAdapter, InstagramAdapter, TikTokAdapter };
