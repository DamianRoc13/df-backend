import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { RecurringPaymentsService } from './recurring-payments.service';
import { AxiosModule } from '../common/http/axios.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [AxiosModule, PrismaModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, RecurringPaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
