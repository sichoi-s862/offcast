import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { YouTubeProvider, YouTubeStats } from './providers/youtube.provider';
import { TikTokProvider, TikTokStats } from './providers/tiktok.provider';
import { SoopProvider, SoopStats } from './providers/soop.provider';
import { InstagramProvider, InstagramStats } from './providers/instagram.provider';
import { ChzzkProvider, ChzzkStats } from './providers/chzzk.provider';

export type Provider = 'youtube' | 'tiktok' | 'soop' | 'instagram' | 'chzzk';

export interface AllStats {
  youtube?: YouTubeStats;
  tiktok?: TikTokStats;
  soop?: SoopStats;
  instagram?: InstagramStats;
  chzzk?: ChzzkStats;
}

@Injectable()
export class SocialService {
  constructor(
    private userService: UserService,
    private youtubeProvider: YouTubeProvider,
    private tiktokProvider: TikTokProvider,
    private soopProvider: SoopProvider,
    private instagramProvider: InstagramProvider,
    private chzzkProvider: ChzzkProvider,
  ) {}

  async getYouTubeStats(userId: string): Promise<YouTubeStats> {
    const account = await this.userService.getAccountByProvider(userId, 'youtube');
    if (!account) {
      throw new NotFoundException('YouTube account not linked');
    }
    return this.youtubeProvider.getStats(account.accessToken);
  }

  async getTikTokStats(userId: string): Promise<TikTokStats> {
    const account = await this.userService.getAccountByProvider(userId, 'tiktok');
    if (!account) {
      throw new NotFoundException('TikTok account not linked');
    }
    return this.tiktokProvider.getStats(account.accessToken);
  }

  async getSoopStats(userId: string): Promise<SoopStats> {
    const account = await this.userService.getAccountByProvider(userId, 'soop');
    if (!account) {
      throw new NotFoundException('SOOP account not linked');
    }
    return this.soopProvider.getStats(account.accessToken);
  }

  async getInstagramStats(userId: string): Promise<InstagramStats> {
    const account = await this.userService.getAccountByProvider(userId, 'instagram');
    if (!account) {
      throw new NotFoundException('Instagram account not linked');
    }
    return this.instagramProvider.getStats(account.accessToken);
  }

  async getChzzkStats(userId: string): Promise<ChzzkStats> {
    const account = await this.userService.getAccountByProvider(userId, 'chzzk');
    if (!account) {
      throw new NotFoundException('Chzzk account not linked');
    }
    return this.chzzkProvider.getStats(account.accessToken);
  }

  async getStatsByProvider(
    userId: string,
    provider: Provider,
  ): Promise<YouTubeStats | TikTokStats | SoopStats | InstagramStats | ChzzkStats> {
    switch (provider) {
      case 'youtube':
        return this.getYouTubeStats(userId);
      case 'tiktok':
        return this.getTikTokStats(userId);
      case 'soop':
        return this.getSoopStats(userId);
      case 'instagram':
        return this.getInstagramStats(userId);
      case 'chzzk':
        return this.getChzzkStats(userId);
      default:
        throw new BadRequestException(`Unknown provider: ${provider}`);
    }
  }

  async getAllStats(userId: string): Promise<AllStats> {
    const accounts = await this.userService.getAccounts(userId);
    const stats: AllStats = {};

    const promises: Promise<void>[] = [];

    for (const account of accounts) {
      const provider = account.provider as Provider;

      const fetchStats = async () => {
        try {
          switch (provider) {
            case 'youtube':
              stats.youtube = await this.youtubeProvider.getStats(account.accessToken);
              break;
            case 'tiktok':
              stats.tiktok = await this.tiktokProvider.getStats(account.accessToken);
              break;
            case 'soop':
              stats.soop = await this.soopProvider.getStats(account.accessToken);
              break;
            case 'instagram':
              stats.instagram = await this.instagramProvider.getStats(account.accessToken);
              break;
            case 'chzzk':
              stats.chzzk = await this.chzzkProvider.getStats(account.accessToken);
              break;
          }
        } catch (error) {
          console.error(`Failed to fetch ${provider} stats:`, error);
        }
      };

      promises.push(fetchStats());
    }

    await Promise.all(promises);
    return stats;
  }

  async getLinkedAccounts(userId: string) {
    const accounts = await this.userService.getAccounts(userId);
    return accounts.map((account) => ({
      provider: account.provider,
      profileName: account.profileName,
      profileImage: account.profileImage,
      linkedAt: account.createdAt,
    }));
  }
}
