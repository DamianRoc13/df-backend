import { Module } from '@nestjs/common';
import { OperationsController } from './operations.controller';
import { OperationsService } from './operations.service';
import { AxiosModule } from '../common/http/axios.module';

@Module({
  imports: [AxiosModule],
  controllers: [OperationsController],
  providers: [OperationsService],
})
export class OperationsModule {}
