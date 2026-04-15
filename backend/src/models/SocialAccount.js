import mongoose from 'mongoose';

const socialAccountSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  platform: { type: String, enum: ['facebook', 'instagram', 'tiktok'], required: true },
  accountId: { type: String, required: true },
  accountName: { type: String, required: true },
  accountHandle: { type: String },
  accountAvatar: { type: String },
  accessToken: { type: String, required: true, select: false },
  refreshToken: { type: String, select: false },
  tokenExpiresAt: { type: Date },
  pageId: { type: String },       // Facebook Page ID
  pageAccessToken: { type: String, select: false }, // FB Page token
  isActive: { type: Boolean, default: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  connectedAt: { type: Date, default: Date.now },
  lastUsedAt: { type: Date },
});

socialAccountSchema.index({ user: 1, platform: 1, accountId: 1 }, { unique: true });

export default mongoose.model('SocialAccount', socialAccountSchema);
