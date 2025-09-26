import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import configuration from './config/configuration';
import { AxiosModule } from './common/http/axios.module';
import { PaymentsModule } from './payments/payments.module';
import { OperationsModule } from './operations/operations.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ScheduleModule.forRoot(),
    AxiosModule,
    PrismaModule,
    PaymentsModule,
    OperationsModule,
  ],
})
export class AppModule {}
