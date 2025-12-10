import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface InstagramProfile {
  id: string;
  username: string;
  profilePicture: string;
}

@Injectable()
export class InstagramStrategy extends PassportStrategy(Strategy, 'instagram') {
  constructor(configService: ConfigService) {
    super({
      authorizationURL: 'https://www.facebook.com/v18.0/dialog/oauth',
      tokenURL: 'https://graph.facebook.com/v18.0/oauth/access_token',
      clientID: configService.get<string>('INSTAGRAM_CLIENT_ID') || 'not-configured',
      clientSecret: configService.get<string>('INSTAGRAM_CLIENT_SECRET') || 'not-configured',
      callbackURL: configService.get<string>('INSTAGRAM_CALLBACK_URL') || 'http://localhost:8080/auth/instagram/callback',
      scope: 'instagram_basic,instagram_manage_insights,pages_show_list,pages_read_engagement',
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string; profile: InstagramProfile }> {
    // First get the Facebook pages
    const { data: pagesData } = await axios.get(
      'https://graph.facebook.com/v18.0/me/accounts',
      {
        params: {
          access_token: accessToken,
        },
      },
    );

    // Get Instagram business account connected to the page
    let instagramAccount = null;
    for (const page of pagesData.data || []) {
      const { data: igData } = await axios.get(
        `https://graph.facebook.com/v18.0/${page.id}`,
        {
          params: {
            fields: 'instagram_business_account',
            access_token: accessToken,
          },
        },
      );
      if (igData.instagram_business_account) {
        instagramAccount = igData.instagram_business_account;
        break;
      }
    }

    let profile: InstagramProfile = {
      id: '',
      username: '',
      profilePicture: '',
    };

    if (instagramAccount) {
      const { data: igProfile } = await axios.get(
        `https://graph.facebook.com/v18.0/${instagramAccount.id}`,
        {
          params: {
            fields: 'id,username,profile_picture_url',
            access_token: accessToken,
          },
        },
      );

      profile = {
        id: igProfile.id || '',
        username: igProfile.username || '',
        profilePicture: igProfile.profile_picture_url || '',
      };
    }

    return {
      accessToken,
      refreshToken,
      profile,
    };
  }
}
