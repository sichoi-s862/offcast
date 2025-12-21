import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ReportService } from './report.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 신고 서비스 테스트
 */
describe('ReportService', () => {
  let service: ReportService;

  // Mock 데이터
  const mockReport = {
    id: 'report-1',
    reporterId: 'user-1',
    targetType: 'POST',
    postId: 'post-1',
    commentId: null,
    targetUserId: null,
    reason: 'SPAM',
    detail: '스팸 게시글입니다.',
    status: 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPost = {
    id: 'post-1',
    authorId: 'user-2',
    title: '테스트 게시글',
    deletedAt: null,
  };

  const mockComment = {
    id: 'comment-1',
    authorId: 'user-2',
    content: '테스트 댓글',
    deletedAt: null,
  };

  const mockUser = {
    id: 'user-2',
    nickname: '테스트유저',
    deletedAt: null,
  };

  // Prisma Mock
  const mockPrismaService = {
    report: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    post: {
      findUnique: jest.fn(),
    },
    comment: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ReportService>(ReportService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('게시글 신고를 생성해야 함', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.report.findFirst.mockResolvedValue(null);
      mockPrismaService.report.create.mockResolvedValue(mockReport);

      const result = await service.create('user-1', {
        targetType: 'POST',
        postId: 'post-1',
        reason: 'SPAM',
        detail: '스팸 게시글입니다.',
      });

      expect(result).toEqual(mockReport);
    });

    it('댓글 신고를 생성해야 함', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue(mockComment);
      mockPrismaService.report.findFirst.mockResolvedValue(null);
      mockPrismaService.report.create.mockResolvedValue({
        ...mockReport,
        targetType: 'COMMENT',
        postId: null,
        commentId: 'comment-1',
      });

      const result = await service.create('user-1', {
        targetType: 'COMMENT',
        commentId: 'comment-1',
        reason: 'HARASSMENT',
      });

      expect(result.targetType).toBe('COMMENT');
    });

    it('사용자 신고를 생성해야 함', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.report.findFirst.mockResolvedValue(null);
      mockPrismaService.report.create.mockResolvedValue({
        ...mockReport,
        targetType: 'USER',
        postId: null,
        targetUserId: 'user-2',
      });

      const result = await service.create('user-1', {
        targetType: 'USER',
        targetUserId: 'user-2',
        reason: 'INAPPROPRIATE',
      });

      expect(result.targetType).toBe('USER');
    });

    it('이미 신고한 대상은 ConflictException을 던져야 함', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.report.findFirst.mockResolvedValue(mockReport);

      await expect(
        service.create('user-1', {
          targetType: 'POST',
          postId: 'post-1',
          reason: 'SPAM',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('자기 자신을 신고하면 BadRequestException을 던져야 함', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        id: 'user-1',
      });
      mockPrismaService.report.findFirst.mockResolvedValue(null);

      await expect(
        service.create('user-1', {
          targetType: 'USER',
          targetUserId: 'user-1',
          reason: 'SPAM',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('자신의 게시글을 신고하면 BadRequestException을 던져야 함', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue({
        ...mockPost,
        authorId: 'user-1',
      });
      mockPrismaService.report.findFirst.mockResolvedValue(null);

      await expect(
        service.create('user-1', {
          targetType: 'POST',
          postId: 'post-1',
          reason: 'SPAM',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('자신의 댓글을 신고하면 BadRequestException을 던져야 함', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue({
        ...mockComment,
        authorId: 'user-1',
      });
      mockPrismaService.report.findFirst.mockResolvedValue(null);

      await expect(
        service.create('user-1', {
          targetType: 'COMMENT',
          commentId: 'comment-1',
          reason: 'SPAM',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('게시글 신고 시 postId가 없으면 BadRequestException을 던져야 함', async () => {
      await expect(
        service.create('user-1', {
          targetType: 'POST',
          reason: 'SPAM',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('댓글 신고 시 commentId가 없으면 BadRequestException을 던져야 함', async () => {
      await expect(
        service.create('user-1', {
          targetType: 'COMMENT',
          reason: 'SPAM',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('사용자 신고 시 targetUserId가 없으면 BadRequestException을 던져야 함', async () => {
      await expect(
        service.create('user-1', {
          targetType: 'USER',
          reason: 'SPAM',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('존재하지 않는 게시글을 신고하면 NotFoundException을 던져야 함', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(null);

      await expect(
        service.create('user-1', {
          targetType: 'POST',
          postId: 'non-existent',
          reason: 'SPAM',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('삭제된 게시글을 신고하면 NotFoundException을 던져야 함', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue({
        ...mockPost,
        deletedAt: new Date(),
      });

      await expect(
        service.create('user-1', {
          targetType: 'POST',
          postId: 'post-1',
          reason: 'SPAM',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('존재하지 않는 댓글을 신고하면 NotFoundException을 던져야 함', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue(null);

      await expect(
        service.create('user-1', {
          targetType: 'COMMENT',
          commentId: 'non-existent',
          reason: 'SPAM',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('삭제된 댓글을 신고하면 NotFoundException을 던져야 함', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue({
        ...mockComment,
        deletedAt: new Date(),
      });

      await expect(
        service.create('user-1', {
          targetType: 'COMMENT',
          commentId: 'comment-1',
          reason: 'SPAM',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('존재하지 않는 사용자를 신고하면 NotFoundException을 던져야 함', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.create('user-1', {
          targetType: 'USER',
          targetUserId: 'non-existent',
          reason: 'SPAM',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('탈퇴한 사용자를 신고하면 NotFoundException을 던져야 함', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        deletedAt: new Date(),
      });

      await expect(
        service.create('user-1', {
          targetType: 'USER',
          targetUserId: 'user-2',
          reason: 'SPAM',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findMyReports', () => {
    it('내 신고 목록을 반환해야 함', async () => {
      mockPrismaService.report.findMany.mockResolvedValue([mockReport]);
      mockPrismaService.report.count.mockResolvedValue(1);

      const result = await service.findMyReports('user-1', 1, 20);

      expect(result.reports).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('신고 내역이 없으면 빈 배열을 반환해야 함', async () => {
      mockPrismaService.report.findMany.mockResolvedValue([]);
      mockPrismaService.report.count.mockResolvedValue(0);

      const result = await service.findMyReports('user-1', 1, 20);

      expect(result.reports).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('페이지네이션이 적용되어야 함', async () => {
      mockPrismaService.report.findMany.mockResolvedValue([]);
      mockPrismaService.report.count.mockResolvedValue(100);

      await service.findMyReports('user-1', 2, 10);

      expect(mockPrismaService.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
    });
  });
});
