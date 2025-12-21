import { Module } from '@nestjs/common';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';
import { YouTubeProvider } from './providers/youtube.provider';
import { TikTokProvider } from './providers/tiktok.provider';
import { TwitchProvider } from './providers/twitch.provider';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  controllers: [SocialController],
  providers: [
    SocialService,
    YouTubeProvider,
    TikTokProvider,
    TwitchProvider,
  ],
  exports: [SocialService],
})
export class SocialModule {}
