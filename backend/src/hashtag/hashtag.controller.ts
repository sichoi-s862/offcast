import {
  Controller,
  Get,
  Query,
  Param,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { HashtagService } from './hashtag.service';
import { Public } from '../common/decorators/public.decorator';

/**
 * 해시태그 컨트롤러
 * - 해시태그 검색, 인기/트렌딩 해시태그 조회
 */
@ApiTags('Hashtag')
@Controller('hashtags')
export class HashtagController {
  constructor(private hashtagService: HashtagService) {}

  /**
   * 해시태그 검색 (자동완성용)
   */
  @Public()
  @Get('search')
  @ApiOperation({
    summary: '해시태그 검색 (자동완성용)',
    description: '입력된 키워드로 시작하는 해시태그를 검색합니다',
  })
  @ApiQuery({ name: 'q', description: '검색 키워드' })
  @ApiQuery({ name: 'limit', required: false, description: '결과 개수 제한' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '검색 결과 반환',
  })
  async search(
    @Query('q') keyword: string,
    @Query('limit') limit?: number,
  ) {
    return this.hashtagService.search(keyword, limit);
  }

  /**
   * 인기 해시태그 목록 조회
   */
  @Public()
  @Get('popular')
  @ApiOperation({
    summary: '인기 해시태그 목록 조회',
    description: '사용 횟수 기준 인기 해시태그를 조회합니다',
  })
  @ApiQuery({ name: 'limit', required: false, description: '결과 개수 제한' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '인기 해시태그 목록 반환',
  })
  async getPopular(@Query('limit') limit?: number) {
    return this.hashtagService.getPopular(limit);
  }

  /**
   * 트렌딩 해시태그 목록 조회 (최근 24시간)
   */
  @Public()
  @Get('trending')
  @ApiOperation({
    summary: '트렌딩 해시태그 목록 조회',
    description: '최근 24시간 내 많이 사용된 해시태그를 조회합니다',
  })
  @ApiQuery({ name: 'limit', required: false, description: '결과 개수 제한' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '트렌딩 해시태그 목록 반환',
  })
  async getTrending(@Query('limit') limit?: number) {
    return this.hashtagService.getTrending(limit);
  }

  /**
   * 특정 해시태그의 게시글 목록 조회
   */
  @Public()
  @Get(':name/posts')
  @ApiOperation({
    summary: '특정 해시태그의 게시글 목록 조회',
    description: '해당 해시태그가 포함된 게시글을 조회합니다',
  })
  @ApiParam({ name: 'name', description: '해시태그 이름 (# 제외)' })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호' })
  @ApiQuery({ name: 'limit', required: false, description: '페이지 크기' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '게시글 목록 반환',
  })
  async getPostsByHashtag(
    @Param('name') name: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.hashtagService.getPostsByHashtag(name, page, limit);
  }

  /**
   * 특정 해시태그 상세 조회
   */
  @Public()
  @Get(':name')
  @ApiOperation({ summary: '특정 해시태그 상세 조회' })
  @ApiParam({ name: 'name', description: '해시태그 이름 (# 제외)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '해시태그 정보 반환',
  })
  async findByName(@Param('name') name: string) {
    return this.hashtagService.findByName(name);
  }
}
