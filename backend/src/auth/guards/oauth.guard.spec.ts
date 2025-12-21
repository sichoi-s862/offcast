import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  YouTubeOAuthGuard,
  TikTokOAuthGuard,
  TwitchOAuthGuard,
} from './oauth.guard';

/**
 * OAuth 가드 테스트
 */
describe('OAuthGuards', () => {
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn().mockReturnValue('http://localhost:3000'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YouTubeOAuthGuard,
        TikTokOAuthGuard,
        TwitchOAuthGuard,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    configService = module.get<ConfigService>(ConfigService);
    jest.clearAllMocks();
  });

  describe('YouTubeOAuthGuard', () => {
    let guard: YouTubeOAuthGuard;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          YouTubeOAuthGuard,
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      guard = module.get<YouTubeOAuthGuard>(YouTubeOAuthGuard);
    });

    it('should be defined', () => {
      expect(guard).toBeDefined();
    });

    it('OAuth 에러 시 에러 페이지로 리다이렉트해야 함', async () => {
      const mockRedirect = jest.fn();
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            query: {
              error: 'access_denied',
              error_description: 'User denied access',
            },
          }),
          getResponse: () => ({
            redirect: mockRedirect,
          }),
        }),
      } as unknown as ExecutionContext;

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(false);
      expect(mockRedirect).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:3000/auth/callback?error='),
      );
    });

    it('에러 설명이 없으면 에러 코드를 사용해야 함', async () => {
      const mockRedirect = jest.fn();
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            query: {
              error: 'server_error',
            },
          }),
          getResponse: () => ({
            redirect: mockRedirect,
          }),
        }),
      } as unknown as ExecutionContext;

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(false);
      expect(mockRedirect).toHaveBeenCalledWith(
        expect.stringContaining('server_error'),
      );
    });
  });

  describe('TikTokOAuthGuard', () => {
    let guard: TikTokOAuthGuard;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          TikTokOAuthGuard,
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      guard = module.get<TikTokOAuthGuard>(TikTokOAuthGuard);
    });

    it('should be defined', () => {
      expect(guard).toBeDefined();
    });

    it('OAuth 에러 시 에러 페이지로 리다이렉트해야 함', async () => {
      const mockRedirect = jest.fn();
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            query: {
              error: 'access_denied',
            },
          }),
          getResponse: () => ({
            redirect: mockRedirect,
          }),
        }),
      } as unknown as ExecutionContext;

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(false);
    });
  });

  describe('TwitchOAuthGuard', () => {
    let guard: TwitchOAuthGuard;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          TwitchOAuthGuard,
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      guard = module.get<TwitchOAuthGuard>(TwitchOAuthGuard);
    });

    it('should be defined', () => {
      expect(guard).toBeDefined();
    });

    it('OAuth 에러 시 에러 페이지로 리다이렉트해야 함', async () => {
      const mockRedirect = jest.fn();
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            query: {
              error: 'access_denied',
            },
          }),
          getResponse: () => ({
            redirect: mockRedirect,
          }),
        }),
      } as unknown as ExecutionContext;

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(false);
    });
  });

  describe('OAuthGuard 공통 동작', () => {
    it('FRONTEND_URL이 없으면 기본값을 사용해야 함', async () => {
      mockConfigService.get.mockReturnValue(null);

      const module = await Test.createTestingModule({
        providers: [
          YouTubeOAuthGuard,
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      const guard = module.get<YouTubeOAuthGuard>(YouTubeOAuthGuard);

      const mockRedirect = jest.fn();
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            query: { error: 'test' },
          }),
          getResponse: () => ({
            redirect: mockRedirect,
          }),
        }),
      } as unknown as ExecutionContext;

      await guard.canActivate(mockContext);

      expect(mockRedirect).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:3000'),
      );
    });
  });
});
