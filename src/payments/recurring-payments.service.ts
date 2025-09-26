import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class RecurringPaymentsService {
  private readonly logger = new Logger(RecurringPaymentsService.name);

  constructor(private paymentsService: PaymentsService) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async processDuePayments() {
    this.logger.log('Iniciando procesamiento de pagos recurrentes...');
    
    try {
      // Obtener suscripciones que deben cobrarse
      const dueSubscriptions = await this.paymentsService.getDueSubscriptions();
      
      this.logger.log(`Se encontraron ${dueSubscriptions.length} suscripciones para cobrar`);

      // Procesar cada suscripción
      for (const subscription of dueSubscriptions) {
        try {
          this.logger.log(`Procesando suscripción ${subscription.id} para cliente ${subscription.customer.email}`);
          
          const result = await this.paymentsService.processRecurringPayment(subscription.id);
          
          if (result.success) {
            this.logger.log(`✅ Pago exitoso para suscripción ${subscription.id}`);
          } else {
            this.logger.warn(`❌ Pago fallido para suscripción ${subscription.id}: ${result.paymentResult.result?.description}`);
          }
        } catch (error) {
          this.logger.error(`Error procesando suscripción ${subscription.id}:`, error);
        }

        // Pequeña pausa entre pagos para no saturar el gateway
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      this.logger.log('Procesamiento de pagos recurrentes completado');
    } catch (error) {
      this.logger.error('Error en el procesamiento masivo de pagos recurrentes:', error);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async retryFailedPayments() {
    this.logger.log('Verificando suscripciones con pagos fallidos para reintentos...');
    
    try {
      // Obtener suscripciones activas con intentos fallidos pero que aún no han alcanzado el límite
      const failedSubscriptions = await this.paymentsService.getDueSubscriptions();
      const subscriptionsToRetry = failedSubscriptions.filter(sub => 
        sub.failedAttempts > 0 && sub.failedAttempts < 3
      );

      this.logger.log(`Se encontraron ${subscriptionsToRetry.length} suscripciones para reintentar`);

      for (const subscription of subscriptionsToRetry) {
        try {
          // Solo reintentar si han pasado al menos 4 horas desde el último intento
          const lastPayment = await this.getLastPaymentAttempt(subscription.id);
          if (lastPayment) {
            const hoursSinceLastAttempt = (Date.now() - lastPayment.createdAt.getTime()) / (1000 * 60 * 60);
            if (hoursSinceLastAttempt < 4) {
              continue; // Saltar este reintento
            }
          }

          this.logger.log(`Reintentando pago para suscripción ${subscription.id}`);
          const result = await this.paymentsService.processRecurringPayment(subscription.id);
          
          if (result.success) {
            this.logger.log(`✅ Reintento exitoso para suscripción ${subscription.id}`);
          } else {
            this.logger.warn(`❌ Reintento fallido para suscripción ${subscription.id}`);
          }
        } catch (error) {
          this.logger.error(`Error en reintento de suscripción ${subscription.id}:`, error);
        }

        // Pausa entre reintentos
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    } catch (error) {
      this.logger.error('Error en el procesamiento de reintentos:', error);
    }
  }

  private async getLastPaymentAttempt(subscriptionId: string) {
    // Implementar lógica para obtener el último intento de pago
    // Por ahora retornamos null, pero deberías implementar esto usando Prisma
    return null;
  }
}