import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Account } from '@prisma/client';

export interface OAuthProfile {
  provider: string;
  providerAccountId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  profileName?: string;
  profileImage?: string;
}

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: { accounts: true },
    });
  }

  async findByProviderAccount(
    provider: string,
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
    return account?.user ?? null;
  }

  async findOrCreateByOAuth(profile: OAuthProfile): Promise<User> {
    const existingUser = await this.findByProviderAccount(
      profile.provider,
      profile.providerAccountId,
    );

    if (existingUser) {
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
        },
      });
      return existingUser;
    }

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
          },
        },
      },
      include: { accounts: true },
    });
  }

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
      if (existingAccount.userId !== userId) {
        throw new ConflictException('This account is already linked to another user');
      }
      return this.prisma.account.update({
        where: { id: existingAccount.id },
        data: {
          accessToken: profile.accessToken,
          refreshToken: profile.refreshToken,
          expiresAt: profile.expiresAt,
          profileName: profile.profileName,
          profileImage: profile.profileImage,
        },
      });
    }

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
      },
    });
  }

  async getAccounts(userId: string): Promise<Account[]> {
    return this.prisma.account.findMany({
      where: { userId },
    });
  }

  async getAccountByProvider(
    userId: string,
    provider: string,
  ): Promise<Account | null> {
    return this.prisma.account.findFirst({
      where: { userId, provider },
    });
  }

  async unlinkAccount(userId: string, provider: string): Promise<void> {
    await this.prisma.account.deleteMany({
      where: { userId, provider },
    });
  }
}
