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
   * 기본 채널 시드 데이터 생성
   */
  async seedDefaultChannels(): Promise<void> {
    const defaultChannels: CreateChannelDto[] = [
      {
        name: '자유 게시판',
        slug: 'free',
        description: '누구나 자유롭게 이야기하는 공간',
        minSubscribers: 0,
        sortOrder: 0,
      },
      {
        name: '1만 라운지',
        slug: 'lounge-10k',
        description: '구독자 1만 이상 크리에이터 전용',
        minSubscribers: 10000,
        sortOrder: 1,
      },
      {
        name: '10만 라운지',
        slug: 'lounge-100k',
        description: '구독자 10만 이상 크리에이터 전용',
        minSubscribers: 100000,
        sortOrder: 2,
      },
      {
        name: '100만 라운지',
        slug: 'lounge-1m',
        description: '구독자 100만 이상 크리에이터 전용',
        minSubscribers: 1000000,
        sortOrder: 3,
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
