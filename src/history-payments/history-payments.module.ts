import { Module } from '@nestjs/common';
import { HistoryPaymentsController } from './history-payments.controller';
import { HistoryPaymentsService } from './history-payments.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [HistoryPaymentsController],
  providers: [HistoryPaymentsService],
  exports: [HistoryPaymentsService],
})
export class HistoryPaymentsModule {}
