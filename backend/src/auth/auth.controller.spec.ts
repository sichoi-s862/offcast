import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpStatus } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { Provider } from '@prisma/client';

/**
 * 인증 컨트롤러 테스트
 */
describe('AuthController', () => {
  let controller: AuthController;

  // Mock 데이터
  const mockUser = {
    id: 'user-1',
    nickname: '테스트유저',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockToken = {
    accessToken: 'mock-access-token',
    expiresIn: 3600,
  };

  // Mock Services
  const mockAuthService = {
    validateOAuthLogin: jest.fn(),
    devLogin: jest.fn(),
    refreshToken: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockUserService = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('devLogin', () => {
    it('개발용 로그인을 성공적으로 수행해야 함', async () => {
      const devLoginResult = { user: mockUser, token: mockToken };
      mockAuthService.devLogin.mockResolvedValue(devLoginResult);

      const result = await controller.devLogin({
        provider: Provider.YOUTUBE,
        nickname: '테스트유저',
        subscriberCount: 150000,
      });

      expect(result).toEqual(devLoginResult);
      expect(mockAuthService.devLogin).toHaveBeenCalledWith({
        provider: Provider.YOUTUBE,
        nickname: '테스트유저',
        subscriberCount: 150000,
      });
    });

    it('닉네임 없이 로그인해야 함', async () => {
      const devLoginResult = { user: mockUser, token: mockToken };
      mockAuthService.devLogin.mockResolvedValue(devLoginResult);

      const result = await controller.devLogin({
        provider: Provider.TIKTOK,
      });

      expect(result).toEqual(devLoginResult);
      expect(mockAuthService.devLogin).toHaveBeenCalledWith({
        provider: Provider.TIKTOK,
        nickname: undefined,
        subscriberCount: undefined,
      });
    });
  });

  describe('youtubeLogin', () => {
    it('YouTube 로그인이 정의되어야 함', () => {
      expect(controller.youtubeLogin).toBeDefined();
      // Guard가 리다이렉트 처리하므로 반환값 없음
      expect(controller.youtubeLogin()).toBeUndefined();
    });
  });

  describe('youtubeCallback', () => {
    it('YouTube 콜백을 처리하고 리다이렉트해야 함', async () => {
      const mockReq = {
        user: {
          accessToken: 'youtube-access-token',
          refreshToken: 'youtube-refresh-token',
          profile: {
            id: 'youtube-id',
            title: 'Test Channel',
            thumbnail: 'https://example.com/thumb.jpg',
            subscriberCount: 100000,
          },
        },
      } as any;

      const mockRes = {
        redirect: jest.fn(),
      } as any;

      mockAuthService.validateOAuthLogin.mockResolvedValue({
        user: mockUser,
        token: mockToken,
      });
      mockConfigService.get.mockReturnValue('http://localhost:3000');

      await controller.youtubeCallback(mockReq, mockRes);

      expect(mockAuthService.validateOAuthLogin).toHaveBeenCalled();
      expect(mockRes.redirect).toHaveBeenCalled();
      const redirectUrl = mockRes.redirect.mock.calls[0][0];
      expect(redirectUrl).toContain('http://localhost:3000/auth/callback');
      expect(redirectUrl).toContain('token=mock-access-token');
      expect(redirectUrl).toContain('provider=YOUTUBE');
    });
  });

  describe('tiktokLogin', () => {
    it('TikTok 로그인이 정의되어야 함', () => {
      expect(controller.tiktokLogin).toBeDefined();
      expect(controller.tiktokLogin()).toBeUndefined();
    });
  });

  describe('tiktokCallback', () => {
    it('TikTok 콜백을 처리해야 함 (followerCount 사용)', async () => {
      const mockReq = {
        user: {
          accessToken: 'tiktok-access-token',
          refreshToken: 'tiktok-refresh-token',
          profile: {
            id: 'tiktok-id',
            displayName: 'TikTok User',
            avatarUrl: 'https://example.com/avatar.jpg',
            followerCount: 50000, // TikTok용 필드
          },
        },
      } as any;

      const mockRes = {
        redirect: jest.fn(),
      } as any;

      mockAuthService.validateOAuthLogin.mockResolvedValue({
        user: mockUser,
        token: mockToken,
      });
      mockConfigService.get.mockReturnValue('http://localhost:3000');

      await controller.tiktokCallback(mockReq, mockRes);

      expect(mockAuthService.validateOAuthLogin).toHaveBeenCalled();
      const redirectUrl = mockRes.redirect.mock.calls[0][0];
      expect(redirectUrl).toContain('subscriberCount=50000');
    });
  });

  describe('twitchLogin', () => {
    it('Twitch 로그인이 정의되어야 함', () => {
      expect(controller.twitchLogin).toBeDefined();
      expect(controller.twitchLogin()).toBeUndefined();
    });
  });

  describe('twitchCallback', () => {
    it('Twitch 콜백을 처리해야 함 (viewCount 사용)', async () => {
      const mockReq = {
        user: {
          accessToken: 'twitch-access-token',
          refreshToken: 'twitch-refresh-token',
          profile: {
            id: 'twitch-id',
            displayName: 'TwitchUser',
            name: 'Twitch User',
            profileImage: 'https://example.com/pic.jpg',
            viewCount: 25000, // Twitch용 필드
          },
        },
      } as any;

      const mockRes = {
        redirect: jest.fn(),
      } as any;

      mockAuthService.validateOAuthLogin.mockResolvedValue({
        user: mockUser,
        token: mockToken,
      });
      mockConfigService.get.mockReturnValue('http://localhost:3000');

      await controller.twitchCallback(mockReq, mockRes);

      expect(mockAuthService.validateOAuthLogin).toHaveBeenCalled();
      const redirectUrl = mockRes.redirect.mock.calls[0][0];
      expect(redirectUrl).toContain('subscriberCount=25000');
    });
  });

  describe('getMe', () => {
    it('현재 로그인한 사용자 정보를 반환해야 함', async () => {
      mockUserService.findById.mockResolvedValue(mockUser);

      const result = await controller.getMe(mockUser as any);

      expect(result).toEqual(mockUser);
      expect(mockUserService.findById).toHaveBeenCalledWith('user-1');
    });
  });

  describe('refresh', () => {
    it('토큰을 갱신해야 함', async () => {
      mockAuthService.refreshToken.mockResolvedValue(mockToken);

      const result = await controller.refresh(mockUser as any);

      expect(result).toEqual(mockToken);
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith('user-1');
    });
  });

  describe('createOAuthProfile (private helper)', () => {
    it('다양한 프로필 필드를 처리해야 함', async () => {
      // 프로필 이름 우선순위: title > displayName > nickname > name > username
      const mockReq1 = {
        user: {
          accessToken: 'token',
          refreshToken: 'refresh',
          profile: {
            id: 'id',
            title: 'Channel Title',
            displayName: 'Display Name',
            nickname: 'Nickname',
          },
        },
      } as any;

      const mockRes = {
        redirect: jest.fn(),
      } as any;

      mockAuthService.validateOAuthLogin.mockResolvedValue({
        user: mockUser,
        token: mockToken,
      });
      mockConfigService.get.mockReturnValue('http://localhost:3000');

      await controller.youtubeCallback(mockReq1, mockRes);

      // createOAuthProfile이 title을 profileName으로 사용
      const callArg = mockAuthService.validateOAuthLogin.mock.calls[0][0];
      expect(callArg.profileName).toBe('Channel Title');
    });

    it('이미지 필드 우선순위를 처리해야 함', async () => {
      const mockReq = {
        user: {
          accessToken: 'token',
          refreshToken: 'refresh',
          profile: {
            id: 'id',
            name: 'User',
            avatarUrl: 'avatar.jpg',
            profileImage: 'profile.jpg',
          },
        },
      } as any;

      const mockRes = {
        redirect: jest.fn(),
      } as any;

      mockAuthService.validateOAuthLogin.mockResolvedValue({
        user: mockUser,
        token: mockToken,
      });
      mockConfigService.get.mockReturnValue('http://localhost:3000');

      await controller.tiktokCallback(mockReq, mockRes);

      const callArg = mockAuthService.validateOAuthLogin.mock.calls[0][0];
      // thumbnail이 없으므로 avatarUrl 사용
      expect(callArg.profileImage).toBe('avatar.jpg');
    });
  });

  describe('handleOAuthCallback edge cases', () => {
    it('채널명이 없을 때 처리해야 함', async () => {
      const mockReq = {
        user: {
          accessToken: 'token',
          refreshToken: 'refresh',
          profile: {
            id: 'id',
            // 이름 필드 없음
          },
        },
      } as any;

      const mockRes = {
        redirect: jest.fn(),
      } as any;

      mockAuthService.validateOAuthLogin.mockResolvedValue({
        user: mockUser,
        token: mockToken,
      });
      mockConfigService.get.mockReturnValue('http://localhost:3000');

      await controller.youtubeCallback(mockReq, mockRes);

      const redirectUrl = mockRes.redirect.mock.calls[0][0];
      // channelName 파라미터가 없거나 빈 값
      expect(redirectUrl).not.toContain('channelName=');
    });

    it('구독자 수가 undefined일 때 처리해야 함', async () => {
      const mockReq = {
        user: {
          accessToken: 'token',
          refreshToken: 'refresh',
          profile: {
            id: 'id',
            name: 'User',
            // subscriberCount, followerCount, followersCount 모두 없음
          },
        },
      } as any;

      const mockRes = {
        redirect: jest.fn(),
      } as any;

      mockAuthService.validateOAuthLogin.mockResolvedValue({
        user: mockUser,
        token: mockToken,
      });
      mockConfigService.get.mockReturnValue('http://localhost:3000');

      await controller.youtubeCallback(mockReq, mockRes);

      const redirectUrl = mockRes.redirect.mock.calls[0][0];
      // subscriberCount 파라미터가 없어야 함
      expect(redirectUrl).not.toContain('subscriberCount=');
    });

    it('구독자 수가 0일 때는 포함되지 않아야 함 (OR 연산으로 인해)', async () => {
      const mockReq = {
        user: {
          accessToken: 'token',
          refreshToken: 'refresh',
          profile: {
            id: 'id',
            name: 'User',
            subscriberCount: 0,
          },
        },
      } as any;

      const mockRes = {
        redirect: jest.fn(),
      } as any;

      mockAuthService.validateOAuthLogin.mockResolvedValue({
        user: mockUser,
        token: mockToken,
      });
      mockConfigService.get.mockReturnValue('http://localhost:3000');

      await controller.youtubeCallback(mockReq, mockRes);

      const redirectUrl = mockRes.redirect.mock.calls[0][0];
      // OR 연산 (||)이 사용되어 0은 falsy로 취급됨 -> undefined와 동일하게 처리
      expect(redirectUrl).not.toContain('subscriberCount=');
    });
  });
});
