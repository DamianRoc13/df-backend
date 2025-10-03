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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const payments_service_1 = require("./payments.service");
const create_checkout_dto_1 = require("./dto/create-checkout.dto");
const create_subscription_dto_1 = require("./dto/create-subscription.dto");
let PaymentsController = class PaymentsController {
    constructor(svc) {
        this.svc = svc;
    }
    async create(dto, req) {
        var _a, _b, _c;
        const ip = ((_b = (_a = req.headers['x-forwarded-for']) === null || _a === void 0 ? void 0 : _a.split(',')[0]) === null || _b === void 0 ? void 0 : _b.trim())
            || ((_c = req.socket) === null || _c === void 0 ? void 0 : _c.remoteAddress) || dto.customerIp;
        return this.svc.createCheckout({ ...dto, customerIp: ip });
    }
    async verifyRecurring(body) {
        return this.svc.verifyRecurring(body);
    }
    async status(resourcePath) {
        return this.svc.getPaymentStatus(resourcePath);
    }
    async createSubscriptionCheckout(dto, req) {
        var _a, _b, _c;
        const ip = ((_b = (_a = req.headers['x-forwarded-for']) === null || _a === void 0 ? void 0 : _a.split(',')[0]) === null || _b === void 0 ? void 0 : _b.trim())
            || ((_c = req.socket) === null || _c === void 0 ? void 0 : _c.remoteAddress) || dto.customerIp;
        return this.svc.createSubscriptionCheckout({ ...dto, customerIp: ip });
    }
    async completeSubscription(body) {
        return this.svc.completeSubscriptionSetup(body.resourcePath, body.customerId, body.planType);
    }
    async chargeSubscription(subscriptionId) {
        return this.svc.processRecurringPayment(subscriptionId);
    }
    async getDueSubscriptions() {
        return this.svc.getDueSubscriptions();
    }
    async pauseSubscription(subscriptionId) {
        return this.svc.pauseSubscription(subscriptionId);
    }
    async cancelSubscription(subscriptionId) {
        return this.svc.cancelSubscription(subscriptionId);
    }
    async resumeSubscription(subscriptionId) {
        return this.svc.resumeSubscription(subscriptionId);
    }
    async paymentCallback(type, checkoutId, resourcePath, customerId, planType) {
        try {
            if (type === 'subscription') {
                if (!customerId || !planType) {
                    throw new common_1.BadRequestException('Faltan parámetros requeridos para completar la suscripción: customerId y planType');
                }
                console.log(`[payment-callback] Procesando suscripción - resourcePath: ${resourcePath}, customerId: ${customerId}, planType: ${planType}`);
                const result = await this.svc.completeSubscriptionSetup(resourcePath, customerId, planType);
                const paymentData = {
                    ...result.paymentResult,
                    subscriptionDetails: {
                        subscription: result.subscription,
                        paymentToken: result.paymentToken,
                        customerId: result.customerId,
                    }
                };
                const safe = JSON.parse(JSON.stringify(paymentData, (key, value) => {
                    if (key === 'subscription' || key === 'payments')
                        return undefined;
                    return value;
                }));
                const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4321';
                const encodedData = encodeURIComponent(JSON.stringify(safe));
                return { redirectUrl: `${frontendUrl}/payment-success?payment=${encodedData}` };
            }
            else {
                console.log(`[payment-callback] Procesando pago único - resourcePath: ${resourcePath}`);
                const paymentStatus = await this.svc.getPaymentStatus(resourcePath);
                const safe = JSON.parse(JSON.stringify(paymentStatus, (key, value) => {
                    if (key === 'subscription' || key === 'payments')
                        return undefined;
                    return value;
                }));
                const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4321';
                const encodedData = encodeURIComponent(JSON.stringify(safe));
                return { redirectUrl: `${frontendUrl}/payment-success?payment=${encodedData}` };
            }
        }
        catch (error) {
            console.error('[payment-callback] Error:', error);
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4321';
            const err = {
                error: true,
                message: (error === null || error === void 0 ? void 0 : error.message) || 'Payment callback error',
                details: {
                    name: error === null || error === void 0 ? void 0 : error.name,
                    status: error === null || error === void 0 ? void 0 : error.status,
                    code: error === null || error === void 0 ? void 0 : error.code,
                    attempts: error === null || error === void 0 ? void 0 : error.attempts
                }
            };
            const encodedData = encodeURIComponent(JSON.stringify(err));
            return { redirectUrl: `${frontendUrl}/payment-success?payment=${encodedData}` };
        }
    }
    async jsonResponse(response, type, checkoutId, resourcePath, customerId, planType) {
        try {
            let paymentData;
            if (type === 'subscription' && customerId && planType) {
                console.log(`[json-response] Procesando suscripción - resourcePath: ${resourcePath}`);
                const result = await this.svc.completeSubscriptionSetup(resourcePath, customerId, planType);
                paymentData = {
                    ...result.paymentResult,
                    subscriptionDetails: {
                        subscription: result.subscription,
                        paymentToken: result.paymentToken,
                        customerId: result.customerId,
                    }
                };
            }
            else {
                console.log(`[json-response] Procesando pago único - resourcePath: ${resourcePath}`);
                paymentData = await this.svc.getPaymentStatus(resourcePath, customerId);
            }
            const safe = JSON.parse(JSON.stringify(paymentData, (key, value) => {
                if (key === 'subscription' || key === 'payments')
                    return undefined;
                return value;
            }));
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4321';
            const encodedData = encodeURIComponent(JSON.stringify(safe));
            const redirectUrl = `${frontendUrl}/payment-success?payment=${encodedData}`;
            response.redirect(302, redirectUrl);
        }
        catch (error) {
            console.error('[json-response] Error:', error);
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4321';
            const err = {
                error: true,
                success: false,
                message: (error === null || error === void 0 ? void 0 : error.message) || 'json-response error',
                details: {
                    name: error === null || error === void 0 ? void 0 : error.name,
                    status: error === null || error === void 0 ? void 0 : error.status,
                    code: error === null || error === void 0 ? void 0 : error.code,
                    attempts: error === null || error === void 0 ? void 0 : error.attempts
                }
            };
            const encodedData = encodeURIComponent(JSON.stringify(err));
            const redirectUrl = `${frontendUrl}/payment-success?payment=${encodedData}`;
            response.redirect(302, redirectUrl);
        }
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Post)('checkouts'),
    (0, swagger_1.ApiOperation)({ summary: 'Crear checkoutId (Método 1)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_checkout_dto_1.CreateCheckoutDto, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('verify-recurring'),
    (0, swagger_1.ApiOperation)({ summary: 'Verificar estado de pago recurrente (idempotente)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "verifyRecurring", null);
__decorate([
    (0, common_1.Get)('status'),
    (0, swagger_1.ApiQuery)({ name: 'resourcePath', required: true }),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener estado final con resourcePath (Método 2)' }),
    __param(0, (0, common_1.Query)('resourcePath')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "status", null);
__decorate([
    (0, common_1.Post)('subscriptions/checkout'),
    (0, swagger_1.ApiOperation)({ summary: 'Crear checkout para suscripción mensual (con tokenización)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_subscription_dto_1.CreateSubscriptionDto, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "createSubscriptionCheckout", null);
__decorate([
    (0, common_1.Post)('subscriptions/complete'),
    (0, swagger_1.ApiOperation)({ summary: 'Completar configuración de suscripción después del pago inicial' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "completeSubscription", null);
__decorate([
    (0, common_1.Post)('subscriptions/:id/charge'),
    (0, swagger_1.ApiOperation)({ summary: 'Procesar pago recurrente de suscripción' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "chargeSubscription", null);
__decorate([
    (0, common_1.Get)('subscriptions/due'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener suscripciones pendientes de cobro' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "getDueSubscriptions", null);
__decorate([
    (0, common_1.Patch)('subscriptions/:id/pause'),
    (0, swagger_1.ApiOperation)({ summary: 'Pausar suscripción' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "pauseSubscription", null);
__decorate([
    (0, common_1.Patch)('subscriptions/:id/cancel'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancelar suscripción' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "cancelSubscription", null);
__decorate([
    (0, common_1.Patch)('subscriptions/:id/resume'),
    (0, swagger_1.ApiOperation)({ summary: 'Reactivar suscripción pausada' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "resumeSubscription", null);
__decorate([
    (0, common_1.Get)('payment-callback'),
    (0, swagger_1.ApiOperation)({ summary: 'Callback de pagos - maneja tanto pagos únicos como suscripciones' }),
    __param(0, (0, common_1.Query)('type')),
    __param(1, (0, common_1.Query)('id')),
    __param(2, (0, common_1.Query)('resourcePath')),
    __param(3, (0, common_1.Query)('customerId')),
    __param(4, (0, common_1.Query)('planType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "paymentCallback", null);
__decorate([
    (0, common_1.Get)('json-response'),
    (0, swagger_1.ApiOperation)({ summary: 'Endpoint que devuelve JSON puro de la respuesta del pago' }),
    __param(0, (0, common_1.Res)({ passthrough: false })),
    __param(1, (0, common_1.Query)('type')),
    __param(2, (0, common_1.Query)('id')),
    __param(3, (0, common_1.Query)('resourcePath')),
    __param(4, (0, common_1.Query)('customerId')),
    __param(5, (0, common_1.Query)('planType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "jsonResponse", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, swagger_1.ApiTags)('payments'),
    (0, common_1.Controller)('payments'),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService])
], PaymentsController);
//# sourceMappingURL=payments.controller.js.map