import { Injectable } from '@nestjs/common';
import axios from 'axios';

export interface ChzzkStats {
  followerCount: number;
  nickname: string;
  profileImageUrl: string;
  channelId: string;
  channelDescription: string;
}

@Injectable()
export class ChzzkProvider {
  async getStats(accessToken: string): Promise<ChzzkStats> {
    // Try to get Chzzk channel info
    let chzzkStats: ChzzkStats = {
      followerCount: 0,
      nickname: '',
      profileImageUrl: '',
      channelId: '',
      channelDescription: '',
    };

    try {
      // Chzzk API for user/channel info
      const { data: userData } = await axios.get(
        'https://api.chzzk.naver.com/service/v1/users/me',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (userData?.content) {
        const channelId = userData.content.userIdHash || userData.content.channelId;

        chzzkStats = {
          followerCount: 0,
          nickname: userData.content.nickname || '',
          profileImageUrl: userData.content.profileImageUrl || '',
          channelId: channelId || '',
          channelDescription: '',
        };

        // Get channel details including follower count
        if (channelId) {
          try {
            const { data: channelData } = await axios.get(
              `https://api.chzzk.naver.com/service/v1/channels/${channelId}`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              },
            );

            if (channelData?.content) {
              chzzkStats.followerCount = channelData.content.followerCount || 0;
              chzzkStats.channelDescription = channelData.content.channelDescription || '';
            }
          } catch {
            console.log('Could not fetch Chzzk channel details');
          }
        }
      }
    } catch {
      // Fallback to Naver profile
      try {
        const { data: naverData } = await axios.get(
          'https://openapi.naver.com/v1/nid/me',
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        const naverUser = naverData.response;
        chzzkStats = {
          followerCount: 0,
          nickname: naverUser?.nickname || naverUser?.name || '',
          profileImageUrl: naverUser?.profile_image || '',
          channelId: naverUser?.id || '',
          channelDescription: '',
        };
      } catch {
        console.log('Could not fetch Naver profile as fallback');
      }
    }

    return chzzkStats;
  }
}
