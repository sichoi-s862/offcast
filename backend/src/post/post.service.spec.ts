import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from './post.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

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

      const result = await service.findAll({
        channelId: 'channel-1',
        sort: 'popular',
        page: 1,
        limit: 20,
      });

      // 인기순은 별도의 findAllPopular 메서드에서 처리됨 (시간 감쇠 적용)
      expect(mockPrismaService.post.findMany).toHaveBeenCalled();
      expect(result.posts).toEqual([]);
    });

    it('정렬 옵션을 적용해야 함 (조회순)', async () => {
      mockPrismaService.post.findMany.mockResolvedValue([]);
      mockPrismaService.post.count.mockResolvedValue(0);

      await service.findAll({
        channelId: 'channel-1',
        sort: 'views',
        page: 1,
        limit: 20,
      });

      expect(mockPrismaService.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { viewCount: 'desc' },
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

    it('계정이 없으면 null을 반환해야 함', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue({
        ...mockPost,
        author: {
          ...mockUser,
          accounts: [],
        },
      });

      const result = await service.getAuthorInfo('post-1');

      expect(result).toBeNull();
    });

    it('구독자 수가 1000 이상이면 천 단위로 포맷해야 함', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue({
        ...mockPost,
        author: {
          ...mockUser,
          accounts: [{ ...mockUser.accounts[0], subscriberCount: 5500 }],
        },
      });

      const result = await service.getAuthorInfo('post-1');

      expect(result).toContain('5.5천');
    });

    it('구독자 수가 1000 미만이면 그대로 표시해야 함', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue({
        ...mockPost,
        author: {
          ...mockUser,
          accounts: [{ ...mockUser.accounts[0], subscriberCount: 500 }],
        },
      });

      const result = await service.getAuthorInfo('post-1');

      expect(result).toContain('500');
    });

    it('구독자 수가 0이면 0으로 표시해야 함', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue({
        ...mockPost,
        author: {
          nickname: null,
          accounts: [{ ...mockUser.accounts[0], subscriberCount: 0, profileName: null }],
        },
      });

      const result = await service.getAuthorInfo('post-1');

      expect(result).toContain('0');
      expect(result).toContain('익명');
    });
  });

  describe('findAll - 접근 가능한 채널 필터링', () => {
    it('accessibleChannelIds가 있으면 해당 채널만 필터링해야 함', async () => {
      mockPrismaService.post.findMany.mockResolvedValue([mockPost]);
      mockPrismaService.post.count.mockResolvedValue(1);

      await service.findAll({ page: 1, limit: 20 }, ['channel-1', 'channel-2']);

      expect(mockPrismaService.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            channelId: { in: ['channel-1', 'channel-2'] },
          }),
        }),
      );
    });

    it('channelId가 명시되면 accessibleChannelIds보다 우선해야 함', async () => {
      mockPrismaService.post.findMany.mockResolvedValue([mockPost]);
      mockPrismaService.post.count.mockResolvedValue(1);

      await service.findAll(
        { channelId: 'channel-1', page: 1, limit: 20 },
        ['channel-1', 'channel-2'],
      );

      expect(mockPrismaService.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            channelId: 'channel-1',
          }),
        }),
      );
    });

    it('페이지 번호가 0 이하면 1로 처리해야 함', async () => {
      mockPrismaService.post.findMany.mockResolvedValue([]);
      mockPrismaService.post.count.mockResolvedValue(0);

      const result = await service.findAll({ page: -1, limit: 20 });

      expect(result.page).toBe(1);
    });

    it('limit이 50을 초과하면 50으로 제한해야 함', async () => {
      mockPrismaService.post.findMany.mockResolvedValue([]);
      mockPrismaService.post.count.mockResolvedValue(0);

      const result = await service.findAll({ page: 1, limit: 100 });

      expect(result.limit).toBe(50);
    });

    it('limit이 0이면 기본값 20을 사용해야 함', async () => {
      mockPrismaService.post.findMany.mockResolvedValue([]);
      mockPrismaService.post.count.mockResolvedValue(0);

      // 0 || 20 = 20, Math.max(1, 20) = 20, Math.min(50, 20) = 20
      const result = await service.findAll({ page: 1, limit: 0 });

      expect(result.limit).toBe(20);
    });

    it('limit이 음수면 1로 처리해야 함', async () => {
      mockPrismaService.post.findMany.mockResolvedValue([]);
      mockPrismaService.post.count.mockResolvedValue(0);

      // -5 || 20 = -5, Math.max(1, -5) = 1, Math.min(50, 1) = 1
      const result = await service.findAll({ page: 1, limit: -5 });

      expect(result.limit).toBe(1);
    });
  });

  describe('findAllPopular - 인기순 정렬', () => {
    it('인기순으로 게시글을 정렬해야 함', async () => {
      const oldPost = {
        ...mockPost,
        id: 'post-old',
        likeCount: 100,
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 48시간 전
      };
      const newPost = {
        ...mockPost,
        id: 'post-new',
        likeCount: 50,
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1시간 전
      };

      mockPrismaService.post.findMany.mockResolvedValue([oldPost, newPost]);
      mockPrismaService.post.count.mockResolvedValue(2);

      const result = await service.findAll({
        channelId: 'channel-1',
        sort: 'popular',
        page: 1,
        limit: 20,
      });

      // 시간 감쇠로 인해 최신 글이 더 높은 점수를 가질 수 있음
      expect(result.posts).toHaveLength(2);
    });

    it('인기순 조회가 여러 번 호출되어도 정상 작동해야 함', async () => {
      mockPrismaService.post.findMany.mockResolvedValue([mockPost]);
      mockPrismaService.post.count.mockResolvedValue(1);

      // 첫 번째 호출
      const result1 = await service.findAll({
        channelId: 'channel-1',
        sort: 'popular',
        page: 1,
        limit: 20,
      });

      // 두 번째 호출
      const result2 = await service.findAll({
        channelId: 'channel-1',
        sort: 'popular',
        page: 1,
        limit: 20,
      });

      expect(result1.posts).toHaveLength(1);
      expect(result2.posts).toHaveLength(1);
    });

    it('2페이지 이상은 캐시하지 않아야 함', async () => {
      mockPrismaService.post.findMany.mockResolvedValue([mockPost]);
      mockPrismaService.post.count.mockResolvedValue(1);

      await service.findAll({
        channelId: 'channel-1',
        sort: 'popular',
        page: 2,
        limit: 20,
      });

      expect(mockPrismaService.post.findMany).toHaveBeenCalled();
    });
  });

  describe('findByAuthor', () => {
    it('특정 사용자의 게시글 목록을 반환해야 함', async () => {
      mockPrismaService.post.findMany.mockResolvedValue([mockPost]);
      mockPrismaService.post.count.mockResolvedValue(1);

      const result = await service.findByAuthor('user-1', { page: 1, limit: 15 });

      expect(result.posts).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockPrismaService.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            authorId: 'user-1',
          }),
        }),
      );
    });

    it('기본값으로 페이지 1, limit 15를 사용해야 함', async () => {
      mockPrismaService.post.findMany.mockResolvedValue([]);
      mockPrismaService.post.count.mockResolvedValue(0);

      const result = await service.findByAuthor('user-1');

      expect(result.page).toBe(1);
      expect(result.limit).toBe(15);
    });

    it('limit이 50을 초과하면 50으로 제한해야 함', async () => {
      mockPrismaService.post.findMany.mockResolvedValue([]);
      mockPrismaService.post.count.mockResolvedValue(0);

      const result = await service.findByAuthor('user-1', { limit: 100 });

      expect(result.limit).toBe(50);
    });
  });

  describe('create', () => {
    it('게시글을 생성해야 함', async () => {
      const createDto = {
        channelId: 'channel-1',
        title: '새 게시글',
        content: '내용입니다',
      };

      const createdPost = { ...mockPost, ...createDto };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const tx = {
          post: { create: jest.fn().mockResolvedValue(createdPost) },
          postImage: { createMany: jest.fn() },
          hashtag: { upsert: jest.fn() },
          postHashtag: { create: jest.fn() },
        };
        return callback(tx);
      });

      const result = await service.create('user-1', createDto);

      expect(result.title).toBe('새 게시글');
    });

    it('이미지와 해시태그가 있는 게시글을 생성해야 함', async () => {
      const createDto = {
        channelId: 'channel-1',
        title: '새 게시글',
        content: '내용입니다',
        imageUrls: ['https://example.com/image.jpg'],
        imageKeys: ['images/image.jpg'],
        hashtags: ['#테스트', '크리에이터'],
      };

      const createdPost = { ...mockPost, ...createDto };
      const mockHashtag = { id: 'tag-1', name: '테스트', usageCount: 1 };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const tx = {
          post: { create: jest.fn().mockResolvedValue(createdPost) },
          postImage: { createMany: jest.fn() },
          hashtag: { upsert: jest.fn().mockResolvedValue(mockHashtag) },
          postHashtag: { create: jest.fn() },
        };
        return callback(tx);
      });

      const result = await service.create('user-1', createDto);

      expect(result.title).toBe('새 게시글');
    });
  });

  describe('update', () => {
    it('게시글이 없으면 NotFoundException을 던져야 함', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(null);

      await expect(
        service.update('non-existent', 'user-1', { title: '수정' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('작성자가 게시글을 수정해야 함', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);

      const updatedPost = { ...mockPost, title: '수정된 제목' };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const tx = {
          post: { update: jest.fn().mockResolvedValue(updatedPost) },
          postHashtag: { findMany: jest.fn().mockResolvedValue([]), deleteMany: jest.fn() },
          hashtag: { upsert: jest.fn(), update: jest.fn() },
        };
        return callback(tx);
      });

      const result = await service.update('post-1', 'user-1', { title: '수정된 제목' });

      expect(result.title).toBe('수정된 제목');
    });

    it('해시태그를 수정해야 함', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);

      const existingHashtags = [
        { postId: 'post-1', hashtagId: 'tag-1', hashtag: { id: 'tag-1', name: '기존태그' } },
      ];

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const tx = {
          post: { update: jest.fn().mockResolvedValue(mockPost) },
          postHashtag: {
            findMany: jest.fn().mockResolvedValue(existingHashtags),
            deleteMany: jest.fn(),
            create: jest.fn(),
          },
          hashtag: {
            upsert: jest.fn().mockResolvedValue({ id: 'tag-2', name: '새태그' }),
            update: jest.fn(),
          },
        };
        return callback(tx);
      });

      await service.update('post-1', 'user-1', { hashtags: ['새태그'] });

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('게시글이 없으면 NotFoundException을 던져야 함', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(null);

      await expect(service.delete('non-existent', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('작성자가 게시글을 삭제해야 함 (소프트 삭제)', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const tx = {
          postHashtag: { findMany: jest.fn().mockResolvedValue([]) },
          hashtag: { update: jest.fn() },
          post: { update: jest.fn() },
        };
        return callback(tx);
      });

      await service.delete('post-1', 'user-1');

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('해시태그 사용 횟수를 감소시켜야 함', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);

      const postHashtags = [
        { postId: 'post-1', hashtagId: 'tag-1' },
        { postId: 'post-1', hashtagId: 'tag-2' },
      ];

      const mockHashtagUpdate = jest.fn();
      const mockPostUpdate = jest.fn();

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const tx = {
          postHashtag: { findMany: jest.fn().mockResolvedValue(postHashtags) },
          hashtag: { update: mockHashtagUpdate },
          post: { update: mockPostUpdate },
        };
        return callback(tx);
      });

      await service.delete('post-1', 'user-1');

      expect(mockHashtagUpdate).toHaveBeenCalledTimes(2);
    });
  });

  describe('toggleLike', () => {
    it('좋아요가 없으면 추가해야 함', async () => {
      mockPrismaService.postLike.findUnique.mockResolvedValue(null);
      mockPrismaService.$transaction.mockResolvedValue([
        { id: 'like-1', postId: 'post-1', userId: 'user-1' },
        { ...mockPost, likeCount: 6 },
      ]);

      const result = await service.toggleLike('post-1', 'user-1');

      expect(result.liked).toBe(true);
      expect(result.likeCount).toBe(6);
    });

    it('좋아요가 있으면 삭제해야 함', async () => {
      mockPrismaService.postLike.findUnique.mockResolvedValue({
        id: 'like-1',
        postId: 'post-1',
        userId: 'user-1',
      });
      mockPrismaService.$transaction.mockResolvedValue([
        { id: 'like-1' },
        { ...mockPost, likeCount: 4 },
      ]);

      const result = await service.toggleLike('post-1', 'user-1');

      expect(result.liked).toBe(false);
      expect(result.likeCount).toBe(4);
    });
  });
});
