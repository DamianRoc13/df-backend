import { Body, Controller, Get, Post, Query, Req, Res, Param, Patch, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { ProcessRecurringPaymentDto } from './dto/process-recurring.dto';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private svc: PaymentsService) {}

  @Post('checkouts')
  @ApiOperation({ summary: 'Crear checkoutId (Método 1)' })
  async create(@Body() dto: CreateCheckoutDto, @Req() req: any) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
             || req.socket?.remoteAddress || dto.customerIp;
    return this.svc.createCheckout({ ...dto, customerIp: ip });
  }

  @Post('verify-recurring')
  @ApiOperation({ summary: 'Verificar estado de pago recurrente (idempotente)' })
  async verifyRecurring(@Body() body: { merchantTransactionId?: string; ndc?: string }) {
    return this.svc.verifyRecurring(body);
  }

  @Get('status')
  @ApiQuery({ name: 'resourcePath', required: true })
  @ApiOperation({ summary: 'Obtener estado final con resourcePath (Método 2)' })
  async status(@Query('resourcePath') resourcePath: string) {
    return this.svc.getPaymentStatus(resourcePath);
  }

  @Post('subscriptions/checkout')
  @ApiOperation({ summary: 'Crear checkout para suscripción mensual (con tokenización)' })
  async createSubscriptionCheckout(@Body() dto: CreateSubscriptionDto, @Req() req: any) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
             || req.socket?.remoteAddress || dto.customerIp;
    return this.svc.createSubscriptionCheckout({ ...dto, customerIp: ip });
  }

  @Post('subscriptions/complete')
  @ApiOperation({ summary: 'Completar configuración de suscripción después del pago inicial' })
  async completeSubscription(
    @Body() body: { resourcePath: string; customerId: string; planType: string }
  ) {
    return this.svc.completeSubscriptionSetup(body.resourcePath, body.customerId, body.planType as any);
  }

  @Post('subscriptions/:id/charge')
  @ApiOperation({ summary: 'Procesar pago recurrente de suscripción' })
  async chargeSubscription(@Param('id') subscriptionId: string) {
    return this.svc.processRecurringPayment(subscriptionId);
  }

  @Get('subscriptions/due')
  @ApiOperation({ summary: 'Obtener suscripciones pendientes de cobro' })
  async getDueSubscriptions() {
    return this.svc.getDueSubscriptions();
  }

  @Patch('subscriptions/:id/pause')
  @ApiOperation({ summary: 'Pausar suscripción' })
  async pauseSubscription(@Param('id') subscriptionId: string) {
    return this.svc.pauseSubscription(subscriptionId);
  }

  @Patch('subscriptions/:id/cancel')
  @ApiOperation({ summary: 'Cancelar suscripción' })
  async cancelSubscription(@Param('id') subscriptionId: string) {
    return this.svc.cancelSubscription(subscriptionId);
  }

  @Patch('subscriptions/:id/resume')
  @ApiOperation({ summary: 'Reactivar suscripción pausada' })
  async resumeSubscription(@Param('id') subscriptionId: string) {
    return this.svc.resumeSubscription(subscriptionId);
  }

  @Get('payment-callback')
  @ApiOperation({ summary: 'Callback de pagos - maneja tanto pagos únicos como suscripciones' })
  async paymentCallback(
    @Query('type') type: string,
    @Query('id') checkoutId: string,
    @Query('resourcePath') resourcePath: string,
    @Query('customerId') customerId?: string,
    @Query('planType') planType?: string
  ) {
    try {
      if (type === 'subscription') {
        if (!customerId || !planType) {
          throw new BadRequestException('Faltan parámetros requeridos para completar la suscripción: customerId y planType');
        }
        
        console.log(`[payment-callback] Procesando suscripción - resourcePath: ${resourcePath}, customerId: ${customerId}, planType: ${planType}`);
        
        // Este método ahora espera a que el pago se complete usando polling
        const result = await this.svc.completeSubscriptionSetup(resourcePath, customerId, planType as any);
        
        // Crear objeto limpio sin referencia circular
        const paymentData = {
          ...result.paymentResult,
          subscriptionDetails: {
            subscription: result.subscription,
            paymentToken: result.paymentToken,
            customerId: result.customerId,
            // NO incluir paymentResult aquí para evitar circularidad
          }
        };

        const safe = JSON.parse(JSON.stringify(paymentData, (key, value) => {
          if (key === 'subscription' || key === 'payments') return undefined;
          return value;
        }));

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4321';
        const encodedData = encodeURIComponent(JSON.stringify(safe));
        return { redirectUrl: `${frontendUrl}/payment-success?payment=${encodedData}` };
      } else {
        console.log(`[payment-callback] Procesando pago único - resourcePath: ${resourcePath}`);
        const paymentStatus = await this.svc.getPaymentStatus(resourcePath);
        const safe = JSON.parse(JSON.stringify(paymentStatus, (key, value) => {
          if (key === 'subscription' || key === 'payments') return undefined;
          return value;
        }));
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4321';
        const encodedData = encodeURIComponent(JSON.stringify(safe));
        return { redirectUrl: `${frontendUrl}/payment-success?payment=${encodedData}` };
      }
    } catch (error) {
      console.error('[payment-callback] Error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4321';
      const err = {
        error: true,
        message: (error as any)?.message || 'Payment callback error',
        details: { 
          name: (error as any)?.name, 
          status: (error as any)?.status,
          code: (error as any)?.code,
          attempts: (error as any)?.attempts
        }
      };
      const encodedData = encodeURIComponent(JSON.stringify(err));
      return { redirectUrl: `${frontendUrl}/payment-success?payment=${encodedData}` };
    }
  }

  @Get('json-response')
  @ApiOperation({ summary: 'Endpoint que devuelve JSON puro de la respuesta del pago' })
  async jsonResponse(
    @Res({ passthrough: false }) response: Response,
    @Query('type') type: string,
    @Query('id') checkoutId: string,
    @Query('resourcePath') resourcePath: string,
    @Query('customerId') customerId?: string,
    @Query('planType') planType?: string
  ) {
    try {
      let paymentData: any;
      if (type === 'subscription' && customerId && planType) {
        console.log(`[json-response] Procesando suscripción - resourcePath: ${resourcePath}`);
        
        // Este método ahora incluye polling para esperar el estado final
        const result = await this.svc.completeSubscriptionSetup(resourcePath, customerId, planType as any);
        
        // Usar el paymentResult que ya obtuvimos en completeSubscriptionSetup
        // Crear objeto limpio sin referencia circular
        paymentData = {
          ...result.paymentResult,
          subscriptionDetails: {
            subscription: result.subscription,
            paymentToken: result.paymentToken,
            customerId: result.customerId,
            // NO incluir paymentResult aquí para evitar circularidad
          }
        };
      } else {
        console.log(`[json-response] Procesando pago único - resourcePath: ${resourcePath}`);
        paymentData = await this.svc.getPaymentStatus(resourcePath, customerId);
      }

      const safe = JSON.parse(
        JSON.stringify(paymentData, (key, value) => {
          if (key === 'subscription' || key === 'payments') return undefined;
          return value;
        })
      );

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4321';
      const encodedData = encodeURIComponent(JSON.stringify(safe));
      const redirectUrl = `${frontendUrl}/payment-success?payment=${encodedData}`;
      response.redirect(302, redirectUrl);
    } catch (error) {
      console.error('[json-response] Error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4321';
      const err = {
        error: true,
        success: false,
        message: (error as any)?.message || 'json-response error',
        details: { 
          name: (error as any)?.name, 
          status: (error as any)?.status,
          code: (error as any)?.code,
          attempts: (error as any)?.attempts
        }
      };
      const encodedData = encodeURIComponent(JSON.stringify(err));
      const redirectUrl = `${frontendUrl}/payment-success?payment=${encodedData}`;
      response.redirect(302, redirectUrl);
    }
  }
}
