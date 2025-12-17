import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Comment, CommentStatus, Prisma } from '@prisma/client';
import { CreateCommentDto, UpdateCommentDto, GetCommentsQueryDto } from './dto/comment.dto';

/**
 * 댓글 목록 응답 인터페이스
 */
export interface CommentListResponse {
  comments: CommentWithReplies[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 답글 포함 댓글 타입
 */
export type CommentWithReplies = Prisma.CommentGetPayload<{
  include: {
    author: {
      select: { id: true; nickname: true };
    };
    replies: {
      include: {
        author: {
          select: { id: true; nickname: true };
        };
        _count: {
          select: { likes: true };
        };
      };
    };
    _count: {
      select: { likes: true };
    };
  };
}>;

/**
 * 댓글 서비스
 * - 댓글/답글 CRUD, 좋아요 관리
 */
@Injectable()
export class CommentService {
  constructor(private prisma: PrismaService) {}

  /**
   * 게시글의 댓글 목록 조회 (답글 포함)
   */
  async findByPostId(query: GetCommentsQueryDto): Promise<CommentListResponse> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(50, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.CommentWhereInput = {
      postId: query.postId,
      parentId: null, // 최상위 댓글만
      status: CommentStatus.ACTIVE,
      deletedAt: null,
    };

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
        include: {
          author: {
            select: { id: true, nickname: true },
          },
          replies: {
            where: {
              status: CommentStatus.ACTIVE,
              deletedAt: null,
            },
            orderBy: { createdAt: 'asc' },
            include: {
              author: {
                select: { id: true, nickname: true },
              },
              _count: {
                select: { likes: true },
              },
            },
          },
          _count: {
            select: { likes: true },
          },
        },
      }),
      this.prisma.comment.count({ where }),
    ]);

    return {
      comments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 댓글 상세 조회
   */
  async findById(id: string): Promise<Comment | null> {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, nickname: true },
        },
        _count: {
          select: { likes: true },
        },
      },
    });

    if (comment && (comment.deletedAt || comment.status !== CommentStatus.ACTIVE)) {
      return null;
    }

    return comment;
  }

  /**
   * 댓글 생성
   */
  async create(authorId: string, dto: CreateCommentDto): Promise<Comment> {
    // 게시글 존재 확인
    const post = await this.prisma.post.findUnique({
      where: { id: dto.postId },
    });

    if (!post || post.deletedAt) {
      throw new NotFoundException('게시글을 찾을 수 없습니다');
    }

    // 답글인 경우 부모 댓글 확인
    if (dto.parentId) {
      const parent = await this.prisma.comment.findUnique({
        where: { id: dto.parentId },
      });

      if (!parent || parent.deletedAt) {
        throw new NotFoundException('부모 댓글을 찾을 수 없습니다');
      }

      // 2단계까지만 허용 (댓글 -> 답글)
      if (parent.parentId) {
        throw new BadRequestException('답글에는 답글을 달 수 없습니다');
      }

      // 같은 게시글인지 확인
      if (parent.postId !== dto.postId) {
        throw new BadRequestException('게시글 ID가 일치하지 않습니다');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // 댓글 생성
      const comment = await tx.comment.create({
        data: {
          postId: dto.postId,
          authorId,
          parentId: dto.parentId,
          content: dto.content,
          imageUrl: dto.imageUrl,
          imageKey: dto.imageKey,
        },
        include: {
          author: {
            select: { id: true, nickname: true },
          },
          _count: {
            select: { likes: true },
          },
        },
      });

      // 게시글의 댓글 수 증가
      await tx.post.update({
        where: { id: dto.postId },
        data: { commentCount: { increment: 1 } },
      });

      return comment;
    });
  }

  /**
   * 댓글 수정
   */
  async update(
    id: string,
    authorId: string,
    dto: UpdateCommentDto,
  ): Promise<Comment> {
    const comment = await this.findById(id);

    if (!comment) {
      throw new NotFoundException('댓글을 찾을 수 없습니다');
    }

    if (comment.authorId !== authorId) {
      throw new ForbiddenException('수정 권한이 없습니다');
    }

    return this.prisma.comment.update({
      where: { id },
      data: { content: dto.content },
    });
  }

  /**
   * 댓글 삭제 (소프트 삭제)
   */
  async delete(id: string, authorId: string): Promise<void> {
    const comment = await this.findById(id);

    if (!comment) {
      throw new NotFoundException('댓글을 찾을 수 없습니다');
    }

    if (comment.authorId !== authorId) {
      throw new ForbiddenException('삭제 권한이 없습니다');
    }

    await this.prisma.$transaction(async (tx) => {
      // 소프트 삭제
      await tx.comment.update({
        where: { id },
        data: {
          status: CommentStatus.DELETED,
          deletedAt: new Date(),
        },
      });

      // 게시글의 댓글 수 감소
      await tx.post.update({
        where: { id: comment.postId },
        data: { commentCount: { decrement: 1 } },
      });
    });
  }

  /**
   * 좋아요 토글
   */
  async toggleLike(commentId: string, userId: string): Promise<{ liked: boolean; likeCount: number }> {
    const existingLike = await this.prisma.commentLike.findUnique({
      where: {
        commentId_userId: { commentId, userId },
      },
    });

    let updatedComment;

    if (existingLike) {
      // 좋아요 취소
      const [, comment] = await this.prisma.$transaction([
        this.prisma.commentLike.delete({
          where: { id: existingLike.id },
        }),
        this.prisma.comment.update({
          where: { id: commentId },
          data: { likeCount: { decrement: 1 } },
        }),
      ]);
      updatedComment = comment;
      return { liked: false, likeCount: updatedComment.likeCount };
    } else {
      // 좋아요 추가
      const [, comment] = await this.prisma.$transaction([
        this.prisma.commentLike.create({
          data: { commentId, userId },
        }),
        this.prisma.comment.update({
          where: { id: commentId },
          data: { likeCount: { increment: 1 } },
        }),
      ]);
      updatedComment = comment;
      return { liked: true, likeCount: updatedComment.likeCount };
    }
  }

  /**
   * 사용자의 좋아요 여부 확인
   */
  async hasUserLiked(commentId: string, userId: string): Promise<boolean> {
    const like = await this.prisma.commentLike.findUnique({
      where: {
        commentId_userId: { commentId, userId },
      },
    });
    return !!like;
  }

  /**
   * 게시글의 총 댓글 수 조회
   */
  async getCommentCount(postId: string): Promise<number> {
    return this.prisma.comment.count({
      where: {
        postId,
        status: CommentStatus.ACTIVE,
        deletedAt: null,
      },
    });
  }

  /**
   * 작성자 정보 문자열 생성
   * - 프론트엔드 AuthorDisplay 컴포넌트용
   */
  async getAuthorInfo(commentId: string): Promise<string | null> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        author: {
          include: {
            accounts: {
              take: 1,
              orderBy: { subscriberCount: 'desc' },
            },
          },
        },
      },
    });

    if (!comment || !comment.author.accounts[0]) {
      return null;
    }

    const account = comment.author.accounts[0];
    const nickname = comment.author.nickname || account.profileName || '익명';
    const subscriberCount = account.subscriberCount || 0;
    const formattedCount = this.formatSubscriberCount(subscriberCount);

    return `${account.provider.toLowerCase()}|${nickname}|${formattedCount}`;
  }

  /**
   * 구독자 수 포맷팅
   */
  private formatSubscriberCount(count: number): string {
    if (count >= 10000) {
      return `${Math.floor(count / 10000)}만`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}천`;
    }
    return count.toString();
  }
}
