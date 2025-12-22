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
   * Default channel seed data
   */
  async seedDefaultChannels(): Promise<void> {
    const defaultChannels: CreateChannelDto[] = [
      // Tier-based lounges (separated by subscriber range - only that range can access)
      {
        name: 'General',
        slug: 'free',
        description: 'Open space for everyone to chat freely',
        minSubscribers: 0,
        sortOrder: 0,
      },
      {
        name: '100+ Lounge',
        slug: 'lounge-100',
        description: 'For creators with 100~999 subscribers',
        minSubscribers: 100,
        maxSubscribers: 999,
        sortOrder: 1,
      },
      {
        name: '1K+ Lounge',
        slug: 'lounge-1k',
        description: 'For creators with 1,000~9,999 subscribers',
        minSubscribers: 1000,
        maxSubscribers: 9999,
        sortOrder: 2,
      },
      {
        name: '10K+ Lounge',
        slug: 'lounge-10k',
        description: 'For creators with 10,000~99,999 subscribers',
        minSubscribers: 10000,
        maxSubscribers: 99999,
        sortOrder: 3,
      },
      {
        name: '100K+ Lounge',
        slug: 'lounge-100k',
        description: 'For creators with 100,000~999,999 subscribers',
        minSubscribers: 100000,
        maxSubscribers: 999999,
        sortOrder: 4,
      },
      {
        name: '1M+ Lounge',
        slug: 'lounge-1m',
        description: 'For creators with 1 million+ subscribers',
        minSubscribers: 1000000,
        sortOrder: 5,
      },
      // Content categories (top 5 by streamer popularity)
      {
        name: 'Gaming',
        slug: 'gaming',
        description: 'PC, console, and mobile gaming content',
        minSubscribers: 0,
        sortOrder: 10,
      },
      {
        name: 'Food & Cooking',
        slug: 'food',
        description: 'Mukbang, cooking, and food review content',
        minSubscribers: 0,
        sortOrder: 11,
      },
      {
        name: 'Lifestyle & Vlog',
        slug: 'vlog',
        description: 'Daily life sharing and vlog content',
        minSubscribers: 0,
        sortOrder: 12,
      },
      {
        name: 'Music & Covers',
        slug: 'music',
        description: 'Music, covers, and composition content',
        minSubscribers: 0,
        sortOrder: 13,
      },
      {
        name: 'Beauty & Fashion',
        slug: 'beauty',
        description: 'Beauty, fashion, and styling content',
        minSubscribers: 0,
        sortOrder: 14,
      },
      // General interest topics (5)
      {
        name: 'Finance & Investing',
        slug: 'investment',
        description: 'Stocks, crypto, real estate, and money talk',
        minSubscribers: 0,
        sortOrder: 20,
      },
      {
        name: 'Health & Fitness',
        slug: 'health',
        description: 'Fitness, diet, and health management',
        minSubscribers: 0,
        sortOrder: 21,
      },
      {
        name: 'Travel & Restaurants',
        slug: 'travel',
        description: 'Travel destinations and restaurant reviews',
        minSubscribers: 0,
        sortOrder: 22,
      },
      {
        name: 'Tech & Gadgets',
        slug: 'tech',
        description: 'Electronics, apps, and tech news',
        minSubscribers: 0,
        sortOrder: 23,
      },
      {
        name: 'Off-Topic',
        slug: 'talk',
        description: 'Casual chat, advice, and open discussions',
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
