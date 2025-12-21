import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { YouTubeProvider } from './youtube.provider';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

/**
 * YouTube 프로바이더 테스트
 */
describe('YouTubeProvider', () => {
  let provider: YouTubeProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [YouTubeProvider],
    }).compile();

    provider = module.get<YouTubeProvider>(YouTubeProvider);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  describe('getStats', () => {
    it('YouTube 채널 통계를 반환해야 함', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          items: [
            {
              id: 'channel-id',
              snippet: {
                title: 'Test Channel',
                thumbnails: {
                  default: { url: 'https://example.com/thumb.jpg' },
                },
              },
              statistics: {
                subscriberCount: '100000',
                videoCount: '50',
                viewCount: '5000000',
              },
            },
          ],
        },
      });

      const result = await provider.getStats('access-token');

      expect(result.subscriberCount).toBe(100000);
      expect(result.videoCount).toBe(50);
      expect(result.viewCount).toBe(5000000);
      expect(result.channelId).toBe('channel-id');
      expect(result.channelTitle).toBe('Test Channel');
      expect(result.thumbnailUrl).toBe('https://example.com/thumb.jpg');
    });

    it('채널이 없으면 NotFoundException을 던져야 함', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          items: [],
        },
      });

      await expect(provider.getStats('access-token')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('items가 undefined이면 NotFoundException을 던져야 함', async () => {
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
          items: [
            {
              id: 'channel-id',
              snippet: {
                title: 'New Channel',
                thumbnails: {},
              },
              statistics: {},
            },
          ],
        },
      });

      const result = await provider.getStats('access-token');

      expect(result.subscriberCount).toBe(0);
      expect(result.videoCount).toBe(0);
      expect(result.viewCount).toBe(0);
      expect(result.thumbnailUrl).toBe('');
    });

    it('올바른 API 엔드포인트를 호출해야 함', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          items: [
            {
              id: 'channel-id',
              snippet: { title: 'Test', thumbnails: {} },
              statistics: {},
            },
          ],
        },
      });

      await provider.getStats('test-token');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://www.googleapis.com/youtube/v3/channels',
        expect.objectContaining({
          params: {
            part: 'snippet,statistics',
            mine: true,
          },
          headers: {
            Authorization: 'Bearer test-token',
          },
        }),
      );
    });
  });
});
