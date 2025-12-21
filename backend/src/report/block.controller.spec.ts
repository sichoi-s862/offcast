import { Test, TestingModule } from '@nestjs/testing';
import { BlockController } from './block.controller';
import { BlockService } from './block.service';

/**
 * 차단 컨트롤러 테스트
 */
describe('BlockController', () => {
  let controller: BlockController;

  // Mock 데이터
  const mockUser = {
    id: 'user-1',
    nickname: '테스트유저',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockBlockedUser = {
    id: 'user-2',
    nickname: '차단된유저',
  };

  const mockBlockedUserResponse = {
    blockedAt: new Date(),
    user: mockBlockedUser,
  };

  // Mock Services
  const mockBlockService = {
    blockUser: jest.fn(),
    unblockUser: jest.fn(),
    getBlockedUsers: jest.fn(),
    isBlocked: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BlockController],
      providers: [{ provide: BlockService, useValue: mockBlockService }],
    }).compile();

    controller = module.get<BlockController>(BlockController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('blockUser', () => {
    it('사용자를 차단해야 함', async () => {
      mockBlockService.blockUser.mockResolvedValue(undefined);

      const result = await controller.blockUser(mockUser as any, 'user-2');

      expect(result.message).toBe('차단되었습니다.');
      expect(mockBlockService.blockUser).toHaveBeenCalledWith(
        'user-1',
        'user-2',
      );
    });
  });

  describe('unblockUser', () => {
    it('차단을 해제해야 함', async () => {
      mockBlockService.unblockUser.mockResolvedValue(undefined);

      const result = await controller.unblockUser(mockUser as any, 'user-2');

      expect(result.message).toBe('차단이 해제되었습니다.');
      expect(mockBlockService.unblockUser).toHaveBeenCalledWith(
        'user-1',
        'user-2',
      );
    });
  });

  describe('getBlockedUsers', () => {
    it('차단 목록을 조회해야 함', async () => {
      mockBlockService.getBlockedUsers.mockResolvedValue({
        blockedUsers: [mockBlockedUserResponse],
        total: 1,
        page: 1,
        limit: 20,
      });

      const result = await controller.getBlockedUsers(mockUser as any);

      expect(result.blockedUsers).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockBlockService.getBlockedUsers).toHaveBeenCalledWith(
        'user-1',
        1,
        20,
      );
    });

    it('페이지네이션을 적용해야 함', async () => {
      mockBlockService.getBlockedUsers.mockResolvedValue({
        blockedUsers: [],
        total: 0,
        page: 2,
        limit: 10,
      });

      await controller.getBlockedUsers(mockUser as any, '2', '10');

      expect(mockBlockService.getBlockedUsers).toHaveBeenCalledWith(
        'user-1',
        2,
        10,
      );
    });

    it('차단한 사용자가 없으면 빈 배열을 반환해야 함', async () => {
      mockBlockService.getBlockedUsers.mockResolvedValue({
        blockedUsers: [],
        total: 0,
        page: 1,
        limit: 20,
      });

      const result = await controller.getBlockedUsers(mockUser as any);

      expect(result.blockedUsers).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('checkBlockStatus', () => {
    it('차단 상태를 확인해야 함', async () => {
      mockBlockService.isBlocked.mockResolvedValue(true);

      const result = await controller.checkBlockStatus(
        mockUser as any,
        'user-2',
      );

      expect(result.isBlocked).toBe(true);
      expect(mockBlockService.isBlocked).toHaveBeenCalledWith(
        'user-1',
        'user-2',
      );
    });

    it('차단하지 않았으면 false를 반환해야 함', async () => {
      mockBlockService.isBlocked.mockResolvedValue(false);

      const result = await controller.checkBlockStatus(
        mockUser as any,
        'user-3',
      );

      expect(result.isBlocked).toBe(false);
    });
  });
});
