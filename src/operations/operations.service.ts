import { Injectable, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OperationsService {
  constructor(private http: HttpService) {}

  // Verificador por paymentId o merchantTransactionId
  async verifyBy(paymentId?: string, merchantTransactionId?: string) {
    if (!paymentId && !merchantTransactionId) {
      throw new BadRequestException('Debe enviar paymentId o merchantTransactionId');
    }
    // 1) Si tienes BD, intenta buscar primero. (Persistencia no incluida en este starter)
    // 2) Con paymentId: consulta al gateway de forma segura
    if (paymentId) {
      const url = `${process.env.OPPWA_URL}/v1/payments/${encodeURIComponent(paymentId)}?entityId=${encodeURIComponent(process.env.OPPWA_ENTITY_ID!)}`;
      const res = await firstValueFrom(this.http.get(url, {
        headers: { Authorization: `Bearer ${process.env.OPPWA_BEARER}` },
      }));
      return { source: 'gateway', data: res.data };
    }
    // 3) Con merchantTransactionId: aquí podrías llamar a tu BD o a un endpoint de búsqueda si tu canal lo expone.
    return { source: 'local', data: null, note: 'Implemente consulta por merchantTransactionId en su persistencia' };
  }

  // Anulación (RF / void)
  async voidPayment(paymentId: string) {
    if (!paymentId) throw new BadRequestException('paymentId requerido');
    // Patrón típico en OPP: POST a /v1/payments/{id} con paymentType=RF y entityId
    const url = `${process.env.OPPWA_URL}/v1/payments/${encodeURIComponent(paymentId)}`;
    const body = new URLSearchParams({
      entityId: process.env.OPPWA_ENTITY_ID!,
      paymentType: 'RF',
    });
    const res = await firstValueFrom(this.http.post(url, body, {
      headers: {
        Authorization: `Bearer ${process.env.OPPWA_BEARER}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }));
    return res.data;
  }
}
