import { Test, TestingModule } from '@nestjs/testing';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';

/**
 * 소셜 컨트롤러 테스트
 */
describe('SocialController', () => {
  let controller: SocialController;

  // Mock 데이터
  const mockUser = {
    id: 'user-1',
    nickname: '테스트유저',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockLinkedAccount = {
    provider: 'YOUTUBE',
    providerAccountId: 'youtube-123',
    profileName: '테스트채널',
    profileImage: 'https://example.com/avatar.jpg',
  };

  const mockYouTubeStats = {
    subscriberCount: 100000,
    videoCount: 50,
    viewCount: 5000000,
  };

  const mockTikTokStats = {
    followerCount: 50000,
    followingCount: 100,
    likeCount: 500000,
  };

  const mockTwitchStats = {
    viewCount: 25000,
    login: 'twitch_user',
    displayName: '트위치유저',
    broadcasterType: 'partner',
  };

  // Mock Services
  const mockSocialService = {
    getLinkedAccounts: jest.fn(),
    getYouTubeStats: jest.fn(),
    getTikTokStats: jest.fn(),
    getTwitchStats: jest.fn(),
    getAllStats: jest.fn(),
    getStatsByProvider: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SocialController],
      providers: [{ provide: SocialService, useValue: mockSocialService }],
    }).compile();

    controller = module.get<SocialController>(SocialController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getLinkedAccounts', () => {
    it('연결된 소셜 계정 목록을 반환해야 함', async () => {
      mockSocialService.getLinkedAccounts.mockResolvedValue([mockLinkedAccount]);

      const result = await controller.getLinkedAccounts(mockUser as any);

      expect(result).toHaveLength(1);
      expect(result[0].provider).toBe('YOUTUBE');
      expect(mockSocialService.getLinkedAccounts).toHaveBeenCalledWith('user-1');
    });

    it('연결된 계정이 없으면 빈 배열을 반환해야 함', async () => {
      mockSocialService.getLinkedAccounts.mockResolvedValue([]);

      const result = await controller.getLinkedAccounts(mockUser as any);

      expect(result).toEqual([]);
    });
  });

  describe('getYouTubeStats', () => {
    it('YouTube 채널 통계를 반환해야 함', async () => {
      mockSocialService.getYouTubeStats.mockResolvedValue(mockYouTubeStats);

      const result = await controller.getYouTubeStats(mockUser as any);

      expect(result.subscriberCount).toBe(100000);
      expect(mockSocialService.getYouTubeStats).toHaveBeenCalledWith('user-1');
    });

    it('YouTube 계정이 없으면 null을 반환해야 함', async () => {
      mockSocialService.getYouTubeStats.mockResolvedValue(null);

      const result = await controller.getYouTubeStats(mockUser as any);

      expect(result).toBeNull();
    });
  });

  describe('getTikTokStats', () => {
    it('TikTok 계정 통계를 반환해야 함', async () => {
      mockSocialService.getTikTokStats.mockResolvedValue(mockTikTokStats);

      const result = await controller.getTikTokStats(mockUser as any);

      expect(result.followerCount).toBe(50000);
      expect(mockSocialService.getTikTokStats).toHaveBeenCalledWith('user-1');
    });

    it('TikTok 계정이 없으면 null을 반환해야 함', async () => {
      mockSocialService.getTikTokStats.mockResolvedValue(null);

      const result = await controller.getTikTokStats(mockUser as any);

      expect(result).toBeNull();
    });
  });

  describe('getTwitchStats', () => {
    it('Twitch 계정 통계를 반환해야 함', async () => {
      mockSocialService.getTwitchStats.mockResolvedValue(mockTwitchStats);

      const result = await controller.getTwitchStats(mockUser as any);

      expect(result.viewCount).toBe(25000);
      expect(mockSocialService.getTwitchStats).toHaveBeenCalledWith('user-1');
    });

    it('Twitch 계정이 없으면 null을 반환해야 함', async () => {
      mockSocialService.getTwitchStats.mockResolvedValue(null);

      const result = await controller.getTwitchStats(mockUser as any);

      expect(result).toBeNull();
    });
  });

  describe('getAllStats', () => {
    it('모든 연결된 플랫폼 통계를 반환해야 함', async () => {
      const allStats = {
        youtube: mockYouTubeStats,
        tiktok: mockTikTokStats,
        twitch: mockTwitchStats,
      };
      mockSocialService.getAllStats.mockResolvedValue(allStats);

      const result = await controller.getAllStats(mockUser as any);

      expect(result.youtube).toEqual(mockYouTubeStats);
      expect(result.tiktok).toEqual(mockTikTokStats);
      expect(result.twitch).toEqual(mockTwitchStats);
      expect(mockSocialService.getAllStats).toHaveBeenCalledWith('user-1');
    });

    it('연결된 플랫폼이 없으면 빈 객체를 반환해야 함', async () => {
      mockSocialService.getAllStats.mockResolvedValue({});

      const result = await controller.getAllStats(mockUser as any);

      expect(result).toEqual({});
    });
  });

  describe('getStatsByProvider', () => {
    it('YouTube 통계를 반환해야 함', async () => {
      mockSocialService.getStatsByProvider.mockResolvedValue(mockYouTubeStats);

      const result = await controller.getStatsByProvider(
        mockUser as any,
        'youtube',
      );

      expect(result.subscriberCount).toBe(100000);
      expect(mockSocialService.getStatsByProvider).toHaveBeenCalledWith(
        'user-1',
        'youtube',
      );
    });

    it('TikTok 통계를 반환해야 함', async () => {
      mockSocialService.getStatsByProvider.mockResolvedValue(mockTikTokStats);

      const result = await controller.getStatsByProvider(
        mockUser as any,
        'tiktok',
      );

      expect(result.followerCount).toBe(50000);
    });

    it('Twitch 통계를 반환해야 함', async () => {
      mockSocialService.getStatsByProvider.mockResolvedValue(mockTwitchStats);

      const result = await controller.getStatsByProvider(
        mockUser as any,
        'twitch',
      );

      expect(result.viewCount).toBe(25000);
    });

    it('해당 플랫폼이 연결되지 않았으면 null을 반환해야 함', async () => {
      mockSocialService.getStatsByProvider.mockResolvedValue(null);

      const result = await controller.getStatsByProvider(
        mockUser as any,
        'youtube',
      );

      expect(result).toBeNull();
    });
  });
});
