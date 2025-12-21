import { Test, TestingModule } from '@nestjs/testing';
import { CommentService } from './comment.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

/**
 * 댓글 서비스 테스트
 */
describe('CommentService', () => {
  let service: CommentService;

  // Mock 데이터
  const mockUser = {
    id: 'user-1',
    nickname: '테스트유저',
    accounts: [
      {
        provider: 'YOUTUBE',
        profileName: '테스트채널',
        subscriberCount: 150000,
      },
    ],
  };

  const mockPost = {
    id: 'post-1',
    authorId: 'user-1',
    channelId: 'channel-1',
    commentCount: 5,
    deletedAt: null,
  };

  const mockComment = {
    id: 'comment-1',
    postId: 'post-1',
    authorId: 'user-1',
    parentId: null,
    content: '테스트 댓글입니다.',
    imageUrl: null,
    imageKey: null,
    likeCount: 3,
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    author: { id: 'user-1', nickname: '테스트유저' },
    replies: [],
    _count: { likes: 3 },
  };

  const mockReply = {
    ...mockComment,
    id: 'comment-2',
    parentId: 'comment-1',
    content: '테스트 답글입니다.',
  };

  // Prisma Mock
  const mockPrismaService = {
    comment: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    commentLike: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    post: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CommentService>(CommentService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByPostId', () => {
    it('게시글의 댓글 목록을 반환해야 함', async () => {
      mockPrismaService.comment.findMany.mockResolvedValue([mockComment]);
      mockPrismaService.comment.count.mockResolvedValue(1);

      const result = await service.findByPostId({ postId: 'post-1', page: 1, limit: 20 });

      expect(result.comments).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('답글을 포함해서 반환해야 함', async () => {
      mockPrismaService.comment.findMany.mockResolvedValue([
        { ...mockComment, replies: [mockReply] },
      ]);
      mockPrismaService.comment.count.mockResolvedValue(1);

      const result = await service.findByPostId({ postId: 'post-1', page: 1, limit: 20 });

      expect(result.comments[0].replies).toHaveLength(1);
    });

    it('기본 페이지네이션을 사용해야 함', async () => {
      mockPrismaService.comment.findMany.mockResolvedValue([mockComment]);
      mockPrismaService.comment.count.mockResolvedValue(1);

      const result = await service.findByPostId({ postId: 'post-1' });

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('page가 0 이하일 때 1로 설정해야 함', async () => {
      mockPrismaService.comment.findMany.mockResolvedValue([]);
      mockPrismaService.comment.count.mockResolvedValue(0);

      const result = await service.findByPostId({ postId: 'post-1', page: 0, limit: 20 });

      expect(result.page).toBe(1);
    });

    it('page가 음수일 때 1로 설정해야 함', async () => {
      mockPrismaService.comment.findMany.mockResolvedValue([]);
      mockPrismaService.comment.count.mockResolvedValue(0);

      const result = await service.findByPostId({ postId: 'post-1', page: -5, limit: 20 });

      expect(result.page).toBe(1);
    });

    it('limit이 최대값을 초과하면 50으로 제한해야 함', async () => {
      mockPrismaService.comment.findMany.mockResolvedValue([]);
      mockPrismaService.comment.count.mockResolvedValue(0);

      const result = await service.findByPostId({ postId: 'post-1', page: 1, limit: 100 });

      expect(result.limit).toBe(50);
    });

    it('limit이 0일 때 기본값 20을 사용해야 함', async () => {
      mockPrismaService.comment.findMany.mockResolvedValue([]);
      mockPrismaService.comment.count.mockResolvedValue(0);

      // 0 || 20 = 20 이 되고, Math.max(1, 20) = 20, Math.min(50, 20) = 20
      const result = await service.findByPostId({ postId: 'post-1', page: 1, limit: 0 });

      expect(result.limit).toBe(20);
    });

    it('limit이 음수일 때 1로 설정해야 함', async () => {
      mockPrismaService.comment.findMany.mockResolvedValue([]);
      mockPrismaService.comment.count.mockResolvedValue(0);

      // -5 || 20 = -5 (truthy), Math.max(1, -5) = 1, Math.min(50, 1) = 1
      const result = await service.findByPostId({ postId: 'post-1', page: 1, limit: -5 });

      expect(result.limit).toBe(1);
    });

    it('totalPages를 올바르게 계산해야 함', async () => {
      mockPrismaService.comment.findMany.mockResolvedValue([]);
      mockPrismaService.comment.count.mockResolvedValue(45);

      const result = await service.findByPostId({ postId: 'post-1', page: 1, limit: 20 });

      expect(result.totalPages).toBe(3);
    });

    it('빈 결과를 처리해야 함', async () => {
      mockPrismaService.comment.findMany.mockResolvedValue([]);
      mockPrismaService.comment.count.mockResolvedValue(0);

      const result = await service.findByPostId({ postId: 'post-1', page: 1, limit: 20 });

      expect(result.comments).toHaveLength(0);
      expect(result.totalPages).toBe(0);
    });
  });

  describe('findById', () => {
    it('댓글을 찾아야 함', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue(mockComment);

      const result = await service.findById('comment-1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('comment-1');
    });

    it('삭제된 댓글은 null을 반환해야 함', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue({
        ...mockComment,
        deletedAt: new Date(),
      });

      const result = await service.findById('comment-1');

      expect(result).toBeNull();
    });

    it('존재하지 않는 댓글은 null을 반환해야 함', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue(null);

      const result = await service.findById('non-existent');

      expect(result).toBeNull();
    });

    it('DELETED 상태인 댓글은 null을 반환해야 함', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue({
        ...mockComment,
        status: 'DELETED',
        deletedAt: null,
      });

      const result = await service.findById('comment-1');

      expect(result).toBeNull();
    });

    it('HIDDEN 상태인 댓글은 null을 반환해야 함', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue({
        ...mockComment,
        status: 'HIDDEN',
        deletedAt: null,
      });

      const result = await service.findById('comment-1');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('댓글을 성공적으로 생성해야 함', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          comment: {
            create: jest.fn().mockResolvedValue(mockComment),
          },
          post: {
            update: jest.fn().mockResolvedValue(mockPost),
          },
        });
      });

      const result = await service.create('user-1', {
        postId: 'post-1',
        content: '테스트 댓글',
      });

      expect(result).toBeDefined();
      expect(result.content).toBe('테스트 댓글입니다.');
    });

    it('이미지가 포함된 댓글을 생성해야 함', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          comment: {
            create: jest.fn().mockResolvedValue({
              ...mockComment,
              imageUrl: 'https://example.com/image.jpg',
              imageKey: 'comments/image.jpg',
            }),
          },
          post: {
            update: jest.fn().mockResolvedValue(mockPost),
          },
        });
      });

      const result = await service.create('user-1', {
        postId: 'post-1',
        content: '이미지 댓글',
        imageUrl: 'https://example.com/image.jpg',
        imageKey: 'comments/image.jpg',
      });

      expect(result).toBeDefined();
    });

    it('답글을 성공적으로 생성해야 함', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.comment.findUnique.mockResolvedValue({
        ...mockComment,
        parentId: null, // 최상위 댓글
      });
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          comment: {
            create: jest.fn().mockResolvedValue(mockReply),
          },
          post: {
            update: jest.fn().mockResolvedValue(mockPost),
          },
        });
      });

      const result = await service.create('user-1', {
        postId: 'post-1',
        parentId: 'comment-1',
        content: '답글',
      });

      expect(result).toBeDefined();
    });

    it('삭제된 게시글에는 댓글을 작성할 수 없어야 함', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue({
        ...mockPost,
        deletedAt: new Date(),
      });

      await expect(
        service.create('user-1', {
          postId: 'post-1',
          content: '테스트 댓글',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('존재하지 않는 게시글에는 댓글을 작성할 수 없어야 함', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(null);

      await expect(
        service.create('user-1', {
          postId: 'non-existent',
          content: '테스트 댓글',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('2단계 이상의 대댓글은 작성할 수 없어야 함', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.comment.findUnique.mockResolvedValue({
        ...mockComment,
        parentId: 'parent-comment', // 이미 답글인 댓글
      });

      await expect(
        service.create('user-1', {
          postId: 'post-1',
          parentId: 'comment-1',
          content: '대대댓글',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('삭제된 부모 댓글에는 답글을 달 수 없어야 함', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.comment.findUnique.mockResolvedValue({
        ...mockComment,
        deletedAt: new Date(),
      });

      await expect(
        service.create('user-1', {
          postId: 'post-1',
          parentId: 'comment-1',
          content: '답글',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('존재하지 않는 부모 댓글에는 답글을 달 수 없어야 함', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.comment.findUnique.mockResolvedValue(null);

      await expect(
        service.create('user-1', {
          postId: 'post-1',
          parentId: 'non-existent-comment',
          content: '답글',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('다른 게시글의 댓글에 답글을 달 수 없어야 함', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.comment.findUnique.mockResolvedValue({
        ...mockComment,
        postId: 'other-post', // 다른 게시글의 댓글
        parentId: null,
      });

      await expect(
        service.create('user-1', {
          postId: 'post-1',
          parentId: 'comment-1',
          content: '답글',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('댓글을 성공적으로 수정해야 함', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue(mockComment);
      mockPrismaService.comment.update.mockResolvedValue({
        ...mockComment,
        content: '수정된 댓글',
      });

      const result = await service.update('comment-1', 'user-1', { content: '수정된 댓글' });

      expect(result.content).toBe('수정된 댓글');
      expect(mockPrismaService.comment.update).toHaveBeenCalledWith({
        where: { id: 'comment-1' },
        data: { content: '수정된 댓글' },
      });
    });

    it('작성자가 아니면 ForbiddenException을 던져야 함', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue(mockComment);

      await expect(
        service.update('comment-1', 'other-user', { content: '수정' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('존재하지 않는 댓글은 수정할 수 없어야 함', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue(null);

      await expect(
        service.update('non-existent', 'user-1', { content: '수정' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('댓글을 성공적으로 삭제해야 함', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue(mockComment);
      mockPrismaService.$transaction.mockResolvedValue(undefined);

      await expect(service.delete('comment-1', 'user-1')).resolves.not.toThrow();
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('작성자가 아니면 ForbiddenException을 던져야 함', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue(mockComment);

      await expect(service.delete('comment-1', 'other-user')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('존재하지 않는 댓글은 삭제할 수 없어야 함', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue(null);

      await expect(service.delete('non-existent', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('toggleLike', () => {
    it('좋아요를 추가해야 함', async () => {
      mockPrismaService.commentLike.findUnique.mockResolvedValue(null);
      mockPrismaService.$transaction.mockResolvedValue([
        { id: 'like-1', commentId: 'comment-1', userId: 'user-1' },
        { ...mockComment, likeCount: 4 },
      ]);

      const result = await service.toggleLike('comment-1', 'user-1');

      expect(result.liked).toBe(true);
      expect(result.likeCount).toBe(4);
    });

    it('좋아요를 취소해야 함', async () => {
      mockPrismaService.commentLike.findUnique.mockResolvedValue({
        id: 'like-1',
        commentId: 'comment-1',
        userId: 'user-1',
      });
      mockPrismaService.$transaction.mockResolvedValue([
        { id: 'like-1' },
        { ...mockComment, likeCount: 2 },
      ]);

      const result = await service.toggleLike('comment-1', 'user-1');

      expect(result.liked).toBe(false);
      expect(result.likeCount).toBe(2);
    });
  });

  describe('hasUserLiked', () => {
    it('좋아요가 있으면 true를 반환해야 함', async () => {
      mockPrismaService.commentLike.findUnique.mockResolvedValue({
        id: 'like-1',
        commentId: 'comment-1',
        userId: 'user-1',
      });

      const result = await service.hasUserLiked('comment-1', 'user-1');

      expect(result).toBe(true);
    });

    it('좋아요가 없으면 false를 반환해야 함', async () => {
      mockPrismaService.commentLike.findUnique.mockResolvedValue(null);

      const result = await service.hasUserLiked('comment-1', 'user-1');

      expect(result).toBe(false);
    });
  });

  describe('getCommentCount', () => {
    it('게시글의 댓글 수를 반환해야 함', async () => {
      mockPrismaService.comment.count.mockResolvedValue(10);

      const result = await service.getCommentCount('post-1');

      expect(result).toBe(10);
    });
  });

  describe('getAuthorInfo', () => {
    it('작성자 정보 문자열을 반환해야 함', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue({
        ...mockComment,
        author: {
          ...mockUser,
          accounts: mockUser.accounts,
        },
      });

      const result = await service.getAuthorInfo('comment-1');

      expect(result).toContain('youtube');
      expect(result).toContain('15만');
    });

    it('댓글이 없으면 null을 반환해야 함', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue(null);

      const result = await service.getAuthorInfo('non-existent');

      expect(result).toBeNull();
    });

    it('계정이 없으면 null을 반환해야 함', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue({
        ...mockComment,
        author: {
          ...mockUser,
          accounts: [],
        },
      });

      const result = await service.getAuthorInfo('comment-1');

      expect(result).toBeNull();
    });

    it('닉네임이 없으면 profileName을 사용해야 함', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue({
        ...mockComment,
        author: {
          id: 'user-1',
          nickname: null,
          accounts: [
            {
              provider: 'TIKTOK',
              profileName: '틱톡프로필',
              subscriberCount: 5000,
            },
          ],
        },
      });

      const result = await service.getAuthorInfo('comment-1');

      expect(result).toContain('tiktok');
      expect(result).toContain('틱톡프로필');
    });

    it('닉네임과 profileName이 모두 없으면 익명을 사용해야 함', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue({
        ...mockComment,
        author: {
          id: 'user-1',
          nickname: null,
          accounts: [
            {
              provider: 'TWITCH',
              profileName: null,
              subscriberCount: 500,
            },
          ],
        },
      });

      const result = await service.getAuthorInfo('comment-1');

      expect(result).toContain('twitch');
      expect(result).toContain('익명');
    });

    it('1000~9999 구독자 수를 천 단위로 포맷해야 함', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue({
        ...mockComment,
        author: {
          ...mockUser,
          accounts: [
            {
              provider: 'YOUTUBE',
              profileName: '테스트',
              subscriberCount: 5500,
            },
          ],
        },
      });

      const result = await service.getAuthorInfo('comment-1');

      expect(result).toContain('5.5천');
    });

    it('1000 미만 구독자 수는 그대로 표시해야 함', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue({
        ...mockComment,
        author: {
          ...mockUser,
          accounts: [
            {
              provider: 'YOUTUBE',
              profileName: '테스트',
              subscriberCount: 500,
            },
          ],
        },
      });

      const result = await service.getAuthorInfo('comment-1');

      expect(result).toContain('500');
    });

    it('10000 이상 구독자 수를 만 단위로 포맷해야 함', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue({
        ...mockComment,
        author: {
          ...mockUser,
          accounts: [
            {
              provider: 'YOUTUBE',
              profileName: '테스트',
              subscriberCount: 123456,
            },
          ],
        },
      });

      const result = await service.getAuthorInfo('comment-1');

      expect(result).toContain('12만');
    });

    it('구독자 수가 0이면 0을 표시해야 함', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue({
        ...mockComment,
        author: {
          ...mockUser,
          accounts: [
            {
              provider: 'YOUTUBE',
              profileName: '테스트',
              subscriberCount: 0,
            },
          ],
        },
      });

      const result = await service.getAuthorInfo('comment-1');

      expect(result).toContain('|0');
    });

    it('구독자 수가 null이면 0으로 처리해야 함', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue({
        ...mockComment,
        author: {
          ...mockUser,
          accounts: [
            {
              provider: 'YOUTUBE',
              profileName: '테스트',
              subscriberCount: null,
            },
          ],
        },
      });

      const result = await service.getAuthorInfo('comment-1');

      expect(result).toContain('|0');
    });
  });
});
