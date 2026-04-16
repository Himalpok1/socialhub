import axios from 'axios';

const IG_API = 'https://graph.facebook.com/v19.0';

export class InstagramAdapter {
  getAuthUrl(userId) {
    const baseUrl = process.env.FRONTEND_URL || 'https://himal.cloud';
    // Instagram uses Meta OAuth (same as Facebook), but routes back to the instagram callback
    const params = new URLSearchParams({
      client_id: process.env.FACEBOOK_APP_ID,
      redirect_uri: `${baseUrl}/api/accounts/callback/instagram`,
      scope: 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement',
      state: userId,
      response_type: 'code',
    });
    return `https://www.facebook.com/v19.0/dialog/oauth?${params}`;
  }

  async exchangeCode(code, state) {
    const baseUrl = process.env.FRONTEND_URL || 'https://himal.cloud';
    // Exchange for FB token first
    const { data: tokenData } = await axios.get(`${IG_API}/oauth/access_token`, {
      params: {
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        redirect_uri: `${baseUrl}/api/accounts/callback/instagram`,
        code,
      },
    });

    // Get IG business account linked to FB pages
    const { data: pages } = await axios.get(`${IG_API}/me/accounts`, {
      params: { access_token: tokenData.access_token },
    });

    const page = pages.data?.[0];
    if (!page) throw new Error('No Facebook Page found. Instagram requires a linked Facebook Page.');

    const { data: igAccount } = await axios.get(`${IG_API}/${page.id}`, {
      params: { fields: 'instagram_business_account', access_token: page.access_token },
    });

    const igId = igAccount.instagram_business_account?.id;
    if (!igId) throw new Error('No Instagram Business account linked to this Facebook Page.');

    const { data: igUser } = await axios.get(`${IG_API}/${igId}`, {
      params: { fields: 'id,name,username,profile_picture_url', access_token: page.access_token },
    });

    return {
      accountId: igId,
      accountName: igUser.name,
      accountHandle: `@${igUser.username}`,
      accountAvatar: igUser.profile_picture_url,
      accessToken: page.access_token,
      pageId: page.id,
      tokenExpiresAt: null,
    };
  }

  async publishPost(account, post) {
    if (process.env.DEMO_MODE === 'true') {
      return this._demoPublish(post);
    }

    const igUserId = account.accountId;
    const token = account.accessToken;

    if (!post.media?.length) {
      // Instagram requires media; use a text card workaround or throw
      throw new Error('Instagram requires at least one image or video.');
    }

    const media = post.media[0];
    const caption = post.content;

    let containerId;

    if (media.type === 'image') {
      const { data } = await axios.post(`${IG_API}/${igUserId}/media`, null, {
        params: { image_url: media.url, caption, access_token: token },
      });
      containerId = data.id;
    } else if (media.type === 'video') {
      const { data } = await axios.post(`${IG_API}/${igUserId}/media`, null, {
        params: { video_url: media.url, caption, media_type: 'REELS', access_token: token },
      });
      containerId = data.id;
      // Wait for video processing
      await this._waitForContainer(igUserId, containerId, token);
    }

    if (post.media.length > 1) {
      // Carousel
      const itemIds = [];
      for (const m of post.media) {
        const { data } = await axios.post(`${IG_API}/${igUserId}/media`, null, {
          params: { [`${m.type}_url`]: m.url, is_carousel_item: true, access_token: token },
        });
        itemIds.push(data.id);
      }
      const { data: carouselData } = await axios.post(`${IG_API}/${igUserId}/media`, null, {
        params: { media_type: 'CAROUSEL', children: itemIds.join(','), caption, access_token: token },
      });
      containerId = carouselData.id;
    }

    // Publish container
    const { data: published } = await axios.post(`${IG_API}/${igUserId}/media_publish`, null, {
      params: { creation_id: containerId, access_token: token },
    });

    return { platformPostId: published.id, publishedAt: new Date() };
  }

  async _waitForContainer(igUserId, containerId, token, maxAttempts = 10) {
    for (let i = 0; i < maxAttempts; i++) {
      const { data } = await axios.get(`${IG_API}/${containerId}`, {
        params: { fields: 'status_code', access_token: token },
      });
      if (data.status_code === 'FINISHED') return;
      if (data.status_code === 'ERROR') throw new Error('Instagram video processing failed');
      await new Promise((r) => setTimeout(r, 5000));
    }
    throw new Error('Instagram video processing timed out');
  }

  async getAnalytics(account, range = 30) {
    if (process.env.DEMO_MODE === 'true') return { demo: true };
    return {};
  }

  async refreshToken(account) {
    // Same as Facebook long-lived token
    return { accessToken: account.accessToken };
  }

  _demoPublish(post) {
    return {
      platformPostId: `ig_${Date.now()}`,
      publishedAt: new Date(),
      demo: true,
    };
  }
}
