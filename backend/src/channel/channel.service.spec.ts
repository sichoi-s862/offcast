import { Test, TestingModule } from '@nestjs/testing';
import { ChannelService } from './channel.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 채널 서비스 테스트
 */
describe('ChannelService', () => {
  let service: ChannelService;

  // Mock 데이터
  const mockChannel = {
    id: 'channel-1',
    name: '자유 게시판',
    slug: 'free',
    description: '모든 크리에이터가 자유롭게 소통하는 공간',
    minSubscribers: 0,
    maxSubscribers: null,
    isActive: true,
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockChannels = [
    mockChannel,
    {
      id: 'channel-2',
      name: '10만 라운지',
      slug: '100k',
      description: '10만 구독자 이상 전용',
      minSubscribers: 100000,
      maxSubscribers: 999999,
      isActive: true,
      sortOrder: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'channel-3',
      name: '100만 라운지',
      slug: '1m',
      description: '100만 구독자 이상 전용',
      minSubscribers: 1000000,
      maxSubscribers: null,
      isActive: true,
      sortOrder: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  // Prisma Mock
  const mockPrismaService = {
    channel: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    channelAccess: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChannelService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ChannelService>(ChannelService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('활성화된 모든 채널을 반환해야 함', async () => {
      mockPrismaService.channel.findMany.mockResolvedValue(mockChannels);

      const result = await service.findAll();

      expect(result).toEqual(mockChannels);
      expect(mockPrismaService.channel.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });
    });

    it('빈 배열을 반환할 수 있어야 함', async () => {
      mockPrismaService.channel.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('ID로 채널을 찾아야 함', async () => {
      mockPrismaService.channel.findUnique.mockResolvedValue(mockChannel);

      const result = await service.findById('channel-1');

      expect(result).toEqual(mockChannel);
      expect(mockPrismaService.channel.findUnique).toHaveBeenCalledWith({
        where: { id: 'channel-1' },
      });
    });

    it('채널이 없으면 null을 반환해야 함', async () => {
      mockPrismaService.channel.findUnique.mockResolvedValue(null);

      const result = await service.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findBySlug', () => {
    it('슬러그로 채널을 찾아야 함', async () => {
      mockPrismaService.channel.findUnique.mockResolvedValue(mockChannel);

      const result = await service.findBySlug('free');

      expect(result).toEqual(mockChannel);
      expect(mockPrismaService.channel.findUnique).toHaveBeenCalledWith({
        where: { slug: 'free' },
      });
    });

    it('채널이 없으면 null을 반환해야 함', async () => {
      mockPrismaService.channel.findUnique.mockResolvedValue(null);

      const result = await service.findBySlug('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getAccessibleChannels', () => {
    it('구독자 수에 따라 접근 가능한 채널을 반환해야 함', async () => {
      mockPrismaService.channel.findMany.mockResolvedValue([mockChannels[0]]);

      const result = await service.getAccessibleChannels(5000);

      expect(mockPrismaService.channel.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          minSubscribers: { lte: 5000 },
          OR: [{ maxSubscribers: null }, { maxSubscribers: { gte: 5000 } }],
        },
        orderBy: { sortOrder: 'asc' },
      });
    });

    it('100만 구독자는 모든 채널에 접근 가능해야 함', async () => {
      mockPrismaService.channel.findMany.mockResolvedValue(mockChannels);

      const result = await service.getAccessibleChannels(1500000);

      expect(result.length).toBe(3);
    });
  });

  describe('checkAccess', () => {
    it('접근 권한이 있고 만료되지 않으면 true를 반환해야 함', async () => {
      mockPrismaService.channelAccess.findUnique.mockResolvedValue({
        id: 'access-1',
        userId: 'user-1',
        channelId: 'channel-1',
        expiresAt: new Date(Date.now() + 3600000), // 1시간 후
      });

      const result = await service.checkAccess('user-1', 'channel-1');

      expect(result).toBe(true);
    });

    it('접근 권한이 없으면 false를 반환해야 함', async () => {
      mockPrismaService.channelAccess.findUnique.mockResolvedValue(null);

      const result = await service.checkAccess('user-1', 'channel-1');

      expect(result).toBe(false);
    });

    it('접근 권한이 만료되면 false를 반환해야 함', async () => {
      mockPrismaService.channelAccess.findUnique.mockResolvedValue({
        id: 'access-1',
        userId: 'user-1',
        channelId: 'channel-1',
        expiresAt: new Date(Date.now() - 3600000), // 1시간 전 (만료)
      });

      const result = await service.checkAccess('user-1', 'channel-1');

      expect(result).toBe(false);
    });
  });

  describe('create', () => {
    it('새 채널을 생성해야 함', async () => {
      const createData = {
        name: '새 채널',
        slug: 'new-channel',
        description: '새로운 채널입니다',
        minSubscribers: 50000,
        maxSubscribers: 99999,
        sortOrder: 5,
      };

      mockPrismaService.channel.create.mockResolvedValue({
        id: 'channel-new',
        ...createData,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create(createData);

      expect(result.name).toBe('새 채널');
      expect(mockPrismaService.channel.create).toHaveBeenCalled();
    });
  });

  describe('grantAccess', () => {
    it('채널 접근 권한을 부여해야 함', async () => {
      const expiresAt = new Date(Date.now() + 86400000);
      mockPrismaService.channelAccess.upsert.mockResolvedValue({
        id: 'access-1',
        userId: 'user-1',
        channelId: 'channel-1',
        expiresAt,
      });

      const result = await service.grantAccess('user-1', 'channel-1', expiresAt);

      expect(result).toBeDefined();
      expect(mockPrismaService.channelAccess.upsert).toHaveBeenCalled();
    });
  });

  describe('refreshAccessBySubscriberCount', () => {
    it('구독자 수에 따라 접근 권한을 갱신해야 함', async () => {
      mockPrismaService.channel.findMany.mockResolvedValue([mockChannel]);
      mockPrismaService.channelAccess.upsert.mockResolvedValue({
        id: 'access-1',
        userId: 'user-1',
        channelId: 'channel-1',
        expiresAt: new Date(),
      });

      const result = await service.refreshAccessBySubscriberCount('user-1', 50000);

      expect(result).toHaveLength(1);
      expect(mockPrismaService.channelAccess.upsert).toHaveBeenCalled();
    });

    it('접근 가능한 채널이 없으면 빈 배열을 반환해야 함', async () => {
      mockPrismaService.channel.findMany.mockResolvedValue([]);

      const result = await service.refreshAccessBySubscriberCount('user-1', 50);

      expect(result).toEqual([]);
    });
  });

  describe('getUserAccesses', () => {
    it('사용자의 채널 접근 권한 목록을 반환해야 함', async () => {
      mockPrismaService.channelAccess.findMany.mockResolvedValue([
        {
          id: 'access-1',
          userId: 'user-1',
          channelId: 'channel-1',
          expiresAt: new Date(Date.now() + 86400000),
          channel: mockChannel,
        },
      ]);

      const result = await service.getUserAccesses('user-1');

      expect(result).toHaveLength(1);
      expect(mockPrismaService.channelAccess.findMany).toHaveBeenCalled();
    });

    it('접근 권한이 없으면 빈 배열을 반환해야 함', async () => {
      mockPrismaService.channelAccess.findMany.mockResolvedValue([]);

      const result = await service.getUserAccesses('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('resetAndSeedChannels', () => {
    it('모든 채널을 삭제하고 기본 채널을 생성해야 함', async () => {
      mockPrismaService.channel.deleteMany.mockResolvedValue({ count: 5 });
      mockPrismaService.channel.findUnique.mockResolvedValue(null);
      mockPrismaService.channel.create.mockImplementation(({ data }) => ({
        id: `channel-${data.slug}`,
        ...data,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      await service.resetAndSeedChannels();

      expect(mockPrismaService.channel.deleteMany).toHaveBeenCalledWith({});
    });
  });

  describe('seedDefaultChannels', () => {
    it('기본 채널을 생성해야 함', async () => {
      mockPrismaService.channel.findUnique.mockResolvedValue(null);
      mockPrismaService.channel.create.mockImplementation(({ data }) => ({
        id: `channel-${data.slug}`,
        ...data,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      await service.seedDefaultChannels();

      // 16개의 기본 채널이 생성되어야 함 (slug로 findUnique 호출)
      expect(mockPrismaService.channel.findUnique).toHaveBeenCalled();
      expect(mockPrismaService.channel.create).toHaveBeenCalled();
    });

    it('이미 존재하는 채널은 생성하지 않아야 함', async () => {
      mockPrismaService.channel.findUnique.mockResolvedValue(mockChannel);

      await service.seedDefaultChannels();

      // 이미 존재하면 create를 호출하지 않음
      expect(mockPrismaService.channel.create).not.toHaveBeenCalled();
    });
  });
});
