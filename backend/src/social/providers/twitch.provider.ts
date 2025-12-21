import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface TwitchStats {
  viewCount: number;
  login: string;
  displayName: string;
  profileImage: string;
  broadcasterType: string;
}

@Injectable()
export class TwitchProvider {
  constructor(private configService: ConfigService) {}

  async getStats(accessToken: string): Promise<TwitchStats> {
    try {
      const clientId = this.configService.get<string>('TWITCH_CLIENT_ID');

      const { data } = await axios.get(
        'https://api.twitch.tv/helix/users',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Client-Id': clientId,
          },
        },
      );

      const userData = data.data[0];

      return {
        viewCount: userData.view_count || 0,
        login: userData.login || '',
        displayName: userData.display_name || '',
        profileImage: userData.profile_image_url || '',
        broadcasterType: userData.broadcaster_type || '',
      };
    } catch (error) {
      console.error('Failed to fetch Twitch stats:', error);
      return {
        viewCount: 0,
        login: '',
        displayName: '',
        profileImage: '',
        broadcasterType: '',
      };
    }
  }
}
