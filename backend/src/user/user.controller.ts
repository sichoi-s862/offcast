import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { IsString, IsNotEmpty, Length, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
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

enum AgreementTypeDto {
  TERMS_OF_SERVICE = 'TERMS_OF_SERVICE',
  PRIVACY_POLICY = 'PRIVACY_POLICY',
  MARKETING = 'MARKETING',
}

class AgreementItemDto {
  @IsEnum(AgreementTypeDto)
  type: AgreementTypeDto;

  @IsString()
  @IsNotEmpty()
  version: string;
}

class SaveAgreementsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AgreementItemDto)
  agreements: AgreementItemDto[];
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

  @Delete('withdraw')
  @ApiOperation({
    summary: 'Withdraw from service',
    description: 'Permanently delete your account. This action cannot be undone.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Account successfully withdrawn',
  })
  async withdraw(@CurrentUser() user: User) {
    await this.userService.withdraw(user.id);
    return { message: 'Your account has been successfully withdrawn.' };
  }

  @Post('agreements')
  @ApiOperation({
    summary: 'Save agreement consents',
    description: 'Save user agreement consents for terms, privacy policy, and marketing.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        agreements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['TERMS_OF_SERVICE', 'PRIVACY_POLICY', 'MARKETING'],
              },
              version: { type: 'string', example: '1.0.0' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Agreements saved successfully',
  })
  async saveAgreements(
    @CurrentUser() user: User,
    @Body() dto: SaveAgreementsDto,
  ) {
    await this.userService.saveAgreements(user.id, dto.agreements);
    return { message: 'Agreements have been saved.' };
  }

  @Get('agreements')
  @ApiOperation({ summary: 'Get my agreement consents' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns list of user agreements',
  })
  async getAgreements(@CurrentUser() user: User) {
    const agreements = await this.userService.getAgreements(user.id);
    const hasRequired = await this.userService.hasRequiredAgreements(user.id);
    return { agreements, hasRequiredAgreements: hasRequired };
  }
}
