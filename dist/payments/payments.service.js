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
        var _a, _b, _c, _d;
        if (process.env.TEST_MODE && parseFloat(input.amount) > 50) {
            throw new common_1.BadRequestException('En pruebas, amount debe ser ≤ 50.00');
        }
        const params = {
            entityId: this.entity(),
            amount: input.amount,
            currency: (_a = input.currency) !== null && _a !== void 0 ? _a : 'USD',
            paymentType: (_b = input.paymentType) !== null && _b !== void 0 ? _b : 'DB',
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
        if (process.env.TEST_MODE)
            params['testMode'] = process.env.TEST_MODE;
        if (input.oneClick)
            params['createRegistration'] = 'true';
        (_c = input === null || input === void 0 ? void 0 : input.registrations) === null || _c === void 0 ? void 0 : _c.forEach((id, i) => (params[`registrations[${i}].id`] = id));
        try {
            const res = await (0, rxjs_1.firstValueFrom)(this.http.post('/v1/checkouts', qs.stringify(params), {
                headers: {
                    Authorization: `Bearer ${this.bearer()}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }));
            return res.data;
        }
        catch (e) {
            const data = (_d = e === null || e === void 0 ? void 0 : e.response) === null || _d === void 0 ? void 0 : _d.data;
            if (data)
                throw new common_1.BadRequestException({ message: 'Gateway /v1/checkouts', gateway: data });
            throw new common_1.InternalServerErrorException('Checkout request failed (network/timeout)');
        }
    }
    async getPaymentStatus(resourcePath) {
        var _a;
        const url = `${this.oppUrl()}${resourcePath}?entityId=${encodeURIComponent(this.entity())}`;
        try {
            const res = await (0, rxjs_1.firstValueFrom)(this.http.get(url, {
                headers: { Authorization: `Bearer ${this.bearer()}` },
            }));
            return res.data;
        }
        catch (e) {
            const data = (_a = e === null || e === void 0 ? void 0 : e.response) === null || _a === void 0 ? void 0 : _a.data;
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
        else if (resultCode.startsWith('000.200.')) {
            return payment_status_enum_1.PaymentStatus.PENDING;
        }
        else {
            return payment_status_enum_1.PaymentStatus.REJECTED;
        }
    }
    async createSubscriptionCheckout(dto) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
        const planPrices = {
            [create_subscription_dto_1.SubscriptionPlanDto.GYM_MONTHLY]: '77.00',
            [create_subscription_dto_1.SubscriptionPlanDto.APP_MONTHLY]: '19.99',
            [create_subscription_dto_1.SubscriptionPlanDto.TEST_MONTHLY]: '1.00'
        };
        const amount = planPrices[dto.planType];
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
                }
            });
        }
        const params = {
            entityId: this.entity(),
            amount,
            currency: 'USD',
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
            'recurringType': 'INITIAL'
        };
        if (process.env.TEST_MODE)
            params['testMode'] = process.env.TEST_MODE;
        try {
            console.log('🚀 Iniciando creación de checkout para suscripción');
            console.log('📊 URL base:', process.env.OPPWA_URL);
            console.log('🔑 Entity ID:', this.entity());
            console.log('💳 Parámetros:', JSON.stringify(params, null, 2));
            const res = await (0, rxjs_1.firstValueFrom)(this.http.post('/v1/checkouts', qs.stringify(params), {
                headers: {
                    Authorization: `Bearer ${this.bearer()}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                timeout: 30000,
            }));
            console.log('✅ Respuesta del gateway:', JSON.stringify(res.data, null, 2));
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
                console.log('💾 Registro de pago inicial creado exitosamente');
            }
            catch (dbError) {
                if (dbError.code === 'P2002' && ((_d = (_c = dbError.meta) === null || _c === void 0 ? void 0 : _c.target) === null || _d === void 0 ? void 0 : _d.includes('merchantTransactionId'))) {
                    console.log('⚠️ MerchantTransactionId duplicado, actualizando registro existente');
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
                    console.log('✅ Registro de pago actualizado');
                }
                else {
                    console.error('❌ Error de base de datos:', dbError);
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
            console.error('❌ Error en createSubscriptionCheckout:', e.message);
            console.error('🔍 Detalles del error:', {
                status: (_g = e === null || e === void 0 ? void 0 : e.response) === null || _g === void 0 ? void 0 : _g.status,
                statusText: (_h = e === null || e === void 0 ? void 0 : e.response) === null || _h === void 0 ? void 0 : _h.statusText,
                data: (_j = e === null || e === void 0 ? void 0 : e.response) === null || _j === void 0 ? void 0 : _j.data,
                config: {
                    url: (_k = e === null || e === void 0 ? void 0 : e.config) === null || _k === void 0 ? void 0 : _k.url,
                    method: (_l = e === null || e === void 0 ? void 0 : e.config) === null || _l === void 0 ? void 0 : _l.method,
                    timeout: (_m = e === null || e === void 0 ? void 0 : e.config) === null || _m === void 0 ? void 0 : _m.timeout
                }
            });
            const data = (_o = e === null || e === void 0 ? void 0 : e.response) === null || _o === void 0 ? void 0 : _o.data;
            if (data)
                throw new common_1.BadRequestException({
                    message: 'Gateway /v1/checkouts subscription error',
                    gateway: data,
                    status: (_p = e === null || e === void 0 ? void 0 : e.response) === null || _p === void 0 ? void 0 : _p.status
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
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        console.log('🔄 Iniciando completeSubscriptionSetup:', { resourcePath, customerId, planType });
        const paymentResult = await this.getPaymentStatus(resourcePath);
        console.log('📊 Respuesta del pago:', JSON.stringify(paymentResult, null, 2));
        const successCodes = ['000.000.000', '000.000.100', '000.100.110', '000.100.112'];
        const isSuccess = successCodes.includes((_a = paymentResult.result) === null || _a === void 0 ? void 0 : _a.code);
        console.log('✅ Pago exitoso:', isSuccess, 'Code:', (_b = paymentResult.result) === null || _b === void 0 ? void 0 : _b.code);
        if (!isSuccess) {
            throw new common_1.BadRequestException({
                message: 'Pago inicial no exitoso',
                result: paymentResult.result
            });
        }
        console.log('🎫 Buscando token en la respuesta del pago (modalidad "En el momento de la transacción")...');
        console.log('📊 Respuesta completa para búsqueda de token:', JSON.stringify(paymentResult, null, 2));
        let tokenData;
        if (paymentResult.registrations && paymentResult.registrations.length > 0) {
            tokenData = paymentResult.registrations[0];
            console.log('🎫 Token encontrado en registrations:', JSON.stringify(tokenData, null, 2));
        }
        else if (paymentResult.registrationId) {
            console.log('🎫 Token encontrado como registrationId:', paymentResult.registrationId);
            tokenData = { id: paymentResult.registrationId };
        }
        else if ((_c = paymentResult.card) === null || _c === void 0 ? void 0 : _c.registrationId) {
            console.log('🎫 Token encontrado en card.registrationId:', paymentResult.card.registrationId);
            tokenData = { id: paymentResult.card.registrationId };
        }
        else {
            console.log('🔍 Buscando token en todas las propiedades...');
            const searchForToken = (obj, path = '') => {
                for (const [key, value] of Object.entries(obj)) {
                    const currentPath = path ? `${path}.${key}` : key;
                    if (typeof value === 'string' && value.match(/^[a-f0-9]{32}$/i)) {
                        console.log(`🎫 Posible token encontrado en ${currentPath}:`, value);
                        return value;
                    }
                    else if (typeof value === 'object' && value !== null) {
                        const found = searchForToken(value, currentPath);
                        if (found)
                            return found;
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
        if (!(tokenData === null || tokenData === void 0 ? void 0 : tokenData.id)) {
            console.error('❌ No se encontró token en la respuesta del pago');
            console.error('🔍 Campos disponibles en la respuesta:', Object.keys(paymentResult));
            throw new common_1.BadRequestException({
                message: 'No se pudo obtener el token de pago con recurringType=INITIAL',
                details: {
                    resourcePath,
                    availableFields: Object.keys(paymentResult),
                    hasRegistrations: !!paymentResult.registrations,
                    registrationsLength: ((_d = paymentResult.registrations) === null || _d === void 0 ? void 0 : _d.length) || 0
                }
            });
        }
        const merchantTxnId = paymentResult.merchantTransactionId;
        console.log('🔍 Buscando pago por merchantTransactionId:', merchantTxnId);
        let payment = await this.prisma.payment.findFirst({
            where: { merchantTransactionId: merchantTxnId },
            include: { customer: true }
        });
        if (!payment) {
            console.log('⚠️ Pago no encontrado por merchantTransactionId, intentando por resourcePath...');
            payment = await this.prisma.payment.findFirst({
                where: { resourcePath },
                include: { customer: true }
            });
        }
        if (!payment) {
            console.error('❌ Pago no encontrado en BD');
            console.error('🔍 Búsqueda por merchantTransactionId:', merchantTxnId);
            console.error('🔍 Búsqueda por resourcePath:', resourcePath);
            throw new common_1.NotFoundException(`Pago no encontrado para merchantTransactionId: ${merchantTxnId} o resourcePath: ${resourcePath}`);
        }
        console.log('📄 Pago encontrado en BD:', payment.id);
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
        const tokenToSave = tokenData.id;
        const customerIdFromPayment = payment.customerId;
        console.log('🎫 Preparando datos del token:', {
            tokenToSave,
            customerIdFromPayment,
            customerId,
            relatedPaymentId: payment.id,
            brand: paymentResult.paymentBrand,
            last4: (_e = paymentResult.card) === null || _e === void 0 ? void 0 : _e.last4Digits,
            expiryMonth: (_f = paymentResult.card) === null || _f === void 0 ? void 0 : _f.expiryMonth,
            expiryYear: (_g = paymentResult.card) === null || _g === void 0 ? void 0 : _g.expiryYear
        });
        try {
            const paymentToken = await this.prisma.paymentToken.create({
                data: {
                    customerId: customerIdFromPayment,
                    token: tokenToSave,
                    brand: paymentResult.paymentBrand || 'UNKNOWN',
                    last4: ((_h = paymentResult.card) === null || _h === void 0 ? void 0 : _h.last4Digits) || '0000',
                    expiryMonth: parseInt(((_j = paymentResult.card) === null || _j === void 0 ? void 0 : _j.expiryMonth) || '12'),
                    expiryYear: parseInt(((_k = paymentResult.card) === null || _k === void 0 ? void 0 : _k.expiryYear) || '2030'),
                    isActive: true
                }
            });
            console.log('✅ Token guardado exitosamente en BD:', {
                tokenId: paymentToken.id,
                token: tokenToSave,
                customerId: customerIdFromPayment,
                relatedPaymentId: payment.id
            });
            await this.prisma.payment.update({
                where: { id: payment.id },
                data: { tokenId: paymentToken.id }
            });
            console.log('✅ Pago actualizado con tokenId:', paymentToken.id);
            const nextBillingDate = new Date();
            nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
            const planPrices = {
                [create_subscription_dto_1.SubscriptionPlanDto.GYM_MONTHLY]: 77.00,
                [create_subscription_dto_1.SubscriptionPlanDto.APP_MONTHLY]: 19.99,
                [create_subscription_dto_1.SubscriptionPlanDto.TEST_MONTHLY]: 1.00
            };
            console.log('📅 Creando suscripción:', {
                customerId: customerIdFromPayment,
                tokenId: paymentToken.id,
                planType,
                amount: planPrices[planType],
                nextBillingDate
            });
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
            console.log('✅ Pago inicial actualizado con subscriptionId:', subscription.id);
            const completeSubscription = await this.prisma.subscription.findUnique({
                where: { id: subscription.id },
                include: {
                    customer: true,
                    token: true,
                    payments: {
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
        }
        catch (error) {
            console.error('❌ Error en el proceso de tokenización/suscripción:', error);
            throw new common_1.InternalServerErrorException(`Error en el proceso: ${error.message}`);
        }
    }
    async processRecurringPayment(subscriptionId) {
        var _a, _b, _c, _d;
        const subscription = await this.prisma.subscription.findUnique({
            where: { id: subscriptionId },
            include: {
                token: true,
                customer: true
            }
        });
        if (!subscription) {
            throw new common_1.NotFoundException('Suscripción no encontrada');
        }
        if (subscription.status !== 'ACTIVE') {
            throw new common_1.BadRequestException('Suscripción no está activa');
        }
        if (!subscription.token.isActive) {
            throw new common_1.BadRequestException('Token de pago no está activo');
        }
        const amount = subscription.amount.toNumber();
        const taxRate = 0.12;
        const baseImp = amount / (1 + taxRate);
        const iva = amount - baseImp;
        const merchantTransactionId = `SUB_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`.toUpperCase();
        const params = {
            entityId: this.entity(),
            amount: amount.toFixed(2),
            currency: 'USD',
            paymentType: 'DB',
            recurringType: 'REPEATED',
            'risk.parameters[USER_DATA1]': 'REPEATED',
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
        if (process.env.TEST_MODE)
            params['testMode'] = process.env.TEST_MODE;
        try {
            const res = await (0, rxjs_1.firstValueFrom)(this.http.post(`/v1/registrations/${subscription.token.token}/payments`, qs.stringify(params), {
                headers: {
                    Authorization: `Bearer ${this.bearer()}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }));
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
                include: {
                    subscription: true,
                    token: true,
                    customer: true
                }
            });
            if (isSuccess) {
                const nextBillingDate = new Date(subscription.nextBillingDate);
                nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
                await this.prisma.subscription.update({
                    where: { id: subscriptionId },
                    data: {
                        lastBillingDate: new Date(),
                        nextBillingDate,
                        failedAttempts: 0
                    }
                });
            }
            else {
                const failedAttempts = subscription.failedAttempts + 1;
                const shouldCancel = failedAttempts >= subscription.maxRetries;
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
        }
        catch (e) {
            const failedAttempts = subscription.failedAttempts + 1;
            const shouldCancel = failedAttempts >= subscription.maxRetries;
            await this.prisma.subscription.update({
                where: { id: subscriptionId },
                data: {
                    failedAttempts,
                    status: shouldCancel ? 'FAILED' : 'ACTIVE'
                }
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
                nextBillingDate: {
                    lte: now
                },
                failedAttempts: {
                    lt: 3
                }
            },
            include: {
                customer: true,
                token: true
            }
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
            data: {
                status: 'ACTIVE',
                failedAttempts: 0
            }
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