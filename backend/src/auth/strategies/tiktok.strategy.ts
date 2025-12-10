import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface TikTokProfile {
  id: string;
  displayName: string;
  avatarUrl: string;
}

@Injectable()
export class TikTokStrategy extends PassportStrategy(Strategy, 'tiktok') {
  private clientKey: string;

  constructor(configService: ConfigService) {
    const clientKey = configService.get<string>('TIKTOK_CLIENT_KEY') || 'not-configured';
    super({
      authorizationURL: 'https://www.tiktok.com/v2/auth/authorize/',
      tokenURL: 'https://open.tiktokapis.com/v2/oauth/token/',
      clientID: clientKey,
      clientSecret: configService.get<string>('TIKTOK_CLIENT_SECRET') || 'not-configured',
      callbackURL: configService.get<string>('TIKTOK_CALLBACK_URL') || 'http://localhost:8080/auth/tiktok/callback',
      scope: 'user.info.basic,user.info.stats',
      customHeaders: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    this.clientKey = clientKey;
  }

  authorizationParams(): { [key: string]: string } {
    return {
      response_type: 'code',
      client_key: this.clientKey,
    };
  }

  async validate(
    accessToken: string,
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string; profile: TikTokProfile }> {
    const { data } = await axios.get(
      'https://open.tiktokapis.com/v2/user/info/',
      {
        params: {
          fields: 'open_id,display_name,avatar_url',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const user = data.data?.user;
    const profile: TikTokProfile = {
      id: user?.open_id || '',
      displayName: user?.display_name || '',
      avatarUrl: user?.avatar_url || '',
    };

    return {
      accessToken,
      refreshToken,
      profile,
    };
  }
}
