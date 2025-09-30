// src/payments/payments.service.ts
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
  private entity() { return (process.env.OPPWA_ENTITY_ID || '').trim(); }
  private oppUrl() { return (process.env.OPPWA_URL || '').trim(); }

  async createCheckout(input: any) {
    // guardrails sandbox
    if (process.env.TEST_MODE && parseFloat(input.amount) > 50) {
      throw new BadRequestException('En pruebas, amount debe ser ≤ 50.00');
    }

    // Crear o encontrar cliente primero
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
        }
      });
    }

    // Verificar si ya existe un pago con este merchantTransactionId
    let payment = await this.prisma.payment.findUnique({
      where: { merchantTransactionId: input.merchantTransactionId }
    });

    // Si existe, generamos un nuevo merchantTransactionId único
    let merchantTransactionId = input.merchantTransactionId;
    if (payment) {
      merchantTransactionId = `${input.merchantTransactionId}_${Date.now()}`;
      console.log(`⚠️ MerchantTransactionId duplicado, generando nuevo ID: ${merchantTransactionId}`);
    }

    // Crear nuevo pago
    payment = await this.prisma.payment.create({
      data: {
        customer: {
          connect: {
            id: customer.id
          }
        },
        paymentType: 'ONE_TIME',
        merchantTransactionId, // Usamos el ID posiblemente modificado
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

    const params: Record<string,string> = {
      entityId: this.entity(),
      amount: input.amount,
      currency: input.currency ?? 'USD',
      paymentType: input.paymentType ?? 'DB',
      'customer.givenName': input.givenName,
      'customer.middleName': input.middleName,
      'customer.surname': input.surname,
      'customer.ip': input.customerIp,
      'merchantTransactionId': input.merchantTransactionId,
      'customer.merchantCustomerId': input.merchantCustomerId,
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

    try {
      const res = await firstValueFrom(this.http.post(
        '/v1/checkouts',
        qs.stringify(params),
        {
          headers: {
            Authorization: `Bearer ${this.bearer()}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      ));
      return res.data;
    } catch (e: any) {
      const data = e?.response?.data;
      if (data) throw new BadRequestException({ message: 'Gateway /v1/checkouts', gateway: data });
      throw new InternalServerErrorException('Checkout request failed (network/timeout)');
    }
  }

  async getPaymentStatus(resourcePath: string, customerId?: string) {
    const url = `${this.oppUrl()}${resourcePath}?entityId=${encodeURIComponent(this.entity())}`;
    try {
      const res = await firstValueFrom(this.http.get(url, {
        headers: { Authorization: `Bearer ${this.bearer()}` },
      }));
      
      const paymentData = res.data;
      
      if (paymentData?.merchantTransactionId) {
        // Buscar el pago existente por merchantTransactionId
        const existingPayment = await this.prisma.payment.findUnique({
          where: { merchantTransactionId: paymentData.merchantTransactionId }
        });

        if (existingPayment) {
          // Si es un pago único (ONE_TIME), solo actualizamos el estado y la respuesta
          if (existingPayment.paymentType === 'ONE_TIME') {
            await this.prisma.payment.update({
              where: { id: existingPayment.id }, // Usamos ID en lugar de merchantTransactionId para más seguridad
              data: {
                gatewayResponse: paymentData,
                resultCode: paymentData.result.code,
                resultDescription: paymentData.result.description,
                resourcePath,
                status: this.determinePaymentStatus(paymentData.result.code)
              }
            });
          } else if (existingPayment.paymentType === 'INITIAL' || existingPayment.paymentType === 'RECURRING') {
            // Para pagos de suscripción, actualizamos todos los campos relevantes
            const updateData: any = {
              gatewayResponse: paymentData,
              resultCode: paymentData.result.code,
              resultDescription: paymentData.result.description,
              resourcePath,
              status: this.determinePaymentStatus(paymentData.result.code),
              // Actualizar valores de impuestos si vienen en la respuesta
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

            // Solo para pagos de suscripción
            if (paymentData.tokenId) updateData.tokenId = paymentData.tokenId;
            if (paymentData.subscriptionId) updateData.subscriptionId = paymentData.subscriptionId;

            // Actualizar el pago
            await this.prisma.payment.update({
              where: { id: existingPayment.id }, // Usamos ID en lugar de merchantTransactionId
              data: updateData
            });
          }
        }
      }

      return res.data;
    } catch (e: any) {
      const data = e?.response?.data;
      if (data) throw new BadRequestException({ message: 'Gateway status', gateway: data });
      throw new InternalServerErrorException('Status request failed (network/timeout)');
    }
  }

  async processPaymentCallback(resourcePath: string, data: any): Promise<any> {
    try {
      // Obtener estado del pago desde el gateway
      const paymentStatus = await this.getPaymentStatus(resourcePath);

      // Buscar el pago por merchantTransactionId
      const payment = await this.prisma.payment.findUnique({
        where: { merchantTransactionId: paymentStatus.merchantTransactionId }
      });

      if (!payment) {
        throw new NotFoundException('Pago no encontrado en la base de datos');
      }

      // Actualizar el pago con la respuesta del gateway
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
    } else if (resultCode.startsWith('000.200.')) {
      return PaymentStatus.PENDING;
    } else {
      return PaymentStatus.REJECTED;
    }
  }

  // ==================== SUSCRIPCIONES Y RECURRENCIAS ====================

  /**
   * Crea pago inicial con tokenización para suscripción mensual
   */
  async createSubscriptionCheckout(dto: CreateSubscriptionDto) {
    // Determinar precio según plan
    const planPrices = {
      [SubscriptionPlanDto.GYM_MONTHLY]: '77.00',
      [SubscriptionPlanDto.APP_MONTHLY]: '19.99',
      [SubscriptionPlanDto.TEST_MONTHLY]: '1.00'
    };

    const amount = planPrices[dto.planType];
    if (!amount) {
      throw new BadRequestException('Plan de suscripción no válido');
    }

    // Guardrails sandbox
    if (process.env.TEST_MODE && parseFloat(amount) > 50) {
      throw new BadRequestException('En pruebas, amount debe ser ≤ 50.00');
    }

    // Crear o encontrar cliente
    // @ts-ignore - Temporal hasta que se actualicen los tipos de Prisma
    let customer = await this.prisma.customer.findUnique({
      where: { email: dto.email }
    });

    if (!customer) {
      // @ts-ignore - Temporal hasta que se actualicen los tipos de Prisma
      customer = await this.prisma.customer.create({
        // @ts-ignore - Temporal hasta que se actualicen los tipos de Prisma
        data: {
          // @ts-ignore - Temporal hasta que se actualicen los tipos de Prisma
          merchantCustomerId: dto.merchantCustomerId,
          email: dto.email,
          givenName: dto.givenName,
          middleName: dto.middleName,
          surname: dto.surname,
        }
      });
    }

    // Crear checkout con tokenización - Modalidad "En el momento de la transacción"
    // Según documentación: incluir paymentType=DB + recurringType=INITIAL
    const params: Record<string,string> = {
      entityId: this.entity(),
      amount,
      currency: 'USD',
      // IMPORTANTE: Para modalidad "En el momento de la transacción" SÍ incluir paymentType
      'paymentType': 'DB',
      'customer.givenName': dto.givenName,
      'customer.middleName': dto.middleName,
      'customer.surname': dto.surname,
      'customer.ip': dto.customerIp,
      'customer.email': dto.email,
      'merchantTransactionId': dto.merchantTransactionId,
      'customer.merchantCustomerId': dto.merchantCustomerId,
      'customParameters[SHOPPER_VAL_BASE0]': dto.base0,
      'customParameters[SHOPPER_VAL_BASEIMP]': dto.baseImp,
      'customParameters[SHOPPER_VAL_IVA]': dto.iva,
      'customParameters[SHOPPER_MID]': process.env.MID || '',
      'customParameters[SHOPPER_TID]': process.env.TID || '',
      'customParameters[SHOPPER_ECI]': '0103910',
      'customParameters[SHOPPER_PSERV]': '17913101',
      'customParameters[SHOPPER_VERSIONDF]': '2',
      'risk.parameters[USER_DATA2]': process.env.MERCHANT_NAME || 'TuComercio',
      // CRÍTICO: Modalidad "En el momento de la transacción" según documentación
      'recurringType': 'INITIAL'
    };

    if (process.env.TEST_MODE) params['testMode'] = process.env.TEST_MODE;

    try {
      console.log('🚀 Iniciando creación de checkout para suscripción');
      console.log('📊 URL base:', process.env.OPPWA_URL);
      console.log('🔑 Entity ID:', this.entity());
      console.log('💳 Parámetros:', JSON.stringify(params, null, 2));
      
      const res = await firstValueFrom(this.http.post(
        '/v1/checkouts',
        qs.stringify(params),
        {
          headers: {
            Authorization: `Bearer ${this.bearer()}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 30000, // Aumentar timeout específicamente para suscripciones
        }
      ));
      
      console.log('✅ Respuesta del gateway:', JSON.stringify(res.data, null, 2));

      // Crear registro inicial del pago (con manejo de duplicados)
      try {
        // @ts-ignore - Temporal hasta que se actualicen los tipos de Prisma
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
        console.log('💾 Registro de pago inicial creado exitosamente');
      } catch (dbError: any) {
        if (dbError.code === 'P2002' && dbError.meta?.target?.includes('merchantTransactionId')) {
          console.log('⚠️ MerchantTransactionId duplicado, actualizando registro existente');
          // @ts-ignore - Temporal hasta que se actualicen los tipos de Prisma
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
          console.log('✅ Registro de pago actualizado');
        } else {
          console.error('❌ Error de base de datos:', dbError);
          throw dbError;
        }
      }

      return { 
        ...res.data, 
        customerId: customer.id,
        planType: dto.planType 
      };
    } catch (e: any) {
      console.error('❌ Error en createSubscriptionCheckout:', e.message);
      console.error('🔍 Detalles del error:', {
        status: e?.response?.status,
        statusText: e?.response?.statusText,
        data: e?.response?.data,
        config: {
          url: e?.config?.url,
          method: e?.config?.method,
          timeout: e?.config?.timeout
        }
      });
      
      const data = e?.response?.data;
      if (data) throw new BadRequestException({ 
        message: 'Gateway /v1/checkouts subscription error', 
        gateway: data,
        status: e?.response?.status
      });
      
      // Error de red/timeout
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

  /**
   * Procesa el resultado del pago inicial y crea la suscripción
   */
  async completeSubscriptionSetup(resourcePath: string, customerId: string, planType: SubscriptionPlanDto) {
    console.log('🔄 Iniciando completeSubscriptionSetup:', { resourcePath, customerId, planType });
    
    // Obtener estado del pago
    const paymentResult = await this.getPaymentStatus(resourcePath);
    console.log('📊 Respuesta del pago:', JSON.stringify(paymentResult, null, 2));
    
    // Verificar si el pago fue exitoso
    const successCodes = ['000.000.000', '000.000.100', '000.100.110', '000.100.112'];
    const isSuccess = successCodes.includes(paymentResult.result?.code);
    console.log('✅ Pago exitoso:', isSuccess, 'Code:', paymentResult.result?.code);

    if (!isSuccess) {
      throw new BadRequestException({
        message: 'Pago inicial no exitoso',
        result: paymentResult.result
      });
    }

    // Modalidad "En el momento de la transacción" - el token viene directamente en la respuesta
    console.log('🎫 Buscando token en la respuesta del pago (modalidad "En el momento de la transacción")...');
    console.log('📊 Respuesta completa para búsqueda de token:', JSON.stringify(paymentResult, null, 2));
    
    let tokenData;
    
    // Según documentación, con recurringType=INITIAL el token debería venir en "registrations"
    if (paymentResult.registrations && paymentResult.registrations.length > 0) {
      tokenData = paymentResult.registrations[0];
      console.log('🎫 Token encontrado en registrations:', JSON.stringify(tokenData, null, 2));
    } 
    // Buscar en otras ubicaciones posibles
    else if (paymentResult.registrationId) {
      console.log('🎫 Token encontrado como registrationId:', paymentResult.registrationId);
      tokenData = { id: paymentResult.registrationId };
    } 
    else if (paymentResult.card?.registrationId) {
      console.log('🎫 Token encontrado en card.registrationId:', paymentResult.card.registrationId);
      tokenData = { id: paymentResult.card.registrationId };
    }
    // Buscar tokens que tengan patrón hexadecimal de 32 caracteres
    else {
      console.log('🔍 Buscando token en todas las propiedades...');
      const searchForToken = (obj: any, path = ''): string | null => {
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key;
          if (typeof value === 'string' && value.match(/^[a-f0-9]{32}$/i)) {
            console.log(`🎫 Posible token encontrado en ${currentPath}:`, value);
            return value;
          } else if (typeof value === 'object' && value !== null) {
            const found = searchForToken(value, currentPath);
            if (found) return found;
          }
        }
        return null;
      };
      
      const foundToken = searchForToken(paymentResult);
      if (foundToken) {
        tokenData = { id: foundToken };
        console.log('✅ Token encontrado mediante búsqueda:', foundToken);
      }
    }

    if (!tokenData?.id) {
      console.error('❌ No se encontró token en la respuesta del pago');
      console.error('🔍 Campos disponibles en la respuesta:', Object.keys(paymentResult));
      
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

    // Buscar el pago en BD por merchantTransactionId (más confiable que resourcePath)
    const merchantTxnId = paymentResult.merchantTransactionId;
    console.log('🔍 Buscando pago por merchantTransactionId:', merchantTxnId);
    
    // @ts-ignore - Temporal hasta que se actualicen los tipos de Prisma
    let payment = await this.prisma.payment.findFirst({
      where: { merchantTransactionId: merchantTxnId },
      include: { customer: true }
    });

    if (!payment) {
      console.log('⚠️ Pago no encontrado por merchantTransactionId, intentando por resourcePath...');
      // @ts-ignore - Temporal hasta que se actualicen los tipos de Prisma
      payment = await this.prisma.payment.findFirst({
        where: { resourcePath },
        include: { customer: true }
      });
    }

    if (!payment) {
      console.error('❌ Pago no encontrado en BD');
      console.error('🔍 Búsqueda por merchantTransactionId:', merchantTxnId);
      console.error('🔍 Búsqueda por resourcePath:', resourcePath);
      throw new NotFoundException(`Pago no encontrado para merchantTransactionId: ${merchantTxnId} o resourcePath: ${resourcePath}`);
    }

    console.log('📄 Pago encontrado en BD:', payment.id);

    // @ts-ignore - Temporal hasta que se actualicen los tipos de Prisma
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        gatewayResponse: paymentResult,
        resultCode: paymentResult.result.code,
        resultDescription: paymentResult.result.description,
        status: 'APPROVED'
      }
    });

    console.log('💾 Actualizando pago en BD');

    // Crear token de pago
    const tokenToSave = tokenData.id;
    const customerIdFromPayment = payment.customerId; // Usar el customerId del pago encontrado
    
    console.log('🎫 Preparando datos del token:', {
      tokenToSave,
      customerIdFromPayment,
      customerId, // El que nos pasaron como parámetro
      relatedPaymentId: payment.id,
      brand: paymentResult.paymentBrand,
      last4: paymentResult.card?.last4Digits,
      expiryMonth: paymentResult.card?.expiryMonth,
      expiryYear: paymentResult.card?.expiryYear
    });

    try {
      // @ts-ignore - Temporal hasta que se actualicen los tipos de Prisma
      const paymentToken = await this.prisma.paymentToken.create({
        data: {
          customerId: customerIdFromPayment, // Usar el customerId del pago
          token: tokenToSave,
          brand: paymentResult.paymentBrand || 'UNKNOWN',
          last4: paymentResult.card?.last4Digits || '0000',
          expiryMonth: parseInt(paymentResult.card?.expiryMonth || '12'),
          expiryYear: parseInt(paymentResult.card?.expiryYear || '2030'),
          isActive: true
        }
      });

      console.log('✅ Token guardado exitosamente en BD:', {
        tokenId: paymentToken.id,
        token: tokenToSave,
        customerId: customerIdFromPayment,
        relatedPaymentId: payment.id
      });

      // Actualizar el pago con el tokenId para referencia
      // @ts-ignore - Temporal hasta que se actualicen los tipos de Prisma
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { tokenId: paymentToken.id }
      });

      console.log('✅ Pago actualizado con tokenId:', paymentToken.id);

      // Crear suscripción
      const nextBillingDate = new Date();
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1); // Próximo mes

      const planPrices = {
        [SubscriptionPlanDto.GYM_MONTHLY]: 77.00,
        [SubscriptionPlanDto.APP_MONTHLY]: 19.99,
        [SubscriptionPlanDto.TEST_MONTHLY]: 1.00
      };

      console.log('📅 Creando suscripción:', {
        customerId: customerIdFromPayment,
        tokenId: paymentToken.id,
        planType,
        amount: planPrices[planType],
        nextBillingDate
      });

      // Crear la suscripción y relacionarla con todos los registros
      // @ts-ignore - Temporal hasta que se actualicen los tipos de Prisma
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

      console.log('🎉 Suscripción creada exitosamente:', {
        subscriptionId: subscription.id,
        customerId: customerIdFromPayment,
        tokenId: paymentToken.id,
        planType,
        amount: planPrices[planType]
      });

      // Actualizar el pago inicial para relacionarlo con la suscripción
      // @ts-ignore - Temporal hasta que se actualicen los tipos de Prisma
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          subscriptionId: subscription.id, // Relacionar el pago con la suscripción
          paymentType: 'INITIAL', // Marcar como pago inicial
          status: 'APPROVED',
          resultCode: paymentResult.result.code,
          resultDescription: paymentResult.result.description,
          updatedAt: new Date()
        }
      });

      console.log('✅ Pago inicial actualizado con subscriptionId:', subscription.id);

      // Consultar la suscripción con todas sus relaciones
      // @ts-ignore - Temporal hasta que se actualicen los tipos de Prisma
      const completeSubscription = await this.prisma.subscription.findUnique({
        where: { id: subscription.id },
        include: {
          customer: true,
          token: true,
          payments: { // Incluir todos los pagos relacionados
            orderBy: { 
              createdAt: 'asc' 
            }
          }
        }
      });

      return {
        subscription: completeSubscription,
        paymentToken,
        paymentResult,
        customerId: customerIdFromPayment
      };
      
    } catch (error: any) {
      console.error('❌ Error en el proceso de tokenización/suscripción:', error);
      throw new InternalServerErrorException(`Error en el proceso: ${error.message}`);
    }
  }

  /**
   * Procesa un pago recurrente usando el token guardado
   */
  async processRecurringPayment(subscriptionId: string) {
    // Obtener suscripción con token y customer
    // @ts-ignore - Temporal hasta que se actualicen los tipos de Prisma
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        token: true,
        customer: true
      }
    });

    if (!subscription) {
      throw new NotFoundException('Suscripción no encontrada');
    }

    if (subscription.status !== 'ACTIVE') {
      throw new BadRequestException('Suscripción no está activa');
    }

    if (!subscription.token.isActive) {
      throw new BadRequestException('Token de pago no está activo');
    }

    // Calcular impuestos
    const amount = subscription.amount.toNumber();
    const taxRate = 0.12;
    const baseImp = amount / (1 + taxRate);
    const iva = amount - baseImp;

    // Generar ID único para esta transacción
    const merchantTransactionId = `SUB_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`.toUpperCase();

    // Preparar request para recurrencia
    const params: Record<string,string> = {
      entityId: this.entity(),
      amount: amount.toFixed(2),
      currency: 'USD',
      paymentType: 'DB',
      recurringType: 'REPEATED', // CRÍTICO para recurrencia
      'risk.parameters[USER_DATA1]': 'REPEATED', // CRÍTICO para recurrencia (según documentación)
      'risk.parameters[USER_DATA2]': process.env.MERCHANT_NAME || 'TuComercio',
      merchantTransactionId,
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
      // Hacer el pago recurrente
      const res = await firstValueFrom(this.http.post(
        `/v1/registrations/${subscription.token.token}/payments`,
        qs.stringify(params),
        {
          headers: {
            Authorization: `Bearer ${this.bearer()}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      ));

      const paymentResult = res.data;
      const successCodes = ['000.000.000', '000.000.100', '000.100.110', '000.100.112'];
      const isSuccess = successCodes.includes(paymentResult.result?.code);

      // Registrar el pago recurrente en BD
      // @ts-ignore - Temporal hasta que se actualicen los tipos de Prisma
      const payment = await this.prisma.payment.create({
        data: {
          customerId: subscription.customerId,
          subscriptionId: subscription.id, // Relacionar con la suscripción
          tokenId: subscription.tokenId,
          paymentType: 'RECURRING', // Tipo para pagos recurrentes
          merchantTransactionId,
          amount,
          currency: 'USD',
          base0: 0,
          baseImp,
          iva,
          gatewayResponse: {
            ...paymentResult,
            // Incluir información adicional en el JSON de respuesta
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
        // Incluir relaciones en la respuesta
        include: {
          subscription: true,
          token: true,
          customer: true
        }
      });

      if (isSuccess) {
        // Actualizar suscripción: próximo cobro y resetear intentos fallidos
        const nextBillingDate = new Date(subscription.nextBillingDate);
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

        // @ts-ignore - Temporal hasta que se actualicen los tipos de Prisma
        await this.prisma.subscription.update({
          where: { id: subscriptionId },
          data: {
            lastBillingDate: new Date(),
            nextBillingDate,
            failedAttempts: 0
          }
        });
      } else {
        // Incrementar intentos fallidos
        const failedAttempts = subscription.failedAttempts + 1;
        const shouldCancel = failedAttempts >= subscription.maxRetries;

        // @ts-ignore - Temporal hasta que se actualicen los tipos de Prisma
        await this.prisma.subscription.update({
          where: { id: subscriptionId },
          data: {
            failedAttempts,
            status: shouldCancel ? 'FAILED' : 'ACTIVE'
          }
        });
      }

      return {
        payment,
        paymentResult,
        success: isSuccess
      };
    } catch (e: any) {
      // En caso de error de red, también incrementar intentos fallidos
      const failedAttempts = subscription.failedAttempts + 1;
      const shouldCancel = failedAttempts >= subscription.maxRetries;

      // @ts-ignore - Temporal hasta que se actualicen los tipos de Prisma
      await this.prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          failedAttempts,
          status: shouldCancel ? 'FAILED' : 'ACTIVE'
        }
      });

      const data = e?.response?.data;
      if (data) throw new BadRequestException({ message: 'Gateway recurring payment', gateway: data });
      throw new InternalServerErrorException('Recurring payment failed (network/timeout)');
    }
  }

  /**
   * Obtiene suscripciones pendientes de cobro
   */
  async getDueSubscriptions() {
    const now = new Date();
    // @ts-ignore - Temporal hasta que se actualicen los tipos de Prisma
    return this.prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        nextBillingDate: {
          lte: now
        },
        failedAttempts: {
          lt: 3 // Solo las que no han fallado más de 3 veces
        }
      },
      include: {
        customer: true,
        token: true
      }
    });
  }

  /**
   * Pausa una suscripción
   */
  async pauseSubscription(subscriptionId: string) {
    // @ts-ignore - Temporal hasta que se actualicen los tipos de Prisma
    return this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: 'PAUSED' }
    });
  }

  /**
   * Cancela una suscripción
   */
  async cancelSubscription(subscriptionId: string) {
    // @ts-ignore - Temporal hasta que se actualicen los tipos de Prisma
    return this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: 'CANCELLED' }
    });
  }

  /**
   * Reactiva una suscripción pausada
   */
  async resumeSubscription(subscriptionId: string) {
    // @ts-ignore - Temporal hasta que se actualicen los tipos de Prisma
    return this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: { 
        status: 'ACTIVE',
        failedAttempts: 0 // Reset intentos fallidos
      }
    });
  }
}
