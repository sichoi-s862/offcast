import { Module } from '@nestjs/common';
import { HashtagController } from './hashtag.controller';
import { HashtagService } from './hashtag.service';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * 해시태그 모듈
 * - 해시태그 검색, 인기/트렌딩 해시태그 조회
 */
@Module({
  imports: [PrismaModule],
  controllers: [HashtagController],
  providers: [HashtagService],
  exports: [HashtagService],
})
export class HashtagModule {}
