import { IsString, IsOptional, IsArray, IsUUID, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 게시글 생성 DTO
 */
export class CreatePostDto {
  @ApiProperty({ description: '채널 ID' })
  @IsUUID()
  channelId: string;

  @ApiProperty({ description: '게시글 제목', minLength: 1, maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title: string;

  @ApiProperty({ description: '게시글 내용', minLength: 1, maxLength: 5000 })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content: string;

  @ApiPropertyOptional({ description: '해시태그 목록', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hashtags?: string[];

  @ApiPropertyOptional({ description: '이미지 URL 목록', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @ApiPropertyOptional({ description: '이미지 S3 Key 목록', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageKeys?: string[];
}

/**
 * 게시글 수정 DTO
 */
export class UpdatePostDto {
  @ApiPropertyOptional({ description: '게시글 제목', minLength: 1, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title?: string;

  @ApiPropertyOptional({ description: '게시글 내용', minLength: 1, maxLength: 5000 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content?: string;

  @ApiPropertyOptional({ description: '해시태그 목록', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hashtags?: string[];
}

/**
 * 게시글 목록 조회 쿼리 DTO
 */
export class GetPostsQueryDto {
  @ApiPropertyOptional({ description: '채널 ID' })
  @IsOptional()
  @IsUUID()
  channelId?: string;

  @ApiPropertyOptional({ description: '페이지 번호 (1부터 시작)', default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: '페이지 크기', default: 20 })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: '정렬 기준', enum: ['latest', 'popular', 'views'] })
  @IsOptional()
  sort?: 'latest' | 'popular' | 'views';

  @ApiPropertyOptional({ description: '검색 키워드' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '해시태그 필터' })
  @IsOptional()
  @IsString()
  hashtag?: string;
}
