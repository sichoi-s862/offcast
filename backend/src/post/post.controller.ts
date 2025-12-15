import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PostService } from './post.service';
import { ChannelService } from '../channel/channel.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreatePostDto, UpdatePostDto, GetPostsQueryDto } from './dto/post.dto';
import type { User } from '@prisma/client';

/**
 * 게시글 컨트롤러
 * - 게시글 CRUD, 좋아요, 조회수 관리
 */
@ApiTags('Post')
@Controller('posts')
export class PostController {
  constructor(
    private postService: PostService,
    private channelService: ChannelService,
  ) {}

  /**
   * 게시글 목록 조회
   */
  @Public()
  @Get()
  @ApiOperation({ summary: '게시글 목록 조회' })
  @ApiQuery({ name: 'channelId', required: false, description: '채널 ID' })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호' })
  @ApiQuery({ name: 'limit', required: false, description: '페이지 크기' })
  @ApiQuery({ name: 'sort', required: false, enum: ['latest', 'popular', 'views'] })
  @ApiQuery({ name: 'keyword', required: false, description: '검색 키워드' })
  @ApiQuery({ name: 'hashtag', required: false, description: '해시태그 필터' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '게시글 목록 반환',
  })
  async findAll(@Query() query: GetPostsQueryDto) {
    return this.postService.findAll(query);
  }

  /**
   * 내 게시글 목록 조회
   */
  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 게시글 목록 조회' })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호' })
  @ApiQuery({ name: 'limit', required: false, description: '페이지 크기' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '내 게시글 목록 반환',
  })
  async findMyPosts(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.postService.findByAuthor(user.id, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 15,
    });
  }

  /**
   * 게시글 상세 조회
   */
  @Public()
  @Get(':id')
  @ApiOperation({ summary: '게시글 상세 조회' })
  @ApiParam({ name: 'id', description: '게시글 ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '게시글 상세 정보 반환',
  })
  async findById(@Param('id') id: string) {
    // 조회수 증가
    await this.postService.incrementViewCount(id);
    return this.postService.findById(id);
  }

  /**
   * 게시글 생성
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '게시글 생성' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '게시글 생성 완료',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: '채널 접근 권한 없음',
  })
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreatePostDto,
  ) {
    // 채널 접근 권한 확인
    const hasAccess = await this.channelService.checkAccess(user.id, dto.channelId);
    if (!hasAccess) {
      // 자유 게시판(minSubscribers: 0)인지 확인
      const channel = await this.channelService.findById(dto.channelId);
      if (!channel || channel.minSubscribers > 0) {
        return {
          statusCode: HttpStatus.FORBIDDEN,
          message: '해당 채널에 접근 권한이 없습니다',
        };
      }
    }

    return this.postService.create(user.id, dto);
  }

  /**
   * 게시글 수정
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '게시글 수정' })
  @ApiParam({ name: 'id', description: '게시글 ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '게시글 수정 완료',
  })
  async update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
  ) {
    return this.postService.update(id, user.id, dto);
  }

  /**
   * 게시글 삭제
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '게시글 삭제' })
  @ApiParam({ name: 'id', description: '게시글 ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '게시글 삭제 완료',
  })
  async delete(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    await this.postService.delete(id, user.id);
    return { message: '게시글이 삭제되었습니다' };
  }

  /**
   * 좋아요 토글
   */
  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '좋아요 토글' })
  @ApiParam({ name: 'id', description: '게시글 ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '좋아요 상태 반환',
  })
  async toggleLike(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    return this.postService.toggleLike(id, user.id);
  }

  /**
   * 좋아요 여부 확인
   */
  @Get(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '좋아요 여부 확인' })
  @ApiParam({ name: 'id', description: '게시글 ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '좋아요 여부 반환',
  })
  async hasLiked(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    const liked = await this.postService.hasUserLiked(id, user.id);
    return { liked };
  }

  /**
   * 작성자 정보 조회 (AuthorDisplay용)
   */
  @Public()
  @Get(':id/author-info')
  @ApiOperation({ summary: '작성자 정보 조회 (AuthorDisplay 컴포넌트용)' })
  @ApiParam({ name: 'id', description: '게시글 ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '작성자 정보 문자열 반환 (provider|nickname|subscriberCount)',
  })
  async getAuthorInfo(@Param('id') id: string) {
    const authorInfo = await this.postService.getAuthorInfo(id);
    return { authorInfo };
  }
}
