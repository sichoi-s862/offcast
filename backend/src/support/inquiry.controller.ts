import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { InquiryService } from './inquiry.service';
import { CreateInquiryDto } from './dto/inquiry.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { User } from '@prisma/client';

@ApiTags('Support - Inquiry')
@Controller('inquiries')
export class InquiryController {
  constructor(private inquiryService: InquiryService) {}

  /**
   * 문의 생성
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '문의 생성' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '문의 생성 완료',
  })
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateInquiryDto,
  ) {
    const inquiry = await this.inquiryService.create(dto, user.id);
    return {
      message: '문의가 접수되었습니다.',
      inquiry: {
        id: inquiry.id,
        category: inquiry.category,
        title: inquiry.title,
        status: inquiry.status,
        createdAt: inquiry.createdAt,
      },
    };
  }

  /**
   * 비회원 문의 생성
   */
  @Public()
  @Post('guest')
  @ApiOperation({ summary: '비회원 문의 생성' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '문의 생성 완료',
  })
  async createGuest(@Body() dto: CreateInquiryDto) {
    if (!dto.email) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: '이메일을 입력해주세요.',
      };
    }

    const inquiry = await this.inquiryService.create(dto);
    return {
      message: '문의가 접수되었습니다.',
      inquiry: {
        id: inquiry.id,
        category: inquiry.category,
        title: inquiry.title,
        status: inquiry.status,
        createdAt: inquiry.createdAt,
      },
    };
  }

  /**
   * 내 문의 목록 조회
   */
  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 문의 목록 조회' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '문의 목록 반환',
  })
  async findMyInquiries(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inquiryService.findByUser(
      user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  /**
   * 문의 상세 조회
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '문의 상세 조회' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '문의 상세 정보 반환',
  })
  async findById(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    const inquiry = await this.inquiryService.findById(id, user.id);
    if (!inquiry) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: '문의를 찾을 수 없습니다.',
      };
    }
    return { inquiry };
  }
}
