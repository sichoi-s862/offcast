import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { UploadService } from './upload.service';

// uuid ESM 모듈 mock
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid-1234'),
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
  });
});
