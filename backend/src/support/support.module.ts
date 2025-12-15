import { Module } from '@nestjs/common';
import { InquiryController } from './inquiry.controller';
import { InquiryService } from './inquiry.service';
import { FaqController } from './faq.controller';
import { FaqService } from './faq.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InquiryController, FaqController],
  providers: [InquiryService, FaqService],
  exports: [InquiryService, FaqService],
})
export class SupportModule {}
