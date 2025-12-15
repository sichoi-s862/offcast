import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FaqCategory, Faq } from '@prisma/client';

export interface FaqResponse {
  id: string;
  category: FaqCategory;
  question: string;
  answer: string;
}

@Injectable()
export class FaqService {
  constructor(private prisma: PrismaService) {}

  /**
   * 활성화된 FAQ 전체 조회
   */
  async findAll(): Promise<FaqResponse[]> {
    const faqs = await this.prisma.faq.findMany({
      where: { isActive: true },
      orderBy: [
        { category: 'asc' },
        { sortOrder: 'asc' },
      ],
      select: {
        id: true,
        category: true,
        question: true,
        answer: true,
      },
    });

    return faqs;
  }

  /**
   * 카테고리별 FAQ 조회
   */
  async findByCategory(category: FaqCategory): Promise<FaqResponse[]> {
    const faqs = await this.prisma.faq.findMany({
      where: {
        category,
        isActive: true,
      },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        category: true,
        question: true,
        answer: true,
      },
    });

    return faqs;
  }

  /**
   * FAQ 검색
   */
  async search(query: string): Promise<FaqResponse[]> {
    const faqs = await this.prisma.faq.findMany({
      where: {
        isActive: true,
        OR: [
          { question: { contains: query, mode: 'insensitive' } },
          { answer: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        category: true,
        question: true,
        answer: true,
      },
    });

    return faqs;
  }
}
