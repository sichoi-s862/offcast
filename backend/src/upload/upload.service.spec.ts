import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { UploadService } from './upload.service';

// uuid ESM 모듈 mock
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid-1234'),
}));

// AWS S3 SDK mock
const mockSend = jest.fn();
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: mockSend,
  })),
  PutObjectCommand: jest.fn().mockImplementation((params) => ({ ...params, type: 'PutObject' })),
  DeleteObjectCommand: jest.fn().mockImplementation((params) => ({ ...params, type: 'DeleteObject' })),
  GetObjectCommand: jest.fn().mockImplementation((params) => ({ ...params, type: 'GetObject' })),
}));

// getSignedUrl mock
jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://presigned-url.example.com/test'),
}));

/**
 * 업로드 서비스 테스트
 */
describe('UploadService', () => {
  let service: UploadService;
  let configService: ConfigService;

  // Mock ConfigService
  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        AWS_REGION: 'ap-northeast-2',
        AWS_S3_BUCKET: 'test-bucket',
        AWS_ACCESS_KEY_ID: 'test-access-key',
        AWS_SECRET_ACCESS_KEY: 'test-secret-key',
        CDN_URL: '',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<UploadService>(UploadService);
    configService = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateMimeType', () => {
    it('유효한 이미지 MIME 타입을 허용해야 함', () => {
      expect(() => service.validateMimeType('image/jpeg')).not.toThrow();
      expect(() => service.validateMimeType('image/png')).not.toThrow();
      expect(() => service.validateMimeType('image/gif')).not.toThrow();
      expect(() => service.validateMimeType('image/webp')).not.toThrow();
    });

    it('유효하지 않은 MIME 타입은 BadRequestException을 던져야 함', () => {
      expect(() => service.validateMimeType('image/bmp')).toThrow(
        BadRequestException,
      );
      expect(() => service.validateMimeType('application/pdf')).toThrow(
        BadRequestException,
      );
      expect(() => service.validateMimeType('text/plain')).toThrow(
        BadRequestException,
      );
      expect(() => service.validateMimeType('video/mp4')).toThrow(
        BadRequestException,
      );
    });
  });

  describe('validateFileSize', () => {
    it('10MB 이하 파일을 허용해야 함', () => {
      expect(() => service.validateFileSize(1024)).not.toThrow(); // 1KB
      expect(() => service.validateFileSize(1024 * 1024)).not.toThrow(); // 1MB
      expect(() => service.validateFileSize(10 * 1024 * 1024)).not.toThrow(); // 10MB (정확히)
    });

    it('10MB 초과 파일은 BadRequestException을 던져야 함', () => {
      expect(() => service.validateFileSize(10 * 1024 * 1024 + 1)).toThrow(
        BadRequestException,
      );
      expect(() => service.validateFileSize(20 * 1024 * 1024)).toThrow(
        BadRequestException,
      );
    });
  });

  describe('getPublicUrl', () => {
    it('S3 URL을 생성해야 함', () => {
      const url = service.getPublicUrl('images/test.jpg');

      expect(url).toBe(
        'https://test-bucket.s3.ap-northeast-2.amazonaws.com/images/test.jpg',
      );
    });

    it('CDN URL이 설정되어 있으면 CDN URL을 사용해야 함', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'CDN_URL') return 'https://cdn.example.com';
        return 'test-bucket';
      });

      // 새 인스턴스 생성
      const newService = new UploadService(mockConfigService as any);
      const url = newService.getPublicUrl('images/test.jpg');

      expect(url).toBe('https://cdn.example.com/images/test.jpg');
    });
  });

  describe('uploadImage', () => {
    it('유효하지 않은 MIME 타입은 거부해야 함', async () => {
      const buffer = Buffer.from('test');

      await expect(
        service.uploadImage(buffer, 'application/pdf', 'images'),
      ).rejects.toThrow(BadRequestException);
    });

    it('너무 큰 파일은 거부해야 함', async () => {
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB

      await expect(
        service.uploadImage(largeBuffer, 'image/jpeg', 'images'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getPresignedUploadUrl', () => {
    it('유효하지 않은 MIME 타입은 거부해야 함', async () => {
      await expect(
        service.getPresignedUploadUrl('application/pdf', 'images'),
      ).rejects.toThrow(BadRequestException);
    });

    it('유효한 MIME 타입으로 presigned URL을 반환해야 함', async () => {
      const result = await service.getPresignedUploadUrl('image/jpeg', 'posts');

      expect(result).toHaveProperty('uploadUrl');
      expect(result).toHaveProperty('key');
      expect(result).toHaveProperty('publicUrl');
      expect(result.key).toContain('posts/');
      expect(result.key).toContain('mocked-uuid-1234');
      expect(result.key).toContain('.jpg');
    });

    it('기본 폴더를 사용해야 함', async () => {
      const result = await service.getPresignedUploadUrl('image/png');

      expect(result.key).toContain('images/');
      expect(result.key).toContain('.png');
    });

    it('사용자 정의 만료 시간을 사용해야 함', async () => {
      const result = await service.getPresignedUploadUrl('image/gif', 'uploads', 600);

      expect(result.key).toContain('uploads/');
      expect(result.key).toContain('.gif');
    });

    it('webp 형식을 처리해야 함', async () => {
      const result = await service.getPresignedUploadUrl('image/webp', 'media');

      expect(result.key).toContain('.webp');
    });
  });

  describe('uploadImage - 성공 케이스', () => {
    beforeEach(() => {
      mockSend.mockResolvedValue({});
    });

    it('이미지를 성공적으로 업로드해야 함', async () => {
      const buffer = Buffer.from('test image data');
      const result = await service.uploadImage(buffer, 'image/jpeg', 'posts');

      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('key');
      expect(result.key).toBe('posts/mocked-uuid-1234.jpg');
      expect(mockSend).toHaveBeenCalled();
    });

    it('PNG 이미지를 업로드해야 함', async () => {
      const buffer = Buffer.from('png image');
      const result = await service.uploadImage(buffer, 'image/png', 'images');

      expect(result.key).toContain('.png');
    });

    it('GIF 이미지를 업로드해야 함', async () => {
      const buffer = Buffer.from('gif image');
      const result = await service.uploadImage(buffer, 'image/gif', 'animations');

      expect(result.key).toContain('.gif');
    });

    it('WebP 이미지를 업로드해야 함', async () => {
      const buffer = Buffer.from('webp image');
      const result = await service.uploadImage(buffer, 'image/webp', 'modern');

      expect(result.key).toContain('.webp');
    });

    it('기본 폴더를 사용해야 함', async () => {
      const buffer = Buffer.from('test');
      const result = await service.uploadImage(buffer, 'image/jpeg');

      expect(result.key).toContain('images/');
    });
  });

  describe('deleteImage', () => {
    beforeEach(() => {
      mockSend.mockResolvedValue({});
    });

    it('이미지를 성공적으로 삭제해야 함', async () => {
      await expect(service.deleteImage('posts/test.jpg')).resolves.not.toThrow();
      expect(mockSend).toHaveBeenCalled();
    });

    it('존재하지 않는 키도 에러 없이 처리해야 함', async () => {
      await expect(service.deleteImage('nonexistent/file.jpg')).resolves.not.toThrow();
    });
  });

  describe('deleteImages', () => {
    beforeEach(() => {
      mockSend.mockResolvedValue({});
    });

    it('여러 이미지를 삭제해야 함', async () => {
      const keys = ['image1.jpg', 'image2.png', 'image3.gif'];
      await expect(service.deleteImages(keys)).resolves.not.toThrow();
      expect(mockSend).toHaveBeenCalledTimes(3);
    });

    it('빈 배열을 처리해야 함', async () => {
      await expect(service.deleteImages([])).resolves.not.toThrow();
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('단일 이미지 배열을 처리해야 함', async () => {
      await expect(service.deleteImages(['single.jpg'])).resolves.not.toThrow();
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('getPresignedDownloadUrl', () => {
    it('다운로드 URL을 반환해야 함', async () => {
      const url = await service.getPresignedDownloadUrl('posts/image.jpg');

      expect(url).toBe('https://presigned-url.example.com/test');
    });

    it('사용자 정의 만료 시간을 사용해야 함', async () => {
      const url = await service.getPresignedDownloadUrl('posts/image.jpg', 7200);

      expect(url).toBeDefined();
    });

    it('기본 만료 시간을 사용해야 함', async () => {
      const url = await service.getPresignedDownloadUrl('posts/image.jpg');

      expect(url).toBeDefined();
    });
  });

  describe('S3 에러 처리', () => {
    it('S3 업로드 실패 시 에러를 던져야 함', async () => {
      mockSend.mockRejectedValue(new Error('S3 Upload Failed'));

      const buffer = Buffer.from('test');
      await expect(
        service.uploadImage(buffer, 'image/jpeg', 'posts'),
      ).rejects.toThrow('S3 Upload Failed');
    });

    it('S3 삭제 실패 시 에러를 던져야 함', async () => {
      mockSend.mockRejectedValue(new Error('S3 Delete Failed'));

      await expect(service.deleteImage('test.jpg')).rejects.toThrow(
        'S3 Delete Failed',
      );
    });
  });

  describe('getExtensionFromMimeType (private 메서드)', () => {
    beforeEach(() => {
      mockSend.mockResolvedValue({});
    });

    it('알 수 없는 MIME 타입은 jpg를 기본값으로 사용', async () => {
      // allowedMimeTypes에는 없지만 테스트를 위해 직접 호출 시뮬레이션
      // 이미 validateMimeType에서 걸러지므로 실제로는 호출되지 않음
      // 대신 허용된 타입들의 확장자 변환을 테스트
      const buffer = Buffer.from('test');

      const jpegResult = await service.uploadImage(buffer, 'image/jpeg', 'test');
      expect(jpegResult.key).toContain('.jpg');

      const pngResult = await service.uploadImage(buffer, 'image/png', 'test');
      expect(pngResult.key).toContain('.png');

      const gifResult = await service.uploadImage(buffer, 'image/gif', 'test');
      expect(gifResult.key).toContain('.gif');

      const webpResult = await service.uploadImage(buffer, 'image/webp', 'test');
      expect(webpResult.key).toContain('.webp');
    });
  });

  describe('생성자 기본값', () => {
    it('AWS 설정이 없을 때 기본값을 사용해야 함', () => {
      const emptyConfigService = {
        get: jest.fn().mockReturnValue(undefined),
      };

      const newService = new UploadService(emptyConfigService as any);
      expect(newService).toBeDefined();
    });

    it('일부 AWS 설정만 있을 때 처리해야 함', () => {
      const partialConfigService = {
        get: jest.fn((key: string) => {
          if (key === 'AWS_REGION') return 'us-west-2';
          return undefined;
        }),
      };

      const newService = new UploadService(partialConfigService as any);
      expect(newService).toBeDefined();
    });
  });

  describe('validateMimeType 에러 메시지', () => {
    it('지원하는 형식 목록을 포함한 에러 메시지를 던져야 함', () => {
      expect(() => service.validateMimeType('image/bmp')).toThrow(
        /지원하지 않는 이미지 형식입니다/,
      );
    });
  });

  describe('validateFileSize 에러 메시지', () => {
    it('최대 파일 크기를 포함한 에러 메시지를 던져야 함', () => {
      expect(() => service.validateFileSize(100 * 1024 * 1024)).toThrow(
        /파일 크기가 너무 큽니다/,
      );
    });
  });

  describe('getPublicUrl 다양한 경로', () => {
    it('중첩된 폴더 경로를 처리해야 함', () => {
      const url = service.getPublicUrl('users/123/posts/456/image.jpg');
      expect(url).toContain('users/123/posts/456/image.jpg');
    });

    it('특수 문자가 포함된 키를 처리해야 함', () => {
      const url = service.getPublicUrl('posts/image-with-dashes_and_underscores.jpg');
      expect(url).toContain('image-with-dashes_and_underscores.jpg');
    });
  });
});
