import { Injectable, NotFoundException } from '@nestjs/common';
import axios from 'axios';

export interface InstagramStats {
  followersCount: number;
  followsCount: number;
  mediaCount: number;
  username: string;
  profilePictureUrl: string;
}

@Injectable()
export class InstagramProvider {
  async getStats(accessToken: string): Promise<InstagramStats> {
    // First get the Facebook pages to find Instagram business account
    const { data: pagesData } = await axios.get(
      'https://graph.facebook.com/v18.0/me/accounts',
      {
        params: {
          access_token: accessToken,
        },
      },
    );

    // Find Instagram business account
    let instagramAccountId = null;
    for (const page of pagesData.data || []) {
      const { data: igData } = await axios.get(
        `https://graph.facebook.com/v18.0/${page.id}`,
        {
          params: {
            fields: 'instagram_business_account',
            access_token: accessToken,
          },
        },
      );
      if (igData.instagram_business_account) {
        instagramAccountId = igData.instagram_business_account.id;
        break;
      }
    }

    if (!instagramAccountId) {
      throw new NotFoundException('Instagram business account not found');
    }

    // Get Instagram account stats
    const { data: igStats } = await axios.get(
      `https://graph.facebook.com/v18.0/${instagramAccountId}`,
      {
        params: {
          fields: 'id,username,profile_picture_url,followers_count,follows_count,media_count',
          access_token: accessToken,
        },
      },
    );

    return {
      followersCount: igStats.followers_count || 0,
      followsCount: igStats.follows_count || 0,
      mediaCount: igStats.media_count || 0,
      username: igStats.username || '',
      profilePictureUrl: igStats.profile_picture_url || '',
    };
  }
}
