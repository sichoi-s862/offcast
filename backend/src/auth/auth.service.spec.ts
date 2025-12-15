import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ForbiddenException } from '@nestjs/common';
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
  });
});
