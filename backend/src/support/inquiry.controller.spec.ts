import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { InquiryController } from './inquiry.controller';
import { InquiryService } from './inquiry.service';

/**
 * 문의 컨트롤러 테스트
 */
describe('InquiryController', () => {
  let controller: InquiryController;

  // Mock 데이터
  const mockUser = {
    id: 'user-1',
    nickname: '테스트유저',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

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

  // Mock Services
  const mockInquiryService = {
    create: jest.fn(),
    findByUser: jest.fn(),
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InquiryController],
      providers: [{ provide: InquiryService, useValue: mockInquiryService }],
    }).compile();

    controller = module.get<InquiryController>(InquiryController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('문의를 생성해야 함', async () => {
      mockInquiryService.create.mockResolvedValue(mockInquiry);

      const result = await controller.create(mockUser as any, {
        category: 'GENERAL',
        title: '테스트 문의',
        content: '테스트 문의 내용입니다.',
        email: 'test@example.com',
      });

      expect(result.message).toBe('문의가 접수되었습니다.');
      expect(result.inquiry.id).toBe('inquiry-1');
      expect(result.inquiry.status).toBe('PENDING');
      expect(mockInquiryService.create).toHaveBeenCalledWith(
        {
          category: 'GENERAL',
          title: '테스트 문의',
          content: '테스트 문의 내용입니다.',
          email: 'test@example.com',
        },
        'user-1',
      );
    });
  });

  describe('createGuest', () => {
    it('비회원 문의를 생성해야 함', async () => {
      const guestInquiry = { ...mockInquiry, userId: null };
      mockInquiryService.create.mockResolvedValue(guestInquiry);

      const result = await controller.createGuest({
        category: 'BUG_REPORT',
        title: '버그 리포트',
        content: '버그가 발생했습니다.',
        email: 'guest@example.com',
      });

      expect(result.message).toBe('문의가 접수되었습니다.');
      expect(mockInquiryService.create).toHaveBeenCalledWith({
        category: 'BUG_REPORT',
        title: '버그 리포트',
        content: '버그가 발생했습니다.',
        email: 'guest@example.com',
      });
    });

    it('이메일 없이 비회원 문의하면 BAD_REQUEST를 반환해야 함', async () => {
      const result = await controller.createGuest({
        category: 'GENERAL',
        title: '테스트',
        content: '내용',
      });

      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(result.message).toBe('이메일을 입력해주세요.');
    });
  });

  describe('findMyInquiries', () => {
    it('내 문의 목록을 조회해야 함', async () => {
      mockInquiryService.findByUser.mockResolvedValue({
        inquiries: [mockInquiry],
        total: 1,
        page: 1,
        limit: 10,
      });

      const result = await controller.findMyInquiries(mockUser as any);

      expect(result.inquiries).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockInquiryService.findByUser).toHaveBeenCalledWith(
        'user-1',
        1,
        10,
      );
    });

    it('페이지네이션을 적용해야 함', async () => {
      mockInquiryService.findByUser.mockResolvedValue({
        inquiries: [],
        total: 0,
        page: 2,
        limit: 5,
      });

      await controller.findMyInquiries(mockUser as any, '2', '5');

      expect(mockInquiryService.findByUser).toHaveBeenCalledWith(
        'user-1',
        2,
        5,
      );
    });

    it('문의가 없으면 빈 배열을 반환해야 함', async () => {
      mockInquiryService.findByUser.mockResolvedValue({
        inquiries: [],
        total: 0,
        page: 1,
        limit: 10,
      });

      const result = await controller.findMyInquiries(mockUser as any);

      expect(result.inquiries).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('findById', () => {
    it('문의 상세를 조회해야 함', async () => {
      mockInquiryService.findById.mockResolvedValue(mockInquiry);

      const result = await controller.findById(mockUser as any, 'inquiry-1');

      expect(result.inquiry).toEqual(mockInquiry);
      expect(mockInquiryService.findById).toHaveBeenCalledWith(
        'inquiry-1',
        'user-1',
      );
    });

    it('존재하지 않는 문의는 NOT_FOUND를 반환해야 함', async () => {
      mockInquiryService.findById.mockResolvedValue(null);

      const result = await controller.findById(
        mockUser as any,
        'non-existent',
      );

      expect(result.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(result.message).toBe('문의를 찾을 수 없습니다.');
    });

    it('다른 사용자의 문의는 NOT_FOUND를 반환해야 함', async () => {
      // findById 서비스에서 다른 사용자의 문의는 null을 반환함
      mockInquiryService.findById.mockResolvedValue(null);

      const result = await controller.findById(mockUser as any, 'inquiry-2');

      expect(result.statusCode).toBe(HttpStatus.NOT_FOUND);
    });
  });
});
