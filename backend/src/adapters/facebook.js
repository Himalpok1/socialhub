import axios from 'axios';

const FB_API = 'https://graph.facebook.com/v19.0';

export class FacebookAdapter {
  getAuthUrl(userId) {
    const params = new URLSearchParams({
      client_id: process.env.FACEBOOK_APP_ID,
      redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
      scope: 'pages_show_list,pages_read_engagement,pages_manage_posts,pages_manage_metadata,publish_to_groups',
      state: userId,
      response_type: 'code',
    });
    return `https://www.facebook.com/v19.0/dialog/oauth?${params}`;
  }

  async exchangeCode(code, userId) {
    const { data: tokenData } = await axios.get(`${FB_API}/oauth/access_token`, {
      params: {
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
        code,
      },
    });

    const { data: userData } = await axios.get(`${FB_API}/me`, {
      params: { access_token: tokenData.access_token, fields: 'id,name,picture' },
    });

    // Get pages
    const { data: pagesData } = await axios.get(`${FB_API}/me/accounts`, {
      params: { access_token: tokenData.access_token },
    });
    const page = pagesData.data?.[0];

    return {
      accountId: userData.id,
      accountName: page?.name || userData.name,
      accountAvatar: userData.picture?.data?.url,
      accessToken: tokenData.access_token,
      pageId: page?.id,
      pageAccessToken: page?.access_token,
      tokenExpiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null,
    };
  }

  async publishPost(account, post) {
    if (process.env.DEMO_MODE === 'true') {
      return this._demoPublish(post);
    }

    const token = account.pageAccessToken || account.accessToken;
    const pageId = account.pageId || account.accountId;

    let endpoint, payload;

    if (post.media?.length > 0 && post.media[0].type === 'image') {
      endpoint = `${FB_API}/${pageId}/photos`;
      payload = { url: post.media[0].url, caption: post.content, access_token: token };
    } else if (post.media?.length > 0 && post.media[0].type === 'video') {
      endpoint = `${FB_API}/${pageId}/videos`;
      payload = { file_url: post.media[0].url, description: post.content, access_token: token };
    } else {
      endpoint = `${FB_API}/${pageId}/feed`;
      payload = { message: post.content, access_token: token };
    }

    const { data } = await axios.post(endpoint, payload);
    return { platformPostId: data.id || data.post_id, publishedAt: new Date() };
  }

  async getAnalytics(account, range = 30) {
    if (process.env.DEMO_MODE === 'true') return { demo: true };
    // Real implementation would call /PAGE_ID/insights
    return {};
  }

  async refreshToken(account) {
    const { data } = await axios.get(`${FB_API}/oauth/access_token`, {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        fb_exchange_token: account.accessToken,
      },
    });
    return {
      accessToken: data.access_token,
      tokenExpiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : null,
    };
  }

  _demoPublish(post) {
    return {
      platformPostId: `fb_${Date.now()}`,
      publishedAt: new Date(),
      demo: true,
    };
  }
}
