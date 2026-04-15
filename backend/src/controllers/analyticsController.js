import Post from '../models/Post.js';
import SocialAccount from '../models/SocialAccount.js';

// Helper to generate realistic demo analytics
function generateDemoMetrics(days = 30) {
  const data = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0],
      reach: Math.floor(Math.random() * 5000 + 500),
      impressions: Math.floor(Math.random() * 8000 + 1000),
      engagement: Math.floor(Math.random() * 500 + 50),
      likes: Math.floor(Math.random() * 300 + 30),
      comments: Math.floor(Math.random() * 80 + 5),
      shares: Math.floor(Math.random() * 60 + 5),
      followers: Math.floor(Math.random() * 20 - 5),
    });
  }
  return data;
}

export async function getAnalytics(req, res, next) {
  try {
    const { range = '30' } = req.query;
    const days = parseInt(range);

    const accounts = await SocialAccount.find({ user: req.user._id, isActive: true })
      .select('-accessToken -refreshToken -pageAccessToken');

    // Post stats
    const now = new Date();
    const since = new Date(now - days * 24 * 60 * 60 * 1000);
    const [totalPosts, publishedPosts, scheduledPosts, failedPosts] = await Promise.all([
      Post.countDocuments({ user: req.user._id }),
      Post.countDocuments({ user: req.user._id, status: 'published' }),
      Post.countDocuments({ user: req.user._id, status: 'scheduled' }),
      Post.countDocuments({ user: req.user._id, status: 'failed' }),
    ]);

    // Platform breakdown
    const platformStats = {};
    for (const platform of ['facebook', 'instagram', 'tiktok']) {
      const count = accounts.filter((a) => a.platform === platform).length;
      platformStats[platform] = {
        connected: count > 0,
        accounts: count,
        metrics: count > 0 ? generateDemoMetrics(days) : [],
      };
    }

    res.json({
      success: true,
      overview: { totalPosts, publishedPosts, scheduledPosts, failedPosts, connectedAccounts: accounts.length },
      platformStats,
      timeline: generateDemoMetrics(days),
    });
  } catch (err) {
    next(err);
  }
}

export async function getAccountAnalytics(req, res, next) {
  try {
    const { range = '30' } = req.query;
    const account = await SocialAccount.findOne({ _id: req.params.accountId, user: req.user._id });
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }

    const days = parseInt(range);
    const metrics = generateDemoMetrics(days);
    const totals = metrics.reduce((acc, d) => {
      acc.reach += d.reach;
      acc.impressions += d.impressions;
      acc.engagement += d.engagement;
      acc.likes += d.likes;
      acc.comments += d.comments;
      acc.shares += d.shares;
      acc.followerGrowth += d.followers;
      return acc;
    }, { reach: 0, impressions: 0, engagement: 0, likes: 0, comments: 0, shares: 0, followerGrowth: 0 });

    res.json({ success: true, account, metrics, totals });
  } catch (err) {
    next(err);
  }
}
