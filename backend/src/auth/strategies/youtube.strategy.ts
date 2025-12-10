import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface YouTubeProfile {
  id: string;
  title: string;
  thumbnail: string;
  description: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
}

@Injectable()
export class YouTubeStrategy extends PassportStrategy(Strategy, 'youtube') {
  constructor(configService: ConfigService) {
    super({
      authorizationURL: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenURL: 'https://oauth2.googleapis.com/token',
      clientID: configService.get<string>('YOUTUBE_CLIENT_ID') || 'not-configured',
      clientSecret: configService.get<string>('YOUTUBE_CLIENT_SECRET') || 'not-configured',
      callbackURL: configService.get<string>('YOUTUBE_CALLBACK_URL') || 'http://localhost:8080/auth/youtube/callback',
      scope: [
        'https://www.googleapis.com/auth/youtube.readonly',
        'https://www.googleapis.com/auth/userinfo.profile',
      ].join(' '),
    });
  }

  authorizationParams(): { [key: string]: string } {
    return {
      prompt: 'consent',
      access_type: 'offline',
    };
  }

  async validate(
    accessToken: string,
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string; profile: YouTubeProfile }> {
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
      throw new Error('YouTube 채널이 없습니다. 채널을 먼저 생성해주세요.');
    }

    const profile: YouTubeProfile = {
      id: channel.id,
      title: channel.snippet?.title || '',
      thumbnail: channel.snippet?.thumbnails?.default?.url || '',
      description: channel.snippet?.description || '',
      subscriberCount: parseInt(channel.statistics?.subscriberCount || '0', 10),
      videoCount: parseInt(channel.statistics?.videoCount || '0', 10),
      viewCount: parseInt(channel.statistics?.viewCount || '0', 10),
    };

    return {
      accessToken,
      refreshToken,
      profile,
    };
  }
}
