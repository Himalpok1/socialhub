import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema({
  url: { type: String, required: true },
  type: { type: String, enum: ['image', 'video'], required: true },
  publicId: { type: String },  // Cloudinary public ID
  thumbnail: { type: String },
  width: { type: Number },
  height: { type: Number },
  duration: { type: Number }, // seconds for video
}, { _id: false });

const platformResultSchema = new mongoose.Schema({
  platform: { type: String, enum: ['facebook', 'instagram', 'tiktok'] },
  accountId: { type: String },
  status: { type: String, enum: ['pending', 'published', 'failed'], default: 'pending' },
  platformPostId: { type: String },
  publishedAt: { type: Date },
  error: { type: String },
}, { _id: false });

const postSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, trim: true },
  content: { type: String, required: true, maxlength: 5000 },
  media: [mediaSchema],
  platforms: [{ type: String, enum: ['facebook', 'instagram', 'tiktok'] }],
  targetAccounts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SocialAccount' }],
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'publishing', 'published', 'partial', 'failed'],
    default: 'draft',
  },
  scheduledAt: { type: Date },
  publishedAt: { type: Date },
  platformResults: [platformResultSchema],
  jobId: { type: String },  // BullMQ job ID
  hashtags: [{ type: String }],
  firstComment: { type: String }, // Instagram first comment hack for hashtags
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

postSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

postSchema.index({ user: 1, status: 1 });
postSchema.index({ scheduledAt: 1, status: 1 });

export default mongoose.model('Post', postSchema);
