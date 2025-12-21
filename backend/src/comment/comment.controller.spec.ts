import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { PostService } from '../post/post.service';
import { UserService } from '../user/user.service';

/**
 * 댓글 컨트롤러 테스트
 */
describe('CommentController', () => {
  let controller: CommentController;

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
    channel: mockChannel,
  };

  const mockComment = {
    id: 'comment-1',
    postId: 'post-1',
    authorId: 'user-1',
    content: '테스트 댓글',
    parentId: null,
    likeCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Mock Services
  const mockCommentService = {
    findByPostId: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    toggleLike: jest.fn(),
    hasUserLiked: jest.fn(),
    getAuthorInfo: jest.fn(),
  };

  const mockPostService = {
    findById: jest.fn(),
  };

  const mockUserService = {
    getMaxSubscriberCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentController],
      providers: [
        { provide: CommentService, useValue: mockCommentService },
        { provide: PostService, useValue: mockPostService },
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();

    controller = module.get<CommentController>(CommentController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findByPostId', () => {
    it('게시글의 댓글 목록을 조회해야 함', async () => {
      mockCommentService.findByPostId.mockResolvedValue({
        comments: [mockComment],
        total: 1,
        page: 1,
        limit: 20,
      });

      const result = await controller.findByPostId({ postId: 'post-1' });

      expect(result.comments).toHaveLength(1);
      expect(mockCommentService.findByPostId).toHaveBeenCalledWith({
        postId: 'post-1',
      });
    });

    it('페이지네이션을 적용해야 함', async () => {
      mockCommentService.findByPostId.mockResolvedValue({
        comments: [],
        total: 0,
        page: 2,
        limit: 10,
      });

      await controller.findByPostId({
        postId: 'post-1',
        page: 2,
        limit: 10,
      });

      expect(mockCommentService.findByPostId).toHaveBeenCalledWith({
        postId: 'post-1',
        page: 2,
        limit: 10,
      });
    });
  });

  describe('findById', () => {
    it('댓글 상세를 조회해야 함', async () => {
      mockCommentService.findById.mockResolvedValue(mockComment);

      const result = await controller.findById('comment-1');

      expect(result).toEqual(mockComment);
    });

    it('존재하지 않는 댓글은 null을 반환해야 함', async () => {
      mockCommentService.findById.mockResolvedValue(null);

      const result = await controller.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('댓글을 생성해야 함', async () => {
      mockPostService.findById.mockResolvedValue(mockPost);
      mockUserService.getMaxSubscriberCount.mockResolvedValue(100000);
      mockCommentService.create.mockResolvedValue(mockComment);

      const result = await controller.create(mockUser as any, {
        postId: 'post-1',
        content: '테스트 댓글',
      });

      expect(result).toEqual(mockComment);
      expect(mockCommentService.create).toHaveBeenCalledWith('user-1', {
        postId: 'post-1',
        content: '테스트 댓글',
      });
    });

    it('게시글이 없으면 NOT_FOUND를 반환해야 함', async () => {
      mockPostService.findById.mockResolvedValue(null);

      const result = await controller.create(mockUser as any, {
        postId: 'non-existent',
        content: '테스트 댓글',
      });

      expect(result.statusCode).toBe(HttpStatus.NOT_FOUND);
    });

    it('채널 접근 권한이 없으면 FORBIDDEN을 반환해야 함', async () => {
      const postWithRestrictedChannel = {
        ...mockPost,
        channel: {
          ...mockChannel,
          minSubscribers: 100000,
        },
      };
      mockPostService.findById.mockResolvedValue(postWithRestrictedChannel);
      mockUserService.getMaxSubscriberCount.mockResolvedValue(50000);

      const result = await controller.create(mockUser as any, {
        postId: 'post-1',
        content: '테스트 댓글',
      });

      expect(result.statusCode).toBe(HttpStatus.FORBIDDEN);
    });

    it('답글을 생성해야 함', async () => {
      mockPostService.findById.mockResolvedValue(mockPost);
      mockUserService.getMaxSubscriberCount.mockResolvedValue(100000);

      const replyComment = {
        ...mockComment,
        id: 'comment-2',
        parentId: 'comment-1',
      };
      mockCommentService.create.mockResolvedValue(replyComment);

      const result = await controller.create(mockUser as any, {
        postId: 'post-1',
        content: '답글 내용',
        parentId: 'comment-1',
      });

      expect(result.parentId).toBe('comment-1');
    });

    it('maxSubscribers 초과 시 FORBIDDEN을 반환해야 함', async () => {
      const postWithRestrictedChannel = {
        ...mockPost,
        channel: {
          ...mockChannel,
          minSubscribers: 10000,
          maxSubscribers: 100000,
        },
      };
      mockPostService.findById.mockResolvedValue(postWithRestrictedChannel);
      mockUserService.getMaxSubscriberCount.mockResolvedValue(150000);

      const result = await controller.create(mockUser as any, {
        postId: 'post-1',
        content: '테스트 댓글',
      });

      expect(result.statusCode).toBe(HttpStatus.FORBIDDEN);
    });
  });

  describe('update', () => {
    it('댓글을 수정해야 함', async () => {
      const updatedComment = { ...mockComment, content: '수정된 댓글' };
      mockCommentService.update.mockResolvedValue(updatedComment);

      const result = await controller.update(mockUser as any, 'comment-1', {
        content: '수정된 댓글',
      });

      expect(result.content).toBe('수정된 댓글');
      expect(mockCommentService.update).toHaveBeenCalledWith(
        'comment-1',
        'user-1',
        { content: '수정된 댓글' },
      );
    });
  });

  describe('delete', () => {
    it('댓글을 삭제해야 함', async () => {
      mockCommentService.delete.mockResolvedValue(undefined);

      const result = await controller.delete(mockUser as any, 'comment-1');

      expect(result.message).toBe('댓글이 삭제되었습니다');
      expect(mockCommentService.delete).toHaveBeenCalledWith(
        'comment-1',
        'user-1',
      );
    });
  });

  describe('toggleLike', () => {
    it('좋아요를 토글해야 함', async () => {
      mockCommentService.toggleLike.mockResolvedValue({
        liked: true,
        likeCount: 1,
      });

      const result = await controller.toggleLike(mockUser as any, 'comment-1');

      expect(result.liked).toBe(true);
      expect(mockCommentService.toggleLike).toHaveBeenCalledWith(
        'comment-1',
        'user-1',
      );
    });
  });

  describe('hasLiked', () => {
    it('좋아요 여부를 확인해야 함', async () => {
      mockCommentService.hasUserLiked.mockResolvedValue(true);

      const result = await controller.hasLiked(mockUser as any, 'comment-1');

      expect(result.liked).toBe(true);
    });

    it('좋아요하지 않았으면 false를 반환해야 함', async () => {
      mockCommentService.hasUserLiked.mockResolvedValue(false);

      const result = await controller.hasLiked(mockUser as any, 'comment-1');

      expect(result.liked).toBe(false);
    });
  });

  describe('getAuthorInfo', () => {
    it('작성자 정보를 반환해야 함', async () => {
      mockCommentService.getAuthorInfo.mockResolvedValue(
        'YOUTUBE|테스트유저|100000',
      );

      const result = await controller.getAuthorInfo('comment-1');

      expect(result.authorInfo).toBe('YOUTUBE|테스트유저|100000');
    });

    it('작성자 정보가 없으면 null을 반환해야 함', async () => {
      mockCommentService.getAuthorInfo.mockResolvedValue(null);

      const result = await controller.getAuthorInfo('non-existent');

      expect(result.authorInfo).toBeNull();
    });
  });
});
