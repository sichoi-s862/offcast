import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { HealthService } from './health.service';
import { Public } from '../common/decorators/public.decorator';

/**
 * 헬스체크 컨트롤러
 * - 서버 상태 확인
 * - 앱 버전 관리
 */
@ApiTags('Health')
@Controller('health')
@SkipThrottle()
export class HealthController {
  constructor(private healthService: HealthService) {}

  /**
   * 서버 상태 확인
   */
  @Public()
  @Get()
  @ApiOperation({
    summary: '서버 상태 확인',
    description: '서버, 데이터베이스, 메모리 상태를 확인합니다.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '서버 상태 정보',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['ok', 'error'] },
        timestamp: { type: 'string', format: 'date-time' },
        uptime: { type: 'number', description: '서버 가동 시간 (초)' },
        database: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['ok', 'error'] },
            latency: { type: 'number', description: 'DB 응답 시간 (ms)' },
          },
        },
        memory: {
          type: 'object',
          properties: {
            heapUsed: { type: 'number' },
            heapTotal: { type: 'number' },
            external: { type: 'number' },
            rss: { type: 'number' },
          },
        },
      },
    },
  })
  async getHealth() {
    return this.healthService.getHealth();
  }

  /**
   * 간단한 생존 체크 (로드밸런서용)
   */
  @Public()
  @Get('ping')
  @ApiOperation({
    summary: '생존 체크',
    description: '로드밸런서 및 모니터링용 간단한 생존 체크입니다.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    schema: {
      type: 'object',
      properties: {
        pong: { type: 'boolean' },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  async ping() {
    return this.healthService.ping();
  }

  /**
   * 최신 앱 버전 정보 조회
   */
  @Public()
  @Get('version')
  @ApiOperation({
    summary: '최신 앱 버전 정보',
    description: '최신 앱 버전과 최소 지원 버전 정보를 조회합니다.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    schema: {
      type: 'object',
      properties: {
        currentVersion: { type: 'string', example: '1.0.0' },
        minVersion: { type: 'string', example: '1.0.0' },
        isForceUpdate: { type: 'boolean' },
        description: { type: 'string' },
      },
    },
  })
  async getLatestVersion() {
    const version = await this.healthService.getLatestVersion();
    if (!version) {
      return {
        currentVersion: '1.0.0',
        minVersion: '1.0.0',
        isForceUpdate: false,
        description: '초기 버전',
      };
    }
    return version;
  }

  /**
   * 앱 버전 호환성 확인
   */
  @Public()
  @Get('version/check')
  @ApiOperation({
    summary: '앱 버전 호환성 확인',
    description: '클라이언트 앱 버전의 호환성과 업데이트 필요 여부를 확인합니다.',
  })
  @ApiQuery({
    name: 'version',
    type: 'string',
    description: '클라이언트 앱 버전',
    example: '1.0.0',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    schema: {
      type: 'object',
      properties: {
        isCompatible: { type: 'boolean', description: '호환 여부' },
        needsUpdate: { type: 'boolean', description: '업데이트 필요 여부' },
        isForceUpdate: { type: 'boolean', description: '강제 업데이트 여부' },
        latestVersion: { type: 'string', description: '최신 버전' },
        minVersion: { type: 'string', description: '최소 지원 버전' },
      },
    },
  })
  async checkVersionCompatibility(@Query('version') version: string) {
    return this.healthService.checkVersionCompatibility(version);
  }

  /**
   * 새 앱 버전 등록 (관리자 전용 - 추후 권한 체크 추가)
   */
  @Post('version')
  @ApiOperation({
    summary: '새 앱 버전 등록',
    description: '새로운 앱 버전을 등록합니다. (관리자 전용)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        version: { type: 'string', example: '1.1.0' },
        description: { type: 'string', example: '버그 수정 및 성능 개선' },
        isForced: { type: 'boolean', example: false },
        minVersion: { type: 'string', example: '1.0.0' },
      },
      required: ['version'],
    },
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: '버전 등록 성공' })
  async createVersion(
    @Body()
    body: {
      version: string;
      description?: string;
      isForced?: boolean;
      minVersion?: string;
    },
  ) {
    return this.healthService.createVersion(body.version, {
      description: body.description,
      isForced: body.isForced,
      minVersion: body.minVersion,
    });
  }

  /**
   * 모든 앱 버전 조회
   */
  @Public()
  @Get('versions')
  @ApiOperation({
    summary: '모든 앱 버전 조회',
    description: '등록된 모든 앱 버전을 조회합니다.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          version: { type: 'string' },
          description: { type: 'string' },
          isForced: { type: 'boolean' },
          minVersion: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  async getAllVersions() {
    return this.healthService.getAllVersions();
  }
}
