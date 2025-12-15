import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportTargetType, ReportReason } from '@prisma/client';

export class CreateReportDto {
  @ApiProperty({
    enum: ReportTargetType,
    description: '신고 대상 유형',
    example: 'POST',
  })
  @IsEnum(ReportTargetType)
  targetType: ReportTargetType;

  @ApiPropertyOptional({
    description: '신고 대상 게시글 ID (targetType이 POST인 경우)',
  })
  @IsOptional()
  @IsUUID()
  postId?: string;

  @ApiPropertyOptional({
    description: '신고 대상 댓글 ID (targetType이 COMMENT인 경우)',
  })
  @IsOptional()
  @IsUUID()
  commentId?: string;

  @ApiPropertyOptional({
    description: '신고 대상 사용자 ID (targetType이 USER인 경우)',
  })
  @IsOptional()
  @IsUUID()
  targetUserId?: string;

  @ApiProperty({
    enum: ReportReason,
    description: '신고 사유',
    example: 'SPAM',
  })
  @IsEnum(ReportReason)
  reason: ReportReason;

  @ApiPropertyOptional({
    description: '추가 설명',
    example: '광고성 게시글입니다.',
  })
  @IsOptional()
  @IsString()
  detail?: string;
}
