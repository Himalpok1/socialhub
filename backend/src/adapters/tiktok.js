import axios from 'axios';

const TT_API = 'https://open.tiktokapis.com/v2';

export class TikTokAdapter {
  getAuthUrl(userId) {
    const baseUrl = process.env.FRONTEND_URL || 'https://himal.cloud';
    const params = new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY,
      redirect_uri: `${baseUrl}/api/accounts/callback/tiktok`,
      scope: 'user.info.basic,video.publish,video.upload',
      response_type: 'code',
      state: userId,
    });
    return `https://www.tiktok.com/v2/auth/authorize/?${params}`;
  }

  async exchangeCode(code, state) {
    const baseUrl = process.env.FRONTEND_URL || 'https://himal.cloud';
    const body = new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY,
      client_secret: process.env.TIKTOK_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: `${baseUrl}/api/accounts/callback/tiktok`,
    });

    const { data } = await axios.post('https://open.tiktokapis.com/v2/oauth/token/', body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const { data: userData } = await axios.get(`${TT_API}/user/info/`, {
      headers: { Authorization: `Bearer ${data.access_token}` },
      params: { fields: 'open_id,union_id,avatar_url,display_name' },
    });

    const user = userData.data?.user;
    return {
      accountId: user.open_id,
      accountName: user.display_name,
      accountHandle: `@${user.display_name}`,
      accountAvatar: user.avatar_url,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenExpiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  }

  async publishPost(account, post) {
    if (process.env.DEMO_MODE === 'true') {
      return this._demoPublish(post);
    }

    if (!post.media?.length) {
      throw new Error('TikTok requires a video to publish.');
    }

    const video = post.media.find((m) => m.type === 'video');
    if (!video) throw new Error('TikTok only supports video posts.');

    // Construct proxy URL to bypass TikTok's domain verification rules for external media
    const baseUrl = process.env.FRONTEND_URL || 'https://himal.cloud';
    const proxyUrl = `${baseUrl}/api/posts/proxy-media?url=${encodeURIComponent(video.url)}`;

    // Step 1: Initialize upload
    const { data: initData } = await axios.post(
      `${TT_API}/post/publish/video/init/`,
      {
        post_info: {
          title: post.content.substring(0, 150),
          privacy_level: 'PUBLIC_TO_EVERYONE',
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
        },
        source_info: {
          source: 'PULL_FROM_URL',
          video_url: proxyUrl,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${account.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      platformPostId: initData.data?.publish_id,
      publishedAt: new Date(),
    };
  }

  async refreshToken(account) {
    const { data } = await axios.post('https://open.tiktokapis.com/v2/oauth/token/', {
      client_key: process.env.TIKTOK_CLIENT_KEY,
      client_secret: process.env.TIKTOK_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: account.refreshToken,
    });
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenExpiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  }

  async getAnalytics(account, range = 30) {
    if (process.env.DEMO_MODE === 'true') return { demo: true };
    return {};
  }

  _demoPublish(post) {
    return {
      platformPostId: `tt_${Date.now()}`,
      publishedAt: new Date(),
      demo: true,
    };
  }
}
