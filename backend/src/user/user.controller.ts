import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length } from 'class-validator';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { User } from '@prisma/client';

class UpdateNicknameDto {
  @IsString()
  @IsNotEmpty({ message: '닉네임을 입력해주세요.' })
  @Length(2, 20, { message: '닉네임은 2자 이상 20자 이하로 입력해주세요.' })
  nickname: string;
}

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private userService: UserService) {}

  @Get('me')
  @ApiOperation({ summary: '내 정보 조회' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '사용자 정보 및 활동 통계 반환',
  })
  async getMe(@CurrentUser() user: User) {
    const [fullUser, stats] = await Promise.all([
      this.userService.findById(user.id),
      this.userService.getUserStats(user.id),
    ]);
    return { user: fullUser, stats };
  }

  @Patch('nickname')
  @ApiOperation({ summary: '닉네임 변경' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nickname: {
          type: 'string',
          description: '새 닉네임',
          example: '익명의크리에이터',
        },
      },
      required: ['nickname'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '닉네임 변경 성공',
  })
  async updateNickname(
    @CurrentUser() user: User,
    @Body() dto: UpdateNicknameDto,
  ) {
    const updatedUser = await this.userService.updateNickname(user.id, dto.nickname);
    return {
      message: '닉네임이 변경되었습니다.',
      user: updatedUser,
    };
  }

  @Get('accounts')
  @ApiOperation({ summary: '연결된 소셜 계정 목록 조회' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '계정 목록 반환',
  })
  async getAccounts(@CurrentUser() user: User) {
    const accounts = await this.userService.getAccounts(user.id);
    return { accounts };
  }
}
