import { Test, TestingModule } from '@nestjs/testing';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

/**
 * 업로드 컨트롤러 테스트
 */
describe('UploadController', () => {
  let controller: UploadController;

  // Mock 데이터
  const mockUploadResult = {
    url: 'https://cdn.example.com/images/test.jpg',
    key: 'images/test.jpg',
  };

  const mockPresignedUrlResult = {
    uploadUrl: 'https://s3.amazonaws.com/presigned-upload-url',
    key: 'images/new-image.jpg',
    publicUrl: 'https://cdn.example.com/images/new-image.jpg',
  };

  // Mock Services
  const mockUploadService = {
    uploadImage: jest.fn(),
    getPresignedUploadUrl: jest.fn(),
    deleteImage: jest.fn(),
    deleteImages: jest.fn(),
    validateMimeType: jest.fn(),
    validateFileSize: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadController],
      providers: [{ provide: UploadService, useValue: mockUploadService }],
    }).compile();

    controller = module.get<UploadController>(UploadController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadImage', () => {
    it('단일 이미지를 업로드해야 함', async () => {
      mockUploadService.uploadImage.mockResolvedValue(mockUploadResult);

      const mockFile = {
        buffer: Buffer.from('test'),
        mimetype: 'image/jpeg',
        originalname: 'test.jpg',
        size: 1024,
      } as Express.Multer.File;

      const result = await controller.uploadImage(mockFile);

      expect(result).toEqual(mockUploadResult);
      expect(mockUploadService.uploadImage).toHaveBeenCalledWith(
        mockFile.buffer,
        'image/jpeg',
        'images',
      );
    });

    it('지정된 폴더에 업로드해야 함', async () => {
      mockUploadService.uploadImage.mockResolvedValue(mockUploadResult);

      const mockFile = {
        buffer: Buffer.from('test'),
        mimetype: 'image/png',
        originalname: 'test.png',
        size: 2048,
      } as Express.Multer.File;

      await controller.uploadImage(mockFile, 'posts');

      expect(mockUploadService.uploadImage).toHaveBeenCalledWith(
        mockFile.buffer,
        'image/png',
        'posts',
      );
    });
  });

  describe('uploadImages', () => {
    it('여러 이미지를 업로드해야 함', async () => {
      mockUploadService.uploadImage.mockResolvedValue(mockUploadResult);
      mockUploadService.validateMimeType.mockReturnValue(true);
      mockUploadService.validateFileSize.mockReturnValue(true);

      const mockFiles = [
        {
          buffer: Buffer.from('test1'),
          mimetype: 'image/jpeg',
          originalname: 'test1.jpg',
          size: 1024,
        },
        {
          buffer: Buffer.from('test2'),
          mimetype: 'image/png',
          originalname: 'test2.png',
          size: 2048,
        },
      ] as Express.Multer.File[];

      const result = await controller.uploadImages(mockFiles);

      expect(result).toHaveLength(2);
      expect(mockUploadService.uploadImage).toHaveBeenCalledTimes(2);
    });

    it('지정된 폴더에 여러 이미지를 업로드해야 함', async () => {
      mockUploadService.uploadImage.mockResolvedValue(mockUploadResult);
      mockUploadService.validateMimeType.mockReturnValue(true);
      mockUploadService.validateFileSize.mockReturnValue(true);

      const mockFiles = [
        {
          buffer: Buffer.from('test1'),
          mimetype: 'image/jpeg',
          originalname: 'test1.jpg',
          size: 1024,
        },
      ] as Express.Multer.File[];

      await controller.uploadImages(mockFiles, 'comments');

      expect(mockUploadService.uploadImage).toHaveBeenCalledWith(
        expect.any(Buffer),
        'image/jpeg',
        'comments',
      );
    });

    it('각 파일의 MIME 타입과 크기를 검증해야 함', async () => {
      mockUploadService.uploadImage.mockResolvedValue(mockUploadResult);
      mockUploadService.validateMimeType.mockReturnValue(true);
      mockUploadService.validateFileSize.mockReturnValue(true);

      const mockFiles = [
        {
          buffer: Buffer.from('test1'),
          mimetype: 'image/jpeg',
          originalname: 'test1.jpg',
          size: 1024,
        },
      ] as Express.Multer.File[];

      await controller.uploadImages(mockFiles);

      expect(mockUploadService.validateMimeType).toHaveBeenCalledWith(
        'image/jpeg',
      );
      expect(mockUploadService.validateFileSize).toHaveBeenCalledWith(1024);
    });
  });

  describe('getPresignedUrl', () => {
    it('Presigned URL을 발급해야 함', async () => {
      mockUploadService.getPresignedUploadUrl.mockResolvedValue(
        mockPresignedUrlResult,
      );

      const result = await controller.getPresignedUrl({
        mimeType: 'image/jpeg',
      });

      expect(result).toEqual(mockPresignedUrlResult);
      expect(mockUploadService.getPresignedUploadUrl).toHaveBeenCalledWith(
        'image/jpeg',
        'images',
      );
    });

    it('지정된 폴더에 대한 Presigned URL을 발급해야 함', async () => {
      mockUploadService.getPresignedUploadUrl.mockResolvedValue(
        mockPresignedUrlResult,
      );

      await controller.getPresignedUrl({
        mimeType: 'image/png',
        folder: 'posts',
      });

      expect(mockUploadService.getPresignedUploadUrl).toHaveBeenCalledWith(
        'image/png',
        'posts',
      );
    });
  });

  describe('deleteImage', () => {
    it('이미지를 삭제해야 함', async () => {
      mockUploadService.deleteImage.mockResolvedValue(undefined);

      const result = await controller.deleteImage('images/test.jpg');

      expect(result.message).toBe('이미지가 삭제되었습니다.');
      expect(mockUploadService.deleteImage).toHaveBeenCalledWith(
        'images/test.jpg',
      );
    });

    it('URL 인코딩된 키를 디코딩해서 삭제해야 함', async () => {
      mockUploadService.deleteImage.mockResolvedValue(undefined);

      await controller.deleteImage('images%2Ftest%20file.jpg');

      expect(mockUploadService.deleteImage).toHaveBeenCalledWith(
        'images/test file.jpg',
      );
    });
  });

  describe('deleteImages', () => {
    it('여러 이미지를 삭제해야 함', async () => {
      mockUploadService.deleteImages.mockResolvedValue(undefined);

      const keys = ['images/test1.jpg', 'images/test2.jpg', 'images/test3.jpg'];

      const result = await controller.deleteImages(keys);

      expect(result.message).toBe('이미지들이 삭제되었습니다.');
      expect(result.deletedCount).toBe(3);
      expect(mockUploadService.deleteImages).toHaveBeenCalledWith(keys);
    });

    it('빈 배열을 전달하면 0개 삭제를 반환해야 함', async () => {
      mockUploadService.deleteImages.mockResolvedValue(undefined);

      const result = await controller.deleteImages([]);

      expect(result.deletedCount).toBe(0);
    });
  });
});
