import { Test, TestingModule } from '@nestjs/testing';
import { HashtagController } from './hashtag.controller';
import { HashtagService } from './hashtag.service';

/**
 * 해시태그 컨트롤러 테스트
 */
describe('HashtagController', () => {
  let controller: HashtagController;

  // Mock 데이터
  const mockHashtag = {
    id: 'hashtag-1',
    name: '크리에이터',
    postCount: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPost = {
    id: 'post-1',
    title: '해시태그 테스트',
    content: '#크리에이터 테스트',
    createdAt: new Date(),
  };

  // Mock Services
  const mockHashtagService = {
    search: jest.fn(),
    getPopular: jest.fn(),
    getTrending: jest.fn(),
    getPostsByHashtag: jest.fn(),
    findByName: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HashtagController],
      providers: [{ provide: HashtagService, useValue: mockHashtagService }],
    }).compile();

    controller = module.get<HashtagController>(HashtagController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('search', () => {
    it('해시태그를 검색해야 함', async () => {
      mockHashtagService.search.mockResolvedValue([mockHashtag]);

      const result = await controller.search('크리');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('크리에이터');
      expect(mockHashtagService.search).toHaveBeenCalledWith('크리', undefined);
    });

    it('검색 결과 개수를 제한해야 함', async () => {
      mockHashtagService.search.mockResolvedValue([mockHashtag]);

      await controller.search('크리', 5);

      expect(mockHashtagService.search).toHaveBeenCalledWith('크리', 5);
    });

    it('검색 결과가 없으면 빈 배열을 반환해야 함', async () => {
      mockHashtagService.search.mockResolvedValue([]);

      const result = await controller.search('없는해시태그');

      expect(result).toEqual([]);
    });
  });

  describe('getPopular', () => {
    it('인기 해시태그를 반환해야 함', async () => {
      mockHashtagService.getPopular.mockResolvedValue([mockHashtag]);

      const result = await controller.getPopular();

      expect(result).toHaveLength(1);
      expect(mockHashtagService.getPopular).toHaveBeenCalledWith(undefined);
    });

    it('결과 개수를 제한해야 함', async () => {
      mockHashtagService.getPopular.mockResolvedValue([mockHashtag]);

      await controller.getPopular(10);

      expect(mockHashtagService.getPopular).toHaveBeenCalledWith(10);
    });

    it('인기 해시태그가 없으면 빈 배열을 반환해야 함', async () => {
      mockHashtagService.getPopular.mockResolvedValue([]);

      const result = await controller.getPopular();

      expect(result).toEqual([]);
    });
  });

  describe('getTrending', () => {
    it('트렌딩 해시태그를 반환해야 함', async () => {
      mockHashtagService.getTrending.mockResolvedValue([mockHashtag]);

      const result = await controller.getTrending();

      expect(result).toHaveLength(1);
      expect(mockHashtagService.getTrending).toHaveBeenCalledWith(undefined);
    });

    it('결과 개수를 제한해야 함', async () => {
      mockHashtagService.getTrending.mockResolvedValue([mockHashtag]);

      await controller.getTrending(5);

      expect(mockHashtagService.getTrending).toHaveBeenCalledWith(5);
    });

    it('트렌딩 해시태그가 없으면 빈 배열을 반환해야 함', async () => {
      mockHashtagService.getTrending.mockResolvedValue([]);

      const result = await controller.getTrending();

      expect(result).toEqual([]);
    });
  });

  describe('getPostsByHashtag', () => {
    it('해시태그의 게시글을 반환해야 함', async () => {
      mockHashtagService.getPostsByHashtag.mockResolvedValue({
        posts: [mockPost],
        total: 1,
        page: 1,
        limit: 15,
      });

      const result = await controller.getPostsByHashtag('크리에이터');

      expect(result.posts).toHaveLength(1);
      expect(mockHashtagService.getPostsByHashtag).toHaveBeenCalledWith(
        '크리에이터',
        undefined,
        undefined,
      );
    });

    it('페이지네이션을 적용해야 함', async () => {
      mockHashtagService.getPostsByHashtag.mockResolvedValue({
        posts: [],
        total: 0,
        page: 2,
        limit: 10,
      });

      await controller.getPostsByHashtag('크리에이터', 2, 10);

      expect(mockHashtagService.getPostsByHashtag).toHaveBeenCalledWith(
        '크리에이터',
        2,
        10,
      );
    });

    it('해시태그에 게시글이 없으면 빈 배열을 반환해야 함', async () => {
      mockHashtagService.getPostsByHashtag.mockResolvedValue({
        posts: [],
        total: 0,
        page: 1,
        limit: 15,
      });

      const result = await controller.getPostsByHashtag('없는해시태그');

      expect(result.posts).toEqual([]);
    });
  });

  describe('findByName', () => {
    it('해시태그 상세를 반환해야 함', async () => {
      mockHashtagService.findByName.mockResolvedValue(mockHashtag);

      const result = await controller.findByName('크리에이터');

      expect(result.name).toBe('크리에이터');
      expect(mockHashtagService.findByName).toHaveBeenCalledWith('크리에이터');
    });

    it('존재하지 않는 해시태그는 null을 반환해야 함', async () => {
      mockHashtagService.findByName.mockResolvedValue(null);

      const result = await controller.findByName('없는해시태그');

      expect(result).toBeNull();
    });
  });
});
