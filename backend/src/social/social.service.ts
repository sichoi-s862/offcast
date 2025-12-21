import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Provider } from '@prisma/client';
import { UserService } from '../user/user.service';
import { YouTubeProvider, YouTubeStats } from './providers/youtube.provider';
import { TikTokProvider, TikTokStats } from './providers/tiktok.provider';
import { TwitchProvider, TwitchStats } from './providers/twitch.provider';

export type SocialProvider = 'youtube' | 'tiktok' | 'twitch';

export interface AllStats {
  youtube?: YouTubeStats;
  tiktok?: TikTokStats;
  twitch?: TwitchStats;
}

@Injectable()
export class SocialService {
  constructor(
    private userService: UserService,
    private youtubeProvider: YouTubeProvider,
    private tiktokProvider: TikTokProvider,
    private twitchProvider: TwitchProvider,
  ) {}

  async getYouTubeStats(userId: string): Promise<YouTubeStats> {
    const account = await this.userService.getAccountByProvider(userId, Provider.YOUTUBE);
    if (!account) {
      throw new NotFoundException('YouTube account not linked');
    }
    return this.youtubeProvider.getStats(account.accessToken);
  }

  async getTikTokStats(userId: string): Promise<TikTokStats> {
    const account = await this.userService.getAccountByProvider(userId, Provider.TIKTOK);
    if (!account) {
      throw new NotFoundException('TikTok account not linked');
    }
    return this.tiktokProvider.getStats(account.accessToken);
  }

  async getTwitchStats(userId: string): Promise<TwitchStats> {
    const account = await this.userService.getAccountByProvider(userId, Provider.TWITCH);
    if (!account) {
      throw new NotFoundException('Twitch account not linked');
    }
    return this.twitchProvider.getStats(account.accessToken);
  }

  async getStatsByProvider(
    userId: string,
    provider: SocialProvider,
  ): Promise<YouTubeStats | TikTokStats | TwitchStats> {
    switch (provider) {
      case 'youtube':
        return this.getYouTubeStats(userId);
      case 'tiktok':
        return this.getTikTokStats(userId);
      case 'twitch':
        return this.getTwitchStats(userId);
      default:
        throw new BadRequestException(`Unknown provider: ${provider}`);
    }
  }

  async getAllStats(userId: string): Promise<AllStats> {
    const accounts = await this.userService.getAccounts(userId);
    const stats: AllStats = {};

    const promises: Promise<void>[] = [];

    for (const account of accounts) {
      const provider = account.provider.toLowerCase() as SocialProvider;

      const fetchStats = async () => {
        try {
          switch (provider) {
            case 'youtube':
              stats.youtube = await this.youtubeProvider.getStats(account.accessToken);
              break;
            case 'tiktok':
              stats.tiktok = await this.tiktokProvider.getStats(account.accessToken);
              break;
            case 'twitch':
              stats.twitch = await this.twitchProvider.getStats(account.accessToken);
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
