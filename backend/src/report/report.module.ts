import { Module } from '@nestjs/common';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { BlockController } from './block.controller';
import { BlockService } from './block.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ReportController, BlockController],
  providers: [ReportService, BlockService],
  exports: [ReportService, BlockService],
})
export class ReportModule {}
