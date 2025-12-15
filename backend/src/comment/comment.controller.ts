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
import { CommentService } from './comment.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateCommentDto, UpdateCommentDto, GetCommentsQueryDto } from './dto/comment.dto';
import type { User } from '@prisma/client';

/**
 * 댓글 컨트롤러
 * - 댓글/답글 CRUD, 좋아요 관리
 */
@ApiTags('Comment')
@Controller('comments')
export class CommentController {
  constructor(private commentService: CommentService) {}

  /**
   * 게시글의 댓글 목록 조회
   */
  @Public()
  @Get()
  @ApiOperation({ summary: '게시글의 댓글 목록 조회 (답글 포함)' })
  @ApiQuery({ name: 'postId', description: '게시글 ID' })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호' })
  @ApiQuery({ name: 'limit', required: false, description: '페이지 크기' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '댓글 목록 반환',
  })
  async findByPostId(@Query() query: GetCommentsQueryDto) {
    return this.commentService.findByPostId(query);
  }

  /**
   * 댓글 상세 조회
   */
  @Public()
  @Get(':id')
  @ApiOperation({ summary: '댓글 상세 조회' })
  @ApiParam({ name: 'id', description: '댓글 ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '댓글 상세 정보 반환',
  })
  async findById(@Param('id') id: string) {
    return this.commentService.findById(id);
  }

  /**
   * 댓글 생성
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '댓글 생성 (답글 포함)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '댓글 생성 완료',
  })
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentService.create(user.id, dto);
  }

  /**
   * 댓글 수정
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '댓글 수정' })
  @ApiParam({ name: 'id', description: '댓글 ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '댓글 수정 완료',
  })
  async update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.commentService.update(id, user.id, dto);
  }

  /**
   * 댓글 삭제
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '댓글 삭제' })
  @ApiParam({ name: 'id', description: '댓글 ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '댓글 삭제 완료',
  })
  async delete(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    await this.commentService.delete(id, user.id);
    return { message: '댓글이 삭제되었습니다' };
  }

  /**
   * 좋아요 토글
   */
  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '좋아요 토글' })
  @ApiParam({ name: 'id', description: '댓글 ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '좋아요 상태 반환',
  })
  async toggleLike(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    return this.commentService.toggleLike(id, user.id);
  }

  /**
   * 좋아요 여부 확인
   */
  @Get(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '좋아요 여부 확인' })
  @ApiParam({ name: 'id', description: '댓글 ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '좋아요 여부 반환',
  })
  async hasLiked(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    const liked = await this.commentService.hasUserLiked(id, user.id);
    return { liked };
  }

  /**
   * 작성자 정보 조회 (AuthorDisplay용)
   */
  @Public()
  @Get(':id/author-info')
  @ApiOperation({ summary: '작성자 정보 조회 (AuthorDisplay 컴포넌트용)' })
  @ApiParam({ name: 'id', description: '댓글 ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '작성자 정보 문자열 반환 (provider|nickname|subscriberCount)',
  })
  async getAuthorInfo(@Param('id') id: string) {
    const authorInfo = await this.commentService.getAuthorInfo(id);
    return { authorInfo };
  }
}
