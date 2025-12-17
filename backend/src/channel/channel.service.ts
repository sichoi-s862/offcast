import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Channel, ChannelAccess } from '@prisma/client';

/**
 * 채널 생성 요청 인터페이스
 */
export interface CreateChannelDto {
  name: string;
  slug: string;
  description?: string;
  minSubscribers: number;
  maxSubscribers?: number;
  sortOrder?: number;
}

/**
 * 채널 서비스
 * - 채널 CRUD 및 접근 권한 관리
 */
@Injectable()
export class ChannelService {
  constructor(private prisma: PrismaService) {}

  /**
   * 모든 활성 채널 조회
   */
  async findAll(): Promise<Channel[]> {
    return this.prisma.channel.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * ID로 채널 조회
   */
  async findById(id: string): Promise<Channel | null> {
    return this.prisma.channel.findUnique({
      where: { id },
    });
  }

  /**
   * 슬러그로 채널 조회
   */
  async findBySlug(slug: string): Promise<Channel | null> {
    return this.prisma.channel.findUnique({
      where: { slug },
    });
  }

  /**
   * 채널 생성
   */
  async create(data: CreateChannelDto): Promise<Channel> {
    return this.prisma.channel.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        minSubscribers: data.minSubscribers,
        maxSubscribers: data.maxSubscribers,
        sortOrder: data.sortOrder || 0,
      },
    });
  }

  /**
   * 사용자가 접근 가능한 채널 목록 조회
   * - 구독자 수에 따라 접근 가능한 채널 필터링
   */
  async getAccessibleChannels(subscriberCount: number): Promise<Channel[]> {
    return this.prisma.channel.findMany({
      where: {
        isActive: true,
        minSubscribers: { lte: subscriberCount },
        OR: [
          { maxSubscribers: null },
          { maxSubscribers: { gte: subscriberCount } },
        ],
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * 사용자의 채널 접근 권한 확인
   */
  async checkAccess(userId: string, channelId: string): Promise<boolean> {
    const access = await this.prisma.channelAccess.findUnique({
      where: {
        userId_channelId: { userId, channelId },
      },
    });

    // 접근 권한이 있고 만료되지 않았는지 확인
    if (access && access.expiresAt > new Date()) {
      return true;
    }

    return false;
  }

  /**
   * 채널 접근 권한 부여
   * - 기존 권한이 있으면 갱신, 없으면 생성
   */
  async grantAccess(
    userId: string,
    channelId: string,
    expiresAt: Date,
  ): Promise<ChannelAccess> {
    return this.prisma.channelAccess.upsert({
      where: {
        userId_channelId: { userId, channelId },
      },
      update: { expiresAt },
      create: {
        userId,
        channelId,
        expiresAt,
      },
    });
  }

  /**
   * 사용자의 구독자 수에 따라 접근 권한 갱신
   * - 모든 접근 가능한 채널에 대해 권한 부여
   */
  async refreshAccessBySubscriberCount(
    userId: string,
    subscriberCount: number,
  ): Promise<ChannelAccess[]> {
    const accessibleChannels = await this.getAccessibleChannels(subscriberCount);

    // 24시간 후 만료
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const accesses: ChannelAccess[] = [];
    for (const channel of accessibleChannels) {
      const access = await this.grantAccess(userId, channel.id, expiresAt);
      accesses.push(access);
    }

    return accesses;
  }

  /**
   * 사용자의 모든 채널 접근 권한 조회
   */
  async getUserAccesses(userId: string): Promise<ChannelAccess[]> {
    return this.prisma.channelAccess.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      include: { channel: true },
    });
  }

  /**
   * 모든 채널 삭제 후 재생성 (개발용)
   */
  async resetAndSeedChannels(): Promise<void> {
    // 모든 채널 삭제 후 새로 생성
    await this.prisma.channel.deleteMany({});
    await this.seedDefaultChannels();
  }

  /**
   * 기본 채널 시드 데이터 생성
   */
  async seedDefaultChannels(): Promise<void> {
    const defaultChannels: CreateChannelDto[] = [
      // 등급별 라운지 (구간별 분리 - 해당 구간만 접근 가능)
      {
        name: '자유 게시판',
        slug: 'free',
        description: '누구나 자유롭게 이야기하는 공간',
        minSubscribers: 0,
        sortOrder: 0,
      },
      {
        name: '100명대 라운지',
        slug: 'lounge-100',
        description: '구독자 100~999명 크리에이터 전용',
        minSubscribers: 100,
        maxSubscribers: 999,
        sortOrder: 1,
      },
      {
        name: '1천명대 라운지',
        slug: 'lounge-1k',
        description: '구독자 1,000~9,999명 크리에이터 전용',
        minSubscribers: 1000,
        maxSubscribers: 9999,
        sortOrder: 2,
      },
      {
        name: '1만명대 라운지',
        slug: 'lounge-10k',
        description: '구독자 10,000~99,999명 크리에이터 전용',
        minSubscribers: 10000,
        maxSubscribers: 99999,
        sortOrder: 3,
      },
      {
        name: '10만명대 라운지',
        slug: 'lounge-100k',
        description: '구독자 100,000~999,999명 크리에이터 전용',
        minSubscribers: 100000,
        maxSubscribers: 999999,
        sortOrder: 4,
      },
      {
        name: '100만+ 라운지',
        slug: 'lounge-1m',
        description: '구독자 100만 이상 크리에이터 전용',
        minSubscribers: 1000000,
        sortOrder: 5,
      },
      // 컨텐츠 카테고리 (스트리머 많은 순 5개)
      {
        name: '게임',
        slug: 'gaming',
        description: 'PC/콘솔/모바일 게임 컨텐츠',
        minSubscribers: 0,
        sortOrder: 10,
      },
      {
        name: '먹방/쿡방',
        slug: 'food',
        description: '먹방, 요리, 음식 리뷰 컨텐츠',
        minSubscribers: 0,
        sortOrder: 11,
      },
      {
        name: '일상/브이로그',
        slug: 'vlog',
        description: '일상 공유, 브이로그 컨텐츠',
        minSubscribers: 0,
        sortOrder: 12,
      },
      {
        name: '음악/커버',
        slug: 'music',
        description: '음악, 커버, 작곡 컨텐츠',
        minSubscribers: 0,
        sortOrder: 13,
      },
      {
        name: '뷰티/패션',
        slug: 'beauty',
        description: '뷰티, 패션, 스타일링 컨텐츠',
        minSubscribers: 0,
        sortOrder: 14,
      },
      // 일반 관심 주제 (5개)
      {
        name: '재테크/투자',
        slug: 'investment',
        description: '주식, 코인, 부동산, 재테크 이야기',
        minSubscribers: 0,
        sortOrder: 20,
      },
      {
        name: '건강/운동',
        slug: 'health',
        description: '헬스, 다이어트, 건강 관리',
        minSubscribers: 0,
        sortOrder: 21,
      },
      {
        name: '여행/맛집',
        slug: 'travel',
        description: '여행지, 맛집 추천 및 후기',
        minSubscribers: 0,
        sortOrder: 22,
      },
      {
        name: 'IT/테크',
        slug: 'tech',
        description: '전자기기, 앱, 테크 소식',
        minSubscribers: 0,
        sortOrder: 23,
      },
      {
        name: '자유토크',
        slug: 'talk',
        description: '일상 잡담, 고민 상담, 자유 주제',
        minSubscribers: 0,
        sortOrder: 24,
      },
    ];

    for (const channelData of defaultChannels) {
      const existing = await this.findBySlug(channelData.slug);
      if (!existing) {
        await this.create(channelData);
      }
    }
  }
}
