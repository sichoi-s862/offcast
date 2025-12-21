import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface TwitchProfile {
  id: string;
  login: string;
  displayName: string;
  profileImage: string;
  viewCount: number;
}

@Injectable()
export class TwitchStrategy extends PassportStrategy(Strategy, 'twitch') {
  constructor(configService: ConfigService) {
    super({
      authorizationURL: 'https://id.twitch.tv/oauth2/authorize',
      tokenURL: 'https://id.twitch.tv/oauth2/token',
      clientID: configService.get<string>('TWITCH_CLIENT_ID') || 'not-configured',
      clientSecret: configService.get<string>('TWITCH_CLIENT_SECRET') || 'not-configured',
      callbackURL: configService.get<string>('TWITCH_CALLBACK_URL') || 'http://localhost:8080/auth/twitch/callback',
      scope: ['user:read:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string; profile: TwitchProfile }> {
    // Get user info from Twitch API
    const { data } = await axios.get(
      'https://api.twitch.tv/helix/users',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Client-Id': this.clientID,
        },
      },
    );

    const userData = data.data[0];

    const profile: TwitchProfile = {
      id: userData.id || '',
      login: userData.login || '',
      displayName: userData.display_name || '',
      profileImage: userData.profile_image_url || '',
      viewCount: userData.view_count || 0,
    };

    return {
      accessToken,
      refreshToken,
      profile,
    };
  }

  private get clientID(): string {
    return (this as any)._oauth2._clientId;
  }
}
