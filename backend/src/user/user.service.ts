import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Account, Provider } from '@prisma/client';

/**
 * OAuth 프로필 인터페이스
 * - 소셜 로그인 시 전달되는 프로필 정보
 */
export interface OAuthProfile {
  provider: Provider;
  providerAccountId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  profileName?: string;
  profileImage?: string;
  subscriberCount?: number;
}

/**
 * 사용자 서비스
 * - 사용자 CRUD 및 OAuth 계정 관리
 */
@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  /**
   * ID로 사용자 조회 (계정 정보 포함)
   */
  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id, deletedAt: null },
      include: { accounts: true },
    });
  }

  /**
   * 소셜 계정으로 사용자 조회
   */
  async findByProviderAccount(
    provider: Provider,
    providerAccountId: string,
  ): Promise<User | null> {
    const account = await this.prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId,
        },
      },
      include: { user: true },
    });

    // 탈퇴한 사용자는 제외
    if (account?.user?.deletedAt) {
      return null;
    }

    return account?.user ?? null;
  }

  /**
   * OAuth 로그인 처리
   * - 기존 사용자면 토큰 갱신, 신규면 사용자 생성
   */
  async findOrCreateByOAuth(profile: OAuthProfile): Promise<User> {
    const existingUser = await this.findByProviderAccount(
      profile.provider,
      profile.providerAccountId,
    );

    if (existingUser) {
      // 기존 사용자: 토큰 및 프로필 정보 갱신 (Account만 업데이트, User.nickname은 건드리지 않음)
      await this.prisma.account.update({
        where: {
          provider_providerAccountId: {
            provider: profile.provider,
            providerAccountId: profile.providerAccountId,
          },
        },
        data: {
          accessToken: profile.accessToken,
          refreshToken: profile.refreshToken,
          expiresAt: profile.expiresAt,
          profileName: profile.profileName,
          profileImage: profile.profileImage,
          subscriberCount: profile.subscriberCount,
        },
      });

      return existingUser;
    }

    // 신규 사용자 생성 (nickname은 나중에 별도 설정)
    return this.prisma.user.create({
      data: {
        accounts: {
          create: {
            provider: profile.provider,
            providerAccountId: profile.providerAccountId,
            accessToken: profile.accessToken,
            refreshToken: profile.refreshToken,
            expiresAt: profile.expiresAt,
            profileName: profile.profileName,
            profileImage: profile.profileImage,
            subscriberCount: profile.subscriberCount,
          },
        },
      },
      include: { accounts: true },
    });
  }

  /**
   * 기존 사용자에게 소셜 계정 연결
   */
  async linkAccount(userId: string, profile: OAuthProfile): Promise<Account> {
    const existingAccount = await this.prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: profile.provider,
          providerAccountId: profile.providerAccountId,
        },
      },
    });

    if (existingAccount) {
      // 다른 사용자에게 이미 연결된 계정인 경우
      if (existingAccount.userId !== userId) {
        throw new ConflictException('This account is already linked to another user.');
      }

      // 같은 사용자면 정보 갱신
      return this.prisma.account.update({
        where: { id: existingAccount.id },
        data: {
          accessToken: profile.accessToken,
          refreshToken: profile.refreshToken,
          expiresAt: profile.expiresAt,
          profileName: profile.profileName,
          profileImage: profile.profileImage,
          subscriberCount: profile.subscriberCount,
        },
      });
    }

    // 새 계정 연결
    return this.prisma.account.create({
      data: {
        userId,
        provider: profile.provider,
        providerAccountId: profile.providerAccountId,
        accessToken: profile.accessToken,
        refreshToken: profile.refreshToken,
        expiresAt: profile.expiresAt,
        profileName: profile.profileName,
        profileImage: profile.profileImage,
        subscriberCount: profile.subscriberCount,
      },
    });
  }

  /**
   * 사용자의 모든 연결된 계정 조회
   */
  async getAccounts(userId: string): Promise<Account[]> {
    return this.prisma.account.findMany({
      where: { userId },
    });
  }

  /**
   * 사용자의 특정 플랫폼 계정 조회
   */
  async getAccountByProvider(
    userId: string,
    provider: Provider,
  ): Promise<Account | null> {
    return this.prisma.account.findFirst({
      where: { userId, provider },
    });
  }

  /**
   * 소셜 계정 연결 해제
   */
  async unlinkAccount(userId: string, provider: Provider): Promise<void> {
    await this.prisma.account.deleteMany({
      where: { userId, provider },
    });
  }

  /**
   * 사용자의 최대 구독자 수 조회
   * - 여러 플랫폼 중 가장 높은 구독자 수 반환
   */
  async getMaxSubscriberCount(userId: string): Promise<number> {
    const accounts = await this.prisma.account.findMany({
      where: { userId },
      select: { subscriberCount: true },
    });

    return accounts.reduce((max, account) => {
      return Math.max(max, account.subscriberCount || 0);
    }, 0);
  }

  /**
   * 닉네임 업데이트
   */
  async updateNickname(userId: string, nickname: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { nickname },
    });
  }

  /**
   * 사용자 활동 통계 조회
   */
  async getUserStats(userId: string): Promise<{ postCount: number; commentCount: number }> {
    const [postCount, commentCount] = await Promise.all([
      this.prisma.post.count({
        where: { authorId: userId, deletedAt: null },
      }),
      this.prisma.comment.count({
        where: { authorId: userId, deletedAt: null },
      }),
    ]);

    return { postCount, commentCount };
  }

  /**
   * 회원 탈퇴 (소프트 삭제)
   */
  async withdraw(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: 'WITHDRAWN',
        deletedAt: new Date(),
      },
    });
  }
}
