import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { OperationsService } from './operations.service';
import { VoidDto } from './dto/void.dto';
import { VerifyDto } from './dto/verify.dto';

@ApiTags('operations')
@Controller('payments')
export class OperationsController {
  constructor(private svc: OperationsService) {}

  @Get('verify')
  @ApiOperation({ summary: 'Verificar estado (paymentId o merchantTransactionId)' })
  async verify(@Query() q: VerifyDto) {
    return this.svc.verifyBy(q.paymentId, q.merchantTransactionId);
  }

  @Post('void')
  @ApiOperation({ summary: 'Anulación (RF) de una transacción aprobada' })
  async void(@Body() dto: VoidDto) {
    return this.svc.voidPayment(dto.paymentId);
  }
}
