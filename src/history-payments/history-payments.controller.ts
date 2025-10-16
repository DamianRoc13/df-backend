import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { HistoryPaymentsService } from './history-payments.service';
import { PaymentType, PaymentStatus } from '@prisma/client';

@ApiTags('History Payments')
@Controller('history-payments')
export class HistoryPaymentsController {
  constructor(
    private readonly historyPaymentsService: HistoryPaymentsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Obtener historial de pagos con paginación' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página',
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    description: 'Cantidad de registros por página',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: PaymentStatus,
    description: 'Filtrar por estado del pago',
  })
  @ApiQuery({
    name: 'paymentType',
    required: false,
    enum: PaymentType,
    description: 'Filtrar por tipo de pago',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Buscar por nombre, email, cédula o ID de transacción',
  })
  async getPaymentHistory(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe)
    pageSize: number,
    @Query('status') status?: PaymentStatus,
    @Query('paymentType') paymentType?: PaymentType,
    @Query('search') search?: string,
  ) {
    return this.historyPaymentsService.getPaymentHistory(
      page,
      pageSize,
      status,
      paymentType,
      search,
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas del dashboard' })
  async getPaymentStats() {
    return this.historyPaymentsService.getPaymentStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle completo de un pago' })
  @ApiParam({
    name: 'id',
    description: 'ID del pago',
    type: String,
  })
  async getPaymentDetail(@Param('id') paymentId: string) {
    return this.historyPaymentsService.getPaymentDetail(paymentId);
  }
}
