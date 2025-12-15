import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from './post.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';

/**
 * 게시글 서비스 테스트
 */
describe('PostService', () => {
  let service: PostService;

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
    title: '테스트 게시글',
    content: '테스트 내용입니다.',
    viewCount: 10,
    likeCount: 5,
    commentCount: 3,
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    author: { id: 'user-1', nickname: '테스트유저' },
    channel: { id: 'channel-1', name: '자유 게시판' },
    images: [],
    hashtags: [{ hashtag: { id: 'tag-1', name: '크리에이터' } }],
    _count: { likes: 5, comments: 3 },
  };

  // Prisma Mock
  const mockPrismaService = {
    post: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    postLike: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    hashtag: {
      upsert: jest.fn(),
      update: jest.fn(),
    },
    postHashtag: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
    },
    postImage: {
      createMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PostService>(PostService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('게시글 목록을 반환해야 함', async () => {
      mockPrismaService.post.findMany.mockResolvedValue([mockPost]);
      mockPrismaService.post.count.mockResolvedValue(1);

      const result = await service.findAll({
        channelId: 'channel-1',
        page: 1,
        limit: 20,
      });

      expect(result.posts).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('검색어로 필터링해야 함', async () => {
      mockPrismaService.post.findMany.mockResolvedValue([mockPost]);
      mockPrismaService.post.count.mockResolvedValue(1);

      await service.findAll({
        channelId: 'channel-1',
        keyword: '테스트',
        page: 1,
        limit: 20,
      });

      expect(mockPrismaService.post.findMany).toHaveBeenCalled();
    });

    it('해시태그로 필터링해야 함', async () => {
      mockPrismaService.post.findMany.mockResolvedValue([mockPost]);
      mockPrismaService.post.count.mockResolvedValue(1);

      await service.findAll({
        channelId: 'channel-1',
        hashtag: '크리에이터',
        page: 1,
        limit: 20,
      });

      expect(mockPrismaService.post.findMany).toHaveBeenCalled();
    });

    it('정렬 옵션을 적용해야 함 (인기순)', async () => {
      mockPrismaService.post.findMany.mockResolvedValue([]);
      mockPrismaService.post.count.mockResolvedValue(0);

      await service.findAll({
        channelId: 'channel-1',
        sort: 'popular',
        page: 1,
        limit: 20,
      });

      expect(mockPrismaService.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { likeCount: 'desc' },
        }),
      );
    });
  });

  describe('findById', () => {
    it('게시글을 찾아야 함', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);

      const result = await service.findById('post-1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('post-1');
    });

    it('삭제된 게시글은 null을 반환해야 함', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue({
        ...mockPost,
        deletedAt: new Date(),
      });

      const result = await service.findById('post-1');

      expect(result).toBeNull();
    });

    it('존재하지 않는 게시글은 null을 반환해야 함', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(null);

      const result = await service.findById('non-existent');

      expect(result).toBeNull();
    });

    it('상태가 ACTIVE가 아닌 게시글은 null을 반환해야 함', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue({
        ...mockPost,
        status: 'DELETED',
      });

      const result = await service.findById('post-1');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('작성자가 아니면 ForbiddenException을 던져야 함', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);

      await expect(
        service.update('post-1', 'other-user', { title: '수정' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('delete', () => {
    it('작성자가 아니면 ForbiddenException을 던져야 함', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);

      await expect(service.delete('post-1', 'other-user')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('incrementViewCount', () => {
    it('조회수를 증가시켜야 함', async () => {
      mockPrismaService.post.update.mockResolvedValue({
        ...mockPost,
        viewCount: 11,
      });

      await service.incrementViewCount('post-1');

      expect(mockPrismaService.post.update).toHaveBeenCalledWith({
        where: { id: 'post-1' },
        data: { viewCount: { increment: 1 } },
      });
    });
  });

  describe('hasUserLiked', () => {
    it('좋아요가 있으면 true를 반환해야 함', async () => {
      mockPrismaService.postLike.findUnique.mockResolvedValue({
        id: 'like-1',
        postId: 'post-1',
        userId: 'user-1',
      });

      const result = await service.hasUserLiked('post-1', 'user-1');

      expect(result).toBe(true);
    });

    it('좋아요가 없으면 false를 반환해야 함', async () => {
      mockPrismaService.postLike.findUnique.mockResolvedValue(null);

      const result = await service.hasUserLiked('post-1', 'user-1');

      expect(result).toBe(false);
    });
  });

  describe('getAuthorInfo', () => {
    it('작성자 정보 문자열을 반환해야 함', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue({
        ...mockPost,
        author: {
          ...mockUser,
          accounts: mockUser.accounts,
        },
      });

      const result = await service.getAuthorInfo('post-1');

      expect(result).toContain('youtube');
      expect(result).toContain('15만');
    });

    it('게시글이 없으면 null을 반환해야 함', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(null);

      const result = await service.getAuthorInfo('non-existent');

      expect(result).toBeNull();
    });
  });
});
