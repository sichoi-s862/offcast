import { Test, TestingModule } from '@nestjs/testing';
import { ChannelController } from './channel.controller';
import { ChannelService } from './channel.service';
import { UserService } from '../user/user.service';

/**
 * 채널 컨트롤러 테스트
 */
describe('ChannelController', () => {
  let controller: ChannelController;

  // Mock 데이터
  const mockUser = {
    id: 'user-1',
    nickname: '테스트유저',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockChannel = {
    id: 'channel-1',
    name: '자유 게시판',
    slug: 'free',
    description: '자유롭게 글을 작성하세요',
    minSubscribers: 0,
    maxSubscribers: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockChannelAccess = {
    id: 'access-1',
    userId: 'user-1',
    channelId: 'channel-1',
    hasAccess: true,
  };

  // Mock Services
  const mockChannelService = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findBySlug: jest.fn(),
    getAccessibleChannels: jest.fn(),
    getUserAccesses: jest.fn(),
    refreshAccessBySubscriberCount: jest.fn(),
    checkAccess: jest.fn(),
    seedDefaultChannels: jest.fn(),
    resetAndSeedChannels: jest.fn(),
  };

  const mockUserService = {
    getMaxSubscriberCount: jest.fn(),
    getUserProviders: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChannelController],
      providers: [
        { provide: ChannelService, useValue: mockChannelService },
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();

    controller = module.get<ChannelController>(ChannelController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('모든 채널 목록을 조회해야 함', async () => {
      mockChannelService.findAll.mockResolvedValue([mockChannel]);

      const result = await controller.findAll();

      expect(result).toHaveLength(1);
      expect(mockChannelService.findAll).toHaveBeenCalled();
    });

    it('채널이 없으면 빈 배열을 반환해야 함', async () => {
      mockChannelService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('getAccessibleChannels', () => {
    it('접근 가능한 채널 목록을 조회해야 함', async () => {
      mockUserService.getMaxSubscriberCount.mockResolvedValue(100000);
      mockUserService.getUserProviders.mockResolvedValue(['YOUTUBE']);
      mockChannelService.getAccessibleChannels.mockResolvedValue([mockChannel]);

      const result = await controller.getAccessibleChannels(mockUser as any);

      expect(result).toHaveLength(1);
      expect(mockUserService.getMaxSubscriberCount).toHaveBeenCalledWith(
        'user-1',
      );
      expect(mockChannelService.getAccessibleChannels).toHaveBeenCalledWith(
        100000,
        ['YOUTUBE'],
      );
    });

    it('구독자 수가 낮으면 제한된 채널만 반환해야 함', async () => {
      mockUserService.getMaxSubscriberCount.mockResolvedValue(5000);
      mockUserService.getUserProviders.mockResolvedValue(['YOUTUBE']);
      mockChannelService.getAccessibleChannels.mockResolvedValue([mockChannel]);

      await controller.getAccessibleChannels(mockUser as any);

      expect(mockChannelService.getAccessibleChannels).toHaveBeenCalledWith(
        5000,
        ['YOUTUBE'],
      );
    });
  });

  describe('getMyAccesses', () => {
    it('내 채널 접근 권한 목록을 조회해야 함', async () => {
      mockChannelService.getUserAccesses.mockResolvedValue([mockChannelAccess]);

      const result = await controller.getMyAccesses(mockUser as any);

      expect(result).toHaveLength(1);
      expect(mockChannelService.getUserAccesses).toHaveBeenCalledWith('user-1');
    });

    it('접근 권한이 없으면 빈 배열을 반환해야 함', async () => {
      mockChannelService.getUserAccesses.mockResolvedValue([]);

      const result = await controller.getMyAccesses(mockUser as any);

      expect(result).toEqual([]);
    });
  });

  describe('refreshAccess', () => {
    it('채널 접근 권한을 갱신해야 함', async () => {
      mockUserService.getMaxSubscriberCount.mockResolvedValue(100000);
      mockChannelService.refreshAccessBySubscriberCount.mockResolvedValue([
        mockChannelAccess,
      ]);

      const result = await controller.refreshAccess(mockUser as any);

      expect(result).toHaveLength(1);
      expect(
        mockChannelService.refreshAccessBySubscriberCount,
      ).toHaveBeenCalledWith('user-1', 100000);
    });
  });

  describe('findById', () => {
    it('ID로 채널을 조회해야 함', async () => {
      mockChannelService.findById.mockResolvedValue(mockChannel);

      const result = await controller.findById('channel-1');

      expect(result).toEqual(mockChannel);
      expect(mockChannelService.findById).toHaveBeenCalledWith('channel-1');
    });

    it('존재하지 않는 채널은 null을 반환해야 함', async () => {
      mockChannelService.findById.mockResolvedValue(null);

      const result = await controller.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findBySlug', () => {
    it('슬러그로 채널을 조회해야 함', async () => {
      mockChannelService.findBySlug.mockResolvedValue(mockChannel);

      const result = await controller.findBySlug('free');

      expect(result).toEqual(mockChannel);
      expect(mockChannelService.findBySlug).toHaveBeenCalledWith('free');
    });

    it('존재하지 않는 슬러그는 null을 반환해야 함', async () => {
      mockChannelService.findBySlug.mockResolvedValue(null);

      const result = await controller.findBySlug('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('checkAccess', () => {
    it('채널 접근 권한을 확인해야 함', async () => {
      mockChannelService.checkAccess.mockResolvedValue(true);

      const result = await controller.checkAccess(mockUser as any, 'channel-1');

      expect(result.hasAccess).toBe(true);
      expect(mockChannelService.checkAccess).toHaveBeenCalledWith(
        'user-1',
        'channel-1',
      );
    });

    it('접근 권한이 없으면 false를 반환해야 함', async () => {
      mockChannelService.checkAccess.mockResolvedValue(false);

      const result = await controller.checkAccess(mockUser as any, 'channel-1');

      expect(result.hasAccess).toBe(false);
    });
  });

  describe('seed', () => {
    it('기본 채널 시드를 실행해야 함', async () => {
      mockChannelService.seedDefaultChannels.mockResolvedValue(undefined);

      const result = await controller.seed();

      expect(result.message).toBe('Default channels created');
      expect(mockChannelService.seedDefaultChannels).toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('채널 리셋 후 재시드를 실행해야 함', async () => {
      mockChannelService.resetAndSeedChannels.mockResolvedValue(undefined);

      const result = await controller.reset();

      expect(result.message).toBe('Channels reset successfully');
      expect(mockChannelService.resetAndSeedChannels).toHaveBeenCalled();
    });
  });
});
