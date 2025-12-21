import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { YouTubeStrategy } from './youtube.strategy';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

/**
 * YouTube 전략 테스트
 */
describe('YouTubeStrategy', () => {
  let strategy: YouTubeStrategy;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        YOUTUBE_CLIENT_ID: 'test-client-id',
        YOUTUBE_CLIENT_SECRET: 'test-client-secret',
        YOUTUBE_CALLBACK_URL: 'http://localhost:8080/auth/youtube/callback',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YouTubeStrategy,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    strategy = module.get<YouTubeStrategy>(YouTubeStrategy);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('authorizationParams', () => {
    it('prompt와 access_type을 반환해야 함', () => {
      const params = strategy.authorizationParams();

      expect(params.prompt).toBe('consent');
      expect(params.access_type).toBe('offline');
    });
  });

  describe('validate', () => {
    it('YouTube 채널 정보를 반환해야 함', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          items: [
            {
              id: 'channel-id',
              snippet: {
                title: 'Test Channel',
                description: 'Test Description',
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

      const result = await strategy.validate('access-token', 'refresh-token');

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.profile.id).toBe('channel-id');
      expect(result.profile.title).toBe('Test Channel');
      expect(result.profile.subscriberCount).toBe(100000);
      expect(result.profile.videoCount).toBe(50);
      expect(result.profile.viewCount).toBe(5000000);
    });

    it('채널이 없으면 에러를 던져야 함', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          items: [],
        },
      });

      await expect(
        strategy.validate('access-token', 'refresh-token'),
      ).rejects.toThrow('YouTube 채널이 없습니다');
    });

    it('items가 undefined이면 에러를 던져야 함', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {},
      });

      await expect(
        strategy.validate('access-token', 'refresh-token'),
      ).rejects.toThrow('YouTube 채널이 없습니다');
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

      const result = await strategy.validate('access-token', 'refresh-token');

      expect(result.profile.subscriberCount).toBe(0);
      expect(result.profile.videoCount).toBe(0);
      expect(result.profile.viewCount).toBe(0);
      expect(result.profile.thumbnail).toBe('');
    });

    it('snippet이 없어도 기본값을 사용해야 함', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          items: [
            {
              id: 'channel-id',
            },
          ],
        },
      });

      const result = await strategy.validate('access-token', 'refresh-token');

      expect(result.profile.title).toBe('');
      expect(result.profile.description).toBe('');
    });
  });
});
