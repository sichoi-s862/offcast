import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 헬스체크 상태 인터페이스
 */
export interface HealthStatus {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  database: {
    status: 'ok' | 'error';
    latency?: number;
    error?: string;
  };
  memory: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
}

/**
 * 앱 버전 정보 인터페이스
 */
export interface AppVersionInfo {
  currentVersion: string;
  minVersion: string;
  isForceUpdate: boolean;
  description?: string;
}

/**
 * 헬스체크 서비스
 * - 서버 상태 확인
 * - 앱 버전 관리
 */
@Injectable()
export class HealthService {
  constructor(private prisma: PrismaService) {}

  /**
   * 서버 상태 확인
   */
  async getHealth(): Promise<HealthStatus> {
    const timestamp = new Date().toISOString();
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    // 데이터베이스 연결 확인
    let dbStatus: HealthStatus['database'];
    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;
      dbStatus = { status: 'ok', latency };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      dbStatus = { status: 'error', error: errorMessage };
    }

    const status = dbStatus.status === 'ok' ? 'ok' : 'error';

    return {
      status,
      timestamp,
      uptime,
      database: dbStatus,
      memory: {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external,
        rss: memoryUsage.rss,
      },
    };
  }

  /**
   * 간단한 생존 체크 (로드밸런서용)
   */
  async ping(): Promise<{ pong: boolean; timestamp: string }> {
    return {
      pong: true,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 최신 앱 버전 정보 조회
   */
  async getLatestVersion(): Promise<AppVersionInfo | null> {
    const latestVersion = await this.prisma.appVersion.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!latestVersion) {
      return null;
    }

    return {
      currentVersion: latestVersion.version,
      minVersion: latestVersion.minVersion || latestVersion.version,
      isForceUpdate: latestVersion.isForced,
      description: latestVersion.description || undefined,
    };
  }

  /**
   * 앱 버전 호환성 확인
   * @param clientVersion - 클라이언트 앱 버전
   */
  async checkVersionCompatibility(
    clientVersion: string,
  ): Promise<{
    isCompatible: boolean;
    needsUpdate: boolean;
    isForceUpdate: boolean;
    latestVersion: string;
    minVersion: string;
  }> {
    const versionInfo = await this.getLatestVersion();

    if (!versionInfo) {
      // 버전 정보가 없으면 호환으로 처리
      return {
        isCompatible: true,
        needsUpdate: false,
        isForceUpdate: false,
        latestVersion: clientVersion,
        minVersion: clientVersion,
      };
    }

    const isCompatible = this.compareVersions(
      clientVersion,
      versionInfo.minVersion,
    ) >= 0;
    const needsUpdate = this.compareVersions(
      clientVersion,
      versionInfo.currentVersion,
    ) < 0;
    const isForceUpdate = !isCompatible && versionInfo.isForceUpdate;

    return {
      isCompatible,
      needsUpdate,
      isForceUpdate,
      latestVersion: versionInfo.currentVersion,
      minVersion: versionInfo.minVersion,
    };
  }

  /**
   * 새 앱 버전 등록
   */
  async createVersion(
    version: string,
    options?: {
      description?: string;
      isForced?: boolean;
      minVersion?: string;
    },
  ) {
    return this.prisma.appVersion.create({
      data: {
        version,
        description: options?.description,
        isForced: options?.isForced ?? false,
        minVersion: options?.minVersion,
      },
    });
  }

  /**
   * 모든 앱 버전 조회
   */
  async getAllVersions() {
    return this.prisma.appVersion.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 시맨틱 버전 비교
   * @returns 양수면 v1 > v2, 음수면 v1 < v2, 0이면 동일
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    const maxLength = Math.max(parts1.length, parts2.length);

    for (let i = 0; i < maxLength; i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;

      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }

    return 0;
  }
}
