import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

/**
 * 업로드 모듈
 * - S3 이미지 업로드/삭제
 * - Presigned URL 발급
 */
@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(), // 메모리에 버퍼로 저장 후 S3 업로드
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 5, // 최대 5개 파일
      },
    }),
  ],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
