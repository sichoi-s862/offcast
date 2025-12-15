import { IsString, IsNotEmpty, IsOptional, IsEnum, IsEmail, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum InquiryCategoryDto {
  GENERAL = 'GENERAL',
  BUG_REPORT = 'BUG_REPORT',
  SUGGESTION = 'SUGGESTION',
  PARTNERSHIP = 'PARTNERSHIP',
  ACCOUNT = 'ACCOUNT',
  OTHER = 'OTHER',
}

export class CreateInquiryDto {
  @ApiProperty({ enum: InquiryCategoryDto, description: '문의 카테고리' })
  @IsEnum(InquiryCategoryDto, { message: '유효한 카테고리를 선택해주세요.' })
  category: InquiryCategoryDto;

  @ApiProperty({ description: '문의 제목', maxLength: 100 })
  @IsString()
  @IsNotEmpty({ message: '제목을 입력해주세요.' })
  @MaxLength(100, { message: '제목은 100자 이하로 입력해주세요.' })
  title: string;

  @ApiProperty({ description: '문의 내용', maxLength: 2000 })
  @IsString()
  @IsNotEmpty({ message: '내용을 입력해주세요.' })
  @MaxLength(2000, { message: '내용은 2000자 이하로 입력해주세요.' })
  content: string;

  @ApiPropertyOptional({ description: '이메일 (비회원 문의 시)' })
  @IsOptional()
  @IsEmail({}, { message: '유효한 이메일 주소를 입력해주세요.' })
  email?: string;
}
