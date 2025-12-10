import { Injectable, NotFoundException } from '@nestjs/common';
import axios from 'axios';

export interface TikTokStats {
  followerCount: number;
  followingCount: number;
  likesCount: number;
  videoCount: number;
  displayName: string;
  avatarUrl: string;
}

@Injectable()
export class TikTokProvider {
  async getStats(accessToken: string): Promise<TikTokStats> {
    const { data } = await axios.get(
      'https://open.tiktokapis.com/v2/user/info/',
      {
        params: {
          fields: 'open_id,display_name,avatar_url,follower_count,following_count,likes_count,video_count',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const user = data.data?.user;
    if (!user) {
      throw new NotFoundException('TikTok user not found');
    }

    return {
      followerCount: user.follower_count || 0,
      followingCount: user.following_count || 0,
      likesCount: user.likes_count || 0,
      videoCount: user.video_count || 0,
      displayName: user.display_name || '',
      avatarUrl: user.avatar_url || '',
    };
  }
}
