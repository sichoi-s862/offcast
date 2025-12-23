import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { SocialModule } from './social/social.module';
import { ChannelModule } from './channel/channel.module';
import { PostModule } from './post/post.module';
import { CommentModule } from './comment/comment.module';
import { HashtagModule } from './hashtag/hashtag.module';
import { UploadModule } from './upload/upload.module';
import { HealthModule } from './health/health.module';
import { ReportModule } from './report/report.module';
import { SupportModule } from './support/support.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 1 minute
        limit: 200, // 200 requests per minute
      },
    ]),
    PrismaModule,
    AuthModule,
    UserModule,
    SocialModule,
    ChannelModule,
    PostModule,
    CommentModule,
    HashtagModule,
    UploadModule,
    HealthModule,
    ReportModule,
    SupportModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
