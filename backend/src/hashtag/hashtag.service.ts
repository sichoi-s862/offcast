import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Hashtag, Prisma } from '@prisma/client';

/**
 * 해시태그 검색 결과 인터페이스
 */
export interface HashtagSearchResult {
  hashtags: Hashtag[];
  total: number;
}

/**
 * 인기 해시태그 인터페이스
 */
export interface PopularHashtag {
  id: string;
  name: string;
  usageCount: number;
}

/**
 * 해시태그 서비스
 * - 해시태그 검색, 인기 해시태그 조회
 */
@Injectable()
export class HashtagService {
  constructor(private prisma: PrismaService) {}

  /**
   * 해시태그 검색 (자동완성용)
   * - 입력된 키워드로 시작하는 해시태그 검색
   */
  async search(keyword: string, limit: number = 10): Promise<HashtagSearchResult> {
    // # 제거 및 소문자 변환
    const normalizedKeyword = keyword.replace(/^#/, '').toLowerCase();

    if (!normalizedKeyword) {
      return { hashtags: [], total: 0 };
    }

    const where: Prisma.HashtagWhereInput = {
      name: {
        startsWith: normalizedKeyword,
        mode: 'insensitive',
      },
      usageCount: { gt: 0 }, // 사용된 적 있는 것만
    };

    const [hashtags, total] = await Promise.all([
      this.prisma.hashtag.findMany({
        where,
        orderBy: { usageCount: 'desc' },
        take: Math.min(limit, 20),
      }),
      this.prisma.hashtag.count({ where }),
    ]);

    return { hashtags, total };
  }

  /**
   * 인기 해시태그 목록 조회
   */
  async getPopular(limit: number = 10): Promise<PopularHashtag[]> {
    return this.prisma.hashtag.findMany({
      where: { usageCount: { gt: 0 } },
      orderBy: { usageCount: 'desc' },
      take: Math.min(limit, 50),
      select: {
        id: true,
        name: true,
        usageCount: true,
      },
    });
  }

  /**
   * 특정 해시태그로 게시글 검색
   */
  async getPostsByHashtag(
    hashtag: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const normalizedName = hashtag.replace(/^#/, '').toLowerCase();
    const skip = (page - 1) * limit;

    const hashtagRecord = await this.prisma.hashtag.findUnique({
      where: { name: normalizedName },
    });

    if (!hashtagRecord) {
      return {
        posts: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

    const where: Prisma.PostWhereInput = {
      hashtags: {
        some: { hashtagId: hashtagRecord.id },
      },
      status: 'ACTIVE',
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
            select: { id: true, nickname: true },
          },
          channel: true,
          images: {
            take: 1,
            orderBy: { order: 'asc' },
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
   * 해시태그 이름으로 조회
   */
  async findByName(name: string): Promise<Hashtag | null> {
    const normalizedName = name.replace(/^#/, '').toLowerCase();
    return this.prisma.hashtag.findUnique({
      where: { name: normalizedName },
    });
  }

  /**
   * 트렌딩 해시태그 조회 (최근 24시간 기준)
   * - 최근 생성된 게시글에서 많이 사용된 해시태그
   */
  async getTrending(limit: number = 10): Promise<PopularHashtag[]> {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    // 최근 24시간 내 게시글에서 사용된 해시태그 집계
    const trending = await this.prisma.postHashtag.groupBy({
      by: ['hashtagId'],
      where: {
        createdAt: { gte: oneDayAgo },
      },
      _count: { hashtagId: true },
      orderBy: { _count: { hashtagId: 'desc' } },
      take: limit,
    });

    if (trending.length === 0) {
      // 트렌딩 데이터가 없으면 인기 해시태그 반환
      return this.getPopular(limit);
    }

    // 해시태그 정보 조회
    const hashtagIds = trending.map((t) => t.hashtagId);
    const hashtags = await this.prisma.hashtag.findMany({
      where: { id: { in: hashtagIds } },
      select: {
        id: true,
        name: true,
        usageCount: true,
      },
    });

    // 트렌딩 순서대로 정렬
    const hashtagMap = new Map(hashtags.map((h) => [h.id, h]));
    return trending
      .map((t) => hashtagMap.get(t.hashtagId))
      .filter((h): h is PopularHashtag => h !== undefined);
  }
}
