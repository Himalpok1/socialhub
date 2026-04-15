/**
 * Demo data seeder for SocialHub
 * Run: node src/utils/seed.js
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/database.js';
import User from '../models/User.js';
import SocialAccount from '../models/SocialAccount.js';
import Post from '../models/Post.js';

async function seed() {
  await connectDB();

  console.log('🌱 Seeding demo data...');

  // Clear existing demo user
  const existingUser = await User.findOne({ email: 'demo@socialhub.io' });
  if (existingUser) {
    await Post.deleteMany({ user: existingUser._id });
    await SocialAccount.deleteMany({ user: existingUser._id });
    await User.deleteOne({ _id: existingUser._id });
    console.log('🧹 Cleared existing demo data');
  }

  // Create demo user
  const user = await User.create({
    name: 'Alex Demo',
    email: 'demo@socialhub.io',
    password: 'demo1234',
  });
  console.log('👤 Created demo user:', user.email);

  // Create demo social accounts
  const accounts = await SocialAccount.insertMany([
    {
      user: user._id,
      platform: 'facebook',
      accountId: 'fb_demo_001',
      accountName: 'My Business Page',
      accountHandle: '@mybusiness',
      accountAvatar: 'https://ui-avatars.com/api/?name=FB+Page&background=1877F2&color=fff&size=128',
      accessToken: 'demo_fb_token',
      pageId: 'demo_page_id',
      isActive: true,
    },
    {
      user: user._id,
      platform: 'instagram',
      accountId: 'ig_demo_001',
      accountName: 'My Instagram',
      accountHandle: '@myinsta',
      accountAvatar: 'https://ui-avatars.com/api/?name=IG&background=E1306C&color=fff&size=128',
      accessToken: 'demo_ig_token',
      isActive: true,
    },
    {
      user: user._id,
      platform: 'tiktok',
      accountId: 'tt_demo_001',
      accountName: 'My TikTok',
      accountHandle: '@mytiktok',
      accountAvatar: 'https://ui-avatars.com/api/?name=TT&background=010101&color=fff&size=128',
      accessToken: 'demo_tt_token',
      isActive: true,
    },
  ]);
  console.log(`🔗 Created ${accounts.length} social accounts`);

  // Create demo posts
  const now = new Date();
  const future = (days, hours = 10) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    d.setHours(hours, 0, 0, 0);
    return d;
  };
  const past = (daysAgo) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    return d;
  };

  const posts = await Post.insertMany([
    {
      user: user._id,
      content: '🚀 Excited to announce our new product launch! After months of hard work, we\'re finally ready to share it with the world. Stay tuned for more details! #launch #excited #newproduct',
      platforms: ['facebook', 'instagram'],
      targetAccounts: [accounts[0]._id, accounts[1]._id],
      status: 'published',
      publishedAt: past(2),
      platformResults: [
        { platform: 'facebook', accountId: accounts[0]._id, status: 'published', platformPostId: 'fb_post_001', publishedAt: past(2) },
        { platform: 'instagram', accountId: accounts[1]._id, status: 'published', platformPostId: 'ig_post_001', publishedAt: past(2) },
      ],
      createdAt: past(3),
    },
    {
      user: user._id,
      content: '✨ Behind the scenes: A day in the life of our team. We work hard and play harder! 💪 #behindthescenes #teamwork #culture',
      platforms: ['instagram', 'tiktok'],
      targetAccounts: [accounts[1]._id, accounts[2]._id],
      status: 'published',
      publishedAt: past(5),
      platformResults: [
        { platform: 'instagram', accountId: accounts[1]._id, status: 'published', platformPostId: 'ig_post_002', publishedAt: past(5) },
        { platform: 'tiktok', accountId: accounts[2]._id, status: 'published', platformPostId: 'tt_post_001', publishedAt: past(5) },
      ],
      createdAt: past(6),
    },
    {
      user: user._id,
      content: '📢 Big news coming next week! We can\'t say much yet, but trust us — you won\'t want to miss it. Make sure you\'re following us! 👀',
      platforms: ['facebook', 'instagram', 'tiktok'],
      targetAccounts: [accounts[0]._id, accounts[1]._id, accounts[2]._id],
      status: 'scheduled',
      scheduledAt: future(2),
      createdAt: past(1),
    },
    {
      user: user._id,
      content: '💡 5 tips to boost your social media engagement:\n1. Post consistently\n2. Use relevant hashtags\n3. Engage with your audience\n4. Use high-quality visuals\n5. Tell your story\n\n#socialmediatips #marketing #growth',
      platforms: ['facebook'],
      targetAccounts: [accounts[0]._id],
      status: 'scheduled',
      scheduledAt: future(4, 14),
      createdAt: past(0),
    },
    {
      user: user._id,
      content: '🎉 Thank you for 10,000 followers! Your support means the world to us. As a thank you, we\'re running a giveaway this week!',
      platforms: ['instagram'],
      targetAccounts: [accounts[1]._id],
      status: 'draft',
      createdAt: past(0),
    },
    {
      user: user._id,
      content: '🌟 Our latest blog post is live! Check our bio for the link. We\'re talking about the future of content marketing and what you need to know in 2026.',
      platforms: ['facebook', 'instagram'],
      targetAccounts: [accounts[0]._id, accounts[1]._id],
      status: 'scheduled',
      scheduledAt: future(7, 9),
      createdAt: past(0),
    },
    {
      user: user._id,
      content: 'Testing our new posting workflow. This draft was created during setup.',
      platforms: ['tiktok'],
      targetAccounts: [accounts[2]._id],
      status: 'draft',
      createdAt: past(0),
    },
  ]);
  console.log(`📝 Created ${posts.length} demo posts`);

  console.log('\n✅ Demo data seeded successfully!');
  console.log('📧 Login: demo@socialhub.io');
  console.log('🔑 Password: demo1234\n');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
