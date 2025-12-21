import { Test, TestingModule } from '@nestjs/testing';
import { FaqController } from './faq.controller';
import { FaqService } from './faq.service';

/**
 * FAQ 컨트롤러 테스트
 */
describe('FaqController', () => {
  let controller: FaqController;

  // Mock 데이터
  const mockFaq = {
    id: 'faq-1',
    category: 'ACCOUNT',
    question: '계정 관련 질문입니다.',
    answer: '계정 관련 답변입니다.',
  };

  // Mock Services
  const mockFaqService = {
    findAll: jest.fn(),
    findByCategory: jest.fn(),
    search: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FaqController],
      providers: [{ provide: FaqService, useValue: mockFaqService }],
    }).compile();

    controller = module.get<FaqController>(FaqController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('전체 FAQ를 조회해야 함', async () => {
      mockFaqService.findAll.mockResolvedValue([mockFaq]);

      const result = await controller.findAll();

      expect(result.faqs).toHaveLength(1);
      expect(mockFaqService.findAll).toHaveBeenCalled();
    });

    it('카테고리별 FAQ를 조회해야 함', async () => {
      mockFaqService.findByCategory.mockResolvedValue([mockFaq]);

      const result = await controller.findAll('ACCOUNT');

      expect(result.faqs).toHaveLength(1);
      expect(mockFaqService.findByCategory).toHaveBeenCalledWith('ACCOUNT');
    });

    it('검색어로 FAQ를 검색해야 함', async () => {
      mockFaqService.search.mockResolvedValue([mockFaq]);

      const result = await controller.findAll(undefined, '계정');

      expect(result.faqs).toHaveLength(1);
      expect(mockFaqService.search).toHaveBeenCalledWith('계정');
    });

    it('검색어가 우선순위가 높아야 함 (카테고리와 검색어 모두 있을 때)', async () => {
      mockFaqService.search.mockResolvedValue([mockFaq]);

      const result = await controller.findAll('ACCOUNT', '계정');

      expect(result.faqs).toHaveLength(1);
      expect(mockFaqService.search).toHaveBeenCalledWith('계정');
      expect(mockFaqService.findByCategory).not.toHaveBeenCalled();
    });

    it('FAQ가 없으면 빈 배열을 반환해야 함', async () => {
      mockFaqService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result.faqs).toEqual([]);
    });

    it('유효하지 않은 카테고리는 전체 조회로 처리해야 함', async () => {
      mockFaqService.findAll.mockResolvedValue([mockFaq]);

      const result = await controller.findAll('INVALID_CATEGORY');

      expect(result.faqs).toHaveLength(1);
      expect(mockFaqService.findAll).toHaveBeenCalled();
      expect(mockFaqService.findByCategory).not.toHaveBeenCalled();
    });

    it('COMMUNITY 카테고리를 조회해야 함', async () => {
      mockFaqService.findByCategory.mockResolvedValue([mockFaq]);

      await controller.findAll('COMMUNITY');

      expect(mockFaqService.findByCategory).toHaveBeenCalledWith('COMMUNITY');
    });

    it('CHANNEL 카테고리를 조회해야 함', async () => {
      mockFaqService.findByCategory.mockResolvedValue([mockFaq]);

      await controller.findAll('CHANNEL');

      expect(mockFaqService.findByCategory).toHaveBeenCalledWith('CHANNEL');
    });

    it('REPORT 카테고리를 조회해야 함', async () => {
      mockFaqService.findByCategory.mockResolvedValue([mockFaq]);

      await controller.findAll('REPORT');

      expect(mockFaqService.findByCategory).toHaveBeenCalledWith('REPORT');
    });

    it('OTHER 카테고리를 조회해야 함', async () => {
      mockFaqService.findByCategory.mockResolvedValue([mockFaq]);

      await controller.findAll('OTHER');

      expect(mockFaqService.findByCategory).toHaveBeenCalledWith('OTHER');
    });
  });

  describe('getCategories', () => {
    it('카테고리 목록을 반환해야 함', () => {
      const result = controller.getCategories();

      expect(result.categories).toHaveLength(5);
      expect(result.categories.map(c => c.value)).toContain('ACCOUNT');
      expect(result.categories.map(c => c.value)).toContain('COMMUNITY');
      expect(result.categories.map(c => c.value)).toContain('CHANNEL');
      expect(result.categories.map(c => c.value)).toContain('REPORT');
      expect(result.categories.map(c => c.value)).toContain('OTHER');
    });

    it('카테고리 라벨을 포함해야 함', () => {
      const result = controller.getCategories();

      const accountCategory = result.categories.find(c => c.value === 'ACCOUNT');
      expect(accountCategory?.label).toBe('계정');
    });
  });
});
