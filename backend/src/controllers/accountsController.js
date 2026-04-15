import SocialAccount from '../models/SocialAccount.js';
import { getAdapterForPlatform } from '../adapters/index.js';
import { AppError } from '../middleware/errorHandler.js';

export async function getAccounts(req, res, next) {
  try {
    const accounts = await SocialAccount.find({ user: req.user._id, isActive: true })
      .select('-accessToken -refreshToken -pageAccessToken');
    res.json({ success: true, accounts });
  } catch (err) {
    next(err);
  }
}

export async function connectAccount(req, res, next) {
  try {
    const { platform } = req.params;
    const adapter = getAdapterForPlatform(platform);

    if (process.env.DEMO_MODE === 'true') {
      // Demo mode: create a fake connected account
      const demoAccounts = {
        facebook: {
          accountId: `fb_demo_${Date.now()}`,
          accountName: 'Your Business Page',
          accountHandle: '@yourbusiness',
          accountAvatar: `https://ui-avatars.com/api/?name=FB+Page&background=1877F2&color=fff`,
          pageId: 'demo_page_id',
        },
        instagram: {
          accountId: `ig_demo_${Date.now()}`,
          accountName: 'Your Instagram',
          accountHandle: '@yourinsta',
          accountAvatar: `https://ui-avatars.com/api/?name=IG&background=E1306C&color=fff`,
        },
        tiktok: {
          accountId: `tt_demo_${Date.now()}`,
          accountName: 'Your TikTok',
          accountHandle: '@yourtiktok',
          accountAvatar: `https://ui-avatars.com/api/?name=TT&background=010101&color=fff`,
        },
      };

      const demo = demoAccounts[platform];
      if (!demo) throw new AppError('Unsupported platform', 400);

      // Remove existing demo account for this platform if any
      await SocialAccount.deleteOne({ user: req.user._id, platform });

      const account = await SocialAccount.create({
        user: req.user._id,
        platform,
        accessToken: 'demo_token',
        ...demo,
      });
      return res.json({
        success: true,
        message: `Demo ${platform} account connected!`,
        account: { ...account.toObject(), accessToken: undefined },
      });
    }

    // Live mode: return OAuth URL
    const authUrl = adapter.getAuthUrl(req.user._id.toString());
    res.json({ success: true, authUrl });
  } catch (err) {
    next(err);
  }
}

export async function handleCallback(req, res, next) {
  try {
    const { platform } = req.params;
    const { code, state } = req.query;
    const adapter = getAdapterForPlatform(platform);

    const accountData = await adapter.exchangeCode(code, state);
    await SocialAccount.findOneAndUpdate(
      { user: req.user._id, platform, accountId: accountData.accountId },
      { ...accountData, user: req.user._id, platform },
      { upsert: true, new: true }
    );

    // Redirect to frontend accounts page
    res.redirect(`${process.env.FRONTEND_URL}/accounts?connected=${platform}`);
  } catch (err) {
    next(err);
  }
}

export async function disconnectAccount(req, res, next) {
  try {
    const account = await SocialAccount.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isActive: false },
      { new: true }
    );
    if (!account) throw new AppError('Account not found.', 404);
    res.json({ success: true, message: 'Account disconnected.' });
  } catch (err) {
    next(err);
  }
}

export async function refreshAccountToken(req, res, next) {
  try {
    const account = await SocialAccount.findOne({ _id: req.params.id, user: req.user._id })
      .select('+accessToken +refreshToken');
    if (!account) throw new AppError('Account not found.', 404);

    const adapter = getAdapterForPlatform(account.platform);
    const refreshed = await adapter.refreshToken(account);
    Object.assign(account, refreshed);
    await account.save();
    res.json({ success: true, message: 'Token refreshed.' });
  } catch (err) {
    next(err);
  }
}
