import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsNumber } from 'class-validator';
import { Throttle } from '@nestjs/throttler';
import type { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService, DevLoginRequest } from './auth.service';
import { UserService, OAuthProfile } from '../user/user.service';
import {
  YouTubeOAuthGuard,
  TikTokOAuthGuard,
  TwitchOAuthGuard,
} from './guards/oauth.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import { Provider } from '@prisma/client';

/**
 * OAuth 요청 인터페이스
 */
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
      name?: string;
      thumbnail?: string;
      avatarUrl?: string;
      profileImage?: string;
      profilePicture?: string;
      subscriberCount?: number;
      followerCount?: number; // TikTok용
      viewCount?: number; // Twitch용
    };
  };
}

/**
 * 개발용 로그인 DTO
 */
class DevLoginDto {
  @IsEnum(Provider)
  provider: Provider;

  @IsOptional()
  @IsString()
  nickname?: string;

  @IsOptional()
  @IsNumber()
  subscriberCount?: number;
}

/**
 * 인증 컨트롤러
 * - OAuth 로그인, JWT 토큰 관리
 */
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
    private userService: UserService,
  ) {}

  /**
   * OAuth 프로필 생성 헬퍼 메서드
   */
  private createOAuthProfile(
    provider: Provider,
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
        profile.name ||
        profile.username ||
        '',
      profileImage:
        profile.thumbnail ||
        profile.avatarUrl ||
        profile.profileImage ||
        profile.profilePicture ||
        '',
      subscriberCount: profile.subscriberCount || profile.followerCount || profile.viewCount,
    };
  }

  /**
   * OAuth 콜백 공통 처리
   */
  private async handleOAuthCallback(
    provider: Provider,
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
    const channelName =
      oauthProfile.title ||
      oauthProfile.displayName ||
      oauthProfile.nickname ||
      oauthProfile.name ||
      oauthProfile.username ||
      '';
    if (channelName) {
      params.set('channelName', channelName);
    }
    const subCount = oauthProfile.subscriberCount || oauthProfile.followerCount || oauthProfile.viewCount;
    if (subCount !== undefined) {
      params.set('subscriberCount', subCount.toString());
    }

    const redirectUrl = `${frontendUrl}/auth/callback?${params.toString()}`;
    return res.redirect(redirectUrl);
  }

  // ============================================
  // 개발용 테스트 로그인 API
  // ============================================

  @Public()
  @Throttle({ short: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @Post('dev/login')
  @ApiOperation({
    summary: '개발용 테스트 로그인',
    description: '실제 OAuth 없이 테스트용 JWT를 발급합니다. 프로덕션 환경에서는 사용 불가합니다.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        provider: {
          type: 'string',
          enum: ['YOUTUBE', 'TIKTOK', 'TWITCH'],
          description: '플랫폼 종류',
        },
        nickname: {
          type: 'string',
          description: '테스트용 닉네임 (선택)',
        },
        subscriberCount: {
          type: 'number',
          description: '테스트용 구독자 수 (선택, 기본값: 150000)',
        },
      },
      required: ['provider'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '로그인 성공, JWT 토큰 반환',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: '프로덕션 환경에서는 사용 불가',
  })
  async devLogin(@Body() body: DevLoginDto) {
    const request: DevLoginRequest = {
      provider: body.provider,
      nickname: body.nickname,
      subscriberCount: body.subscriberCount,
    };
    return this.authService.devLogin(request);
  }

  // ============================================
  // YouTube OAuth
  // ============================================

  @Public()
  @Throttle({ short: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @Get('youtube')
  @UseGuards(YouTubeOAuthGuard)
  @ApiOperation({ summary: 'YouTube OAuth 로그인 시작' })
  youtubeLogin() {
    // Guard가 리다이렉트 처리
  }

  @Public()
  @Get('youtube/callback')
  @UseGuards(YouTubeOAuthGuard)
  @ApiOperation({ summary: 'YouTube OAuth 콜백' })
  async youtubeCallback(@Req() req: OAuthRequest, @Res() res: Response) {
    return this.handleOAuthCallback('YOUTUBE', req, res);
  }

  // ============================================
  // TikTok OAuth
  // ============================================

  @Public()
  @Throttle({ short: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @Get('tiktok')
  @UseGuards(TikTokOAuthGuard)
  @ApiOperation({ summary: 'TikTok OAuth 로그인 시작' })
  tiktokLogin() {
    // Guard가 리다이렉트 처리
  }

  @Public()
  @Get('tiktok/callback')
  @UseGuards(TikTokOAuthGuard)
  @ApiOperation({ summary: 'TikTok OAuth 콜백' })
  async tiktokCallback(@Req() req: OAuthRequest, @Res() res: Response) {
    return this.handleOAuthCallback('TIKTOK', req, res);
  }

  // ============================================
  // Twitch OAuth
  // ============================================

  @Public()
  @Throttle({ short: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @Get('twitch')
  @UseGuards(TwitchOAuthGuard)
  @ApiOperation({ summary: 'Twitch OAuth 로그인 시작' })
  twitchLogin() {
    // Guard가 리다이렉트 처리
  }

  @Public()
  @Get('twitch/callback')
  @UseGuards(TwitchOAuthGuard)
  @ApiOperation({ summary: 'Twitch OAuth 콜백' })
  async twitchCallback(@Req() req: OAuthRequest, @Res() res: Response) {
    return this.handleOAuthCallback('TWITCH', req, res);
  }

  // ============================================
  // 사용자 정보 API
  // ============================================

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '현재 로그인한 사용자 정보 조회' })
  @ApiResponse({ status: HttpStatus.OK, description: '사용자 정보 반환' })
  async getMe(@CurrentUser() user: User) {
    const fullUser = await this.userService.findById(user.id);
    return fullUser;
  }

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
