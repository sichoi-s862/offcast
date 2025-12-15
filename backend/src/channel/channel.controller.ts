import {
  Controller,
  Get,
  Post,
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
import { ChannelService } from './channel.service';
import { UserService } from '../user/user.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { User } from '@prisma/client';

/**
 * 채널 컨트롤러
 * - 채널 목록 조회, 접근 권한 관리
 */
@ApiTags('Channel')
@Controller('channels')
export class ChannelController {
  constructor(
    private channelService: ChannelService,
    private userService: UserService,
  ) {}

  /**
   * 모든 채널 목록 조회
   */
  @Public()
  @Get()
  @ApiOperation({ summary: '모든 채널 목록 조회' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '채널 목록 반환',
  })
  async findAll() {
    return this.channelService.findAll();
  }

  /**
   * 내가 접근 가능한 채널 목록 조회
   */
  @Get('accessible')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내가 접근 가능한 채널 목록 조회' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '접근 가능한 채널 목록 반환',
  })
  async getAccessibleChannels(@CurrentUser() user: User) {
    // 사용자의 최대 구독자 수 조회
    const subscriberCount = await this.userService.getMaxSubscriberCount(user.id);
    return this.channelService.getAccessibleChannels(subscriberCount);
  }

  /**
   * 내 채널 접근 권한 목록 조회
   */
  @Get('my-accesses')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 채널 접근 권한 목록 조회' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '접근 권한 목록 반환',
  })
  async getMyAccesses(@CurrentUser() user: User) {
    return this.channelService.getUserAccesses(user.id);
  }

  /**
   * 채널 접근 권한 갱신
   * - 현재 구독자 수 기반으로 접근 권한 재계산
   */
  @Post('refresh-access')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '채널 접근 권한 갱신',
    description: '현재 구독자 수 기반으로 접근 권한을 재계산합니다',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '갱신된 접근 권한 목록 반환',
  })
  async refreshAccess(@CurrentUser() user: User) {
    const subscriberCount = await this.userService.getMaxSubscriberCount(user.id);
    return this.channelService.refreshAccessBySubscriberCount(
      user.id,
      subscriberCount,
    );
  }

  /**
   * 특정 채널 조회 (슬러그)
   */
  @Public()
  @Get(':slug')
  @ApiOperation({ summary: '특정 채널 조회' })
  @ApiParam({ name: 'slug', description: '채널 슬러그' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '채널 정보 반환',
  })
  async findBySlug(@Param('slug') slug: string) {
    return this.channelService.findBySlug(slug);
  }

  /**
   * 특정 채널 접근 권한 확인
   */
  @Get(':id/check-access')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '특정 채널 접근 권한 확인' })
  @ApiParam({ name: 'id', description: '채널 ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '접근 가능 여부 반환',
  })
  async checkAccess(
    @CurrentUser() user: User,
    @Param('id') channelId: string,
  ) {
    const hasAccess = await this.channelService.checkAccess(user.id, channelId);
    return { hasAccess };
  }

  /**
   * 기본 채널 시드 (개발용)
   */
  @Public()
  @Post('seed')
  @ApiOperation({
    summary: '기본 채널 시드 데이터 생성 (개발용)',
    description: '자유 게시판, 1만/10만/100만 라운지 생성',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '시드 완료',
  })
  async seed() {
    await this.channelService.seedDefaultChannels();
    return { message: '기본 채널이 생성되었습니다' };
  }
}
