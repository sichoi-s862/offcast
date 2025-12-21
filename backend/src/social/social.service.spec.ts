import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SocialService } from './social.service';
import { UserService } from '../user/user.service';
import { YouTubeProvider } from './providers/youtube.provider';
import { TikTokProvider } from './providers/tiktok.provider';
import { TwitchProvider } from './providers/twitch.provider';

/**
 * 소셜 서비스 테스트
 */
describe('SocialService', () => {
  let service: SocialService;

  // Mock 데이터
  const mockAccount = {
    id: 'account-1',
    userId: 'user-1',
    provider: 'YOUTUBE',
    providerAccountId: 'youtube-123',
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    profileName: '테스트채널',
    profileImage: 'https://example.com/image.jpg',
    subscriberCount: 150000,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockYouTubeStats = {
    subscriberCount: 150000,
    videoCount: 100,
    viewCount: 1000000,
    channelId: 'channel-123',
    channelTitle: '테스트채널',
    thumbnailUrl: 'https://example.com/thumb.jpg',
  };

  const mockTikTokStats = {
    followerCount: 50000,
    followingCount: 100,
    likesCount: 500000,
    videoCount: 200,
    displayName: '틱톡유저',
    avatarUrl: 'https://example.com/avatar.jpg',
  };

  const mockTwitchStats = {
    viewCount: 25000,
    login: 'twitch_user',
    displayName: '트위치유저',
    profileImage: 'https://example.com/profile.jpg',
    broadcasterType: 'partner',
  };

  // Mock Services
  const mockUserService = {
    getAccountByProvider: jest.fn(),
    getAccounts: jest.fn(),
  };

  const mockYouTubeProvider = {
    getStats: jest.fn(),
  };

  const mockTikTokProvider = {
    getStats: jest.fn(),
  };

  const mockTwitchProvider = {
    getStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocialService,
        { provide: UserService, useValue: mockUserService },
        { provide: YouTubeProvider, useValue: mockYouTubeProvider },
        { provide: TikTokProvider, useValue: mockTikTokProvider },
        { provide: TwitchProvider, useValue: mockTwitchProvider },
      ],
    }).compile();

    service = module.get<SocialService>(SocialService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getYouTubeStats', () => {
    it('YouTube 통계를 반환해야 함', async () => {
      mockUserService.getAccountByProvider.mockResolvedValue(mockAccount);
      mockYouTubeProvider.getStats.mockResolvedValue(mockYouTubeStats);

      const result = await service.getYouTubeStats('user-1');

      expect(result).toEqual(mockYouTubeStats);
      expect(mockUserService.getAccountByProvider).toHaveBeenCalledWith('user-1', 'YOUTUBE');
    });

    it('YouTube 계정이 없으면 NotFoundException을 던져야 함', async () => {
      mockUserService.getAccountByProvider.mockResolvedValue(null);

      await expect(service.getYouTubeStats('user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getTikTokStats', () => {
    it('TikTok 통계를 반환해야 함', async () => {
      mockUserService.getAccountByProvider.mockResolvedValue({
        ...mockAccount,
        provider: 'TIKTOK',
      });
      mockTikTokProvider.getStats.mockResolvedValue(mockTikTokStats);

      const result = await service.getTikTokStats('user-1');

      expect(result).toEqual(mockTikTokStats);
    });

    it('TikTok 계정이 없으면 NotFoundException을 던져야 함', async () => {
      mockUserService.getAccountByProvider.mockResolvedValue(null);

      await expect(service.getTikTokStats('user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getTwitchStats', () => {
    it('Twitch 통계를 반환해야 함', async () => {
      mockUserService.getAccountByProvider.mockResolvedValue({
        ...mockAccount,
        provider: 'TWITCH',
      });
      mockTwitchProvider.getStats.mockResolvedValue(mockTwitchStats);

      const result = await service.getTwitchStats('user-1');

      expect(result).toEqual(mockTwitchStats);
    });

    it('Twitch 계정이 없으면 NotFoundException을 던져야 함', async () => {
      mockUserService.getAccountByProvider.mockResolvedValue(null);

      await expect(service.getTwitchStats('user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStatsByProvider', () => {
    it('youtube provider로 YouTube 통계를 반환해야 함', async () => {
      mockUserService.getAccountByProvider.mockResolvedValue(mockAccount);
      mockYouTubeProvider.getStats.mockResolvedValue(mockYouTubeStats);

      const result = await service.getStatsByProvider('user-1', 'youtube');

      expect(result).toEqual(mockYouTubeStats);
    });

    it('tiktok provider로 TikTok 통계를 반환해야 함', async () => {
      mockUserService.getAccountByProvider.mockResolvedValue({
        ...mockAccount,
        provider: 'TIKTOK',
      });
      mockTikTokProvider.getStats.mockResolvedValue(mockTikTokStats);

      const result = await service.getStatsByProvider('user-1', 'tiktok');

      expect(result).toEqual(mockTikTokStats);
    });

    it('twitch provider로 Twitch 통계를 반환해야 함', async () => {
      mockUserService.getAccountByProvider.mockResolvedValue({
        ...mockAccount,
        provider: 'TWITCH',
      });
      mockTwitchProvider.getStats.mockResolvedValue(mockTwitchStats);

      const result = await service.getStatsByProvider('user-1', 'twitch');

      expect(result).toEqual(mockTwitchStats);
    });

    it('알 수 없는 provider는 BadRequestException을 던져야 함', async () => {
      await expect(
        service.getStatsByProvider('user-1', 'invalid' as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getAllStats', () => {
    it('모든 연결된 플랫폼의 통계를 반환해야 함', async () => {
      mockUserService.getAccounts.mockResolvedValue([
        { ...mockAccount, provider: 'YOUTUBE' },
        { ...mockAccount, provider: 'TIKTOK' },
        { ...mockAccount, provider: 'TWITCH' },
      ]);
      mockYouTubeProvider.getStats.mockResolvedValue(mockYouTubeStats);
      mockTikTokProvider.getStats.mockResolvedValue(mockTikTokStats);
      mockTwitchProvider.getStats.mockResolvedValue(mockTwitchStats);

      const result = await service.getAllStats('user-1');

      expect(result.youtube).toEqual(mockYouTubeStats);
      expect(result.tiktok).toEqual(mockTikTokStats);
      expect(result.twitch).toEqual(mockTwitchStats);
    });

    it('연결된 계정이 없으면 빈 객체를 반환해야 함', async () => {
      mockUserService.getAccounts.mockResolvedValue([]);

      const result = await service.getAllStats('user-1');

      expect(result).toEqual({});
    });

    it('일부 플랫폼 통계 조회 실패 시 해당 플랫폼만 제외해야 함', async () => {
      mockUserService.getAccounts.mockResolvedValue([
        { ...mockAccount, provider: 'YOUTUBE' },
        { ...mockAccount, provider: 'TIKTOK' },
      ]);
      mockYouTubeProvider.getStats.mockResolvedValue(mockYouTubeStats);
      mockTikTokProvider.getStats.mockRejectedValue(new Error('API Error'));

      const result = await service.getAllStats('user-1');

      expect(result.youtube).toEqual(mockYouTubeStats);
      expect(result.tiktok).toBeUndefined();
    });
  });

  describe('getLinkedAccounts', () => {
    it('연결된 계정 목록을 반환해야 함', async () => {
      const accounts = [
        { ...mockAccount, provider: 'YOUTUBE', createdAt: new Date('2024-01-01') },
        { ...mockAccount, provider: 'TIKTOK', createdAt: new Date('2024-01-02') },
      ];
      mockUserService.getAccounts.mockResolvedValue(accounts);

      const result = await service.getLinkedAccounts('user-1');

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('provider');
      expect(result[0]).toHaveProperty('profileName');
      expect(result[0]).toHaveProperty('linkedAt');
    });

    it('연결된 계정이 없으면 빈 배열을 반환해야 함', async () => {
      mockUserService.getAccounts.mockResolvedValue([]);

      const result = await service.getLinkedAccounts('user-1');

      expect(result).toEqual([]);
    });
  });
});
