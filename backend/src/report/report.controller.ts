import {
  Controller,
  Post,
  Get,
  Body,
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
import { ReportService } from './report.service';
import { CreateReportDto } from './dto/create-report.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { User } from '@prisma/client';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportController {
  constructor(private reportService: ReportService) {}

  @Post()
  @ApiOperation({ summary: '신고하기' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '신고가 접수되었습니다.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: '이미 신고한 대상입니다.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '잘못된 요청입니다.',
  })
  async create(@CurrentUser() user: User, @Body() dto: CreateReportDto) {
    const report = await this.reportService.create(user.id, dto);
    return {
      message: '신고가 접수되었습니다.',
      reportId: report.id,
    };
  }

  @Get('my')
  @ApiOperation({ summary: '내 신고 목록 조회' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '신고 목록 반환',
  })
  async findMyReports(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reportService.findMyReports(
      user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }
}
