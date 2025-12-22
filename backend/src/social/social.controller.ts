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
  @ApiOperation({ summary: 'List linked social accounts' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns list of linked accounts' })
  async getLinkedAccounts(@CurrentUser() user: User) {
    return this.socialService.getLinkedAccounts(user.id);
  }

  @Get('youtube/stats')
  @ApiOperation({ summary: 'YouTube channel statistics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns channel stats including subscriber count' })
  async getYouTubeStats(@CurrentUser() user: User) {
    return this.socialService.getYouTubeStats(user.id);
  }

  @Get('tiktok/stats')
  @ApiOperation({ summary: 'TikTok account statistics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns account stats including follower count' })
  async getTikTokStats(@CurrentUser() user: User) {
    return this.socialService.getTikTokStats(user.id);
  }

  @Get('twitch/stats')
  @ApiOperation({ summary: 'Twitch account statistics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns account stats including view count' })
  async getTwitchStats(@CurrentUser() user: User) {
    return this.socialService.getTwitchStats(user.id);
  }

  @Get('all')
  @ApiOperation({ summary: 'All linked platform statistics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns stats from all linked platforms' })
  async getAllStats(@CurrentUser() user: User) {
    return this.socialService.getAllStats(user.id);
  }

  @Get(':provider/stats')
  @ApiOperation({ summary: 'Get statistics by platform' })
  @ApiParam({
    name: 'provider',
    enum: ['youtube', 'tiktok', 'twitch'],
    description: 'Platform name',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns platform-specific stats' })
  async getStatsByProvider(
    @CurrentUser() user: User,
    @Param('provider') provider: SocialProvider,
  ) {
    return this.socialService.getStatsByProvider(user.id, provider);
  }
}
