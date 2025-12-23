import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';

/**
 * 사용자 컨트롤러 테스트
 */
describe('UserController', () => {
  let controller: UserController;

  // Mock 데이터
  const mockUser = {
    id: 'user-1',
    nickname: '테스트유저',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockUserStats = {
    postCount: 10,
    commentCount: 50,
    likeCount: 100,
  };

  const mockAccount = {
    id: 'account-1',
    provider: 'YOUTUBE',
    providerAccountId: 'youtube-123',
    profileName: '테스트채널',
    profileImage: 'https://example.com/avatar.jpg',
    subscriberCount: 100000,
  };

  // Mock Services
  const mockUserService = {
    findById: jest.fn(),
    getUserStats: jest.fn(),
    updateNickname: jest.fn(),
    getAccounts: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: mockUserService }],
    }).compile();

    controller = module.get<UserController>(UserController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMe', () => {
    it('내 정보를 조회해야 함', async () => {
      mockUserService.findById.mockResolvedValue(mockUser);
      mockUserService.getUserStats.mockResolvedValue(mockUserStats);

      const result = await controller.getMe(mockUser as any);

      expect(result.user).toEqual(mockUser);
      expect(result.stats).toEqual(mockUserStats);
      expect(mockUserService.findById).toHaveBeenCalledWith('user-1');
      expect(mockUserService.getUserStats).toHaveBeenCalledWith('user-1');
    });

    it('사용자 정보와 통계를 병렬로 조회해야 함', async () => {
      mockUserService.findById.mockResolvedValue(mockUser);
      mockUserService.getUserStats.mockResolvedValue(mockUserStats);

      await controller.getMe(mockUser as any);

      // 두 서비스 메서드가 모두 호출되어야 함
      expect(mockUserService.findById).toHaveBeenCalledTimes(1);
      expect(mockUserService.getUserStats).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateNickname', () => {
    it('닉네임을 변경해야 함', async () => {
      const updatedUser = { ...mockUser, nickname: '새닉네임' };
      mockUserService.updateNickname.mockResolvedValue(updatedUser);

      const result = await controller.updateNickname(mockUser as any, {
        nickname: '새닉네임',
      });

      expect(result.message).toBe('Nickname has been updated.');
      expect(result.user.nickname).toBe('새닉네임');
      expect(mockUserService.updateNickname).toHaveBeenCalledWith(
        'user-1',
        '새닉네임',
      );
    });
  });

  describe('getAccounts', () => {
    it('연결된 소셜 계정 목록을 조회해야 함', async () => {
      mockUserService.getAccounts.mockResolvedValue([mockAccount]);

      const result = await controller.getAccounts(mockUser as any);

      expect(result.accounts).toHaveLength(1);
      expect(result.accounts[0].provider).toBe('YOUTUBE');
      expect(mockUserService.getAccounts).toHaveBeenCalledWith('user-1');
    });

    it('연결된 계정이 없으면 빈 배열을 반환해야 함', async () => {
      mockUserService.getAccounts.mockResolvedValue([]);

      const result = await controller.getAccounts(mockUser as any);

      expect(result.accounts).toEqual([]);
    });

    it('여러 계정을 연결한 경우 모두 반환해야 함', async () => {
      const tiktokAccount = {
        id: 'account-2',
        provider: 'TIKTOK',
        providerAccountId: 'tiktok-456',
        profileName: '틱톡계정',
        profileImage: 'https://example.com/tiktok.jpg',
        subscriberCount: 50000,
      };
      mockUserService.getAccounts.mockResolvedValue([mockAccount, tiktokAccount]);

      const result = await controller.getAccounts(mockUser as any);

      expect(result.accounts).toHaveLength(2);
    });
  });
});
