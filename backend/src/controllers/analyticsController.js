import Post from '../models/Post.js';
import SocialAccount from '../models/SocialAccount.js';

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

    // Get published posts within range for timeline
    const recentPosts = await Post.find({
      user: req.user._id,
      status: 'published',
      publishedAt: { $gte: since },
    }).lean();

    // Build real timeline from actual posts
    const timeline = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const postsOnDay = recentPosts.filter((p) => {
        const pDate = new Date(p.publishedAt).toISOString().split('T')[0];
        return pDate === dateStr;
      });

      timeline.push({
        date: dateStr,
        reach: 0,
        impressions: 0,
        engagement: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        followers: 0,
        postsPublished: postsOnDay.length,
      });
    }

    // Platform breakdown
    const platformStats = {};
    for (const platform of ['facebook', 'instagram', 'tiktok']) {
      const count = accounts.filter((a) => a.platform === platform).length;
      const platformPosts = publishedPosts; // TODO: filter by platform when platformResults is indexed
      platformStats[platform] = {
        connected: count > 0,
        accounts: count,
      };
    }

    res.json({
      success: true,
      overview: { totalPosts, publishedPosts, scheduledPosts, failedPosts, connectedAccounts: accounts.length },
      platformStats,
      timeline,
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
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const recentPosts = await Post.find({
      user: req.user._id,
      status: 'published',
      publishedAt: { $gte: since },
    }).lean();

    const metrics = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const postsOnDay = recentPosts.filter((p) => {
        const pDate = new Date(p.publishedAt).toISOString().split('T')[0];
        return pDate === dateStr;
      });

      metrics.push({
        date: dateStr,
        reach: 0,
        impressions: 0,
        engagement: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        followers: 0,
        postsPublished: postsOnDay.length,
      });
    }

    const totals = { reach: 0, impressions: 0, engagement: 0, likes: 0, comments: 0, shares: 0, followerGrowth: 0 };

    res.json({ success: true, account, metrics, totals });
  } catch (err) {
    next(err);
  }
}
