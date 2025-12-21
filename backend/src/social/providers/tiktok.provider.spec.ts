import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TikTokProvider } from './tiktok.provider';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

/**
 * TikTok 프로바이더 테스트
 */
describe('TikTokProvider', () => {
  let provider: TikTokProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TikTokProvider],
    }).compile();

    provider = module.get<TikTokProvider>(TikTokProvider);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  describe('getStats', () => {
    it('TikTok 계정 통계를 반환해야 함', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          data: {
            user: {
              open_id: 'tiktok-id',
              display_name: 'TikTok User',
              avatar_url: 'https://example.com/avatar.jpg',
              follower_count: 50000,
              following_count: 100,
              likes_count: 500000,
              video_count: 200,
            },
          },
        },
      });

      const result = await provider.getStats('access-token');

      expect(result.followerCount).toBe(50000);
      expect(result.followingCount).toBe(100);
      expect(result.likesCount).toBe(500000);
      expect(result.videoCount).toBe(200);
      expect(result.displayName).toBe('TikTok User');
      expect(result.avatarUrl).toBe('https://example.com/avatar.jpg');
    });

    it('사용자가 없으면 NotFoundException을 던져야 함', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          data: {
            user: null,
          },
        },
      });

      await expect(provider.getStats('access-token')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('data가 undefined이면 NotFoundException을 던져야 함', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {},
      });

      await expect(provider.getStats('access-token')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('통계값이 없으면 0을 사용해야 함', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          data: {
            user: {
              open_id: 'tiktok-id',
            },
          },
        },
      });

      const result = await provider.getStats('access-token');

      expect(result.followerCount).toBe(0);
      expect(result.followingCount).toBe(0);
      expect(result.likesCount).toBe(0);
      expect(result.videoCount).toBe(0);
      expect(result.displayName).toBe('');
      expect(result.avatarUrl).toBe('');
    });

    it('올바른 API 엔드포인트를 호출해야 함', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          data: {
            user: { open_id: 'id' },
          },
        },
      });

      await provider.getStats('test-token');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://open.tiktokapis.com/v2/user/info/',
        expect.objectContaining({
          params: {
            fields:
              'open_id,display_name,avatar_url,follower_count,following_count,likes_count,video_count',
          },
          headers: {
            Authorization: 'Bearer test-token',
          },
        }),
      );
    });
  });
});
