import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

/**
 * 헬스체크 컨트롤러 테스트
 */
describe('HealthController', () => {
  let controller: HealthController;

  // Mock 데이터
  const mockHealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: 12345,
    database: {
      status: 'ok',
      latency: 5,
    },
    memory: {
      heapUsed: 50000000,
      heapTotal: 100000000,
      external: 10000000,
      rss: 80000000,
    },
  };

  const mockPingResponse = {
    pong: true,
    timestamp: new Date().toISOString(),
  };

  const mockVersion = {
    id: 'version-1',
    version: '1.0.0',
    description: '초기 버전',
    isForced: false,
    minVersion: '1.0.0',
    createdAt: new Date(),
  };

  const mockVersionCompatibility = {
    isCompatible: true,
    needsUpdate: false,
    isForceUpdate: false,
    latestVersion: '1.0.0',
    minVersion: '1.0.0',
  };

  // Mock Services
  const mockHealthService = {
    getHealth: jest.fn(),
    ping: jest.fn(),
    getLatestVersion: jest.fn(),
    checkVersionCompatibility: jest.fn(),
    createVersion: jest.fn(),
    getAllVersions: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: HealthService, useValue: mockHealthService }],
    }).compile();

    controller = module.get<HealthController>(HealthController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getHealth', () => {
    it('서버 상태를 반환해야 함', async () => {
      mockHealthService.getHealth.mockResolvedValue(mockHealthResponse);

      const result = await controller.getHealth();

      expect(result.status).toBe('ok');
      expect(result.database.status).toBe('ok');
      expect(mockHealthService.getHealth).toHaveBeenCalled();
    });

    it('DB 에러 시 error 상태를 반환해야 함', async () => {
      const errorResponse = {
        ...mockHealthResponse,
        status: 'error',
        database: { status: 'error', latency: null },
      };
      mockHealthService.getHealth.mockResolvedValue(errorResponse);

      const result = await controller.getHealth();

      expect(result.status).toBe('error');
      expect(result.database.status).toBe('error');
    });
  });

  describe('ping', () => {
    it('ping 응답을 반환해야 함', async () => {
      mockHealthService.ping.mockResolvedValue(mockPingResponse);

      const result = await controller.ping();

      expect(result.pong).toBe(true);
      expect(mockHealthService.ping).toHaveBeenCalled();
    });
  });

  describe('getLatestVersion', () => {
    it('최신 버전 정보를 반환해야 함', async () => {
      mockHealthService.getLatestVersion.mockResolvedValue({
        currentVersion: '1.0.0',
        minVersion: '1.0.0',
        isForceUpdate: false,
        description: '초기 버전',
      });

      const result = await controller.getLatestVersion();

      expect(result.currentVersion).toBe('1.0.0');
      expect(mockHealthService.getLatestVersion).toHaveBeenCalled();
    });

    it('버전 정보가 없으면 기본값을 반환해야 함', async () => {
      mockHealthService.getLatestVersion.mockResolvedValue(null);

      const result = await controller.getLatestVersion();

      expect(result.currentVersion).toBe('1.0.0');
      expect(result.minVersion).toBe('1.0.0');
      expect(result.isForceUpdate).toBe(false);
      expect(result.description).toBe('초기 버전');
    });
  });

  describe('checkVersionCompatibility', () => {
    it('버전 호환성을 확인해야 함', async () => {
      mockHealthService.checkVersionCompatibility.mockResolvedValue(
        mockVersionCompatibility,
      );

      const result = await controller.checkVersionCompatibility('1.0.0');

      expect(result.isCompatible).toBe(true);
      expect(result.needsUpdate).toBe(false);
      expect(mockHealthService.checkVersionCompatibility).toHaveBeenCalledWith(
        '1.0.0',
      );
    });

    it('업데이트가 필요한 경우를 반환해야 함', async () => {
      mockHealthService.checkVersionCompatibility.mockResolvedValue({
        isCompatible: true,
        needsUpdate: true,
        isForceUpdate: false,
        latestVersion: '1.1.0',
        minVersion: '1.0.0',
      });

      const result = await controller.checkVersionCompatibility('1.0.0');

      expect(result.needsUpdate).toBe(true);
      expect(result.latestVersion).toBe('1.1.0');
    });

    it('강제 업데이트가 필요한 경우를 반환해야 함', async () => {
      mockHealthService.checkVersionCompatibility.mockResolvedValue({
        isCompatible: false,
        needsUpdate: true,
        isForceUpdate: true,
        latestVersion: '2.0.0',
        minVersion: '2.0.0',
      });

      const result = await controller.checkVersionCompatibility('1.0.0');

      expect(result.isCompatible).toBe(false);
      expect(result.isForceUpdate).toBe(true);
    });
  });

  describe('createVersion', () => {
    it('새 버전을 등록해야 함', async () => {
      mockHealthService.createVersion.mockResolvedValue(mockVersion);

      const result = await controller.createVersion({
        version: '1.1.0',
        description: '버그 수정',
      });

      expect(result.version).toBe('1.0.0');
      expect(mockHealthService.createVersion).toHaveBeenCalledWith('1.1.0', {
        description: '버그 수정',
        isForced: undefined,
        minVersion: undefined,
      });
    });

    it('강제 업데이트 버전을 등록해야 함', async () => {
      mockHealthService.createVersion.mockResolvedValue({
        ...mockVersion,
        version: '2.0.0',
        isForced: true,
      });

      await controller.createVersion({
        version: '2.0.0',
        description: '주요 업데이트',
        isForced: true,
        minVersion: '2.0.0',
      });

      expect(mockHealthService.createVersion).toHaveBeenCalledWith('2.0.0', {
        description: '주요 업데이트',
        isForced: true,
        minVersion: '2.0.0',
      });
    });
  });

  describe('getAllVersions', () => {
    it('모든 버전을 조회해야 함', async () => {
      mockHealthService.getAllVersions.mockResolvedValue([mockVersion]);

      const result = await controller.getAllVersions();

      expect(result).toHaveLength(1);
      expect(result[0].version).toBe('1.0.0');
      expect(mockHealthService.getAllVersions).toHaveBeenCalled();
    });

    it('버전이 없으면 빈 배열을 반환해야 함', async () => {
      mockHealthService.getAllVersions.mockResolvedValue([]);

      const result = await controller.getAllVersions();

      expect(result).toEqual([]);
    });
  });
});
