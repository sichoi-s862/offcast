import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Post, PostStatus, Prisma } from '@prisma/client';
import { CreatePostDto, UpdatePostDto, GetPostsQueryDto } from './dto/post.dto';

/**
 * 게시글 목록 응답 인터페이스
 */
export interface PostListResponse {
  posts: Post[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 게시글 상세 응답 타입
 */
export type PostWithDetails = Prisma.PostGetPayload<{
  include: {
    author: {
      select: {
        id: true;
        nickname: true;
        accounts: {
          select: {
            provider: true;
            subscriberCount: true;
          };
        };
      };
    };
    channel: true;
    images: true;
    hashtags: {
      include: { hashtag: true };
    };
    _count: {
      select: { comments: true; likes: true };
    };
  };
}>;

/**
 * 게시글 서비스
 * - 게시글 CRUD, 좋아요, 조회수 관리
 */
@Injectable()
export class PostService {
  constructor(private prisma: PrismaService) {}

  /**
   * 게시글 목록 조회
   */
  async findAll(query: GetPostsQueryDto, accessibleChannelIds?: string[]): Promise<PostListResponse> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(50, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    // 필터 조건 구성
    const where: Prisma.PostWhereInput = {
      status: PostStatus.ACTIVE,
      deletedAt: null,
    };

    // 채널 필터
    if (query.channelId) {
      where.channelId = query.channelId;
    } else if (accessibleChannelIds && accessibleChannelIds.length > 0) {
      // 접근 가능한 채널만 필터링
      where.channelId = { in: accessibleChannelIds };
    }

    // 키워드 검색 (제목, 내용)
    if (query.keyword) {
      where.OR = [
        { title: { contains: query.keyword, mode: 'insensitive' } },
        { content: { contains: query.keyword, mode: 'insensitive' } },
      ];
    }

    // 해시태그 필터
    if (query.hashtag) {
      where.hashtags = {
        some: {
          hashtag: {
            name: query.hashtag.replace(/^#/, ''),
          },
        },
      };
    }

    // 인기순: 시간 감쇠 적용 (별도 처리)
    if (query.sort === 'popular') {
      return this.findAllPopular(where, page, limit, skip);
    }

    // 정렬 조건
    let orderBy: Prisma.PostOrderByWithRelationInput;
    switch (query.sort) {
      case 'views':
        orderBy = { viewCount: 'desc' };
        break;
      case 'latest':
      default:
        orderBy = { createdAt: 'desc' };
    }

    // 병렬로 데이터와 총 개수 조회
    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          author: {
            select: {
              id: true,
              nickname: true,
              accounts: {
                select: {
                  provider: true,
                  subscriberCount: true,
                },
              },
            },
          },
          channel: true,
          images: {
            orderBy: { order: 'asc' },
            take: 1, // 목록에서는 첫 번째 이미지만
          },
          hashtags: {
            include: { hashtag: true },
          },
          _count: {
            select: { comments: true, likes: true },
          },
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      posts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // 인기순 캐시 (5분)
  private popularCache: {
    data: PostListResponse | null;
    timestamp: number;
  } = { data: null, timestamp: 0 };
  private readonly POPULAR_CACHE_TTL = 5 * 60 * 1000; // 5분

  /**
   * 인기순 조회 (시간 감쇠 적용, 5분 캐싱)
   * 점수 = 좋아요 / (경과시간(시간) + 2)^1.5
   */
  private async findAllPopular(
    where: Prisma.PostWhereInput,
    page: number,
    limit: number,
    skip: number,
  ): Promise<PostListResponse> {
    const now = Date.now();

    // 캐시 확인 (첫 페이지만 캐싱)
    if (
      page === 1 &&
      this.popularCache.data &&
      now - this.popularCache.timestamp < this.POPULAR_CACHE_TTL
    ) {
      return this.popularCache.data;
    }

    // 전체 데이터 조회 (점수 계산을 위해)
    const [allPosts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              nickname: true,
              accounts: {
                select: {
                  provider: true,
                  subscriberCount: true,
                },
              },
            },
          },
          channel: true,
          images: {
            orderBy: { order: 'asc' },
            take: 1,
          },
          hashtags: {
            include: { hashtag: true },
          },
          _count: {
            select: { comments: true, likes: true },
          },
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    // 시간 감쇠 점수 계산 및 정렬
    const postsWithScore = allPosts.map((post) => {
      const hoursAgo = (now - new Date(post.createdAt).getTime()) / (1000 * 60 * 60);
      // 점수 = 좋아요 / (경과시간 + 2)^1.2
      // +2는 최신 글이 0으로 나눠지는 것 방지 및 초기 부스트
      // ^1.2는 완만한 감쇠 (초기 커뮤니티에 적합)
      const score = post.likeCount / Math.pow(hoursAgo + 2, 1.2);
      return { ...post, _popularityScore: score };
    });

    // 점수순 정렬
    postsWithScore.sort((a, b) => b._popularityScore - a._popularityScore);

    // 페이지네이션 적용
    const paginatedPosts = postsWithScore.slice(skip, skip + limit);

    // _popularityScore 필드 제거
    const posts = paginatedPosts.map(({ _popularityScore, ...post }) => post);

    const result = {
      posts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    // 첫 페이지는 캐싱
    if (page === 1) {
      this.popularCache = { data: result, timestamp: now };
    }

    return result;
  }

  /**
   * 특정 사용자의 게시글 목록 조회
   */
  async findByAuthor(
    authorId: string,
    options: { page?: number; limit?: number } = {},
  ): Promise<PostListResponse> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, Math.max(1, options.limit || 15));
    const skip = (page - 1) * limit;

    const where: Prisma.PostWhereInput = {
      authorId,
      status: PostStatus.ACTIVE,
      deletedAt: null,
    };

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          author: {
            select: {
              id: true,
              nickname: true,
              accounts: {
                select: {
                  provider: true,
                  subscriberCount: true,
                },
              },
            },
          },
          channel: true,
          images: {
            orderBy: { order: 'asc' },
            take: 1,
          },
          hashtags: {
            include: { hashtag: true },
          },
          _count: {
            select: { comments: true, likes: true },
          },
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      posts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 게시글 상세 조회
   */
  async findById(id: string): Promise<PostWithDetails | null> {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            nickname: true,
            accounts: {
              select: {
                provider: true,
                subscriberCount: true,
              },
            },
          },
        },
        channel: true,
        images: {
          orderBy: { order: 'asc' },
        },
        hashtags: {
          include: { hashtag: true },
        },
        _count: {
          select: { comments: true, likes: true },
        },
      },
    });

    // 삭제된 게시글 체크
    if (post && (post.deletedAt || post.status !== PostStatus.ACTIVE)) {
      return null;
    }

    return post;
  }

  /**
   * 게시글 생성
   */
  async create(authorId: string, dto: CreatePostDto): Promise<Post> {
    return this.prisma.$transaction(async (tx) => {
      // 1. 게시글 생성
      const post = await tx.post.create({
        data: {
          authorId,
          channelId: dto.channelId,
          title: dto.title,
          content: dto.content,
        },
      });

      // 2. 이미지 연결
      if (dto.imageUrls && dto.imageKeys && dto.imageUrls.length > 0) {
        await tx.postImage.createMany({
          data: dto.imageUrls.map((url, index) => ({
            postId: post.id,
            url,
            key: dto.imageKeys![index] || '',
            order: index,
          })),
        });
      }

      // 3. 해시태그 처리
      if (dto.hashtags && dto.hashtags.length > 0) {
        for (const tagName of dto.hashtags) {
          const normalizedName = tagName.replace(/^#/, '').toLowerCase();

          // 해시태그 생성 또는 조회
          const hashtag = await tx.hashtag.upsert({
            where: { name: normalizedName },
            create: { name: normalizedName, usageCount: 1 },
            update: { usageCount: { increment: 1 } },
          });

          // 게시글-해시태그 연결
          await tx.postHashtag.create({
            data: {
              postId: post.id,
              hashtagId: hashtag.id,
            },
          });
        }
      }

      return post;
    });
  }

  /**
   * 게시글 수정
   */
  async update(
    id: string,
    authorId: string,
    dto: UpdatePostDto,
  ): Promise<Post> {
    const post = await this.findById(id);

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId !== authorId) {
      throw new ForbiddenException('You do not have permission to edit this post');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. 게시글 기본 정보 수정
      const updated = await tx.post.update({
        where: { id },
        data: {
          title: dto.title,
          content: dto.content,
        },
      });

      // 2. 해시태그 수정
      if (dto.hashtags !== undefined) {
        // 기존 해시태그 사용 횟수 감소
        const existingTags = await tx.postHashtag.findMany({
          where: { postId: id },
          include: { hashtag: true },
        });

        for (const pt of existingTags) {
          await tx.hashtag.update({
            where: { id: pt.hashtagId },
            data: { usageCount: { decrement: 1 } },
          });
        }

        // 기존 연결 삭제
        await tx.postHashtag.deleteMany({ where: { postId: id } });

        // 새 해시태그 연결
        for (const tagName of dto.hashtags) {
          const normalizedName = tagName.replace(/^#/, '').toLowerCase();

          const hashtag = await tx.hashtag.upsert({
            where: { name: normalizedName },
            create: { name: normalizedName, usageCount: 1 },
            update: { usageCount: { increment: 1 } },
          });

          await tx.postHashtag.create({
            data: {
              postId: id,
              hashtagId: hashtag.id,
            },
          });
        }
      }

      return updated;
    });
  }

  /**
   * 게시글 삭제 (소프트 삭제)
   */
  async delete(id: string, authorId: string): Promise<void> {
    const post = await this.findById(id);

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId !== authorId) {
      throw new ForbiddenException('You do not have permission to delete this post');
    }

    await this.prisma.$transaction(async (tx) => {
      // 해시태그 사용 횟수 감소
      const postHashtags = await tx.postHashtag.findMany({
        where: { postId: id },
      });

      for (const pt of postHashtags) {
        await tx.hashtag.update({
          where: { id: pt.hashtagId },
          data: { usageCount: { decrement: 1 } },
        });
      }

      // 소프트 삭제
      await tx.post.update({
        where: { id },
        data: {
          status: PostStatus.DELETED,
          deletedAt: new Date(),
        },
      });
    });
  }

  /**
   * 조회수 증가
   */
  async incrementViewCount(id: string): Promise<void> {
    await this.prisma.post.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  }

  /**
   * 좋아요 토글
   */
  async toggleLike(postId: string, userId: string): Promise<{ liked: boolean; likeCount: number }> {
    const existingLike = await this.prisma.postLike.findUnique({
      where: {
        postId_userId: { postId, userId },
      },
    });

    let updatedPost;

    if (existingLike) {
      // 좋아요 취소
      const [, post] = await this.prisma.$transaction([
        this.prisma.postLike.delete({
          where: { id: existingLike.id },
        }),
        this.prisma.post.update({
          where: { id: postId },
          data: { likeCount: { decrement: 1 } },
        }),
      ]);
      updatedPost = post;
      return { liked: false, likeCount: updatedPost.likeCount };
    } else {
      // 좋아요 추가
      const [, post] = await this.prisma.$transaction([
        this.prisma.postLike.create({
          data: { postId, userId },
        }),
        this.prisma.post.update({
          where: { id: postId },
          data: { likeCount: { increment: 1 } },
        }),
      ]);
      updatedPost = post;
      return { liked: true, likeCount: updatedPost.likeCount };
    }
  }

  /**
   * 사용자의 좋아요 여부 확인
   */
  async hasUserLiked(postId: string, userId: string): Promise<boolean> {
    const like = await this.prisma.postLike.findUnique({
      where: {
        postId_userId: { postId, userId },
      },
    });
    return !!like;
  }

  /**
   * 작성자 정보 문자열 생성
   * - 프론트엔드 AuthorDisplay 컴포넌트용
   */
  async getAuthorInfo(postId: string): Promise<string | null> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
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

    if (!post || !post.author.accounts[0]) {
      return null;
    }

    const account = post.author.accounts[0];
    const nickname = post.author.nickname || account.profileName || 'Anonymous';
    const subscriberCount = account.subscriberCount || 0;
    const formattedCount = this.formatSubscriberCount(subscriberCount);

    return `${account.provider.toLowerCase()}|${nickname}|${formattedCount}`;
  }

  /**
   * 구독자 수 포맷팅
   */
  private formatSubscriberCount(count: number): string {
    if (count >= 1000000) {
      return `${Math.floor(count / 1000000)}M+`;
    } else if (count >= 1000) {
      return `${Math.floor(count / 1000)}K+`;
    }
    return `${count}+`;
  }
}
