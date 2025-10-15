import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubscriptionDto, SubscriptionPlanDto } from './dto/create-subscription.dto';
import { PaymentStatus } from './types/payment-status.enum';
import * as qs from 'qs';

@Injectable()
export class PaymentsService {
  constructor(
    private http: HttpService,
    private prisma: PrismaService
  ) {}

  private bearer() { return (process.env.OPPWA_BEARER || '').trim(); }
  private entity() { return (process.env.OPPWA_ENTITY_ID || '').trim(); } // Para pagos únicos
  private entityRecurring() { return (process.env.OPPWA_ENTITY_RECURRING_ID || process.env.OPPWA_ENTITY_ID || '').trim(); } // Para pagos recurrentes
  private oppUrl() { return (process.env.OPPWA_URL || '').trim(); }

  async createCheckout(input: any) {
    if (process.env.TEST_MODE && parseFloat(input.amount) > 50) {
      throw new BadRequestException('En pruebas, amount debe ser ≤ 50.00');
    }

    let customer = await this.prisma.customer.findFirst({
      where: {
        OR: [
          { email: input.email },
          { merchantCustomerId: input.merchantCustomerId }
        ]
      }
    });

    if (!customer) {
      customer = await this.prisma.customer.create({
        data: {
          merchantCustomerId: input.merchantCustomerId,
          email: input.email,
          givenName: input.givenName,
          middleName: input.middleName,
          surname: input.surname,
          identificationDocType: input.identificationDocType,
          identificationDocId: input.identificationDocId,
          phone: input.phone,
          street1: input.street1,
          city: input.city,
          state: input.state,
          country: input.country,
          postcode: input.postcode,
        }
      });
    }

    let payment = await this.prisma.payment.findUnique({
      where: { merchantTransactionId: input.merchantTransactionId }
    });

    let merchantTransactionId = input.merchantTransactionId;
    if (payment) {
      merchantTransactionId = `${input.merchantTransactionId}_${Date.now()}`;
    }

    payment = await this.prisma.payment.create({
      data: {
        customer: { connect: { id: customer.id } },
        paymentType: 'ONE_TIME',
        merchantTransactionId,
        amount: parseFloat(input.amount),
        currency: input.currency || 'USD',
        base0: parseFloat(input.base0),
        baseImp: parseFloat(input.baseImp),
        iva: parseFloat(input.iva),
        status: 'PENDING',
        gatewayResponse: {},
        resultCode: 'PENDING',
        resultDescription: 'Pago iniciado'
      }
    });

    const params: Record<string, string> = {
      entityId: this.entity(),
      amount: input.amount,
      currency: input.currency ?? 'USD',
      paymentType: input.paymentType ?? 'DB',
      'customer.givenName': input.givenName,
      'customer.middleName': input.middleName,
      'customer.surname': input.surname,
      'customer.email': input.email,
      'customer.ip': input.customerIp,
      'customer.identificationDocType': input.identificationDocType,
      'customer.identificationDocId': input.identificationDocId,
      'customer.phone': input.phone,
      'merchantTransactionId': input.merchantTransactionId,
      'customer.merchantCustomerId': input.merchantCustomerId,
      // Información del carrito (obligatorio DataFast)
      'cart.items[0].name': 'Pago único',
      'cart.items[0].description': 'Pago único de servicio',
      'cart.items[0].price': input.amount,
      'cart.items[0].quantity': '1',
      // Dirección de envío (obligatorio DataFast)
      'shipping.street1': input.street1,
      'shipping.country': input.country,
      // Dirección de facturación (obligatorio DataFast)
      'billing.street1': input.street1,
      'billing.country': input.country,
      'customParameters[SHOPPER_VAL_BASE0]': input.base0,
      'customParameters[SHOPPER_VAL_BASEIMP]': input.baseImp,
      'customParameters[SHOPPER_VAL_IVA]': input.iva,
      'customParameters[SHOPPER_MID]': process.env.MID || '',
      'customParameters[SHOPPER_TID]': process.env.TID || '',
      'customParameters[SHOPPER_ECI]': '0103910',
      'customParameters[SHOPPER_PSERV]': '17913101',
      'customParameters[SHOPPER_VERSIONDF]': '2',
      'risk.parameters[USER_DATA2]': process.env.MERCHANT_NAME || 'TuComercio',
    };
    if (process.env.TEST_MODE) params['testMode'] = process.env.TEST_MODE;
    if (input.oneClick) params['createRegistration'] = 'true';
    input?.registrations?.forEach((id: string, i: number) => (params[`registrations[${i}].id`] = id));

    console.log('📤 [createCheckout] Enviando al gateway:', JSON.stringify(params, null, 2));

    try {
      const res = await firstValueFrom(this.http.post(
        '/v1/checkouts',
        qs.stringify(params),
        { headers: { Authorization: `Bearer ${this.bearer()}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
      ));
      console.log('✅ [createCheckout] Respuesta del gateway:', JSON.stringify(res.data, null, 2));
      return res.data;
    } catch (e: any) {
      const data = e?.response?.data;
      console.error('❌ [createCheckout] Error del gateway:', JSON.stringify({
        status: e?.response?.status,
        data: data
      }, null, 2));
      if (data) throw new BadRequestException({ message: 'Gateway /v1/checkouts', gateway: data });
      throw new InternalServerErrorException('Checkout request failed (network/timeout)');
    }
  }

  async verifyRecurring(input: { merchantTransactionId?: string; ndc?: string }) {
    const { merchantTransactionId, ndc } = input || {};
    if (!merchantTransactionId && !ndc) {
      return { success: false, status: 'ERROR', error: 'MISSING_KEYS' };
    }

    const payment = await this.prisma.payment.findFirst({
      where: {
        OR: [
          merchantTransactionId ? { merchantTransactionId } : undefined,
          ndc ? { gatewayResponse: { path: ['ndc'], equals: ndc } } : undefined,
        ].filter(Boolean) as any[],
      },
    });

    const isApprovedInDb =
      !!payment &&
      (
        payment.status === 'APPROVED' ||
        (typeof payment.resultCode === 'string' && payment.resultCode.startsWith('000.'))
      );

    if (isApprovedInDb) {
      const subscription = payment.subscriptionId
        ? await this.prisma.subscription.findUnique({ where: { id: payment.subscriptionId } })
        : undefined;

      const paymentToken = payment.tokenId
        ? await this.prisma.paymentToken.findUnique({ where: { id: payment.tokenId } })
        : undefined;

      return {
        success: true,
        status: 'APPROVED',
        resultCode: payment.resultCode,
        resultDescription: payment.resultDescription,
        payment,
        subscription,
        paymentToken,
      };
    }

    try {
      const gw = await this.getPaymentStatusSafe(ndc || merchantTransactionId || '');
      if (gw?.result?.code && String(gw.result.code).startsWith('000.')) {
        return {
          success: true,
          status: 'APPROVED',
          resultCode: gw.result.code,
          resultDescription: gw.result.description,
          payment: { gatewayResponse: gw },
        };
      }
      const code = gw?.result?.code ? String(gw.result.code) : '';
      const isPendingWrapper = code.startsWith('200.');
      return {
        success: false,
        status: isPendingWrapper ? 'PENDING' : 'PENDING',
        gateway: gw,
      };
    } catch (e: any) {
      const code = e?.response?.gateway?.result?.code || e?.result?.code || '';
      if (String(code).startsWith('200.')) {
        return {
          success: false,
          status: 'PENDING',
          gateway: e?.response?.gateway || e?.gateway || { result: { code } },
        };
      }
      return { success: false, status: 'ERROR', error: 'VERIFY_FAILED' };
    }
  }

  private async getPaymentStatusSafe(idOrNdc: string) {
    try {
      const data = await this.getPaymentStatus(idOrNdc);
      return data;
    } catch (e: any) {
      const code = e?.response?.gateway?.result?.code || e?.result?.code || '';
      if (String(code).startsWith('200.')) {
        return e?.response?.gateway || e?.gateway || { result: { code } };
      }
      throw e;
    }
  }

  async getPaymentStatus(resourcePath: string, customerId?: string, useRecurringEntity: boolean = false) {
    const entityId = useRecurringEntity ? this.entityRecurring() : this.entity();
    const url = `${this.oppUrl()}${resourcePath}?entityId=${encodeURIComponent(entityId)}`;
    try {
      const res = await firstValueFrom(this.http.get(url, {
        headers: { Authorization: `Bearer ${this.bearer()}` },
      }));
      const paymentData = res.data;

      if (paymentData?.merchantTransactionId) {
        const existingPayment = await this.prisma.payment.findUnique({
          where: { merchantTransactionId: paymentData.merchantTransactionId }
        });

        if (existingPayment) {
          if (existingPayment.paymentType === 'ONE_TIME') {
            await this.prisma.payment.update({
              where: { id: existingPayment.id },
              data: {
                gatewayResponse: paymentData,
                resultCode: paymentData.result.code,
                resultDescription: paymentData.result.description,
                resourcePath,
                status: this.determinePaymentStatus(paymentData.result.code)
              }
            });
          } else if (existingPayment.paymentType === 'INITIAL' || existingPayment.paymentType === 'RECURRING') {
            const updateData: any = {
              gatewayResponse: paymentData,
              resultCode: paymentData.result.code,
              resultDescription: paymentData.result.description,
              resourcePath,
              status: this.determinePaymentStatus(paymentData.result.code),
              ...(paymentData.customParameters?.['SHOPPER_VAL_BASE0'] && {
                base0: parseFloat(paymentData.customParameters['SHOPPER_VAL_BASE0'])
              }),
              ...(paymentData.customParameters?.['SHOPPER_VAL_BASEIMP'] && {
                baseImp: parseFloat(paymentData.customParameters['SHOPPER_VAL_BASEIMP'])
              }),
              ...(paymentData.customParameters?.['SHOPPER_VAL_IVA'] && {
                iva: parseFloat(paymentData.customParameters['SHOPPER_VAL_IVA'])
              })
            };
            if (paymentData.tokenId) updateData.tokenId = paymentData.tokenId;
            if (paymentData.subscriptionId) updateData.subscriptionId = paymentData.subscriptionId;

            await this.prisma.payment.update({
              where: { id: existingPayment.id },
              data: updateData
            });
          }
        }
      }

      console.log('✅ [getPaymentStatus] Respuesta exitosa del gateway:', JSON.stringify(res.data, null, 2));
      return res.data;
    } catch (e: any) {
      const data = e?.response?.data;
      console.error('❌ [getPaymentStatus] Error del gateway:', JSON.stringify({
        status: e?.response?.status,
        statusText: e?.response?.statusText,
        data: data,
        resourcePath: resourcePath,
        url: url
      }, null, 2));
      if (data) throw new BadRequestException({ message: 'Gateway status', gateway: data });
      throw new InternalServerErrorException('Status request failed (network/timeout)');
    }
  }

  async processPaymentCallback(resourcePath: string, data: any): Promise<any> {
    try {
      const paymentStatus = await this.getPaymentStatus(resourcePath);
      const payment = await this.prisma.payment.findUnique({
        where: { merchantTransactionId: paymentStatus.merchantTransactionId }
      });
      if (!payment) {
        throw new NotFoundException('Pago no encontrado en la base de datos');
      }
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          gatewayResponse: paymentStatus,
          resultCode: paymentStatus.result.code,
          resultDescription: paymentStatus.result.description,
          resourcePath,
          status: this.determinePaymentStatus(paymentStatus.result.code)
        }
      });
      return paymentStatus;
    } catch (error: any) {
      throw new BadRequestException('Error procesando callback de pago: ' + error.message);
    }
  }

  private determinePaymentStatus(resultCode: string): PaymentStatus {
    if (resultCode.startsWith('000.000.') || resultCode.startsWith('000.100.')) {
      return PaymentStatus.APPROVED;
    } else if (resultCode.startsWith('000.200.') || resultCode.startsWith('200.')) {
      return PaymentStatus.PENDING;
    } else {
      return PaymentStatus.REJECTED;
    }
  }

  /**
   * Espera a que el pago se complete (aprobado o rechazado) haciendo polling
   * Útil para pagos recurrentes que pueden devolver 200.xxx inicialmente
   */
  private async waitForPaymentCompletion(
    resourcePath: string,
    maxAttempts: number = 10,
    delayMs: number = 2000,
    useRecurringEntity: boolean = false
  ): Promise<any> {
    console.log(`🔁 [waitForPaymentCompletion] Iniciando polling para: ${resourcePath}`);
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`⏳ [waitForPaymentCompletion] Intento ${attempt}/${maxAttempts}...`);
        const paymentResult = await this.getPaymentStatus(resourcePath, undefined, useRecurringEntity);
        const resultCode = paymentResult.result?.code || '';
        
        console.log(`📊 [waitForPaymentCompletion] Código recibido: ${resultCode}, Descripción: ${paymentResult.result?.description}`);
        
        // Códigos de éxito definitivos (NO seguir intentando)
        const successCodes = ['000.000.000', '000.000.100', '000.100.110', '000.100.112'];
        const isSuccess = successCodes.includes(resultCode);
        
        // Códigos de rechazo definitivos (NO seguir intentando)
        const rejectionCodes = resultCode.startsWith('100.') || resultCode.startsWith('800.') || resultCode.startsWith('900.');
        
        // Si es éxito o rechazo definitivo, retornar inmediatamente
        if (isSuccess || rejectionCodes) {
          console.log(`✅ [waitForPaymentCompletion] Intento ${attempt}/${maxAttempts}] Pago completado con código: ${resultCode}`);
          return paymentResult;
        }
        
        // Si el código empieza con 200. o 000.200., está pendiente - seguir esperando
        if (resultCode.startsWith('200.') || resultCode.startsWith('000.200.')) {
          console.log(`⏸️  [Intento ${attempt}/${maxAttempts}] Pago pendiente (${resultCode}), esperando ${delayMs}ms...`);
          
          // Si no es el último intento, esperar antes de reintentar
          if (attempt < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
            continue;
          } else {
            // Último intento y sigue pendiente
            throw new BadRequestException({
              message: 'El pago sigue en proceso después de múltiples intentos',
              code: resultCode,
              attempts: maxAttempts
            });
          }
        }
        
        // Cualquier otro código no reconocido, retornar
        console.log(`⚠️ [waitForPaymentCompletion] Código no reconocido: ${resultCode}, retornando resultado`);
        return paymentResult;
        
      } catch (error) {
        console.error(`❌ [waitForPaymentCompletion] Error en intento ${attempt}:`, error);
        // Si es el último intento o un error diferente a pending, propagar el error
        if (attempt === maxAttempts) {
          console.error(`❌ [waitForPaymentCompletion] Máximo de intentos alcanzado, error final:`, error);
          throw error;
        }
        
        // Si es un error de pendiente, continuar esperando
        const errorCode = (error as any)?.response?.gateway?.result?.code || '';
        console.log(`🔍 [waitForPaymentCompletion] Código de error: ${errorCode}`);
        if (errorCode.startsWith('200.') || errorCode.startsWith('000.200.')) {
          console.log(`⏸️  [Intento ${attempt}/${maxAttempts}] Error pendiente, reintentando en ${delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          continue;
        }
        
        // Otro tipo de error, propagar
        console.error(`❌ [waitForPaymentCompletion] Error no manejable, propagando...`);
        throw error;
      }
    }
    
    // No debería llegar aquí, pero por si acaso
    throw new BadRequestException('No se pudo completar la verificación del pago');
  }

  async createSubscriptionCheckout(dto: CreateSubscriptionDto) {
    const planPrices = {
      [SubscriptionPlanDto.GYM_MONTHLY]: '77.00',
      [SubscriptionPlanDto.APP_MONTHLY]: '19.99',
      [SubscriptionPlanDto.TEST_MONTHLY]: '1.00'
    };
    const planNames = {
      [SubscriptionPlanDto.GYM_MONTHLY]: 'Plan Gimnasio Mensual',
      [SubscriptionPlanDto.APP_MONTHLY]: 'Plan App Mensual',
      [SubscriptionPlanDto.TEST_MONTHLY]: 'Plan Prueba Mensual'
    };
    const planDescriptions = {
      [SubscriptionPlanDto.GYM_MONTHLY]: 'Suscripción mensual al gimnasio Animus Society',
      [SubscriptionPlanDto.APP_MONTHLY]: 'Suscripción mensual a la app Animus Society',
      [SubscriptionPlanDto.TEST_MONTHLY]: 'Suscripción de prueba mensual'
    };
    
    const amount = planPrices[dto.planType];
    const planName = planNames[dto.planType];
    const planDescription = planDescriptions[dto.planType];
    
    if (!amount) {
      throw new BadRequestException('Plan de suscripción no válido');
    }
    if (process.env.TEST_MODE && parseFloat(amount) > 50) {
      throw new BadRequestException('En pruebas, amount debe ser ≤ 50.00');
    }

    let customer = await this.prisma.customer.findUnique({
      where: { email: dto.email }
    });

    if (!customer) {
      customer = await this.prisma.customer.create({
        data: {
          merchantCustomerId: dto.merchantCustomerId,
          email: dto.email,
          givenName: dto.givenName,
          middleName: dto.middleName,
          surname: dto.surname,
          identificationDocType: dto.identificationDocType,
          identificationDocId: dto.identificationDocId,
          phone: dto.phone,
          street1: dto.street1,
          city: dto.city,
          state: dto.state,
          country: dto.country,
          postcode: dto.postcode,
        }
      });
    }

    const params: Record<string, string> = {
      entityId: this.entityRecurring(), // Usar entity ID de recurrentes
      amount,
      currency: 'USD',
      paymentType: 'DB',
      'customer.givenName': dto.givenName,
      'customer.middleName': dto.middleName,
      'customer.surname': dto.surname,
      'customer.ip': dto.customerIp,
      'customer.email': dto.email,
      'customer.identificationDocType': dto.identificationDocType,
      'customer.identificationDocId': dto.identificationDocId,
      'customer.phone': dto.phone,
      'merchantTransactionId': dto.merchantTransactionId,
      'customer.merchantCustomerId': dto.merchantCustomerId,
      // Información del carrito (obligatorio DataFast)
      'cart.items[0].name': planName,
      'cart.items[0].description': planDescription,
      'cart.items[0].price': amount,
      'cart.items[0].quantity': '1',
      'shipping.street1': dto.street1,
      'shipping.country': dto.country,
      'billing.street1': dto.street1,
      'billing.country': dto.country,
      'customParameters[SHOPPER_VAL_BASE0]': dto.base0,
      'customParameters[SHOPPER_VAL_BASEIMP]': dto.baseImp,
      'customParameters[SHOPPER_VAL_IVA]': dto.iva,
      'customParameters[SHOPPER_MID]': process.env.MID || '',
      'customParameters[SHOPPER_TID]': process.env.TID || '',
      'customParameters[SHOPPER_ECI]': '0103910',
      'customParameters[SHOPPER_PSERV]': '17913101',
      'customParameters[SHOPPER_VERSIONDF]': '2',
      'risk.parameters[USER_DATA2]': process.env.MERCHANT_NAME || 'TuComercio',
      'recurringType': 'INITIAL',
      'createRegistration': 'true'
    };
    if (process.env.TEST_MODE) params['testMode'] = process.env.TEST_MODE;

    console.log('[createSubscriptionCheckout] Enviando al gateway:', JSON.stringify(params, null, 2));

    try {
      const res = await firstValueFrom(this.http.post(
        '/v1/checkouts',
        qs.stringify(params),
        { headers: { Authorization: `Bearer ${this.bearer()}`, 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 30000 }
      ));

      console.log('✅ [createSubscriptionCheckout] Respuesta del gateway:', JSON.stringify(res.data, null, 2));

      try {
        await this.prisma.payment.create({
          data: {
            customerId: customer.id,
            paymentType: 'INITIAL',
            merchantTransactionId: dto.merchantTransactionId,
            amount: parseFloat(amount),
            currency: 'USD',
            base0: parseFloat(dto.base0),
            baseImp: parseFloat(dto.baseImp),
            iva: parseFloat(dto.iva),
            gatewayResponse: res.data,
            resultCode: res.data.result?.code || 'PENDING',
            resultDescription: res.data.result?.description,
            resourcePath: res.data.resourcePath,
            status: 'PENDING'
          }
        });
      } catch (dbError: any) {
        if (dbError.code === 'P2002' && dbError.meta?.target?.includes('merchantTransactionId')) {
          await this.prisma.payment.update({
            where: { merchantTransactionId: dto.merchantTransactionId },
            data: {
              gatewayResponse: res.data,
              resultCode: res.data.result?.code || 'PENDING',
              resultDescription: res.data.result?.description,
              resourcePath: res.data.resourcePath,
              status: 'PENDING',
              updatedAt: new Date()
            }
          });
        } else {
          throw dbError;
        }
      }

      return {
        ...res.data,
        customerId: customer.id,
        planType: dto.planType
      };
    } catch (e: any) {
      const data = e?.response?.data;
      console.error('❌ [createSubscriptionCheckout] Error:', JSON.stringify({
        status: e?.response?.status,
        data: data,
        code: e.code,
        message: e.message
      }, null, 2));
      if (data) throw new BadRequestException({
        message: 'Gateway /v1/checkouts subscription error',
        gateway: data,
        status: e?.response?.status
      });
      if (e.code === 'ECONNABORTED' || e.message.includes('timeout')) {
        throw new InternalServerErrorException({
          message: 'Subscription checkout timeout - gateway not responding',
          error: e.message,
          code: e.code
        });
      }
      throw new InternalServerErrorException({
        message: 'Subscription checkout failed',
        error: e.message,
        code: e.code
      });
    }
  }

  async completeSubscriptionSetup(resourcePath: string, customerId: string, planType: SubscriptionPlanDto) {
    // Esperar a que el pago se complete (con reintentos para manejar códigos 200.xxx)
    console.log(`🔄 [completeSubscriptionSetup] Iniciando verificación del pago para resourcePath: ${resourcePath}`);
    const paymentResult = await this.waitForPaymentCompletion(resourcePath, 10, 2000, true); // true = usar entity recurring
    
    console.log(`📊 [completeSubscriptionSetup] Resultado del pago:`, JSON.stringify({
      resultCode: paymentResult.result?.code,
      resultDescription: paymentResult.result?.description,
      registrations: paymentResult.registrations,
      registrationId: paymentResult.registrationId
    }, null, 2));
    
    const successCodes = ['000.000.000', '000.000.100', '000.100.110', '000.100.112'];
    const isSuccess = successCodes.includes(paymentResult.result?.code);
    
    if (!isSuccess) {
      console.error(`❌ [completeSubscriptionSetup] Pago no exitoso. Código: ${paymentResult.result?.code}`);
      throw new BadRequestException({
        message: 'Pago inicial no exitoso',
        result: paymentResult.result
      });
    }

    let tokenData;
    if (paymentResult.registrations && paymentResult.registrations.length > 0) {
      tokenData = paymentResult.registrations[0];
    } else if (paymentResult.registrationId) {
      tokenData = { id: paymentResult.registrationId };
    } else if (paymentResult.card?.registrationId) {
      tokenData = { id: paymentResult.card.registrationId };
    } else {
      const searchForToken = (obj: any): string | null => {
        for (const [, value] of Object.entries(obj)) {
          if (typeof value === 'string' && value.match(/^[a-f0-9]{32}$/i)) return value;
          if (typeof value === 'object' && value !== null) {
            const found = searchForToken(value);
            if (found) return found;
          }
        }
        return null;
      };
      const foundToken = searchForToken(paymentResult);
      if (foundToken) tokenData = { id: foundToken };
    }

    if (!tokenData?.id) {
      throw new BadRequestException({
        message: 'No se pudo obtener el token de pago con recurringType=INITIAL',
        details: {
          resourcePath,
          availableFields: Object.keys(paymentResult),
          hasRegistrations: !!paymentResult.registrations,
          registrationsLength: paymentResult.registrations?.length || 0
        }
      });
    }

    const merchantTxnId = paymentResult.merchantTransactionId;
    let payment = await this.prisma.payment.findFirst({
      where: { merchantTransactionId: merchantTxnId },
      include: { customer: true }
    });

    if (!payment) {
      payment = await this.prisma.payment.findFirst({
        where: { resourcePath },
        include: { customer: true }
      });
    }

    if (!payment) {
      throw new NotFoundException(`Pago no encontrado para merchantTransactionId: ${merchantTxnId} o resourcePath: ${resourcePath}`);
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        gatewayResponse: paymentResult,
        resultCode: paymentResult.result.code,
        resultDescription: paymentResult.result.description,
        status: 'APPROVED'
      }
    });

    const tokenToSave = tokenData.id;
    const customerIdFromPayment = payment.customerId;

    const paymentToken = await this.prisma.paymentToken.create({
      data: {
        customerId: customerIdFromPayment,
        token: tokenToSave,
        brand: paymentResult.paymentBrand || 'UNKNOWN',
        last4: paymentResult.card?.last4Digits || '0000',
        expiryMonth: parseInt(paymentResult.card?.expiryMonth || '12'),
        expiryYear: parseInt(paymentResult.card?.expiryYear || '2030'),
        isActive: true
      }
    });

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { tokenId: paymentToken.id }
    });

    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

    const planPrices = {
      [SubscriptionPlanDto.GYM_MONTHLY]: 77.00,
      [SubscriptionPlanDto.APP_MONTHLY]: 19.99,
      [SubscriptionPlanDto.TEST_MONTHLY]: 1.00
    };

    const subscription = await this.prisma.subscription.create({
      data: {
        customerId: customerIdFromPayment,
        tokenId: paymentToken.id,
        planType,
        amount: planPrices[planType],
        nextBillingDate,
        lastBillingDate: new Date(),
        status: 'ACTIVE'
      }
    });

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        subscriptionId: subscription.id,
        paymentType: 'INITIAL',
        status: 'APPROVED',
        resultCode: paymentResult.result.code,
        resultDescription: paymentResult.result.description,
        updatedAt: new Date()
      }
    });

    const completeSubscription = await this.prisma.subscription.findUnique({
      where: { id: subscription.id },
      include: {
        customer: true,
        token: true,
        payments: { orderBy: { createdAt: 'asc' } }
      }
    });

    return {
      subscription: completeSubscription,
      paymentToken,
      paymentResult,
      customerId: customerIdFromPayment
    };
  }

  async processRecurringPayment(subscriptionId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { token: true, customer: true }
    });

    if (!subscription) throw new NotFoundException('Suscripción no encontrada');
    if (subscription.status !== 'ACTIVE') throw new BadRequestException('Suscripción no está activa');
    if (!subscription.token.isActive) throw new BadRequestException('Token de pago no está activo');

    const amount = subscription.amount.toNumber();
    const taxRate = 0.12;
    const baseImp = amount / (1 + taxRate);
    const iva = amount - baseImp;
    const merchantTransactionId = `SUB_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`.toUpperCase();

    // Nombres y descripciones de planes
    const planNames = {
      'GYM_MONTHLY': 'Plan Gimnasio Mensual',
      'APP_MONTHLY': 'Plan App Mensual',
      'TEST_MONTHLY': 'Plan Prueba Mensual'
    };
    const planDescriptions = {
      'GYM_MONTHLY': 'Suscripción mensual al gimnasio Animus Society',
      'APP_MONTHLY': 'Suscripción mensual a la app Animus Society',
      'TEST_MONTHLY': 'Suscripción de prueba mensual'
    };

    const planName = planNames[subscription.planType] || 'Plan Mensual';
    const planDescription = planDescriptions[subscription.planType] || 'Suscripción mensual';

    const params: Record<string, string> = {
      entityId: this.entityRecurring(), // Usar entity ID de recurrentes
      amount: amount.toFixed(2),
      currency: 'USD',
      paymentType: 'DB',
      recurringType: 'REPEATED',
      'risk.parameters[USER_DATA1]': 'REPEATED',
      'risk.parameters[USER_DATA2]': process.env.MERCHANT_NAME || 'TuComercio',
      merchantTransactionId,
      // Datos del cliente (OBLIGATORIOS en recurrencias según DataFast)
      'customer.givenName': subscription.customer.givenName,
      'customer.middleName': subscription.customer.middleName,
      'customer.surname': subscription.customer.surname,
      'customer.email': subscription.customer.email,
      'customer.identificationDocType': subscription.customer.identificationDocType,
      'customer.identificationDocId': subscription.customer.identificationDocId,
      'customer.phone': subscription.customer.phone,
      'customer.merchantCustomerId': subscription.customer.merchantCustomerId,
      // Información del carrito (obligatorio DataFast)
      'cart.items[0].name': planName,
      'cart.items[0].description': planDescription,
      'cart.items[0].price': amount.toFixed(2),
      'cart.items[0].quantity': '1',
      // Dirección de envío (obligatorio DataFast)
      'shipping.street1': subscription.customer.street1,
      'shipping.country': subscription.customer.country,
      // Dirección de facturación (obligatorio DataFast)
      'billing.street1': subscription.customer.street1,
      'billing.country': subscription.customer.country,
      // Parámetros DataFast
      'customParameters[SHOPPER_MID]': process.env.MID || '',
      'customParameters[SHOPPER_TID]': process.env.TID || '',
      'customParameters[SHOPPER_ECI]': '0103910',
      'customParameters[SHOPPER_PSERV]': '17913101',
      'customParameters[SHOPPER_VERSIONDF]': '2',
      'customParameters[SHOPPER_VAL_BASE0]': '0.00',
      'customParameters[SHOPPER_VAL_BASEIMP]': baseImp.toFixed(2),
      'customParameters[SHOPPER_VAL_IVA]': iva.toFixed(2),
    };
    if (process.env.TEST_MODE) params['testMode'] = process.env.TEST_MODE;

    try {
      const res = await firstValueFrom(this.http.post(
        `/v1/registrations/${subscription.token.token}/payments`,
        qs.stringify(params),
        { headers: { Authorization: `Bearer ${this.bearer()}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
      ));

      const paymentResult = res.data;
      const successCodes = ['000.000.000', '000.000.100', '000.100.110', '000.100.112'];
      const isSuccess = successCodes.includes(paymentResult.result?.code);

      const payment = await this.prisma.payment.create({
        data: {
          customerId: subscription.customerId,
          subscriptionId: subscription.id,
          tokenId: subscription.tokenId,
          paymentType: 'RECURRING',
          merchantTransactionId,
          amount,
          currency: 'USD',
          base0: 0,
          baseImp,
          iva,
          gatewayResponse: {
            ...paymentResult,
            billingInfo: {
              cycleDate: subscription.nextBillingDate,
              attemptNumber: subscription.failedAttempts + 1,
              isRetry: subscription.failedAttempts > 0
            }
          },
          resultCode: paymentResult.result?.code || 'FAILED',
          resultDescription: `${paymentResult.result?.description} (Intento ${subscription.failedAttempts + 1})`,
          status: isSuccess ? 'APPROVED' : 'REJECTED'
        },
        include: { subscription: true, token: true, customer: true }
      });

      if (isSuccess) {
        const nextBillingDate = new Date(subscription.nextBillingDate);
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
        await this.prisma.subscription.update({
          where: { id: subscriptionId },
          data: { lastBillingDate: new Date(), nextBillingDate, failedAttempts: 0 }
        });
      } else {
        const failedAttempts = subscription.failedAttempts + 1;
        const shouldCancel = failedAttempts >= subscription.maxRetries;
        await this.prisma.subscription.update({
          where: { id: subscriptionId },
          data: { failedAttempts, status: shouldCancel ? 'FAILED' : 'ACTIVE' }
        });
      }

      return { payment, paymentResult, success: isSuccess };
    } catch (e: any) {
      const failedAttempts = subscription.failedAttempts + 1;
      const shouldCancel = failedAttempts >= subscription.maxRetries;
      await this.prisma.subscription.update({
        where: { id: subscriptionId },
        data: { failedAttempts, status: shouldCancel ? 'FAILED' : 'ACTIVE' }
      });
      const data = e?.response?.data;
      if (data) throw new BadRequestException({ message: 'Gateway recurring payment', gateway: data });
      throw new InternalServerErrorException('Recurring payment failed (network/timeout)');
    }
  }

  async getDueSubscriptions() {
    const now = new Date();
    return this.prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        nextBillingDate: { lte: now },
        failedAttempts: { lt: 3 }
      },
      include: { customer: true, token: true }
    });
  }

  async pauseSubscription(subscriptionId: string) {
    return this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: 'PAUSED' }
    });
  }

  async cancelSubscription(subscriptionId: string) {
    return this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: 'CANCELLED' }
    });
  }

  async resumeSubscription(subscriptionId: string) {
    return this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: 'ACTIVE', failedAttempts: 0 }
    });
  }
}
