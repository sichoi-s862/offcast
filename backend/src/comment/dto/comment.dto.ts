import { IsString, IsOptional, IsUUID, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 댓글 생성 DTO
 */
export class CreateCommentDto {
  @ApiProperty({ description: '게시글 ID' })
  @IsUUID()
  postId: string;

  @ApiPropertyOptional({ description: '부모 댓글 ID (답글인 경우)' })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiProperty({ description: '댓글 내용', minLength: 1, maxLength: 1000 })
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  content: string;

  @ApiPropertyOptional({ description: '이미지 URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: '이미지 S3 Key' })
  @IsOptional()
  @IsString()
  imageKey?: string;
}

/**
 * 댓글 수정 DTO
 */
export class UpdateCommentDto {
  @ApiProperty({ description: '댓글 내용', minLength: 1, maxLength: 1000 })
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  content: string;
}

/**
 * 댓글 목록 조회 쿼리 DTO
 */
export class GetCommentsQueryDto {
  @ApiProperty({ description: '게시글 ID' })
  @IsUUID()
  postId: string;

  @ApiPropertyOptional({ description: '페이지 번호', default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: '페이지 크기', default: 20 })
  @IsOptional()
  limit?: number;
}
