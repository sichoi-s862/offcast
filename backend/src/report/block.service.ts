import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BlockService {
  constructor(private prisma: PrismaService) {}

  /**
   * 사용자 차단
   */
  async blockUser(blockerId: string, blockedUserId: string): Promise<void> {
    // 자기 자신 차단 방지
    if (blockerId === blockedUserId) {
      throw new BadRequestException('You cannot block yourself.');
    }

    // 차단 대상 존재 확인
    const targetUser = await this.prisma.user.findUnique({
      where: { id: blockedUserId },
    });
    if (!targetUser || targetUser.deletedAt) {
      throw new NotFoundException('User not found.');
    }

    // 이미 차단했는지 확인
    const existingBlock = await this.prisma.userBlock.findUnique({
      where: {
        blockerId_blockedUserId: {
          blockerId,
          blockedUserId,
        },
      },
    });
    if (existingBlock) {
      throw new ConflictException('You have already blocked this user.');
    }

    await this.prisma.userBlock.create({
      data: {
        blockerId,
        blockedUserId,
      },
    });
  }

  /**
   * 차단 해제
   */
  async unblockUser(blockerId: string, blockedUserId: string): Promise<void> {
    const block = await this.prisma.userBlock.findUnique({
      where: {
        blockerId_blockedUserId: {
          blockerId,
          blockedUserId,
        },
      },
    });

    if (!block) {
      throw new NotFoundException('Block record not found.');
    }

    await this.prisma.userBlock.delete({
      where: { id: block.id },
    });
  }

  /**
   * 차단 목록 조회
   */
  async getBlockedUsers(
    userId: string,
    page = 1,
    limit = 20,
  ) {
    const skip = (page - 1) * limit;

    const [blocks, total] = await Promise.all([
      this.prisma.userBlock.findMany({
        where: { blockerId: userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.userBlock.count({
        where: { blockerId: userId },
      }),
    ]);

    // 차단된 사용자 정보 조회
    const blockedUserIds = blocks.map((b) => b.blockedUserId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: blockedUserIds } },
      select: {
        id: true,
        nickname: true,
        accounts: {
          select: {
            provider: true,
            profileName: true,
            subscriberCount: true,
          },
        },
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const blockedUsers = blocks.map((block) => ({
      id: block.id,
      blockedUserId: block.blockedUserId,
      user: userMap.get(block.blockedUserId) || null,
      createdAt: block.createdAt,
    }));

    return { blockedUsers, total };
  }

  /**
   * 특정 사용자를 차단했는지 확인
   */
  async isBlocked(blockerId: string, blockedUserId: string): Promise<boolean> {
    const block = await this.prisma.userBlock.findUnique({
      where: {
        blockerId_blockedUserId: {
          blockerId,
          blockedUserId,
        },
      },
    });
    return !!block;
  }

  /**
   * 차단한 사용자 ID 목록 조회 (필터링용)
   */
  async getBlockedUserIds(userId: string): Promise<string[]> {
    const blocks = await this.prisma.userBlock.findMany({
      where: { blockerId: userId },
      select: { blockedUserId: true },
    });
    return blocks.map((b) => b.blockedUserId);
  }
}
