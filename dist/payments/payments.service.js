"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const prisma_service_1 = require("../prisma/prisma.service");
const create_subscription_dto_1 = require("./dto/create-subscription.dto");
const payment_status_enum_1 = require("./types/payment-status.enum");
const qs = require("qs");
let PaymentsService = class PaymentsService {
    constructor(http, prisma) {
        this.http = http;
        this.prisma = prisma;
    }
    bearer() { return (process.env.OPPWA_BEARER || '').trim(); }
    entity() { return (process.env.OPPWA_ENTITY_ID || '').trim(); }
    oppUrl() { return (process.env.OPPWA_URL || '').trim(); }
    async createCheckout(input) {
        var _a, _b, _c, _d, _e;
        if (process.env.TEST_MODE && parseFloat(input.amount) > 50) {
            throw new common_1.BadRequestException('En pruebas, amount debe ser ≤ 50.00');
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
        const params = {
            entityId: this.entity(),
            amount: input.amount,
            currency: (_a = input.currency) !== null && _a !== void 0 ? _a : 'USD',
            paymentType: (_b = input.paymentType) !== null && _b !== void 0 ? _b : 'DB',
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
            'cart.items[0].name': 'Pago único',
            'cart.items[0].description': 'Pago único de servicio',
            'cart.items[0].price': input.amount,
            'cart.items[0].quantity': '1',
            'shipping.street1': input.street1,
            'shipping.country': input.country,
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
        if (process.env.TEST_MODE)
            params['testMode'] = process.env.TEST_MODE;
        if (input.oneClick)
            params['createRegistration'] = 'true';
        (_c = input === null || input === void 0 ? void 0 : input.registrations) === null || _c === void 0 ? void 0 : _c.forEach((id, i) => (params[`registrations[${i}].id`] = id));
        console.log('📤 [createCheckout] Enviando al gateway:', JSON.stringify(params, null, 2));
        try {
            const res = await (0, rxjs_1.firstValueFrom)(this.http.post('/v1/checkouts', qs.stringify(params), { headers: { Authorization: `Bearer ${this.bearer()}`, 'Content-Type': 'application/x-www-form-urlencoded' } }));
            console.log('✅ [createCheckout] Respuesta del gateway:', JSON.stringify(res.data, null, 2));
            return res.data;
        }
        catch (e) {
            const data = (_d = e === null || e === void 0 ? void 0 : e.response) === null || _d === void 0 ? void 0 : _d.data;
            console.error('❌ [createCheckout] Error del gateway:', JSON.stringify({
                status: (_e = e === null || e === void 0 ? void 0 : e.response) === null || _e === void 0 ? void 0 : _e.status,
                data: data
            }, null, 2));
            if (data)
                throw new common_1.BadRequestException({ message: 'Gateway /v1/checkouts', gateway: data });
            throw new common_1.InternalServerErrorException('Checkout request failed (network/timeout)');
        }
    }
    async verifyRecurring(input) {
        var _a, _b, _c, _d, _e, _f, _g;
        const { merchantTransactionId, ndc } = input || {};
        if (!merchantTransactionId && !ndc) {
            return { success: false, status: 'ERROR', error: 'MISSING_KEYS' };
        }
        const payment = await this.prisma.payment.findFirst({
            where: {
                OR: [
                    merchantTransactionId ? { merchantTransactionId } : undefined,
                    ndc ? { gatewayResponse: { path: ['ndc'], equals: ndc } } : undefined,
                ].filter(Boolean),
            },
        });
        const isApprovedInDb = !!payment &&
            (payment.status === 'APPROVED' ||
                (typeof payment.resultCode === 'string' && payment.resultCode.startsWith('000.')));
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
            if (((_a = gw === null || gw === void 0 ? void 0 : gw.result) === null || _a === void 0 ? void 0 : _a.code) && String(gw.result.code).startsWith('000.')) {
                return {
                    success: true,
                    status: 'APPROVED',
                    resultCode: gw.result.code,
                    resultDescription: gw.result.description,
                    payment: { gatewayResponse: gw },
                };
            }
            const code = ((_b = gw === null || gw === void 0 ? void 0 : gw.result) === null || _b === void 0 ? void 0 : _b.code) ? String(gw.result.code) : '';
            const isPendingWrapper = code.startsWith('200.');
            return {
                success: false,
                status: isPendingWrapper ? 'PENDING' : 'PENDING',
                gateway: gw,
            };
        }
        catch (e) {
            const code = ((_e = (_d = (_c = e === null || e === void 0 ? void 0 : e.response) === null || _c === void 0 ? void 0 : _c.gateway) === null || _d === void 0 ? void 0 : _d.result) === null || _e === void 0 ? void 0 : _e.code) || ((_f = e === null || e === void 0 ? void 0 : e.result) === null || _f === void 0 ? void 0 : _f.code) || '';
            if (String(code).startsWith('200.')) {
                return {
                    success: false,
                    status: 'PENDING',
                    gateway: ((_g = e === null || e === void 0 ? void 0 : e.response) === null || _g === void 0 ? void 0 : _g.gateway) || (e === null || e === void 0 ? void 0 : e.gateway) || { result: { code } },
                };
            }
            return { success: false, status: 'ERROR', error: 'VERIFY_FAILED' };
        }
    }
    async getPaymentStatusSafe(idOrNdc) {
        var _a, _b, _c, _d, _e;
        try {
            const data = await this.getPaymentStatus(idOrNdc);
            return data;
        }
        catch (e) {
            const code = ((_c = (_b = (_a = e === null || e === void 0 ? void 0 : e.response) === null || _a === void 0 ? void 0 : _a.gateway) === null || _b === void 0 ? void 0 : _b.result) === null || _c === void 0 ? void 0 : _c.code) || ((_d = e === null || e === void 0 ? void 0 : e.result) === null || _d === void 0 ? void 0 : _d.code) || '';
            if (String(code).startsWith('200.')) {
                return ((_e = e === null || e === void 0 ? void 0 : e.response) === null || _e === void 0 ? void 0 : _e.gateway) || (e === null || e === void 0 ? void 0 : e.gateway) || { result: { code } };
            }
            throw e;
        }
    }
    async getPaymentStatus(resourcePath, customerId) {
        var _a, _b, _c, _d, _e, _f;
        const url = `${this.oppUrl()}${resourcePath}?entityId=${encodeURIComponent(this.entity())}`;
        try {
            const res = await (0, rxjs_1.firstValueFrom)(this.http.get(url, {
                headers: { Authorization: `Bearer ${this.bearer()}` },
            }));
            const paymentData = res.data;
            if (paymentData === null || paymentData === void 0 ? void 0 : paymentData.merchantTransactionId) {
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
                    }
                    else if (existingPayment.paymentType === 'INITIAL' || existingPayment.paymentType === 'RECURRING') {
                        const updateData = {
                            gatewayResponse: paymentData,
                            resultCode: paymentData.result.code,
                            resultDescription: paymentData.result.description,
                            resourcePath,
                            status: this.determinePaymentStatus(paymentData.result.code),
                            ...(((_a = paymentData.customParameters) === null || _a === void 0 ? void 0 : _a['SHOPPER_VAL_BASE0']) && {
                                base0: parseFloat(paymentData.customParameters['SHOPPER_VAL_BASE0'])
                            }),
                            ...(((_b = paymentData.customParameters) === null || _b === void 0 ? void 0 : _b['SHOPPER_VAL_BASEIMP']) && {
                                baseImp: parseFloat(paymentData.customParameters['SHOPPER_VAL_BASEIMP'])
                            }),
                            ...(((_c = paymentData.customParameters) === null || _c === void 0 ? void 0 : _c['SHOPPER_VAL_IVA']) && {
                                iva: parseFloat(paymentData.customParameters['SHOPPER_VAL_IVA'])
                            })
                        };
                        if (paymentData.tokenId)
                            updateData.tokenId = paymentData.tokenId;
                        if (paymentData.subscriptionId)
                            updateData.subscriptionId = paymentData.subscriptionId;
                        await this.prisma.payment.update({
                            where: { id: existingPayment.id },
                            data: updateData
                        });
                    }
                }
            }
            console.log('✅ [getPaymentStatus] Respuesta exitosa del gateway:', JSON.stringify(res.data, null, 2));
            return res.data;
        }
        catch (e) {
            const data = (_d = e === null || e === void 0 ? void 0 : e.response) === null || _d === void 0 ? void 0 : _d.data;
            console.error('❌ [getPaymentStatus] Error del gateway:', JSON.stringify({
                status: (_e = e === null || e === void 0 ? void 0 : e.response) === null || _e === void 0 ? void 0 : _e.status,
                statusText: (_f = e === null || e === void 0 ? void 0 : e.response) === null || _f === void 0 ? void 0 : _f.statusText,
                data: data,
                resourcePath: resourcePath,
                url: url
            }, null, 2));
            if (data)
                throw new common_1.BadRequestException({ message: 'Gateway status', gateway: data });
            throw new common_1.InternalServerErrorException('Status request failed (network/timeout)');
        }
    }
    async processPaymentCallback(resourcePath, data) {
        try {
            const paymentStatus = await this.getPaymentStatus(resourcePath);
            const payment = await this.prisma.payment.findUnique({
                where: { merchantTransactionId: paymentStatus.merchantTransactionId }
            });
            if (!payment) {
                throw new common_1.NotFoundException('Pago no encontrado en la base de datos');
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
        }
        catch (error) {
            throw new common_1.BadRequestException('Error procesando callback de pago: ' + error.message);
        }
    }
    determinePaymentStatus(resultCode) {
        if (resultCode.startsWith('000.000.') || resultCode.startsWith('000.100.')) {
            return payment_status_enum_1.PaymentStatus.APPROVED;
        }
        else if (resultCode.startsWith('000.200.') || resultCode.startsWith('200.')) {
            return payment_status_enum_1.PaymentStatus.PENDING;
        }
        else {
            return payment_status_enum_1.PaymentStatus.REJECTED;
        }
    }
    async waitForPaymentCompletion(resourcePath, maxAttempts = 10, delayMs = 2000) {
        var _a, _b, _c, _d, _e;
        console.log(`🔁 [waitForPaymentCompletion] Iniciando polling para: ${resourcePath}`);
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                console.log(`⏳ [waitForPaymentCompletion] Intento ${attempt}/${maxAttempts}...`);
                const paymentResult = await this.getPaymentStatus(resourcePath);
                const resultCode = ((_a = paymentResult.result) === null || _a === void 0 ? void 0 : _a.code) || '';
                console.log(`📊 [waitForPaymentCompletion] Código recibido: ${resultCode}, Descripción: ${(_b = paymentResult.result) === null || _b === void 0 ? void 0 : _b.description}`);
                const successCodes = ['000.000.000', '000.000.100', '000.100.110', '000.100.112'];
                const isSuccess = successCodes.includes(resultCode);
                const rejectionCodes = resultCode.startsWith('100.') || resultCode.startsWith('800.') || resultCode.startsWith('900.');
                if (isSuccess || rejectionCodes) {
                    console.log(`✅ [waitForPaymentCompletion] Intento ${attempt}/${maxAttempts}] Pago completado con código: ${resultCode}`);
                    return paymentResult;
                }
                if (resultCode.startsWith('200.') || resultCode.startsWith('000.200.')) {
                    console.log(`⏸️  [Intento ${attempt}/${maxAttempts}] Pago pendiente (${resultCode}), esperando ${delayMs}ms...`);
                    if (attempt < maxAttempts) {
                        await new Promise(resolve => setTimeout(resolve, delayMs));
                        continue;
                    }
                    else {
                        throw new common_1.BadRequestException({
                            message: 'El pago sigue en proceso después de múltiples intentos',
                            code: resultCode,
                            attempts: maxAttempts
                        });
                    }
                }
                console.log(`⚠️ [waitForPaymentCompletion] Código no reconocido: ${resultCode}, retornando resultado`);
                return paymentResult;
            }
            catch (error) {
                console.error(`❌ [waitForPaymentCompletion] Error en intento ${attempt}:`, error);
                if (attempt === maxAttempts) {
                    console.error(`❌ [waitForPaymentCompletion] Máximo de intentos alcanzado, error final:`, error);
                    throw error;
                }
                const errorCode = ((_e = (_d = (_c = error === null || error === void 0 ? void 0 : error.response) === null || _c === void 0 ? void 0 : _c.gateway) === null || _d === void 0 ? void 0 : _d.result) === null || _e === void 0 ? void 0 : _e.code) || '';
                console.log(`🔍 [waitForPaymentCompletion] Código de error: ${errorCode}`);
                if (errorCode.startsWith('200.') || errorCode.startsWith('000.200.')) {
                    console.log(`⏸️  [Intento ${attempt}/${maxAttempts}] Error pendiente, reintentando en ${delayMs}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                    continue;
                }
                console.error(`❌ [waitForPaymentCompletion] Error no manejable, propagando...`);
                throw error;
            }
        }
        throw new common_1.BadRequestException('No se pudo completar la verificación del pago');
    }
    async createSubscriptionCheckout(dto) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        const planPrices = {
            [create_subscription_dto_1.SubscriptionPlanDto.GYM_MONTHLY]: '77.00',
            [create_subscription_dto_1.SubscriptionPlanDto.APP_MONTHLY]: '19.99',
            [create_subscription_dto_1.SubscriptionPlanDto.TEST_MONTHLY]: '1.00'
        };
        const planNames = {
            [create_subscription_dto_1.SubscriptionPlanDto.GYM_MONTHLY]: 'Plan Gimnasio Mensual',
            [create_subscription_dto_1.SubscriptionPlanDto.APP_MONTHLY]: 'Plan App Mensual',
            [create_subscription_dto_1.SubscriptionPlanDto.TEST_MONTHLY]: 'Plan Prueba Mensual'
        };
        const planDescriptions = {
            [create_subscription_dto_1.SubscriptionPlanDto.GYM_MONTHLY]: 'Suscripción mensual al gimnasio Animus Society',
            [create_subscription_dto_1.SubscriptionPlanDto.APP_MONTHLY]: 'Suscripción mensual a la app Animus Society',
            [create_subscription_dto_1.SubscriptionPlanDto.TEST_MONTHLY]: 'Suscripción de prueba mensual'
        };
        const amount = planPrices[dto.planType];
        const planName = planNames[dto.planType];
        const planDescription = planDescriptions[dto.planType];
        if (!amount) {
            throw new common_1.BadRequestException('Plan de suscripción no válido');
        }
        if (process.env.TEST_MODE && parseFloat(amount) > 50) {
            throw new common_1.BadRequestException('En pruebas, amount debe ser ≤ 50.00');
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
        const params = {
            entityId: this.entity(),
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
        if (process.env.TEST_MODE)
            params['testMode'] = process.env.TEST_MODE;
        console.log('[createSubscriptionCheckout] Enviando al gateway:', JSON.stringify(params, null, 2));
        try {
            const res = await (0, rxjs_1.firstValueFrom)(this.http.post('/v1/checkouts', qs.stringify(params), { headers: { Authorization: `Bearer ${this.bearer()}`, 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 30000 }));
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
                        resultCode: ((_a = res.data.result) === null || _a === void 0 ? void 0 : _a.code) || 'PENDING',
                        resultDescription: (_b = res.data.result) === null || _b === void 0 ? void 0 : _b.description,
                        resourcePath: res.data.resourcePath,
                        status: 'PENDING'
                    }
                });
            }
            catch (dbError) {
                if (dbError.code === 'P2002' && ((_d = (_c = dbError.meta) === null || _c === void 0 ? void 0 : _c.target) === null || _d === void 0 ? void 0 : _d.includes('merchantTransactionId'))) {
                    await this.prisma.payment.update({
                        where: { merchantTransactionId: dto.merchantTransactionId },
                        data: {
                            gatewayResponse: res.data,
                            resultCode: ((_e = res.data.result) === null || _e === void 0 ? void 0 : _e.code) || 'PENDING',
                            resultDescription: (_f = res.data.result) === null || _f === void 0 ? void 0 : _f.description,
                            resourcePath: res.data.resourcePath,
                            status: 'PENDING',
                            updatedAt: new Date()
                        }
                    });
                }
                else {
                    throw dbError;
                }
            }
            return {
                ...res.data,
                customerId: customer.id,
                planType: dto.planType
            };
        }
        catch (e) {
            const data = (_g = e === null || e === void 0 ? void 0 : e.response) === null || _g === void 0 ? void 0 : _g.data;
            console.error('❌ [createSubscriptionCheckout] Error:', JSON.stringify({
                status: (_h = e === null || e === void 0 ? void 0 : e.response) === null || _h === void 0 ? void 0 : _h.status,
                data: data,
                code: e.code,
                message: e.message
            }, null, 2));
            if (data)
                throw new common_1.BadRequestException({
                    message: 'Gateway /v1/checkouts subscription error',
                    gateway: data,
                    status: (_j = e === null || e === void 0 ? void 0 : e.response) === null || _j === void 0 ? void 0 : _j.status
                });
            if (e.code === 'ECONNABORTED' || e.message.includes('timeout')) {
                throw new common_1.InternalServerErrorException({
                    message: 'Subscription checkout timeout - gateway not responding',
                    error: e.message,
                    code: e.code
                });
            }
            throw new common_1.InternalServerErrorException({
                message: 'Subscription checkout failed',
                error: e.message,
                code: e.code
            });
        }
    }
    async completeSubscriptionSetup(resourcePath, customerId, planType) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        console.log(`🔄 [completeSubscriptionSetup] Iniciando verificación del pago para resourcePath: ${resourcePath}`);
        const paymentResult = await this.waitForPaymentCompletion(resourcePath, 10, 2000);
        console.log(`📊 [completeSubscriptionSetup] Resultado del pago:`, JSON.stringify({
            resultCode: (_a = paymentResult.result) === null || _a === void 0 ? void 0 : _a.code,
            resultDescription: (_b = paymentResult.result) === null || _b === void 0 ? void 0 : _b.description,
            registrations: paymentResult.registrations,
            registrationId: paymentResult.registrationId
        }, null, 2));
        const successCodes = ['000.000.000', '000.000.100', '000.100.110', '000.100.112'];
        const isSuccess = successCodes.includes((_c = paymentResult.result) === null || _c === void 0 ? void 0 : _c.code);
        if (!isSuccess) {
            console.error(`❌ [completeSubscriptionSetup] Pago no exitoso. Código: ${(_d = paymentResult.result) === null || _d === void 0 ? void 0 : _d.code}`);
            throw new common_1.BadRequestException({
                message: 'Pago inicial no exitoso',
                result: paymentResult.result
            });
        }
        let tokenData;
        if (paymentResult.registrations && paymentResult.registrations.length > 0) {
            tokenData = paymentResult.registrations[0];
        }
        else if (paymentResult.registrationId) {
            tokenData = { id: paymentResult.registrationId };
        }
        else if ((_e = paymentResult.card) === null || _e === void 0 ? void 0 : _e.registrationId) {
            tokenData = { id: paymentResult.card.registrationId };
        }
        else {
            const searchForToken = (obj) => {
                for (const [, value] of Object.entries(obj)) {
                    if (typeof value === 'string' && value.match(/^[a-f0-9]{32}$/i))
                        return value;
                    if (typeof value === 'object' && value !== null) {
                        const found = searchForToken(value);
                        if (found)
                            return found;
                    }
                }
                return null;
            };
            const foundToken = searchForToken(paymentResult);
            if (foundToken)
                tokenData = { id: foundToken };
        }
        if (!(tokenData === null || tokenData === void 0 ? void 0 : tokenData.id)) {
            throw new common_1.BadRequestException({
                message: 'No se pudo obtener el token de pago con recurringType=INITIAL',
                details: {
                    resourcePath,
                    availableFields: Object.keys(paymentResult),
                    hasRegistrations: !!paymentResult.registrations,
                    registrationsLength: ((_f = paymentResult.registrations) === null || _f === void 0 ? void 0 : _f.length) || 0
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
            throw new common_1.NotFoundException(`Pago no encontrado para merchantTransactionId: ${merchantTxnId} o resourcePath: ${resourcePath}`);
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
                last4: ((_g = paymentResult.card) === null || _g === void 0 ? void 0 : _g.last4Digits) || '0000',
                expiryMonth: parseInt(((_h = paymentResult.card) === null || _h === void 0 ? void 0 : _h.expiryMonth) || '12'),
                expiryYear: parseInt(((_j = paymentResult.card) === null || _j === void 0 ? void 0 : _j.expiryYear) || '2030'),
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
            [create_subscription_dto_1.SubscriptionPlanDto.GYM_MONTHLY]: 77.00,
            [create_subscription_dto_1.SubscriptionPlanDto.APP_MONTHLY]: 19.99,
            [create_subscription_dto_1.SubscriptionPlanDto.TEST_MONTHLY]: 1.00
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
    async processRecurringPayment(subscriptionId) {
        var _a, _b, _c, _d;
        const subscription = await this.prisma.subscription.findUnique({
            where: { id: subscriptionId },
            include: { token: true, customer: true }
        });
        if (!subscription)
            throw new common_1.NotFoundException('Suscripción no encontrada');
        if (subscription.status !== 'ACTIVE')
            throw new common_1.BadRequestException('Suscripción no está activa');
        if (!subscription.token.isActive)
            throw new common_1.BadRequestException('Token de pago no está activo');
        const amount = subscription.amount.toNumber();
        const taxRate = 0.12;
        const baseImp = amount / (1 + taxRate);
        const iva = amount - baseImp;
        const merchantTransactionId = `SUB_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`.toUpperCase();
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
        const params = {
            entityId: this.entity(),
            amount: amount.toFixed(2),
            currency: 'USD',
            paymentType: 'DB',
            recurringType: 'REPEATED',
            'risk.parameters[USER_DATA1]': 'REPEATED',
            'risk.parameters[USER_DATA2]': process.env.MERCHANT_NAME || 'TuComercio',
            merchantTransactionId,
            'customer.givenName': subscription.customer.givenName,
            'customer.middleName': subscription.customer.middleName,
            'customer.surname': subscription.customer.surname,
            'customer.email': subscription.customer.email,
            'customer.identificationDocType': subscription.customer.identificationDocType,
            'customer.identificationDocId': subscription.customer.identificationDocId,
            'customer.phone': subscription.customer.phone,
            'customer.merchantCustomerId': subscription.customer.merchantCustomerId,
            'cart.items[0].name': planName,
            'cart.items[0].description': planDescription,
            'cart.items[0].price': amount.toFixed(2),
            'cart.items[0].quantity': '1',
            'shipping.street1': subscription.customer.street1,
            'shipping.country': subscription.customer.country,
            'billing.street1': subscription.customer.street1,
            'billing.country': subscription.customer.country,
            'customParameters[SHOPPER_MID]': process.env.MID || '',
            'customParameters[SHOPPER_TID]': process.env.TID || '',
            'customParameters[SHOPPER_ECI]': '0103910',
            'customParameters[SHOPPER_PSERV]': '17913101',
            'customParameters[SHOPPER_VERSIONDF]': '2',
            'customParameters[SHOPPER_VAL_BASE0]': '0.00',
            'customParameters[SHOPPER_VAL_BASEIMP]': baseImp.toFixed(2),
            'customParameters[SHOPPER_VAL_IVA]': iva.toFixed(2),
        };
        if (process.env.TEST_MODE)
            params['testMode'] = process.env.TEST_MODE;
        try {
            const res = await (0, rxjs_1.firstValueFrom)(this.http.post(`/v1/registrations/${subscription.token.token}/payments`, qs.stringify(params), { headers: { Authorization: `Bearer ${this.bearer()}`, 'Content-Type': 'application/x-www-form-urlencoded' } }));
            const paymentResult = res.data;
            const successCodes = ['000.000.000', '000.000.100', '000.100.110', '000.100.112'];
            const isSuccess = successCodes.includes((_a = paymentResult.result) === null || _a === void 0 ? void 0 : _a.code);
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
                    resultCode: ((_b = paymentResult.result) === null || _b === void 0 ? void 0 : _b.code) || 'FAILED',
                    resultDescription: `${(_c = paymentResult.result) === null || _c === void 0 ? void 0 : _c.description} (Intento ${subscription.failedAttempts + 1})`,
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
            }
            else {
                const failedAttempts = subscription.failedAttempts + 1;
                const shouldCancel = failedAttempts >= subscription.maxRetries;
                await this.prisma.subscription.update({
                    where: { id: subscriptionId },
                    data: { failedAttempts, status: shouldCancel ? 'FAILED' : 'ACTIVE' }
                });
            }
            return { payment, paymentResult, success: isSuccess };
        }
        catch (e) {
            const failedAttempts = subscription.failedAttempts + 1;
            const shouldCancel = failedAttempts >= subscription.maxRetries;
            await this.prisma.subscription.update({
                where: { id: subscriptionId },
                data: { failedAttempts, status: shouldCancel ? 'FAILED' : 'ACTIVE' }
            });
            const data = (_d = e === null || e === void 0 ? void 0 : e.response) === null || _d === void 0 ? void 0 : _d.data;
            if (data)
                throw new common_1.BadRequestException({ message: 'Gateway recurring payment', gateway: data });
            throw new common_1.InternalServerErrorException('Recurring payment failed (network/timeout)');
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
    async pauseSubscription(subscriptionId) {
        return this.prisma.subscription.update({
            where: { id: subscriptionId },
            data: { status: 'PAUSED' }
        });
    }
    async cancelSubscription(subscriptionId) {
        return this.prisma.subscription.update({
            where: { id: subscriptionId },
            data: { status: 'CANCELLED' }
        });
    }
    async resumeSubscription(subscriptionId) {
        return this.prisma.subscription.update({
            where: { id: subscriptionId },
            data: { status: 'ACTIVE', failedAttempts: 0 }
        });
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        prisma_service_1.PrismaService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map