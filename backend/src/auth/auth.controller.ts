import {
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import type { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UserService, OAuthProfile } from '../user/user.service';
import {
  YouTubeOAuthGuard,
  TikTokOAuthGuard,
  SoopOAuthGuard,
  InstagramOAuthGuard,
  ChzzkOAuthGuard,
} from './guards/oauth.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { User } from '@prisma/client';

interface OAuthRequest extends Request {
  user: {
    accessToken: string;
    refreshToken: string;
    profile: {
      id: string;
      title?: string;
      displayName?: string;
      nickname?: string;
      username?: string;
      thumbnail?: string;
      avatarUrl?: string;
      profileImage?: string;
      profilePicture?: string;
      subscriberCount?: number;
    };
  };
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
    private userService: UserService,
  ) {}

  private createOAuthProfile(
    provider: string,
    oauthUser: OAuthRequest['user'],
  ): OAuthProfile {
    const profile = oauthUser.profile;
    return {
      provider,
      providerAccountId: profile.id,
      accessToken: oauthUser.accessToken,
      refreshToken: oauthUser.refreshToken,
      profileName:
        profile.title ||
        profile.displayName ||
        profile.nickname ||
        profile.username ||
        '',
      profileImage:
        profile.thumbnail ||
        profile.avatarUrl ||
        profile.profileImage ||
        profile.profilePicture ||
        '',
    };
  }

  private async handleOAuthCallback(
    provider: string,
    req: OAuthRequest,
    res: Response,
  ) {
    const profile = this.createOAuthProfile(provider, req.user);
    const result = await this.authService.validateOAuthLogin(profile);

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const params = new URLSearchParams({
      token: result.token.accessToken,
      provider,
    });

    const oauthProfile = req.user.profile;
    const channelName = oauthProfile.title || oauthProfile.displayName || oauthProfile.nickname || oauthProfile.username || '';
    if (channelName) {
      params.set('channelName', channelName);
    }
    if (oauthProfile.subscriberCount !== undefined) {
      params.set('subscriberCount', oauthProfile.subscriberCount.toString());
    }

    const redirectUrl = `${frontendUrl}/auth/callback?${params.toString()}`;
    return res.redirect(redirectUrl);
  }

  // YouTube OAuth
  @Public()
  @Get('youtube')
  @UseGuards(YouTubeOAuthGuard)
  @ApiOperation({ summary: 'YouTube OAuth 로그인 시작' })
  youtubeLogin() {
    // Guard handles redirect
  }

  @Public()
  @Get('youtube/callback')
  @UseGuards(YouTubeOAuthGuard)
  @ApiOperation({ summary: 'YouTube OAuth 콜백' })
  async youtubeCallback(@Req() req: OAuthRequest, @Res() res: Response) {
    return this.handleOAuthCallback('youtube', req, res);
  }

  // TikTok OAuth
  @Public()
  @Get('tiktok')
  @UseGuards(TikTokOAuthGuard)
  @ApiOperation({ summary: 'TikTok OAuth 로그인 시작' })
  tiktokLogin() {
    // Guard handles redirect
  }

  @Public()
  @Get('tiktok/callback')
  @UseGuards(TikTokOAuthGuard)
  @ApiOperation({ summary: 'TikTok OAuth 콜백' })
  async tiktokCallback(@Req() req: OAuthRequest, @Res() res: Response) {
    return this.handleOAuthCallback('tiktok', req, res);
  }

  // SOOP OAuth
  @Public()
  @Get('soop')
  @UseGuards(SoopOAuthGuard)
  @ApiOperation({ summary: 'SOOP OAuth 로그인 시작' })
  soopLogin() {
    // Guard handles redirect
  }

  @Public()
  @Get('soop/callback')
  @UseGuards(SoopOAuthGuard)
  @ApiOperation({ summary: 'SOOP OAuth 콜백' })
  async soopCallback(@Req() req: OAuthRequest, @Res() res: Response) {
    return this.handleOAuthCallback('soop', req, res);
  }

  // Instagram OAuth
  @Public()
  @Get('instagram')
  @UseGuards(InstagramOAuthGuard)
  @ApiOperation({ summary: 'Instagram OAuth 로그인 시작' })
  instagramLogin() {
    // Guard handles redirect
  }

  @Public()
  @Get('instagram/callback')
  @UseGuards(InstagramOAuthGuard)
  @ApiOperation({ summary: 'Instagram OAuth 콜백' })
  async instagramCallback(@Req() req: OAuthRequest, @Res() res: Response) {
    return this.handleOAuthCallback('instagram', req, res);
  }

  // Chzzk OAuth
  @Public()
  @Get('chzzk')
  @UseGuards(ChzzkOAuthGuard)
  @ApiOperation({ summary: 'Chzzk OAuth 로그인 시작' })
  chzzkLogin() {
    // Guard handles redirect
  }

  @Public()
  @Get('chzzk/callback')
  @UseGuards(ChzzkOAuthGuard)
  @ApiOperation({ summary: 'Chzzk OAuth 콜백' })
  async chzzkCallback(@Req() req: OAuthRequest, @Res() res: Response) {
    return this.handleOAuthCallback('chzzk', req, res);
  }

  // Current user info
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '현재 로그인한 사용자 정보' })
  @ApiResponse({ status: HttpStatus.OK, description: '사용자 정보 반환' })
  async getMe(@CurrentUser() user: User) {
    const fullUser = await this.userService.findById(user.id);
    return fullUser;
  }

  // Refresh token
  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'JWT 토큰 갱신' })
  @ApiResponse({ status: HttpStatus.OK, description: '새 토큰 반환' })
  async refresh(@CurrentUser() user: User) {
    const token = await this.authService.refreshToken(user.id);
    return token;
  }
}
