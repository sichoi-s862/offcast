import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

/**
 * 업로드 결과 인터페이스
 */
export interface UploadResult {
  url: string;
  key: string;
}

/**
 * Presigned URL 결과 인터페이스
 */
export interface PresignedUrlResult {
  uploadUrl: string;
  key: string;
  publicUrl: string;
}

/**
 * 이미지 업로드 서비스
 * - AWS S3에 이미지 업로드/삭제
 * - Presigned URL 발급
 */
@Injectable()
export class UploadService {
  private s3Client: S3Client;
  private bucketName: string;
  private region: string;

  // 허용된 이미지 MIME 타입
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ];

  // 최대 파일 크기 (10MB)
  private readonly maxFileSize = 10 * 1024 * 1024;

  constructor(private configService: ConfigService) {
    this.region = this.configService.get<string>('AWS_REGION') || 'ap-northeast-2';
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET') || 'offcast-images';

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '',
      },
    });
  }

  /**
   * 이미지 파일 직접 업로드
   * @param file - 업로드할 파일 버퍼
   * @param mimeType - 파일 MIME 타입
   * @param folder - S3 폴더 경로 (예: 'posts', 'comments')
   */
  async uploadImage(
    file: Buffer,
    mimeType: string,
    folder: string = 'images',
  ): Promise<UploadResult> {
    // MIME 타입 검증
    if (!this.allowedMimeTypes.includes(mimeType)) {
      throw new BadRequestException(
        `지원하지 않는 이미지 형식입니다. 지원 형식: ${this.allowedMimeTypes.join(', ')}`,
      );
    }

    // 파일 크기 검증
    if (file.length > this.maxFileSize) {
      throw new BadRequestException(
        `파일 크기가 너무 큽니다. 최대 ${this.maxFileSize / 1024 / 1024}MB까지 업로드 가능합니다.`,
      );
    }

    // 파일 확장자 추출
    const extension = this.getExtensionFromMimeType(mimeType);
    const key = `${folder}/${uuidv4()}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file,
      ContentType: mimeType,
    });

    await this.s3Client.send(command);

    return {
      url: this.getPublicUrl(key),
      key,
    };
  }

  /**
   * Presigned URL 발급 (클라이언트 직접 업로드용)
   * @param mimeType - 파일 MIME 타입
   * @param folder - S3 폴더 경로
   * @param expiresIn - URL 만료 시간 (초, 기본 300초)
   */
  async getPresignedUploadUrl(
    mimeType: string,
    folder: string = 'images',
    expiresIn: number = 300,
  ): Promise<PresignedUrlResult> {
    // MIME 타입 검증
    if (!this.allowedMimeTypes.includes(mimeType)) {
      throw new BadRequestException(
        `지원하지 않는 이미지 형식입니다. 지원 형식: ${this.allowedMimeTypes.join(', ')}`,
      );
    }

    // 파일 확장자 추출
    const extension = this.getExtensionFromMimeType(mimeType);
    const key = `${folder}/${uuidv4()}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn });

    return {
      uploadUrl,
      key,
      publicUrl: this.getPublicUrl(key),
    };
  }

  /**
   * 이미지 삭제
   * @param key - S3 객체 키
   */
  async deleteImage(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  /**
   * 여러 이미지 삭제
   * @param keys - S3 객체 키 배열
   */
  async deleteImages(keys: string[]): Promise<void> {
    const deletePromises = keys.map((key) => this.deleteImage(key));
    await Promise.all(deletePromises);
  }

  /**
   * Presigned Download URL 발급 (비공개 버킷용)
   * @param key - S3 객체 키
   * @param expiresIn - URL 만료 시간 (초, 기본 3600초)
   */
  async getPresignedDownloadUrl(
    key: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * 공개 URL 생성
   * @param key - S3 객체 키
   */
  getPublicUrl(key: string): string {
    // CloudFront 사용 시 CDN URL로 변경 가능
    const cdnUrl = this.configService.get<string>('CDN_URL');
    if (cdnUrl) {
      return `${cdnUrl}/${key}`;
    }
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
  }

  /**
   * MIME 타입에서 파일 확장자 추출
   */
  private getExtensionFromMimeType(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
    };
    return mimeToExt[mimeType] || 'jpg';
  }

  /**
   * 파일 크기 검증
   */
  validateFileSize(size: number): void {
    if (size > this.maxFileSize) {
      throw new BadRequestException(
        `파일 크기가 너무 큽니다. 최대 ${this.maxFileSize / 1024 / 1024}MB까지 업로드 가능합니다.`,
      );
    }
  }

  /**
   * MIME 타입 검증
   */
  validateMimeType(mimeType: string): void {
    if (!this.allowedMimeTypes.includes(mimeType)) {
      throw new BadRequestException(
        `지원하지 않는 이미지 형식입니다. 지원 형식: ${this.allowedMimeTypes.join(', ')}`,
      );
    }
  }
}
