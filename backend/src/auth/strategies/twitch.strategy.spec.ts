import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TwitchStrategy, TwitchProfile } from './twitch.strategy';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('TwitchStrategy', () => {
  let strategy: TwitchStrategy;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        TWITCH_CLIENT_ID: 'test-client-id',
        TWITCH_CLIENT_SECRET: 'test-client-secret',
        TWITCH_CALLBACK_URL: 'http://localhost:8080/auth/twitch/callback',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TwitchStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<TwitchStrategy>(TwitchStrategy);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user profile with tokens', async () => {
      const mockUserData = {
        id: 'twitch-user-123',
        login: 'testuser',
        display_name: 'Test User',
        profile_image_url: 'https://example.com/profile.jpg',
        view_count: 10000,
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: { data: [mockUserData] },
      });

      const result = await strategy.validate('access-token', 'refresh-token');

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        profile: {
          id: 'twitch-user-123',
          login: 'testuser',
          displayName: 'Test User',
          profileImage: 'https://example.com/profile.jpg',
          viewCount: 10000,
        },
      });
    });

    it('should handle empty user data', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { data: [{}] },
      });

      const result = await strategy.validate('access-token', 'refresh-token');

      expect(result.profile).toEqual({
        id: '',
        login: '',
        displayName: '',
        profileImage: '',
        viewCount: 0,
      });
    });

    it('should call Twitch API with correct parameters', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { data: [{ id: '123' }] },
      });

      await strategy.validate('test-access-token', 'test-refresh-token');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.twitch.tv/helix/users',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-access-token',
          }),
        }),
      );
    });
  });
});
