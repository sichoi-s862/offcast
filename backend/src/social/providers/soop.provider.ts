import { Injectable } from '@nestjs/common';
import axios from 'axios';

export interface SoopStats {
  fanCount: number;
  nickname: string;
  profileImage: string;
  broadcastId: string;
}

@Injectable()
export class SoopProvider {
  async getStats(accessToken: string): Promise<SoopStats> {
    // Get user info
    const { data: userData } = await axios.get(
      'https://openapi.sooplive.co.kr/v1/me',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    // Get fan/follower count
    let fanCount = 0;
    try {
      const { data: statsData } = await axios.get(
        'https://openapi.sooplive.co.kr/v1/me/stats',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      fanCount = statsData.fan_count || statsData.follower_count || 0;
    } catch {
      // Stats endpoint might not exist, try alternative
      try {
        const { data: channelData } = await axios.get(
          `https://openapi.sooplive.co.kr/v1/channels/${userData.user_id || userData.id}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );
        fanCount = channelData.fan_count || channelData.follower_count || 0;
      } catch {
        console.log('Could not fetch SOOP fan count');
      }
    }

    return {
      fanCount,
      nickname: userData.nickname || userData.user_nick || '',
      profileImage: userData.profile_image || '',
      broadcastId: userData.user_id || userData.id || '',
    };
  }
}
