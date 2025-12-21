import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy, JwtPayload } from './jwt.strategy';
import { UserService } from '../user/user.service';

/**
 * JWT 전략 테스트
 */
describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  // Mock 데이터
  const mockUser = {
    id: 'user-1',
    nickname: '테스트유저',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  // Mock Services
  const mockUserService = {
    findById: jest.fn(),
  };

  const mockConfigService = {
    getOrThrow: jest.fn().mockReturnValue('test-jwt-secret'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: UserService, useValue: mockUserService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('유효한 페이로드로 사용자를 반환해야 함', async () => {
      mockUserService.findById.mockResolvedValue(mockUser);

      const payload: JwtPayload = {
        sub: 'user-1',
        iat: Date.now(),
        exp: Date.now() + 3600000,
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual(mockUser);
      expect(mockUserService.findById).toHaveBeenCalledWith('user-1');
    });

    it('사용자가 없으면 UnauthorizedException을 던져야 함', async () => {
      mockUserService.findById.mockResolvedValue(null);

      const payload: JwtPayload = {
        sub: 'non-existent',
      };

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('삭제된 사용자도 찾을 수 있어야 함 (서비스에서 처리)', async () => {
      const deletedUser = { ...mockUser, deletedAt: new Date() };
      mockUserService.findById.mockResolvedValue(deletedUser);

      const payload: JwtPayload = {
        sub: 'user-1',
      };

      const result = await strategy.validate(payload);

      // 삭제된 사용자 처리는 서비스나 가드에서 담당
      expect(result).toEqual(deletedUser);
    });
  });
});
