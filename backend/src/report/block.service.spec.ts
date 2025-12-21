import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { BlockService } from './block.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 차단 서비스 테스트
 */
describe('BlockService', () => {
  let service: BlockService;

  // Mock 데이터
  const mockBlock = {
    id: 'block-1',
    blockerId: 'user-1',
    blockedUserId: 'user-2',
    createdAt: new Date(),
  };

  const mockUser = {
    id: 'user-2',
    nickname: '테스트유저',
    deletedAt: null,
    accounts: [
      {
        provider: 'YOUTUBE',
        profileName: '테스트채널',
        subscriberCount: 100000,
      },
    ],
  };

  // Prisma Mock
  const mockPrismaService = {
    userBlock: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlockService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<BlockService>(BlockService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('blockUser', () => {
    it('사용자를 차단해야 함', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.userBlock.findUnique.mockResolvedValue(null);
      mockPrismaService.userBlock.create.mockResolvedValue(mockBlock);

      await service.blockUser('user-1', 'user-2');

      expect(mockPrismaService.userBlock.create).toHaveBeenCalledWith({
        data: {
          blockerId: 'user-1',
          blockedUserId: 'user-2',
        },
      });
    });

    it('자기 자신을 차단하면 BadRequestException을 던져야 함', async () => {
      await expect(service.blockUser('user-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('존재하지 않는 사용자를 차단하면 NotFoundException을 던져야 함', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.blockUser('user-1', 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('탈퇴한 사용자를 차단하면 NotFoundException을 던져야 함', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        deletedAt: new Date(),
      });

      await expect(service.blockUser('user-1', 'user-2')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('이미 차단한 사용자를 다시 차단하면 ConflictException을 던져야 함', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.userBlock.findUnique.mockResolvedValue(mockBlock);

      await expect(service.blockUser('user-1', 'user-2')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('unblockUser', () => {
    it('차단을 해제해야 함', async () => {
      mockPrismaService.userBlock.findUnique.mockResolvedValue(mockBlock);
      mockPrismaService.userBlock.delete.mockResolvedValue(mockBlock);

      await service.unblockUser('user-1', 'user-2');

      expect(mockPrismaService.userBlock.delete).toHaveBeenCalledWith({
        where: { id: 'block-1' },
      });
    });

    it('차단 내역이 없으면 NotFoundException을 던져야 함', async () => {
      mockPrismaService.userBlock.findUnique.mockResolvedValue(null);

      await expect(service.unblockUser('user-1', 'user-2')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getBlockedUsers', () => {
    it('차단 목록을 반환해야 함', async () => {
      mockPrismaService.userBlock.findMany.mockResolvedValue([mockBlock]);
      mockPrismaService.userBlock.count.mockResolvedValue(1);
      mockPrismaService.user.findMany.mockResolvedValue([mockUser]);

      const result = await service.getBlockedUsers('user-1', 1, 20);

      expect(result.blockedUsers).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.blockedUsers[0]).toHaveProperty('user');
    });

    it('차단한 사용자가 없으면 빈 배열을 반환해야 함', async () => {
      mockPrismaService.userBlock.findMany.mockResolvedValue([]);
      mockPrismaService.userBlock.count.mockResolvedValue(0);
      mockPrismaService.user.findMany.mockResolvedValue([]);

      const result = await service.getBlockedUsers('user-1', 1, 20);

      expect(result.blockedUsers).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('페이지네이션이 적용되어야 함', async () => {
      mockPrismaService.userBlock.findMany.mockResolvedValue([]);
      mockPrismaService.userBlock.count.mockResolvedValue(100);
      mockPrismaService.user.findMany.mockResolvedValue([]);

      await service.getBlockedUsers('user-1', 2, 10);

      expect(mockPrismaService.userBlock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
    });

    it('차단된 사용자 정보가 없을 경우 null을 반환해야 함', async () => {
      mockPrismaService.userBlock.findMany.mockResolvedValue([mockBlock]);
      mockPrismaService.userBlock.count.mockResolvedValue(1);
      mockPrismaService.user.findMany.mockResolvedValue([]);

      const result = await service.getBlockedUsers('user-1', 1, 20);

      expect(result.blockedUsers[0].user).toBeNull();
    });
  });

  describe('isBlocked', () => {
    it('차단 상태면 true를 반환해야 함', async () => {
      mockPrismaService.userBlock.findUnique.mockResolvedValue(mockBlock);

      const result = await service.isBlocked('user-1', 'user-2');

      expect(result).toBe(true);
    });

    it('차단하지 않았으면 false를 반환해야 함', async () => {
      mockPrismaService.userBlock.findUnique.mockResolvedValue(null);

      const result = await service.isBlocked('user-1', 'user-2');

      expect(result).toBe(false);
    });
  });

  describe('getBlockedUserIds', () => {
    it('차단한 사용자 ID 목록을 반환해야 함', async () => {
      mockPrismaService.userBlock.findMany.mockResolvedValue([
        { blockedUserId: 'user-2' },
        { blockedUserId: 'user-3' },
      ]);

      const result = await service.getBlockedUserIds('user-1');

      expect(result).toEqual(['user-2', 'user-3']);
    });

    it('차단한 사용자가 없으면 빈 배열을 반환해야 함', async () => {
      mockPrismaService.userBlock.findMany.mockResolvedValue([]);

      const result = await service.getBlockedUserIds('user-1');

      expect(result).toEqual([]);
    });
  });
});
