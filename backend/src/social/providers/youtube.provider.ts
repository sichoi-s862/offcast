import { Injectable, NotFoundException } from '@nestjs/common';
import axios from 'axios';

export interface YouTubeStats {
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  channelId: string;
  channelTitle: string;
  thumbnailUrl: string;
}

@Injectable()
export class YouTubeProvider {
  async getStats(accessToken: string): Promise<YouTubeStats> {
    const { data } = await axios.get(
      'https://www.googleapis.com/youtube/v3/channels',
      {
        params: {
          part: 'snippet,statistics',
          mine: true,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const channel = data.items?.[0];
    if (!channel) {
      throw new NotFoundException('YouTube channel not found');
    }

    return {
      subscriberCount: parseInt(channel.statistics.subscriberCount || '0', 10),
      videoCount: parseInt(channel.statistics.videoCount || '0', 10),
      viewCount: parseInt(channel.statistics.viewCount || '0', 10),
      channelId: channel.id,
      channelTitle: channel.snippet.title,
      thumbnailUrl: channel.snippet.thumbnails?.default?.url || '',
    };
  }
}
