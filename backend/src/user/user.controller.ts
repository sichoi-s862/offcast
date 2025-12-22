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
  @IsNotEmpty({ message: 'Please enter a nickname.' })
  @Length(2, 20, { message: 'Nickname must be between 2 and 20 characters.' })
  nickname: string;
}

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private userService: UserService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get my profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns user info and activity stats',
  })
  async getMe(@CurrentUser() user: User) {
    const [fullUser, stats] = await Promise.all([
      this.userService.findById(user.id),
      this.userService.getUserStats(user.id),
    ]);
    return { user: fullUser, stats };
  }

  @Patch('nickname')
  @ApiOperation({ summary: 'Update nickname' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nickname: {
          type: 'string',
          description: 'New nickname',
          example: 'AnonymousCreator',
        },
      },
      required: ['nickname'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Nickname updated successfully',
  })
  async updateNickname(
    @CurrentUser() user: User,
    @Body() dto: UpdateNicknameDto,
  ) {
    const updatedUser = await this.userService.updateNickname(user.id, dto.nickname);
    return {
      message: 'Nickname has been updated.',
      user: updatedUser,
    };
  }

  @Get('accounts')
  @ApiOperation({ summary: 'Get linked social accounts' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns list of linked accounts',
  })
  async getAccounts(@CurrentUser() user: User) {
    const accounts = await this.userService.getAccounts(user.id);
    return { accounts };
  }
}
