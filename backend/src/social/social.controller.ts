import {
  Controller,
  Get,
  Param,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { SocialService, type SocialProvider } from './social.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { User } from '@prisma/client';

@ApiTags('Social')
@Controller('social')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SocialController {
  constructor(private socialService: SocialService) {}

  @Get('accounts')
  @ApiOperation({ summary: '연결된 소셜 계정 목록' })
  @ApiResponse({ status: HttpStatus.OK, description: '연결된 계정 목록 반환' })
  async getLinkedAccounts(@CurrentUser() user: User) {
    return this.socialService.getLinkedAccounts(user.id);
  }

  @Get('youtube/stats')
  @ApiOperation({ summary: 'YouTube 채널 통계' })
  @ApiResponse({ status: HttpStatus.OK, description: '구독자 수 등 채널 통계 반환' })
  async getYouTubeStats(@CurrentUser() user: User) {
    return this.socialService.getYouTubeStats(user.id);
  }

  @Get('tiktok/stats')
  @ApiOperation({ summary: 'TikTok 계정 통계' })
  @ApiResponse({ status: HttpStatus.OK, description: '팔로워 수 등 계정 통계 반환' })
  async getTikTokStats(@CurrentUser() user: User) {
    return this.socialService.getTikTokStats(user.id);
  }

  @Get('soop/stats')
  @ApiOperation({ summary: 'SOOP 채널 통계' })
  @ApiResponse({ status: HttpStatus.OK, description: '팬 수 등 채널 통계 반환' })
  async getSoopStats(@CurrentUser() user: User) {
    return this.socialService.getSoopStats(user.id);
  }

  @Get('chzzk/stats')
  @ApiOperation({ summary: 'Chzzk 채널 통계' })
  @ApiResponse({ status: HttpStatus.OK, description: '팔로워 수 등 채널 통계 반환' })
  async getChzzkStats(@CurrentUser() user: User) {
    return this.socialService.getChzzkStats(user.id);
  }

  @Get('all')
  @ApiOperation({ summary: '모든 연결된 플랫폼 통계' })
  @ApiResponse({ status: HttpStatus.OK, description: '모든 연결된 플랫폼의 통계 반환' })
  async getAllStats(@CurrentUser() user: User) {
    return this.socialService.getAllStats(user.id);
  }

  @Get(':provider/stats')
  @ApiOperation({ summary: '특정 플랫폼 통계 조회' })
  @ApiParam({
    name: 'provider',
    enum: ['youtube', 'tiktok', 'soop', 'chzzk'],
    description: '플랫폼 이름',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '플랫폼별 통계 반환' })
  async getStatsByProvider(
    @CurrentUser() user: User,
    @Param('provider') provider: SocialProvider,
  ) {
    return this.socialService.getStatsByProvider(user.id, provider);
  }
}
