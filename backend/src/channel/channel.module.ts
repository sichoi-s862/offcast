import { Module } from '@nestjs/common';
import { ChannelController } from './channel.controller';
import { ChannelService } from './channel.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UserModule } from '../user/user.module';

/**
 * 채널 모듈
 * - 채널 CRUD 및 접근 권한 관리
 */
@Module({
  imports: [PrismaModule, UserModule],
  controllers: [ChannelController],
  providers: [ChannelService],
  exports: [ChannelService],
})
export class ChannelModule {}
