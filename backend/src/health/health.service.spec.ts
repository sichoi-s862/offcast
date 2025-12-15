import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 헬스체크 서비스 테스트
 */
describe('HealthService', () => {
  let service: HealthService;
  let prisma: PrismaService;

  // Mock 데이터
  const mockAppVersion = {
    id: 'version-1',
    version: '1.2.0',
    description: '새로운 기능 추가',
    isForced: false,
    minVersion: '1.0.0',
    createdAt: new Date(),
  };

  // Prisma Mock
  const mockPrismaService = {
    $queryRaw: jest.fn(),
    appVersion: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHealth', () => {
    it('정상 상태를 반환해야 함', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

      const result = await service.getHealth();

      expect(result.status).toBe('ok');
      expect(result.database.status).toBe('ok');
      expect(result.database.latency).toBeDefined();
      expect(result.memory).toBeDefined();
      expect(result.uptime).toBeGreaterThan(0);
    });

    it('DB 연결 실패 시 error 상태를 반환해야 함', async () => {
      mockPrismaService.$queryRaw.mockRejectedValue(new Error('DB 연결 실패'));

      const result = await service.getHealth();

      expect(result.status).toBe('error');
      expect(result.database.status).toBe('error');
      expect(result.database.error).toBe('DB 연결 실패');
    });
  });

  describe('ping', () => {
    it('pong 응답을 반환해야 함', async () => {
      const result = await service.ping();

      expect(result.pong).toBe(true);
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('getLatestVersion', () => {
    it('최신 버전 정보를 반환해야 함', async () => {
      mockPrismaService.appVersion.findFirst.mockResolvedValue(mockAppVersion);

      const result = await service.getLatestVersion();

      expect(result).toBeDefined();
      expect(result!.currentVersion).toBe('1.2.0');
      expect(result!.minVersion).toBe('1.0.0');
      expect(result!.isForceUpdate).toBe(false);
    });

    it('버전 정보가 없으면 null을 반환해야 함', async () => {
      mockPrismaService.appVersion.findFirst.mockResolvedValue(null);

      const result = await service.getLatestVersion();

      expect(result).toBeNull();
    });
  });

  describe('checkVersionCompatibility', () => {
    it('최신 버전은 호환되고 업데이트 불필요', async () => {
      mockPrismaService.appVersion.findFirst.mockResolvedValue(mockAppVersion);

      const result = await service.checkVersionCompatibility('1.2.0');

      expect(result.isCompatible).toBe(true);
      expect(result.needsUpdate).toBe(false);
      expect(result.isForceUpdate).toBe(false);
    });

    it('구버전은 호환되지만 업데이트 필요', async () => {
      mockPrismaService.appVersion.findFirst.mockResolvedValue(mockAppVersion);

      const result = await service.checkVersionCompatibility('1.1.0');

      expect(result.isCompatible).toBe(true);
      expect(result.needsUpdate).toBe(true);
      expect(result.isForceUpdate).toBe(false);
    });

    it('최소 버전 미만은 호환되지 않음', async () => {
      mockPrismaService.appVersion.findFirst.mockResolvedValue({
        ...mockAppVersion,
        isForced: true,
      });

      const result = await service.checkVersionCompatibility('0.9.0');

      expect(result.isCompatible).toBe(false);
      expect(result.needsUpdate).toBe(true);
      expect(result.isForceUpdate).toBe(true);
    });

    it('버전 정보가 없으면 호환으로 처리', async () => {
      mockPrismaService.appVersion.findFirst.mockResolvedValue(null);

      const result = await service.checkVersionCompatibility('1.0.0');

      expect(result.isCompatible).toBe(true);
      expect(result.needsUpdate).toBe(false);
    });
  });

  describe('createVersion', () => {
    it('새 버전을 생성해야 함', async () => {
      mockPrismaService.appVersion.create.mockResolvedValue({
        id: 'version-2',
        version: '1.3.0',
        description: '버그 수정',
        isForced: false,
        minVersion: '1.1.0',
        createdAt: new Date(),
      });

      const result = await service.createVersion('1.3.0', {
        description: '버그 수정',
        minVersion: '1.1.0',
      });

      expect(result.version).toBe('1.3.0');
      expect(mockPrismaService.appVersion.create).toHaveBeenCalledWith({
        data: {
          version: '1.3.0',
          description: '버그 수정',
          isForced: false,
          minVersion: '1.1.0',
        },
      });
    });

    it('강제 업데이트 버전을 생성할 수 있어야 함', async () => {
      mockPrismaService.appVersion.create.mockResolvedValue({
        id: 'version-3',
        version: '2.0.0',
        description: '메이저 업데이트',
        isForced: true,
        minVersion: '2.0.0',
        createdAt: new Date(),
      });

      const result = await service.createVersion('2.0.0', {
        description: '메이저 업데이트',
        isForced: true,
        minVersion: '2.0.0',
      });

      expect(result.isForced).toBe(true);
    });
  });

  describe('getAllVersions', () => {
    it('모든 버전을 반환해야 함', async () => {
      const versions = [
        mockAppVersion,
        { ...mockAppVersion, id: 'version-2', version: '1.1.0' },
      ];
      mockPrismaService.appVersion.findMany.mockResolvedValue(versions);

      const result = await service.getAllVersions();

      expect(result).toHaveLength(2);
      expect(mockPrismaService.appVersion.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('compareVersions (private method - 간접 테스트)', () => {
    it('시맨틱 버전을 올바르게 비교해야 함', async () => {
      mockPrismaService.appVersion.findFirst.mockResolvedValue({
        ...mockAppVersion,
        version: '2.0.0',
        minVersion: '1.5.0',
      });

      // 1.4.9 < 1.5.0 (min) -> 호환 안됨
      let result = await service.checkVersionCompatibility('1.4.9');
      expect(result.isCompatible).toBe(false);

      // 1.5.0 == 1.5.0 (min) -> 호환됨
      result = await service.checkVersionCompatibility('1.5.0');
      expect(result.isCompatible).toBe(true);

      // 1.10.0 > 1.5.0 (min) -> 호환됨
      result = await service.checkVersionCompatibility('1.10.0');
      expect(result.isCompatible).toBe(true);
    });
  });
});
