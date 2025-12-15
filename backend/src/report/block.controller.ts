import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { BlockService } from './block.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { User } from '@prisma/client';

@ApiTags('Blocks')
@Controller('blocks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BlockController {
  constructor(private blockService: BlockService) {}

  @Post(':userId')
  @ApiOperation({ summary: '사용자 차단' })
  @ApiParam({ name: 'userId', description: '차단할 사용자 ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '차단 완료',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: '이미 차단한 사용자입니다.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '자기 자신을 차단할 수 없습니다.',
  })
  async blockUser(
    @CurrentUser() user: User,
    @Param('userId') blockedUserId: string,
  ) {
    await this.blockService.blockUser(user.id, blockedUserId);
    return { message: '차단되었습니다.' };
  }

  @Delete(':userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '차단 해제' })
  @ApiParam({ name: 'userId', description: '차단 해제할 사용자 ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '차단 해제 완료',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '차단 내역이 없습니다.',
  })
  async unblockUser(
    @CurrentUser() user: User,
    @Param('userId') blockedUserId: string,
  ) {
    await this.blockService.unblockUser(user.id, blockedUserId);
    return { message: '차단이 해제되었습니다.' };
  }

  @Get()
  @ApiOperation({ summary: '차단 목록 조회' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '차단 목록 반환',
  })
  async getBlockedUsers(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.blockService.getBlockedUsers(
      user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get(':userId/status')
  @ApiOperation({ summary: '특정 사용자 차단 여부 확인' })
  @ApiParam({ name: 'userId', description: '확인할 사용자 ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '차단 여부 반환',
  })
  async checkBlockStatus(
    @CurrentUser() user: User,
    @Param('userId') targetUserId: string,
  ) {
    const isBlocked = await this.blockService.isBlocked(user.id, targetUserId);
    return { isBlocked };
  }
}
