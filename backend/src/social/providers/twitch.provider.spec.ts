import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TwitchProvider } from './twitch.provider';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('TwitchProvider', () => {
  let provider: TwitchProvider;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'TWITCH_CLIENT_ID') return 'test-client-id';
      return undefined;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TwitchProvider,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    provider = module.get<TwitchProvider>(TwitchProvider);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  describe('getStats', () => {
    it('should return Twitch stats', async () => {
      const mockUserData = {
        id: 'twitch-123',
        login: 'teststreamer',
        display_name: 'Test Streamer',
        profile_image_url: 'https://example.com/profile.jpg',
        view_count: 50000,
        broadcaster_type: 'partner',
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: { data: [mockUserData] },
      });

      const result = await provider.getStats('test-access-token');

      expect(result).toEqual({
        viewCount: 50000,
        login: 'teststreamer',
        displayName: 'Test Streamer',
        profileImage: 'https://example.com/profile.jpg',
        broadcasterType: 'partner',
      });
    });

    it('should call Twitch API with correct headers', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { data: [{}] },
      });

      await provider.getStats('test-access-token');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.twitch.tv/helix/users',
        {
          headers: {
            Authorization: 'Bearer test-access-token',
            'Client-Id': 'test-client-id',
          },
        },
      );
    });

    it('should return default values on API error', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));

      const result = await provider.getStats('test-access-token');

      expect(result).toEqual({
        viewCount: 0,
        login: '',
        displayName: '',
        profileImage: '',
        broadcasterType: '',
      });
    });

    it('should handle empty user data', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { data: [{}] },
      });

      const result = await provider.getStats('test-access-token');

      expect(result).toEqual({
        viewCount: 0,
        login: '',
        displayName: '',
        profileImage: '',
        broadcasterType: '',
      });
    });

    it('should handle missing view_count', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          data: [{
            login: 'testuser',
            display_name: 'Test User',
          }],
        },
      });

      const result = await provider.getStats('test-access-token');

      expect(result.viewCount).toBe(0);
      expect(result.login).toBe('testuser');
    });
  });
});
