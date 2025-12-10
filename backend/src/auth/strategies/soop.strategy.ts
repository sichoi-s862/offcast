import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface SoopProfile {
  id: string;
  nickname: string;
  profileImage: string;
}

@Injectable()
export class SoopStrategy extends PassportStrategy(Strategy, 'soop') {
  constructor(configService: ConfigService) {
    super({
      authorizationURL: 'https://openapi.sooplive.co.kr/oauth/authorize',
      tokenURL: 'https://openapi.sooplive.co.kr/oauth/token',
      clientID: configService.get<string>('SOOP_CLIENT_ID') || 'not-configured',
      clientSecret: configService.get<string>('SOOP_CLIENT_SECRET') || 'not-configured',
      callbackURL: configService.get<string>('SOOP_CALLBACK_URL') || 'http://localhost:8080/auth/soop/callback',
      scope: 'read',
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string; profile: SoopProfile }> {
    const { data } = await axios.get(
      'https://openapi.sooplive.co.kr/v1/me',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const profile: SoopProfile = {
      id: data.user_id || data.id || '',
      nickname: data.nickname || data.user_nick || '',
      profileImage: data.profile_image || '',
    };

    return {
      accessToken,
      refreshToken,
      profile,
    };
  }
}
