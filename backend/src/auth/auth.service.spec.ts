import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';

/**
 * 인증 서비스 테스트
 */
describe('AuthService', () => {
  let service: AuthService;

  // Mock 데이터
  const mockUser = {
    id: 'user-1',
    nickname: '테스트유저',
    role: 'USER',
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    accounts: [
      {
        id: 'account-1',
        provider: 'YOUTUBE',
        providerAccountId: 'youtube-123',
        profileName: '테스트채널',
        profileImage: 'https://example.com/image.jpg',
        subscriberCount: 150000,
      },
    ],
  };

  // Mock Services
  const mockUserService = {
    findOrCreateByOAuth: jest.fn(),
    findById: jest.fn(),
    getMaxSubscriberCount: jest.fn(),
    updateNickname: jest.fn(),
    linkAccount: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  let nodeEnvValue = 'development';
  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        NODE_ENV: nodeEnvValue,
        JWT_SECRET: 'test-secret',
        JWT_EXPIRES_IN: '7d',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    nodeEnvValue = 'development'; // Reset to development

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateOAuthLogin', () => {
    it('OAuth 로그인 후 JWT 토큰을 반환해야 함', async () => {
      mockUserService.findOrCreateByOAuth.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('test-jwt-token');

      const result = await service.validateOAuthLogin({
        provider: 'YOUTUBE',
        providerAccountId: 'youtube-123',
        accessToken: 'oauth-access-token',
        refreshToken: 'oauth-refresh-token',
        profileName: '테스트채널',
        subscriberCount: 150000,
      });

      expect(result.user).toEqual(mockUser);
      expect(result.token.accessToken).toBe('test-jwt-token');
      expect(mockUserService.findOrCreateByOAuth).toHaveBeenCalled();
      expect(mockJwtService.sign).toHaveBeenCalled();
    });
  });

  describe('devLogin', () => {
    it('개발 환경에서 테스트 로그인이 가능해야 함', async () => {
      mockUserService.findOrCreateByOAuth.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('dev-jwt-token');

      const result = await service.devLogin({
        provider: 'YOUTUBE',
        nickname: '테스트유저',
        subscriberCount: 150000,
      });

      expect(result.user).toBeDefined();
      expect(result.token.accessToken).toBe('dev-jwt-token');
    });

    it('구독자 수 미지정 시 기본값 150000을 사용해야 함', async () => {
      mockUserService.findOrCreateByOAuth.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('dev-jwt-token');

      await service.devLogin({
        provider: 'TIKTOK',
      });

      expect(mockUserService.findOrCreateByOAuth).toHaveBeenCalledWith(
        expect.objectContaining({
          subscriberCount: 150000,
        }),
      );
    });

    it('프로덕션 환경에서는 ForbiddenException을 던져야 함', async () => {
      nodeEnvValue = 'production';

      await expect(
        service.devLogin({
          provider: 'YOUTUBE',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('refreshToken', () => {
    it('새 JWT 토큰을 발급해야 함', async () => {
      mockUserService.findById.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('new-jwt-token');

      const result = await service.refreshToken('user-1');

      expect(result.accessToken).toBe('new-jwt-token');
      expect(mockUserService.findById).toHaveBeenCalledWith('user-1');
    });

    it('존재하지 않는 사용자는 에러를 던져야 함', async () => {
      mockUserService.findById.mockResolvedValue(null);

      await expect(service.refreshToken('non-existent')).rejects.toThrow();
    });
  });

  describe('generateToken', () => {
    it('사용자 정보를 포함한 JWT 토큰을 생성해야 함', async () => {
      mockJwtService.sign.mockReturnValue('generated-token');

      const result = await service.generateToken(mockUser as any);

      expect(result.accessToken).toBe('generated-token');
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: 'user-1',
        }),
      );
    });

    it('expiresIn을 포함해야 함', () => {
      mockJwtService.sign.mockReturnValue('test-token');

      const result = service.generateToken(mockUser as any);

      expect(result.expiresIn).toBeDefined();
      expect(typeof result.expiresIn).toBe('number');
    });
  });

  describe('linkOAuthAccount', () => {
    it('기존 사용자에게 OAuth 계정을 연결해야 함', async () => {
      mockUserService.linkAccount.mockResolvedValue(undefined);
      mockUserService.findById.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('linked-token');

      const result = await service.linkOAuthAccount('user-1', {
        provider: 'TIKTOK',
        providerAccountId: 'tiktok-123',
        accessToken: 'tiktok-access',
        refreshToken: 'tiktok-refresh',
        profileName: '틱톡계정',
        subscriberCount: 50000,
      });

      expect(result.user).toEqual(mockUser);
      expect(result.token.accessToken).toBe('linked-token');
      expect(mockUserService.linkAccount).toHaveBeenCalledWith('user-1', expect.objectContaining({
        provider: 'TIKTOK',
      }));
    });

    it('사용자를 찾을 수 없으면 NotFoundException을 던져야 함', async () => {
      mockUserService.linkAccount.mockResolvedValue(undefined);
      mockUserService.findById.mockResolvedValue(null);

      await expect(
        service.linkOAuthAccount('non-existent', {
          provider: 'TWITCH',
          providerAccountId: 'twitch-123',
          accessToken: 'twitch-access',
          refreshToken: 'twitch-refresh',
          profileName: '트위치계정',
          subscriberCount: 10000,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getExpiresInSeconds (private)', () => {
    it('초 단위를 올바르게 변환해야 함', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'JWT_EXPIRES_IN') return '300s';
        return 'development';
      });
      mockJwtService.sign.mockReturnValue('test-token');

      // getExpiresInSeconds는 private이므로 generateToken을 통해 테스트
      const result = service.generateToken(mockUser as any);

      expect(result.expiresIn).toBe(300);
    });

    it('분 단위를 올바르게 변환해야 함', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'JWT_EXPIRES_IN') return '30m';
        return 'development';
      });
      mockJwtService.sign.mockReturnValue('test-token');

      const result = service.generateToken(mockUser as any);

      expect(result.expiresIn).toBe(1800); // 30 * 60
    });

    it('시간 단위를 올바르게 변환해야 함', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'JWT_EXPIRES_IN') return '2h';
        return 'development';
      });
      mockJwtService.sign.mockReturnValue('test-token');

      const result = service.generateToken(mockUser as any);

      expect(result.expiresIn).toBe(7200); // 2 * 3600
    });

    it('일 단위를 올바르게 변환해야 함', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'JWT_EXPIRES_IN') return '7d';
        return 'development';
      });
      mockJwtService.sign.mockReturnValue('test-token');

      const result = service.generateToken(mockUser as any);

      expect(result.expiresIn).toBe(604800); // 7 * 86400
    });

    it('잘못된 형식이면 기본값 7일을 사용해야 함', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'JWT_EXPIRES_IN') return 'invalid';
        return 'development';
      });
      mockJwtService.sign.mockReturnValue('test-token');

      const result = service.generateToken(mockUser as any);

      expect(result.expiresIn).toBe(604800); // 7일 기본값
    });

    it('JWT_EXPIRES_IN이 없으면 기본값 7일을 사용해야 함', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'JWT_EXPIRES_IN') return undefined;
        return 'development';
      });
      mockJwtService.sign.mockReturnValue('test-token');

      const result = service.generateToken(mockUser as any);

      expect(result.expiresIn).toBe(604800); // 7일 기본값
    });
  });

  describe('devLogin 추가 케이스', () => {
    it('닉네임이 없으면 기본 닉네임을 생성해야 함', async () => {
      mockUserService.findOrCreateByOAuth.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('dev-jwt-token');

      await service.devLogin({
        provider: 'YOUTUBE',
        subscriberCount: 100000,
      });

      // nickname 업데이트 확인 - 기본 닉네임 형식: 테스트_YOUTUBE
      expect(mockUserService.updateNickname).toHaveBeenCalledWith('user-1', '테스트_YOUTUBE');
    });

    it('TikTok 플랫폼으로 개발 로그인을 해야 함', async () => {
      mockUserService.findOrCreateByOAuth.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('dev-jwt-token');

      await service.devLogin({
        provider: 'TIKTOK',
        nickname: '틱톡테스트',
      });

      expect(mockUserService.findOrCreateByOAuth).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'TIKTOK',
          providerAccountId: 'dev_TIKTOK_test',
        }),
      );
    });

    it('Twitch 플랫폼으로 개발 로그인을 해야 함', async () => {
      mockUserService.findOrCreateByOAuth.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('dev-jwt-token');

      await service.devLogin({
        provider: 'TWITCH',
        nickname: '트위치테스트',
        subscriberCount: 25000,
      });

      expect(mockUserService.findOrCreateByOAuth).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'TWITCH',
          subscriberCount: 25000,
        }),
      );
    });

    it('사용자 닉네임을 업데이트해야 함', async () => {
      mockUserService.findOrCreateByOAuth.mockResolvedValue(mockUser);
      mockUserService.updateNickname.mockResolvedValue(undefined);
      mockJwtService.sign.mockReturnValue('dev-jwt-token');

      const result = await service.devLogin({
        provider: 'YOUTUBE',
        nickname: '새로운닉네임',
      });

      expect(mockUserService.updateNickname).toHaveBeenCalledWith('user-1', '새로운닉네임');
      expect(result.user.nickname).toBe('새로운닉네임');
    });
  });

  describe('validateOAuthLogin 추가 케이스', () => {
    it('프로필 이미지를 포함해야 함', async () => {
      mockUserService.findOrCreateByOAuth.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('test-jwt-token');

      await service.validateOAuthLogin({
        provider: 'YOUTUBE',
        providerAccountId: 'youtube-123',
        accessToken: 'oauth-access-token',
        refreshToken: 'oauth-refresh-token',
        profileName: '테스트채널',
        profileImage: 'https://example.com/profile.jpg',
        subscriberCount: 150000,
      });

      expect(mockUserService.findOrCreateByOAuth).toHaveBeenCalledWith(
        expect.objectContaining({
          profileImage: 'https://example.com/profile.jpg',
        }),
      );
    });

    it('TikTok OAuth 로그인을 처리해야 함', async () => {
      mockUserService.findOrCreateByOAuth.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('tiktok-jwt-token');

      const result = await service.validateOAuthLogin({
        provider: 'TIKTOK',
        providerAccountId: 'tiktok-456',
        accessToken: 'tiktok-access',
        refreshToken: 'tiktok-refresh',
        profileName: '틱톡유저',
        subscriberCount: 50000,
      });

      expect(result.token.accessToken).toBe('tiktok-jwt-token');
    });

    it('Twitch OAuth 로그인을 처리해야 함', async () => {
      mockUserService.findOrCreateByOAuth.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('twitch-jwt-token');

      const result = await service.validateOAuthLogin({
        provider: 'TWITCH',
        providerAccountId: 'twitch-789',
        accessToken: 'twitch-access',
        refreshToken: 'twitch-refresh',
        profileName: '트위치스트리머',
        subscriberCount: 10000,
      });

      expect(result.token.accessToken).toBe('twitch-jwt-token');
    });
  });

  describe('refreshToken 추가 케이스', () => {
    it('NotFoundException 메시지를 확인해야 함', async () => {
      mockUserService.findById.mockResolvedValue(null);

      await expect(service.refreshToken('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('갱신된 토큰에 expiresIn이 포함되어야 함', async () => {
      mockUserService.findById.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('refreshed-token');

      const result = await service.refreshToken('user-1');

      expect(result.expiresIn).toBeDefined();
      expect(result.accessToken).toBe('refreshed-token');
    });
  });
});
