import { Module } from '@nestjs/common';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';
import { YouTubeProvider } from './providers/youtube.provider';
import { TikTokProvider } from './providers/tiktok.provider';
import { SoopProvider } from './providers/soop.provider';
import { InstagramProvider } from './providers/instagram.provider';
import { ChzzkProvider } from './providers/chzzk.provider';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  controllers: [SocialController],
  providers: [
    SocialService,
    YouTubeProvider,
    TikTokProvider,
    SoopProvider,
    InstagramProvider,
    ChzzkProvider,
  ],
  exports: [SocialService],
})
export class SocialModule {}
