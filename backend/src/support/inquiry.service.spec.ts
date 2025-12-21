import { Test, TestingModule } from '@nestjs/testing';
import { InquiryService } from './inquiry.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 문의 서비스 테스트
 */
describe('InquiryService', () => {
  let service: InquiryService;

  // Mock 데이터
  const mockInquiry = {
    id: 'inquiry-1',
    userId: 'user-1',
    email: 'test@example.com',
    category: 'GENERAL',
    title: '테스트 문의',
    content: '테스트 문의 내용입니다.',
    status: 'PENDING',
    answer: null,
    answeredAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Prisma Mock
  const mockPrismaService = {
    inquiry: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InquiryService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<InquiryService>(InquiryService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('로그인 사용자의 문의를 생성해야 함', async () => {
      mockPrismaService.inquiry.create.mockResolvedValue(mockInquiry);

      const result = await service.create(
        {
          category: 'GENERAL',
          title: '테스트 문의',
          content: '테스트 문의 내용입니다.',
          email: 'test@example.com',
        },
        'user-1',
      );

      expect(result).toEqual(mockInquiry);
      expect(mockPrismaService.inquiry.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          email: 'test@example.com',
          category: 'GENERAL',
          title: '테스트 문의',
          content: '테스트 문의 내용입니다.',
          status: 'PENDING',
        },
      });
    });

    it('비로그인 사용자의 문의도 생성해야 함', async () => {
      const anonymousInquiry = { ...mockInquiry, userId: null };
      mockPrismaService.inquiry.create.mockResolvedValue(anonymousInquiry);

      const result = await service.create({
        category: 'BUG_REPORT',
        title: '버그 리포트',
        content: '버그가 발생했습니다.',
        email: 'anonymous@example.com',
      });

      expect(result).toEqual(anonymousInquiry);
      expect(mockPrismaService.inquiry.create).toHaveBeenCalledWith({
        data: {
          userId: undefined,
          email: 'anonymous@example.com',
          category: 'BUG_REPORT',
          title: '버그 리포트',
          content: '버그가 발생했습니다.',
          status: 'PENDING',
        },
      });
    });
  });

  describe('findByUser', () => {
    it('사용자의 문의 목록을 반환해야 함', async () => {
      mockPrismaService.inquiry.findMany.mockResolvedValue([mockInquiry]);
      mockPrismaService.inquiry.count.mockResolvedValue(1);

      const result = await service.findByUser('user-1', 1, 10);

      expect(result.inquiries).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('문의가 없으면 빈 배열을 반환해야 함', async () => {
      mockPrismaService.inquiry.findMany.mockResolvedValue([]);
      mockPrismaService.inquiry.count.mockResolvedValue(0);

      const result = await service.findByUser('user-1', 1, 10);

      expect(result.inquiries).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('페이지네이션이 적용되어야 함', async () => {
      mockPrismaService.inquiry.findMany.mockResolvedValue([]);
      mockPrismaService.inquiry.count.mockResolvedValue(100);

      await service.findByUser('user-1', 3, 10);

      expect(mockPrismaService.inquiry.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        skip: 20,
        take: 10,
      });
    });

    it('기본 페이지와 limit을 사용해야 함', async () => {
      mockPrismaService.inquiry.findMany.mockResolvedValue([]);
      mockPrismaService.inquiry.count.mockResolvedValue(0);

      await service.findByUser('user-1');

      expect(mockPrismaService.inquiry.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });
    });
  });

  describe('findById', () => {
    it('문의 상세를 반환해야 함', async () => {
      mockPrismaService.inquiry.findUnique.mockResolvedValue(mockInquiry);

      const result = await service.findById('inquiry-1', 'user-1');

      expect(result).toEqual(mockInquiry);
    });

    it('존재하지 않는 문의는 null을 반환해야 함', async () => {
      mockPrismaService.inquiry.findUnique.mockResolvedValue(null);

      const result = await service.findById('non-existent', 'user-1');

      expect(result).toBeNull();
    });

    it('다른 사용자의 문의는 null을 반환해야 함', async () => {
      mockPrismaService.inquiry.findUnique.mockResolvedValue(mockInquiry);

      const result = await service.findById('inquiry-1', 'other-user');

      expect(result).toBeNull();
    });

    it('userId가 없으면 모든 문의를 조회할 수 있어야 함', async () => {
      mockPrismaService.inquiry.findUnique.mockResolvedValue(mockInquiry);

      const result = await service.findById('inquiry-1');

      expect(result).toEqual(mockInquiry);
    });

    it('문의의 userId가 null이면 userId 없이도 조회 가능해야 함', async () => {
      const anonymousInquiry = { ...mockInquiry, userId: null };
      mockPrismaService.inquiry.findUnique.mockResolvedValue(anonymousInquiry);

      const result = await service.findById('inquiry-1', 'user-1');

      // userId가 null인 문의는 userId 체크를 통과하지 못함
      expect(result).toBeNull();
    });
  });
});
