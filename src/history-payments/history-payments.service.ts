import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  PaymentHistoryItemDto,
  PaymentHistoryResponseDto,
  PaymentDetailDto,
} from './dto/payment-history.dto';
import { PaymentType, PaymentStatus } from '@prisma/client';

@Injectable()
export class HistoryPaymentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Obtener historial de pagos con paginación
   */
  async getPaymentHistory(
    page: number = 1,
    pageSize: number = 10,
    status?: PaymentStatus,
    paymentType?: PaymentType,
    search?: string,
  ): Promise<PaymentHistoryResponseDto> {
    const skip = (page - 1) * pageSize;

    // Construir filtros
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (paymentType) {
      where.paymentType = paymentType;
    }

    if (search) {
      where.OR = [
        {
          merchantTransactionId: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          customer: {
            email: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          customer: {
            givenName: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          customer: {
            surname: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          customer: {
            identificationDocId: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
      ];
    }

    // Obtener total de registros
    const total = await this.prisma.payment.count({ where });

    // Obtener pagos
    const payments = await this.prisma.payment.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        customer: {
          select: {
            givenName: true,
            middleName: true,
            surname: true,
            identificationDocId: true,
          },
        },
      },
    });

    // Mapear a DTO
    const data: PaymentHistoryItemDto[] = payments.map((payment) => {
      // Construir nombre omitiendo "nd" si middleName es exactamente "nd"
      const middleName = payment.customer.middleName.toLowerCase() === 'nd' 
        ? '' 
        : payment.customer.middleName;
      const customerName = `${payment.customer.givenName} ${middleName} ${payment.customer.surname}`.trim().replace(/\s+/g, ' ');

      return {
        id: payment.id,
        customerName,
        customerIdentification: payment.customer.identificationDocId,
        paymentType: payment.paymentType,
        amount: Number(payment.amount),
        currency: payment.currency,
        status: payment.status,
        createdAt: payment.createdAt,
        merchantTransactionId: payment.merchantTransactionId,
      };
    });

    const totalPages = Math.ceil(total / pageSize);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  /**
   * Obtener detalle completo de un pago
   */
  async getPaymentDetail(paymentId: string): Promise<PaymentDetailDto> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        customer: true,
        subscription: true,
        token: true,
      },
    });

    if (!payment) {
      throw new NotFoundException(
        `Pago con ID ${paymentId} no encontrado`,
      );
    }

    // Filtrar "nd" del middleName si es exactamente "nd"
    const middleName = payment.customer.middleName.toLowerCase() === 'nd' 
      ? '' 
      : payment.customer.middleName;

    const detail: PaymentDetailDto = {
      id: payment.id,
      customer: {
        id: payment.customer.id,
        merchantCustomerId: payment.customer.merchantCustomerId,
        email: payment.customer.email,
        givenName: payment.customer.givenName,
        middleName: middleName,
        surname: payment.customer.surname,
        identificationDocType: payment.customer.identificationDocType,
        identificationDocId: payment.customer.identificationDocId,
        phone: payment.customer.phone,
        street1: payment.customer.street1,
        city: payment.customer.city,
        state: payment.customer.state,
        country: payment.customer.country,
        postcode: payment.customer.postcode,
      },
      payment: {
        merchantTransactionId: payment.merchantTransactionId,
        paymentType: payment.paymentType,
        amount: Number(payment.amount),
        currency: payment.currency,
        base0: Number(payment.base0),
        baseImp: Number(payment.baseImp),
        iva: Number(payment.iva),
        status: payment.status,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      },
      gateway: {
        resultCode: payment.resultCode,
        resultDescription: payment.resultDescription,
        resourcePath: payment.resourcePath,
        gatewayResponse: payment.gatewayResponse,
      },
    };

    // Agregar información de suscripción si existe
    if (payment.subscription) {
      detail.subscription = {
        id: payment.subscription.id,
        planType: payment.subscription.planType,
        status: payment.subscription.status,
        nextBillingDate: payment.subscription.nextBillingDate,
      };
    }

    // Agregar información del token si existe
    if (payment.token) {
      detail.token = {
        brand: payment.token.brand,
        last4: payment.token.last4,
        expiryMonth: payment.token.expiryMonth,
        expiryYear: payment.token.expiryYear,
      };
    }

    return detail;
  }

  /**
   * Obtener estadísticas del dashboard
   */
  async getPaymentStats() {
    const [
      totalRevenue,
      successfulPayments,
      pendingPayments,
      failedPayments,
    ] = await Promise.all([
      // Total de ingresos (solo pagos aprobados)
      this.prisma.payment.aggregate({
        where: { status: 'APPROVED' },
        _sum: { amount: true },
      }),
      // Pagos exitosos
      this.prisma.payment.count({
        where: { status: 'APPROVED' },
      }),
      // Pagos pendientes
      this.prisma.payment.count({
        where: { status: 'PENDING' },
      }),
      // Pagos fallidos
      this.prisma.payment.count({
        where: {
          OR: [
            { status: 'FAILED' },
            { status: 'REJECTED' },
          ],
        },
      }),
    ]);

    return {
      totalRevenue: Number(totalRevenue._sum.amount || 0),
      successfulPayments,
      pendingPayments,
      failedPayments,
    };
  }
}
