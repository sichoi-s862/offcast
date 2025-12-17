import { Module } from '@nestjs/common';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UserModule } from '../user/user.module';
import { PostModule } from '../post/post.module';

/**
 * 댓글 모듈
 * - 댓글/답글 CRUD, 좋아요 관리
 */
@Module({
  imports: [PrismaModule, UserModule, PostModule],
  controllers: [CommentController],
  providers: [CommentService],
  exports: [CommentService],
})
export class CommentModule {}
