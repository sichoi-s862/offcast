import {
  Controller,
  Post,
  Delete,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  HttpStatus,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { UploadService, UploadResult, PresignedUrlResult } from './upload.service';

/**
 * Presigned URL 요청 DTO
 */
class PresignedUrlDto {
  mimeType: string;
  folder?: string;
}

/**
 * 이미지 업로드 컨트롤러
 * - 직접 업로드, Presigned URL 발급, 삭제
 */
@ApiTags('Upload')
@Controller('upload')
@ApiBearerAuth()
export class UploadController {
  constructor(private uploadService: UploadService) {}

  /**
   * 단일 이미지 직접 업로드
   */
  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: '단일 이미지 업로드' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: '업로드할 이미지 파일',
        },
        folder: {
          type: 'string',
          description: '저장 폴더 (posts, comments 등)',
          default: 'images',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '업로드 성공',
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: '이미지 URL' },
        key: { type: 'string', description: 'S3 객체 키' },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 파일 형식 또는 크기' })
  async uploadImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|gif|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body('folder') folder?: string,
  ): Promise<UploadResult> {
    return this.uploadService.uploadImage(
      file.buffer,
      file.mimetype,
      folder || 'images',
    );
  }

  /**
   * 여러 이미지 직접 업로드 (최대 5개)
   */
  @Post('images')
  @UseInterceptors(FilesInterceptor('files', 5))
  @ApiOperation({ summary: '여러 이미지 업로드 (최대 5개)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: '업로드할 이미지 파일들',
        },
        folder: {
          type: 'string',
          description: '저장 폴더',
          default: 'images',
        },
      },
      required: ['files'],
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '업로드 성공',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          url: { type: 'string' },
          key: { type: 'string' },
        },
      },
    },
  })
  async uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('folder') folder?: string,
  ): Promise<UploadResult[]> {
    // 각 파일 검증 및 업로드
    const uploadPromises = files.map((file) => {
      this.uploadService.validateMimeType(file.mimetype);
      this.uploadService.validateFileSize(file.size);
      return this.uploadService.uploadImage(
        file.buffer,
        file.mimetype,
        folder || 'images',
      );
    });

    return Promise.all(uploadPromises);
  }

  /**
   * Presigned URL 발급 (클라이언트 직접 업로드용)
   */
  @Post('presigned-url')
  @ApiOperation({
    summary: 'Presigned URL 발급',
    description: '클라이언트가 직접 S3에 업로드할 수 있는 서명된 URL을 발급합니다.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        mimeType: {
          type: 'string',
          description: '파일 MIME 타입',
          example: 'image/jpeg',
        },
        folder: {
          type: 'string',
          description: '저장 폴더',
          default: 'images',
        },
      },
      required: ['mimeType'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Presigned URL 발급 성공',
    schema: {
      type: 'object',
      properties: {
        uploadUrl: { type: 'string', description: '업로드용 서명된 URL' },
        key: { type: 'string', description: 'S3 객체 키' },
        publicUrl: { type: 'string', description: '업로드 후 접근할 공개 URL' },
      },
    },
  })
  async getPresignedUrl(
    @Body() dto: PresignedUrlDto,
  ): Promise<PresignedUrlResult> {
    return this.uploadService.getPresignedUploadUrl(
      dto.mimeType,
      dto.folder || 'images',
    );
  }

  /**
   * 이미지 삭제
   */
  @Delete(':key')
  @ApiOperation({ summary: '이미지 삭제' })
  @ApiResponse({ status: HttpStatus.OK, description: '삭제 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '이미지를 찾을 수 없음' })
  async deleteImage(@Param('key') key: string): Promise<{ message: string }> {
    // URL 디코딩 (슬래시 등 특수문자 처리)
    const decodedKey = decodeURIComponent(key);
    await this.uploadService.deleteImage(decodedKey);
    return { message: '이미지가 삭제되었습니다.' };
  }

  /**
   * 여러 이미지 삭제
   */
  @Post('delete-many')
  @ApiOperation({ summary: '여러 이미지 삭제' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        keys: {
          type: 'array',
          items: { type: 'string' },
          description: '삭제할 S3 객체 키 배열',
        },
      },
      required: ['keys'],
    },
  })
  @ApiResponse({ status: HttpStatus.OK, description: '삭제 성공' })
  async deleteImages(
    @Body('keys') keys: string[],
  ): Promise<{ message: string; deletedCount: number }> {
    await this.uploadService.deleteImages(keys);
    return {
      message: '이미지들이 삭제되었습니다.',
      deletedCount: keys.length,
    };
  }
}
