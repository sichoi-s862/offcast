import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InquiryCategory, InquiryStatus, Inquiry } from '@prisma/client';
import { CreateInquiryDto } from './dto/inquiry.dto';

export interface InquiryListResponse {
  inquiries: Inquiry[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class InquiryService {
  constructor(private prisma: PrismaService) {}

  /**
   * 문의 생성
   */
  async create(
    dto: CreateInquiryDto,
    userId?: string,
  ): Promise<Inquiry> {
    return this.prisma.inquiry.create({
      data: {
        userId,
        email: dto.email,
        category: dto.category as InquiryCategory,
        title: dto.title,
        content: dto.content,
        status: InquiryStatus.PENDING,
      },
    });
  }

  /**
   * 내 문의 목록 조회
   */
  async findByUser(
    userId: string,
    page = 1,
    limit = 10,
  ): Promise<InquiryListResponse> {
    const skip = (page - 1) * limit;

    const [inquiries, total] = await Promise.all([
      this.prisma.inquiry.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.inquiry.count({ where: { userId } }),
    ]);

    return { inquiries, total, page, limit };
  }

  /**
   * 문의 상세 조회
   */
  async findById(id: string, userId?: string): Promise<Inquiry | null> {
    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id },
    });

    // 본인의 문의만 조회 가능
    if (inquiry && userId && inquiry.userId !== userId) {
      return null;
    }

    return inquiry;
  }
}
