import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 사용자 서비스 테스트
 */
describe('UserService', () => {
  let service: UserService;

  // Mock 데이터
  const mockUser = {
    id: 'user-1',
    nickname: '테스트유저',
    role: 'USER',
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    accounts: [
      {
        id: 'account-1',
        userId: 'user-1',
        provider: 'YOUTUBE',
        providerAccountId: 'youtube-123',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        profileName: '테스트채널',
        profileImage: 'https://example.com/image.jpg',
        subscriberCount: 150000,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  };

  const mockAccount = {
    id: 'account-1',
    userId: 'user-1',
    provider: 'YOUTUBE',
    providerAccountId: 'youtube-123',
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    profileName: '테스트채널',
    profileImage: 'https://example.com/image.jpg',
    subscriberCount: 150000,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOAuthProfile = {
    provider: 'YOUTUBE' as const,
    providerAccountId: 'youtube-123',
    accessToken: 'new-access-token',
    refreshToken: 'new-refresh-token',
    profileName: '테스트채널',
    profileImage: 'https://example.com/image.jpg',
    subscriberCount: 200000,
  };

  // Prisma Mock
  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    account: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    post: {
      count: jest.fn(),
    },
    comment: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('사용자를 ID로 찾아야 함', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findById('user-1');

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1', deletedAt: null },
        include: { accounts: true },
      });
    });

    it('존재하지 않는 사용자는 null을 반환해야 함', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByProviderAccount', () => {
    it('소셜 계정으로 사용자를 찾아야 함', async () => {
      mockPrismaService.account.findUnique.mockResolvedValue({
        ...mockAccount,
        user: mockUser,
      });

      const result = await service.findByProviderAccount('YOUTUBE', 'youtube-123');

      expect(result).toEqual(mockUser);
    });

    it('탈퇴한 사용자는 null을 반환해야 함', async () => {
      mockPrismaService.account.findUnique.mockResolvedValue({
        ...mockAccount,
        user: { ...mockUser, deletedAt: new Date() },
      });

      const result = await service.findByProviderAccount('YOUTUBE', 'youtube-123');

      expect(result).toBeNull();
    });

    it('계정이 없으면 null을 반환해야 함', async () => {
      mockPrismaService.account.findUnique.mockResolvedValue(null);

      const result = await service.findByProviderAccount('YOUTUBE', 'non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findOrCreateByOAuth', () => {
    it('기존 사용자가 있으면 토큰을 갱신해야 함', async () => {
      mockPrismaService.account.findUnique.mockResolvedValue({
        ...mockAccount,
        user: mockUser,
      });
      mockPrismaService.account.update.mockResolvedValue(mockAccount);

      const result = await service.findOrCreateByOAuth(mockOAuthProfile);

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.account.update).toHaveBeenCalled();
    });

    it('신규 사용자를 생성해야 함', async () => {
      mockPrismaService.account.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockUser);

      const result = await service.findOrCreateByOAuth({
        ...mockOAuthProfile,
        providerAccountId: 'new-youtube-123',
      });

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.create).toHaveBeenCalled();
    });
  });

  describe('linkAccount', () => {
    it('새 계정을 연결해야 함', async () => {
      mockPrismaService.account.findUnique.mockResolvedValue(null);
      mockPrismaService.account.create.mockResolvedValue(mockAccount);

      const result = await service.linkAccount('user-1', mockOAuthProfile);

      expect(result).toEqual(mockAccount);
      expect(mockPrismaService.account.create).toHaveBeenCalled();
    });

    it('같은 사용자의 기존 계정이면 정보를 갱신해야 함', async () => {
      mockPrismaService.account.findUnique.mockResolvedValue(mockAccount);
      mockPrismaService.account.update.mockResolvedValue(mockAccount);

      const result = await service.linkAccount('user-1', mockOAuthProfile);

      expect(result).toEqual(mockAccount);
      expect(mockPrismaService.account.update).toHaveBeenCalled();
    });

    it('다른 사용자에게 연결된 계정이면 ConflictException을 던져야 함', async () => {
      mockPrismaService.account.findUnique.mockResolvedValue({
        ...mockAccount,
        userId: 'other-user',
      });

      await expect(
        service.linkAccount('user-1', mockOAuthProfile),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getAccounts', () => {
    it('사용자의 모든 계정을 반환해야 함', async () => {
      mockPrismaService.account.findMany.mockResolvedValue([mockAccount]);

      const result = await service.getAccounts('user-1');

      expect(result).toEqual([mockAccount]);
      expect(mockPrismaService.account.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });

    it('계정이 없으면 빈 배열을 반환해야 함', async () => {
      mockPrismaService.account.findMany.mockResolvedValue([]);

      const result = await service.getAccounts('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('getAccountByProvider', () => {
    it('특정 플랫폼 계정을 반환해야 함', async () => {
      mockPrismaService.account.findFirst.mockResolvedValue(mockAccount);

      const result = await service.getAccountByProvider('user-1', 'YOUTUBE');

      expect(result).toEqual(mockAccount);
    });

    it('해당 플랫폼 계정이 없으면 null을 반환해야 함', async () => {
      mockPrismaService.account.findFirst.mockResolvedValue(null);

      const result = await service.getAccountByProvider('user-1', 'TIKTOK');

      expect(result).toBeNull();
    });
  });

  describe('unlinkAccount', () => {
    it('계정 연결을 해제해야 함', async () => {
      mockPrismaService.account.deleteMany.mockResolvedValue({ count: 1 });

      await service.unlinkAccount('user-1', 'YOUTUBE');

      expect(mockPrismaService.account.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', provider: 'YOUTUBE' },
      });
    });
  });

  describe('getMaxSubscriberCount', () => {
    it('가장 높은 구독자 수를 반환해야 함', async () => {
      mockPrismaService.account.findMany.mockResolvedValue([
        { subscriberCount: 100000 },
        { subscriberCount: 200000 },
        { subscriberCount: 50000 },
      ]);

      const result = await service.getMaxSubscriberCount('user-1');

      expect(result).toBe(200000);
    });

    it('계정이 없으면 0을 반환해야 함', async () => {
      mockPrismaService.account.findMany.mockResolvedValue([]);

      const result = await service.getMaxSubscriberCount('user-1');

      expect(result).toBe(0);
    });

    it('구독자 수가 null인 계정은 0으로 처리해야 함', async () => {
      mockPrismaService.account.findMany.mockResolvedValue([
        { subscriberCount: null },
        { subscriberCount: 100000 },
      ]);

      const result = await service.getMaxSubscriberCount('user-1');

      expect(result).toBe(100000);
    });
  });

  describe('updateNickname', () => {
    it('닉네임을 업데이트해야 함', async () => {
      const updatedUser = { ...mockUser, nickname: '새닉네임' };
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateNickname('user-1', '새닉네임');

      expect(result.nickname).toBe('새닉네임');
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { nickname: '새닉네임' },
      });
    });
  });

  describe('getUserStats', () => {
    it('사용자 활동 통계를 반환해야 함', async () => {
      mockPrismaService.post.count.mockResolvedValue(10);
      mockPrismaService.comment.count.mockResolvedValue(25);

      const result = await service.getUserStats('user-1');

      expect(result).toEqual({ postCount: 10, commentCount: 25 });
    });

    it('활동이 없으면 0을 반환해야 함', async () => {
      mockPrismaService.post.count.mockResolvedValue(0);
      mockPrismaService.comment.count.mockResolvedValue(0);

      const result = await service.getUserStats('user-1');

      expect(result).toEqual({ postCount: 0, commentCount: 0 });
    });
  });

  describe('withdraw', () => {
    it('회원 탈퇴 처리를 해야 함', async () => {
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        status: 'WITHDRAWN',
        deletedAt: new Date(),
      });

      await service.withdraw('user-1');

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          status: 'WITHDRAWN',
          deletedAt: expect.any(Date),
        },
      });
    });
  });
});
