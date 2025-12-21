import { Test, TestingModule } from '@nestjs/testing';
import { FaqService } from './faq.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * FAQ 서비스 테스트
 */
describe('FaqService', () => {
  let service: FaqService;

  // Mock 데이터
  const mockFaq = {
    id: 'faq-1',
    category: 'ACCOUNT',
    question: '계정 관련 질문입니다.',
    answer: '계정 관련 답변입니다.',
    sortOrder: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Prisma Mock
  const mockPrismaService = {
    faq: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FaqService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<FaqService>(FaqService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('활성화된 FAQ 전체를 반환해야 함', async () => {
      mockPrismaService.faq.findMany.mockResolvedValue([mockFaq]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('question');
      expect(result[0]).toHaveProperty('answer');
    });

    it('FAQ가 없으면 빈 배열을 반환해야 함', async () => {
      mockPrismaService.faq.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });

    it('카테고리와 정렬순으로 정렬되어야 함', async () => {
      mockPrismaService.faq.findMany.mockResolvedValue([]);

      await service.findAll();

      expect(mockPrismaService.faq.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: [
          { category: 'asc' },
          { sortOrder: 'asc' },
        ],
        select: {
          id: true,
          category: true,
          question: true,
          answer: true,
        },
      });
    });
  });

  describe('findByCategory', () => {
    it('특정 카테고리의 FAQ를 반환해야 함', async () => {
      mockPrismaService.faq.findMany.mockResolvedValue([mockFaq]);

      const result = await service.findByCategory('ACCOUNT');

      expect(result).toHaveLength(1);
      expect(mockPrismaService.faq.findMany).toHaveBeenCalledWith({
        where: {
          category: 'ACCOUNT',
          isActive: true,
        },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          category: true,
          question: true,
          answer: true,
        },
      });
    });

    it('해당 카테고리에 FAQ가 없으면 빈 배열을 반환해야 함', async () => {
      mockPrismaService.faq.findMany.mockResolvedValue([]);

      const result = await service.findByCategory('OTHER');

      expect(result).toEqual([]);
    });
  });

  describe('search', () => {
    it('검색어로 FAQ를 검색해야 함', async () => {
      mockPrismaService.faq.findMany.mockResolvedValue([mockFaq]);

      const result = await service.search('계정');

      expect(result).toHaveLength(1);
    });

    it('검색 결과가 없으면 빈 배열을 반환해야 함', async () => {
      mockPrismaService.faq.findMany.mockResolvedValue([]);

      const result = await service.search('없는검색어');

      expect(result).toEqual([]);
    });

    it('질문과 답변 모두에서 검색해야 함', async () => {
      mockPrismaService.faq.findMany.mockResolvedValue([]);

      await service.search('테스트');

      expect(mockPrismaService.faq.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          OR: [
            { question: { contains: '테스트', mode: 'insensitive' } },
            { answer: { contains: '테스트', mode: 'insensitive' } },
          ],
        },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          category: true,
          question: true,
          answer: true,
        },
      });
    });
  });
});
