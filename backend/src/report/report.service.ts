import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { Report, ReportTargetType } from '@prisma/client';

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  /**
   * 신고 생성
   */
  async create(reporterId: string, dto: CreateReportDto): Promise<Report> {
    // 신고 대상 유효성 검증
    await this.validateReportTarget(dto);

    // 중복 신고 확인
    const existingReport = await this.findExistingReport(reporterId, dto);
    if (existingReport) {
      throw new ConflictException('이미 신고한 대상입니다.');
    }

    // 자기 자신 신고 방지
    if (dto.targetType === ReportTargetType.USER && dto.targetUserId === reporterId) {
      throw new BadRequestException('자기 자신을 신고할 수 없습니다.');
    }

    // 게시글/댓글 작성자 자기 신고 방지
    if (dto.targetType === ReportTargetType.POST && dto.postId) {
      const post = await this.prisma.post.findUnique({
        where: { id: dto.postId },
        select: { authorId: true },
      });
      if (post?.authorId === reporterId) {
        throw new BadRequestException('자신의 게시글을 신고할 수 없습니다.');
      }
    }

    if (dto.targetType === ReportTargetType.COMMENT && dto.commentId) {
      const comment = await this.prisma.comment.findUnique({
        where: { id: dto.commentId },
        select: { authorId: true },
      });
      if (comment?.authorId === reporterId) {
        throw new BadRequestException('자신의 댓글을 신고할 수 없습니다.');
      }
    }

    return this.prisma.report.create({
      data: {
        reporterId,
        targetType: dto.targetType,
        postId: dto.postId,
        commentId: dto.commentId,
        targetUserId: dto.targetUserId,
        reason: dto.reason,
        detail: dto.detail,
      },
    });
  }

  /**
   * 신고 대상 유효성 검증
   */
  private async validateReportTarget(dto: CreateReportDto): Promise<void> {
    switch (dto.targetType) {
      case ReportTargetType.POST:
        if (!dto.postId) {
          throw new BadRequestException('게시글 ID가 필요합니다.');
        }
        const post = await this.prisma.post.findUnique({
          where: { id: dto.postId },
        });
        if (!post || post.deletedAt) {
          throw new NotFoundException('게시글을 찾을 수 없습니다.');
        }
        break;

      case ReportTargetType.COMMENT:
        if (!dto.commentId) {
          throw new BadRequestException('댓글 ID가 필요합니다.');
        }
        const comment = await this.prisma.comment.findUnique({
          where: { id: dto.commentId },
        });
        if (!comment || comment.deletedAt) {
          throw new NotFoundException('댓글을 찾을 수 없습니다.');
        }
        break;

      case ReportTargetType.USER:
        if (!dto.targetUserId) {
          throw new BadRequestException('사용자 ID가 필요합니다.');
        }
        const user = await this.prisma.user.findUnique({
          where: { id: dto.targetUserId },
        });
        if (!user || user.deletedAt) {
          throw new NotFoundException('사용자를 찾을 수 없습니다.');
        }
        break;
    }
  }

  /**
   * 기존 신고 확인
   */
  private async findExistingReport(
    reporterId: string,
    dto: CreateReportDto,
  ): Promise<Report | null> {
    return this.prisma.report.findFirst({
      where: {
        reporterId,
        targetType: dto.targetType,
        postId: dto.postId || null,
        commentId: dto.commentId || null,
        targetUserId: dto.targetUserId || null,
      },
    });
  }

  /**
   * 내 신고 목록 조회
   */
  async findMyReports(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ reports: Report[]; total: number }> {
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where: { reporterId: userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.report.count({
        where: { reporterId: userId },
      }),
    ]);

    return { reports, total };
  }
}
