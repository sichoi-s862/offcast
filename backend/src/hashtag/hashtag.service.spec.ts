import { Test, TestingModule } from '@nestjs/testing';
import { HashtagService } from './hashtag.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 해시태그 서비스 테스트
 */
describe('HashtagService', () => {
  let service: HashtagService;

  // Mock 데이터
  const mockHashtags = [
    { id: 'tag-1', name: '크리에이터', usageCount: 150, createdAt: new Date(), updatedAt: new Date() },
    { id: 'tag-2', name: '유튜브', usageCount: 120, createdAt: new Date(), updatedAt: new Date() },
    { id: 'tag-3', name: '일상', usageCount: 100, createdAt: new Date(), updatedAt: new Date() },
  ];

  const mockPost = {
    id: 'post-1',
    title: '테스트 게시글',
    content: '테스트 내용',
    viewCount: 10,
    likeCount: 5,
    commentCount: 3,
    createdAt: new Date(),
    author: {
      id: 'user-1',
      nickname: '테스트유저',
    },
    channel: { id: 'channel-1', name: '자유 게시판' },
    images: [],
    hashtags: [],
    _count: { comments: 3, likes: 5 },
  };

  // Prisma Mock
  const mockPrismaService = {
    hashtag: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    postHashtag: {
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    post: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HashtagService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<HashtagService>(HashtagService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('search', () => {
    it('키워드로 해시태그를 검색해야 함', async () => {
      mockPrismaService.hashtag.findMany.mockResolvedValue([mockHashtags[0]]);
      mockPrismaService.hashtag.count.mockResolvedValue(1);

      const result = await service.search('크리에이터');

      expect(result.hashtags).toHaveLength(1);
      expect(result.hashtags[0].name).toBe('크리에이터');
      expect(result.total).toBe(1);
    });

    it('빈 키워드는 빈 결과를 반환해야 함', async () => {
      const result = await service.search('');

      expect(result.hashtags).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('# 접두사를 제거하고 검색해야 함', async () => {
      mockPrismaService.hashtag.findMany.mockResolvedValue([mockHashtags[0]]);
      mockPrismaService.hashtag.count.mockResolvedValue(1);

      await service.search('#크리에이터');

      expect(mockPrismaService.hashtag.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: {
              startsWith: '크리에이터',
              mode: 'insensitive',
            },
          }),
        }),
      );
    });

    it('limit 파라미터를 적용해야 함', async () => {
      mockPrismaService.hashtag.findMany.mockResolvedValue(mockHashtags.slice(0, 5));
      mockPrismaService.hashtag.count.mockResolvedValue(10);

      await service.search('태그', 5);

      expect(mockPrismaService.hashtag.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        }),
      );
    });
  });

  describe('getPopular', () => {
    it('인기 해시태그를 반환해야 함', async () => {
      mockPrismaService.hashtag.findMany.mockResolvedValue(
        mockHashtags.map(({ id, name, usageCount }) => ({ id, name, usageCount })),
      );

      const result = await service.getPopular();

      expect(result).toHaveLength(3);
      expect(mockPrismaService.hashtag.findMany).toHaveBeenCalledWith({
        where: { usageCount: { gt: 0 } },
        orderBy: { usageCount: 'desc' },
        take: 10,
        select: {
          id: true,
          name: true,
          usageCount: true,
        },
      });
    });

    it('limit 파라미터를 적용해야 함', async () => {
      mockPrismaService.hashtag.findMany.mockResolvedValue([]);

      await service.getPopular(5);

      expect(mockPrismaService.hashtag.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        }),
      );
    });
  });

  describe('getTrending', () => {
    it('트렌딩 데이터가 있으면 해당 해시태그를 반환해야 함', async () => {
      mockPrismaService.postHashtag.groupBy.mockResolvedValue([
        { hashtagId: 'tag-1', _count: { hashtagId: 50 } },
        { hashtagId: 'tag-2', _count: { hashtagId: 30 } },
      ]);
      mockPrismaService.hashtag.findMany.mockResolvedValue([
        { id: 'tag-1', name: '크리에이터', usageCount: 150 },
        { id: 'tag-2', name: '유튜브', usageCount: 120 },
      ]);

      const result = await service.getTrending();

      expect(result).toHaveLength(2);
      expect(mockPrismaService.postHashtag.groupBy).toHaveBeenCalled();
    });

    it('트렌딩 데이터가 없으면 인기 해시태그를 반환해야 함', async () => {
      mockPrismaService.postHashtag.groupBy.mockResolvedValue([]);
      mockPrismaService.hashtag.findMany.mockResolvedValue(
        mockHashtags.map(({ id, name, usageCount }) => ({ id, name, usageCount })),
      );

      const result = await service.getTrending();

      expect(result).toHaveLength(3);
    });
  });

  describe('getPostsByHashtag', () => {
    it('해시태그로 게시글을 조회해야 함', async () => {
      mockPrismaService.hashtag.findUnique.mockResolvedValue(mockHashtags[0]);
      mockPrismaService.post.findMany.mockResolvedValue([mockPost]);
      mockPrismaService.post.count.mockResolvedValue(1);

      const result = await service.getPostsByHashtag('크리에이터', 1, 20);

      expect(result.posts).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('존재하지 않는 해시태그는 빈 결과를 반환해야 함', async () => {
      mockPrismaService.hashtag.findUnique.mockResolvedValue(null);

      const result = await service.getPostsByHashtag('존재하지않음', 1, 20);

      expect(result.posts).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('페이지네이션을 적용해야 함', async () => {
      mockPrismaService.hashtag.findUnique.mockResolvedValue(mockHashtags[0]);
      mockPrismaService.post.findMany.mockResolvedValue([]);
      mockPrismaService.post.count.mockResolvedValue(50);

      const result = await service.getPostsByHashtag('크리에이터', 2, 10);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(mockPrismaService.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
    });
  });

  describe('findByName', () => {
    it('이름으로 해시태그를 찾아야 함', async () => {
      mockPrismaService.hashtag.findUnique.mockResolvedValue(mockHashtags[0]);

      const result = await service.findByName('크리에이터');

      expect(result).toBeDefined();
      expect(result?.name).toBe('크리에이터');
    });

    it('# 접두사를 제거하고 검색해야 함', async () => {
      mockPrismaService.hashtag.findUnique.mockResolvedValue(mockHashtags[0]);

      await service.findByName('#크리에이터');

      expect(mockPrismaService.hashtag.findUnique).toHaveBeenCalledWith({
        where: { name: '크리에이터' },
      });
    });

    it('존재하지 않는 해시태그는 null을 반환해야 함', async () => {
      mockPrismaService.hashtag.findUnique.mockResolvedValue(null);

      const result = await service.findByName('없는태그');

      expect(result).toBeNull();
    });
  });
});
