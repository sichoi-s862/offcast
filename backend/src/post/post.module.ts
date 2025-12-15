import { Module } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ChannelModule } from '../channel/channel.module';

/**
 * 게시글 모듈
 * - 게시글 CRUD, 좋아요, 해시태그 관리
 */
@Module({
  imports: [PrismaModule, ChannelModule],
  controllers: [PostController],
  providers: [PostService],
  exports: [PostService],
})
export class PostModule {}
