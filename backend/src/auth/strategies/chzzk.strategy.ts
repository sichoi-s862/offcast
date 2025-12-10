import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface ChzzkProfile {
  id: string;
  nickname: string;
  profileImage: string;
}

@Injectable()
export class ChzzkStrategy extends PassportStrategy(Strategy, 'chzzk') {
  constructor(configService: ConfigService) {
    super({
      authorizationURL: 'https://nid.naver.com/oauth2.0/authorize',
      tokenURL: 'https://nid.naver.com/oauth2.0/token',
      clientID: configService.get<string>('CHZZK_CLIENT_ID') || 'not-configured',
      clientSecret: configService.get<string>('CHZZK_CLIENT_SECRET') || 'not-configured',
      callbackURL: configService.get<string>('CHZZK_CALLBACK_URL') || 'http://localhost:8080/auth/chzzk/callback',
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string; profile: ChzzkProfile }> {
    // Get Naver user info first
    const { data: naverData } = await axios.get(
      'https://openapi.naver.com/v1/nid/me',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const naverUser = naverData.response;

    // Try to get Chzzk channel info using Naver ID
    // Note: Chzzk API may require separate authentication or channel linking
    let chzzkProfile: ChzzkProfile = {
      id: naverUser?.id || '',
      nickname: naverUser?.nickname || naverUser?.name || '',
      profileImage: naverUser?.profile_image || '',
    };

    // If Chzzk has separate API endpoints, you can fetch channel info here
    // This is a placeholder as Chzzk's public API might be limited
    try {
      // Chzzk uses Naver login but has its own channel system
      // The actual Chzzk channel ID might need to be fetched separately
      const { data: chzzkData } = await axios.get(
        'https://api.chzzk.naver.com/service/v1/users/me',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (chzzkData?.content) {
        chzzkProfile = {
          id: chzzkData.content.userIdHash || chzzkData.content.channelId || naverUser?.id || '',
          nickname: chzzkData.content.nickname || naverUser?.nickname || '',
          profileImage: chzzkData.content.profileImageUrl || naverUser?.profile_image || '',
        };
      }
    } catch {
      // Fallback to Naver profile if Chzzk API fails
      console.log('Using Naver profile as fallback for Chzzk');
    }

    return {
      accessToken,
      refreshToken,
      profile: chzzkProfile,
    };
  }
}
