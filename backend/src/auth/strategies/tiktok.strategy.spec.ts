import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TikTokStrategy } from './tiktok.strategy';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

/**
 * TikTok 전략 테스트
 */
describe('TikTokStrategy', () => {
  let strategy: TikTokStrategy;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        TIKTOK_CLIENT_KEY: 'test-client-key',
        TIKTOK_CLIENT_SECRET: 'test-client-secret',
        TIKTOK_CALLBACK_URL: 'http://localhost:8080/auth/tiktok/callback',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TikTokStrategy,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    strategy = module.get<TikTokStrategy>(TikTokStrategy);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('authorizationParams', () => {
    it('response_type과 client_key를 반환해야 함', () => {
      const params = strategy.authorizationParams();

      expect(params.response_type).toBe('code');
      expect(params.client_key).toBe('test-client-key');
    });
  });

  describe('validate', () => {
    it('TikTok 프로필 정보를 반환해야 함', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          data: {
            user: {
              open_id: 'tiktok-user-id',
              display_name: 'TikTok User',
              avatar_url: 'https://example.com/avatar.jpg',
              follower_count: 50000,
            },
          },
        },
      });

      const result = await strategy.validate('access-token', 'refresh-token');

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.profile.id).toBe('tiktok-user-id');
      expect(result.profile.displayName).toBe('TikTok User');
      expect(result.profile.avatarUrl).toBe('https://example.com/avatar.jpg');
      expect(result.profile.followerCount).toBe(50000);
    });

    it('사용자 정보가 없으면 기본값을 사용해야 함', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          data: {
            user: null,
          },
        },
      });

      const result = await strategy.validate('access-token', 'refresh-token');

      expect(result.profile.id).toBe('');
      expect(result.profile.displayName).toBe('');
      expect(result.profile.avatarUrl).toBe('');
      expect(result.profile.followerCount).toBe(0);
    });

    it('data가 undefined이면 기본값을 사용해야 함', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {},
      });

      const result = await strategy.validate('access-token', 'refresh-token');

      expect(result.profile.id).toBe('');
      expect(result.profile.followerCount).toBe(0);
    });

    it('follower_count가 없으면 0을 반환해야 함', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          data: {
            user: {
              open_id: 'tiktok-user-id',
              display_name: 'New User',
            },
          },
        },
      });

      const result = await strategy.validate('access-token', 'refresh-token');

      expect(result.profile.followerCount).toBe(0);
    });

    it('올바른 API 엔드포인트를 호출해야 함', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          data: {
            user: {},
          },
        },
      });

      await strategy.validate('access-token', 'refresh-token');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://open.tiktokapis.com/v2/user/info/',
        expect.objectContaining({
          params: {
            fields: 'open_id,display_name,avatar_url,follower_count',
          },
          headers: {
            Authorization: 'Bearer access-token',
          },
        }),
      );
    });
  });
});
