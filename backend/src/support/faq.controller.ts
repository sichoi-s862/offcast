import {
  Controller,
  Get,
  Query,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { FaqService } from './faq.service';
import { Public } from '../common/decorators/public.decorator';
import { FaqCategory } from '@prisma/client';

@ApiTags('Support - FAQ')
@Controller('faqs')
@Public()
export class FaqController {
  constructor(private faqService: FaqService) {}

  /**
   * FAQ 전체 조회
   */
  @Get()
  @ApiOperation({ summary: 'FAQ 전체 조회' })
  @ApiQuery({ name: 'category', required: false, enum: FaqCategory })
  @ApiQuery({ name: 'search', required: false, description: '검색어' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'FAQ 목록 반환',
  })
  async findAll(
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    // 검색어가 있으면 검색
    if (search) {
      const faqs = await this.faqService.search(search);
      return { faqs };
    }

    // 카테고리 필터
    if (category && Object.values(FaqCategory).includes(category as FaqCategory)) {
      const faqs = await this.faqService.findByCategory(category as FaqCategory);
      return { faqs };
    }

    // 전체 조회
    const faqs = await this.faqService.findAll();
    return { faqs };
  }

  /**
   * FAQ 카테고리 목록 조회
   */
  @Get('categories')
  @ApiOperation({ summary: 'FAQ 카테고리 목록 조회' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'FAQ 카테고리 목록 반환',
  })
  getCategories() {
    return {
      categories: [
        { value: 'ACCOUNT', label: '계정' },
        { value: 'COMMUNITY', label: '커뮤니티' },
        { value: 'CHANNEL', label: '채널/등급' },
        { value: 'REPORT', label: '신고/차단' },
        { value: 'OTHER', label: '기타' },
      ],
    };
  }
}
