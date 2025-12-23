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
import { UserService } from '../user/user.service';
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
    private userService: UserService,
  ) {}

  /**
   * 게시글 목록 조회
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: '채널 접근 권한 없음',
  })
  async findAll(
    @CurrentUser() user: User,
    @Query() query: GetPostsQueryDto,
  ) {
    const subscriberCount = await this.userService.getMaxSubscriberCount(user.id);
    const userProviders = await this.userService.getUserProviders(user.id);

    // 특정 채널 필터링 시 접근 권한 확인
    if (query.channelId) {
      const channel = await this.channelService.findById(query.channelId);
      if (channel) {
        const hasAccess = this.channelService.hasChannelAccess(
          channel,
          subscriberCount,
          userProviders,
        );

        if (!hasAccess) {
          return {
            statusCode: HttpStatus.FORBIDDEN,
            message: 'You do not have access to this channel.',
          };
        }
      }
    }

    // 사용자가 접근 가능한 채널 ID 목록 조회
    const accessibleChannels = await this.channelService.getAccessibleChannels(
      subscriberCount,
      userProviders,
    );
    const accessibleChannelIds = accessibleChannels.map(ch => ch.id);

    return this.postService.findAll(query, accessibleChannelIds);
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
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '게시글 상세 조회' })
  @ApiParam({ name: 'id', description: '게시글 ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '게시글 상세 정보 반환',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: '채널 접근 권한 없음',
  })
  async findById(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    // 게시글 조회
    const post = await this.postService.findById(id);
    if (!post) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Post not found.',
      };
    }

    // 채널 접근 권한 확인
    const channel = post.channel;
    if (channel) {
      const subscriberCount = await this.userService.getMaxSubscriberCount(user.id);
      const userProviders = await this.userService.getUserProviders(user.id);
      const hasAccess = this.channelService.hasChannelAccess(
        channel,
        subscriberCount,
        userProviders,
      );

      if (!hasAccess) {
        return {
          statusCode: HttpStatus.FORBIDDEN,
          message: 'You do not have access to this channel.',
        };
      }
    }

    // 조회수 증가
    await this.postService.incrementViewCount(id);
    return post;
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
    // 채널 조회
    const channel = await this.channelService.findById(dto.channelId);
    if (!channel) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Channel not found.',
      };
    }

    // 구독자 수 + 플랫폼 기반 채널 접근 권한 확인
    const subscriberCount = await this.userService.getMaxSubscriberCount(user.id);
    const userProviders = await this.userService.getUserProviders(user.id);
    const hasAccess = this.channelService.hasChannelAccess(
      channel,
      subscriberCount,
      userProviders,
    );

    if (!hasAccess) {
      return {
        statusCode: HttpStatus.FORBIDDEN,
        message: 'You do not have access to this channel.',
      };
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
