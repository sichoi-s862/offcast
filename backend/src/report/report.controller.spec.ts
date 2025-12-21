import { Test, TestingModule } from '@nestjs/testing';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';

/**
 * 신고 컨트롤러 테스트
 */
describe('ReportController', () => {
  let controller: ReportController;

  // Mock 데이터
  const mockUser = {
    id: 'user-1',
    nickname: '테스트유저',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockReport = {
    id: 'report-1',
    reporterId: 'user-1',
    targetType: 'POST',
    targetId: 'post-1',
    reason: 'SPAM',
    description: '스팸 게시글입니다',
    status: 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Mock Services
  const mockReportService = {
    create: jest.fn(),
    findMyReports: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportController],
      providers: [{ provide: ReportService, useValue: mockReportService }],
    }).compile();

    controller = module.get<ReportController>(ReportController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('신고를 생성해야 함', async () => {
      mockReportService.create.mockResolvedValue(mockReport);

      const result = await controller.create(mockUser as any, {
        targetType: 'POST',
        targetId: 'post-1',
        reason: 'SPAM',
        description: '스팸 게시글입니다',
      });

      expect(result.message).toBe('신고가 접수되었습니다.');
      expect(result.reportId).toBe('report-1');
      expect(mockReportService.create).toHaveBeenCalledWith('user-1', {
        targetType: 'POST',
        targetId: 'post-1',
        reason: 'SPAM',
        description: '스팸 게시글입니다',
      });
    });

    it('댓글 신고를 생성해야 함', async () => {
      const commentReport = { ...mockReport, targetType: 'COMMENT', targetId: 'comment-1' };
      mockReportService.create.mockResolvedValue(commentReport);

      const result = await controller.create(mockUser as any, {
        targetType: 'COMMENT',
        targetId: 'comment-1',
        reason: 'HARASSMENT',
        description: '괴롭힘 댓글입니다',
      });

      expect(result.message).toBe('신고가 접수되었습니다.');
    });

    it('사용자 신고를 생성해야 함', async () => {
      const userReport = { ...mockReport, targetType: 'USER', targetId: 'user-2' };
      mockReportService.create.mockResolvedValue(userReport);

      const result = await controller.create(mockUser as any, {
        targetType: 'USER',
        targetId: 'user-2',
        reason: 'INAPPROPRIATE',
      });

      expect(result.message).toBe('신고가 접수되었습니다.');
    });
  });

  describe('findMyReports', () => {
    it('내 신고 목록을 조회해야 함', async () => {
      mockReportService.findMyReports.mockResolvedValue({
        reports: [mockReport],
        total: 1,
        page: 1,
        limit: 20,
      });

      const result = await controller.findMyReports(mockUser as any);

      expect(result.reports).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockReportService.findMyReports).toHaveBeenCalledWith(
        'user-1',
        1,
        20,
      );
    });

    it('페이지네이션을 적용해야 함', async () => {
      mockReportService.findMyReports.mockResolvedValue({
        reports: [],
        total: 0,
        page: 2,
        limit: 10,
      });

      await controller.findMyReports(mockUser as any, '2', '10');

      expect(mockReportService.findMyReports).toHaveBeenCalledWith(
        'user-1',
        2,
        10,
      );
    });

    it('신고가 없으면 빈 배열을 반환해야 함', async () => {
      mockReportService.findMyReports.mockResolvedValue({
        reports: [],
        total: 0,
        page: 1,
        limit: 20,
      });

      const result = await controller.findMyReports(mockUser as any);

      expect(result.reports).toEqual([]);
      expect(result.total).toBe(0);
    });
  });
});
