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
  });

  describe('create', () => {
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
  });

  describe('update', () => {
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
  });
});
