import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService, OAuthProfile } from '../user/user.service';
import { User, Provider } from '@prisma/client';

/**
 * JWT 토큰 페이로드 인터페이스
 */
export interface TokenPayload {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

/**
 * 인증 결과 인터페이스
 */
export interface AuthResult {
  user: User;
  token: TokenPayload;
}

/**
 * 개발용 로그인 요청 인터페이스
 */
export interface DevLoginRequest {
  provider: Provider;
  nickname?: string;
  subscriberCount?: number;
}

/**
 * 인증 서비스
 * - OAuth 로그인 처리, JWT 토큰 발급/갱신
 */
@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private userService: UserService,
  ) {}

  /**
   * OAuth 로그인 검증 및 토큰 발급
   */
  async validateOAuthLogin(profile: OAuthProfile): Promise<AuthResult> {
    const user = await this.userService.findOrCreateByOAuth(profile);
    const token = this.generateToken(user);
    return { user, token };
  }

  /**
   * 기존 사용자에게 OAuth 계정 연결
   */
  async linkOAuthAccount(
    userId: string,
    profile: OAuthProfile,
  ): Promise<AuthResult> {
    await this.userService.linkAccount(userId, profile);
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }
    const token = this.generateToken(user);
    return { user, token };
  }

  /**
   * JWT 토큰 생성
   */
  generateToken(user: User): TokenPayload {
    const payload = { sub: user.id };
    const expiresIn = this.getExpiresInSeconds();

    return {
      accessToken: this.jwtService.sign(payload),
      expiresIn,
    };
  }

  /**
   * 토큰 갱신
   */
  async refreshToken(userId: string): Promise<TokenPayload> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }
    return this.generateToken(user);
  }

  /**
   * 개발용 테스트 로그인
   * - 실제 OAuth 없이 테스트용 JWT 발급
   * - 프로덕션 환경에서는 사용 불가
   */
  async devLogin(request: DevLoginRequest): Promise<AuthResult> {
    // 프로덕션 환경 체크
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    if (nodeEnv === 'production') {
      throw new ForbiddenException('개발용 로그인은 프로덕션 환경에서 사용할 수 없습니다');
    }

    // 테스트용 프로필 생성
    const testProfile: OAuthProfile = {
      provider: request.provider,
      providerAccountId: `dev_${request.provider}_${Date.now()}`,
      accessToken: 'dev_access_token',
      refreshToken: 'dev_refresh_token',
      profileName: request.nickname || `테스트_${request.provider}`,
      profileImage: '',
      subscriberCount: request.subscriberCount || 150000, // 기본값: 15만 구독자
    };

    const user = await this.userService.findOrCreateByOAuth(testProfile);
    const token = this.generateToken(user);

    return { user, token };
  }

  /**
   * JWT 만료 시간을 초 단위로 변환
   */
  private getExpiresInSeconds(): number {
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '7d';
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 604800; // 기본값: 7일

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 604800;
    }
  }
}
