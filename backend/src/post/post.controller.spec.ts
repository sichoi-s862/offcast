import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { ChannelService } from '../channel/channel.service';
import { UserService } from '../user/user.service';

/**
 * 게시글 컨트롤러 테스트
 */
describe('PostController', () => {
  let controller: PostController;

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
    minSubscribers: 0,
    maxSubscribers: null,
  };

  const mockPost = {
    id: 'post-1',
    authorId: 'user-1',
    channelId: 'channel-1',
    title: '테스트 게시글',
    content: '테스트 내용',
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    channel: mockChannel,
    author: mockUser,
  };

  // Mock Services
  const mockPostService = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByAuthor: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    toggleLike: jest.fn(),
    hasUserLiked: jest.fn(),
    incrementViewCount: jest.fn(),
    getAuthorInfo: jest.fn(),
  };

  const mockChannelService = {
    findById: jest.fn(),
    getAccessibleChannels: jest.fn(),
    hasChannelAccess: jest.fn(),
  };

  const mockUserService = {
    getMaxSubscriberCount: jest.fn(),
    getUserProviders: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostController],
      providers: [
        { provide: PostService, useValue: mockPostService },
        { provide: ChannelService, useValue: mockChannelService },
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();

    controller = module.get<PostController>(PostController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('게시글 목록을 조회해야 함', async () => {
      mockUserService.getMaxSubscriberCount.mockResolvedValue(100000);
      mockChannelService.getAccessibleChannels.mockResolvedValue([mockChannel]);
      mockPostService.findAll.mockResolvedValue({
        posts: [mockPost],
        total: 1,
        page: 1,
        limit: 15,
      });

      const result = await controller.findAll(mockUser as any, {});

      expect(result.posts).toHaveLength(1);
      expect(mockPostService.findAll).toHaveBeenCalled();
    });

    it('특정 채널 필터링 시 접근 권한을 확인해야 함', async () => {
      mockChannelService.findById.mockResolvedValue(mockChannel);
      mockUserService.getMaxSubscriberCount.mockResolvedValue(100000);
      mockChannelService.getAccessibleChannels.mockResolvedValue([mockChannel]);
      mockPostService.findAll.mockResolvedValue({
        posts: [],
        total: 0,
        page: 1,
        limit: 15,
      });

      await controller.findAll(mockUser as any, { channelId: 'channel-1' });

      expect(mockChannelService.findById).toHaveBeenCalledWith('channel-1');
    });

    it('채널 접근 권한이 없으면 FORBIDDEN을 반환해야 함 (minSubscribers 미달)', async () => {
      const restrictedChannel = {
        ...mockChannel,
        minSubscribers: 10000,
        maxSubscribers: null,
      };
      mockChannelService.findById.mockResolvedValue(restrictedChannel);
      mockUserService.getMaxSubscriberCount.mockResolvedValue(5000); // 10000 미만

      const result = await controller.findAll(mockUser as any, {
        channelId: 'channel-1',
      });

      expect(result.statusCode).toBe(HttpStatus.FORBIDDEN);
    });

    it('채널 접근 권한이 없으면 FORBIDDEN을 반환해야 함 (maxSubscribers 초과)', async () => {
      const restrictedChannel = {
        ...mockChannel,
        minSubscribers: 10000,
        maxSubscribers: 100000,
      };
      mockChannelService.findById.mockResolvedValue(restrictedChannel);
      mockUserService.getMaxSubscriberCount.mockResolvedValue(150000); // 100000 초과

      const result = await controller.findAll(mockUser as any, {
        channelId: 'channel-1',
      });

      expect(result.statusCode).toBe(HttpStatus.FORBIDDEN);
    });
  });

  describe('findMyPosts', () => {
    it('내 게시글 목록을 조회해야 함', async () => {
      mockPostService.findByAuthor.mockResolvedValue({
        posts: [mockPost],
        total: 1,
        page: 1,
        limit: 15,
      });

      const result = await controller.findMyPosts(mockUser as any);

      expect(result.posts).toHaveLength(1);
      expect(mockPostService.findByAuthor).toHaveBeenCalledWith('user-1', {
        page: 1,
        limit: 15,
      });
    });

    it('페이지네이션을 적용해야 함', async () => {
      mockPostService.findByAuthor.mockResolvedValue({
        posts: [],
        total: 0,
        page: 2,
        limit: 10,
      });

      await controller.findMyPosts(mockUser as any, '2', '10');

      expect(mockPostService.findByAuthor).toHaveBeenCalledWith('user-1', {
        page: 2,
        limit: 10,
      });
    });
  });

  describe('findById', () => {
    it('게시글 상세를 조회해야 함', async () => {
      mockPostService.findById.mockResolvedValue(mockPost);
      mockUserService.getMaxSubscriberCount.mockResolvedValue(100000);
      mockUserService.getUserProviders.mockResolvedValue(['YOUTUBE']);
      mockChannelService.hasChannelAccess.mockReturnValue(true);
      mockPostService.incrementViewCount.mockResolvedValue(undefined);

      const result = await controller.findById(mockUser as any, 'post-1');

      expect(result).toEqual(mockPost);
      expect(mockPostService.incrementViewCount).toHaveBeenCalledWith('post-1');
    });

    it('게시글이 없으면 NOT_FOUND를 반환해야 함', async () => {
      mockPostService.findById.mockResolvedValue(null);

      const result = await controller.findById(mockUser as any, 'non-existent');

      expect(result.statusCode).toBe(HttpStatus.NOT_FOUND);
    });

    it('채널 접근 권한이 없으면 FORBIDDEN을 반환해야 함', async () => {
      const postWithRestrictedChannel = {
        ...mockPost,
        channel: {
          ...mockChannel,
          minSubscribers: 100000,
          maxSubscribers: null,
        },
      };
      mockPostService.findById.mockResolvedValue(postWithRestrictedChannel);
      mockUserService.getMaxSubscriberCount.mockResolvedValue(50000);
      mockUserService.getUserProviders.mockResolvedValue(['YOUTUBE']);
      mockChannelService.hasChannelAccess.mockReturnValue(false);

      const result = await controller.findById(mockUser as any, 'post-1');

      expect(result.statusCode).toBe(HttpStatus.FORBIDDEN);
    });
  });

  describe('create', () => {
    it('게시글을 생성해야 함', async () => {
      mockChannelService.findById.mockResolvedValue(mockChannel);
      mockUserService.getMaxSubscriberCount.mockResolvedValue(100000);
      mockUserService.getUserProviders.mockResolvedValue(['YOUTUBE']);
      mockChannelService.hasChannelAccess.mockReturnValue(true);
      mockPostService.create.mockResolvedValue(mockPost);

      const result = await controller.create(mockUser as any, {
        channelId: 'channel-1',
        title: '테스트 게시글',
        content: '테스트 내용',
      });

      expect(result).toEqual(mockPost);
    });

    it('존재하지 않는 채널이면 NOT_FOUND를 반환해야 함', async () => {
      mockChannelService.findById.mockResolvedValue(null);

      const result = await controller.create(mockUser as any, {
        channelId: 'non-existent',
        title: '테스트',
        content: '내용',
      });

      expect(result.statusCode).toBe(HttpStatus.NOT_FOUND);
    });

    it('채널 접근 권한이 없으면 FORBIDDEN을 반환해야 함', async () => {
      const restrictedChannel = {
        ...mockChannel,
        minSubscribers: 100000,
      };
      mockChannelService.findById.mockResolvedValue(restrictedChannel);
      mockUserService.getMaxSubscriberCount.mockResolvedValue(50000);
      mockUserService.getUserProviders.mockResolvedValue(['YOUTUBE']);
      mockChannelService.hasChannelAccess.mockReturnValue(false);

      const result = await controller.create(mockUser as any, {
        channelId: 'channel-1',
        title: '테스트',
        content: '내용',
      });

      expect(result.statusCode).toBe(HttpStatus.FORBIDDEN);
    });
  });

  describe('update', () => {
    it('게시글을 수정해야 함', async () => {
      const updatedPost = { ...mockPost, title: '수정된 제목' };
      mockPostService.update.mockResolvedValue(updatedPost);

      const result = await controller.update(mockUser as any, 'post-1', {
        title: '수정된 제목',
      });

      expect(result.title).toBe('수정된 제목');
      expect(mockPostService.update).toHaveBeenCalledWith(
        'post-1',
        'user-1',
        { title: '수정된 제목' },
      );
    });
  });

  describe('delete', () => {
    it('게시글을 삭제해야 함', async () => {
      mockPostService.delete.mockResolvedValue(undefined);

      const result = await controller.delete(mockUser as any, 'post-1');

      expect(result.message).toBe('게시글이 삭제되었습니다');
      expect(mockPostService.delete).toHaveBeenCalledWith('post-1', 'user-1');
    });
  });

  describe('toggleLike', () => {
    it('좋아요를 토글해야 함', async () => {
      mockPostService.toggleLike.mockResolvedValue({ liked: true, likeCount: 1 });

      const result = await controller.toggleLike(mockUser as any, 'post-1');

      expect(result.liked).toBe(true);
      expect(mockPostService.toggleLike).toHaveBeenCalledWith('post-1', 'user-1');
    });
  });

  describe('hasLiked', () => {
    it('좋아요 여부를 확인해야 함', async () => {
      mockPostService.hasUserLiked.mockResolvedValue(true);

      const result = await controller.hasLiked(mockUser as any, 'post-1');

      expect(result.liked).toBe(true);
    });

    it('좋아요하지 않았으면 false를 반환해야 함', async () => {
      mockPostService.hasUserLiked.mockResolvedValue(false);

      const result = await controller.hasLiked(mockUser as any, 'post-1');

      expect(result.liked).toBe(false);
    });
  });

  describe('getAuthorInfo', () => {
    it('작성자 정보를 반환해야 함', async () => {
      mockPostService.getAuthorInfo.mockResolvedValue('YOUTUBE|테스트유저|100000');

      const result = await controller.getAuthorInfo('post-1');

      expect(result.authorInfo).toBe('YOUTUBE|테스트유저|100000');
    });

    it('작성자 정보가 없으면 null을 반환해야 함', async () => {
      mockPostService.getAuthorInfo.mockResolvedValue(null);

      const result = await controller.getAuthorInfo('non-existent');

      expect(result.authorInfo).toBeNull();
    });
  });
});
