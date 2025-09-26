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
var RecurringPaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecurringPaymentsService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const payments_service_1 = require("../payments/payments.service");
let RecurringPaymentsService = RecurringPaymentsService_1 = class RecurringPaymentsService {
    constructor(paymentsService) {
        this.paymentsService = paymentsService;
        this.logger = new common_1.Logger(RecurringPaymentsService_1.name);
    }
    async processDuePayments() {
        var _a;
        this.logger.log('Iniciando procesamiento de pagos recurrentes...');
        try {
            const dueSubscriptions = await this.paymentsService.getDueSubscriptions();
            this.logger.log(`Se encontraron ${dueSubscriptions.length} suscripciones para cobrar`);
            for (const subscription of dueSubscriptions) {
                try {
                    this.logger.log(`Procesando suscripción ${subscription.id} para cliente ${subscription.customer.email}`);
                    const result = await this.paymentsService.processRecurringPayment(subscription.id);
                    if (result.success) {
                        this.logger.log(`✅ Pago exitoso para suscripción ${subscription.id}`);
                    }
                    else {
                        this.logger.warn(`❌ Pago fallido para suscripción ${subscription.id}: ${(_a = result.paymentResult.result) === null || _a === void 0 ? void 0 : _a.description}`);
                    }
                }
                catch (error) {
                    this.logger.error(`Error procesando suscripción ${subscription.id}:`, error);
                }
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            this.logger.log('Procesamiento de pagos recurrentes completado');
        }
        catch (error) {
            this.logger.error('Error en el procesamiento masivo de pagos recurrentes:', error);
        }
    }
    async retryFailedPayments() {
        this.logger.log('Verificando suscripciones con pagos fallidos para reintentos...');
        try {
            const failedSubscriptions = await this.paymentsService.getDueSubscriptions();
            const subscriptionsToRetry = failedSubscriptions.filter(sub => sub.failedAttempts > 0 && sub.failedAttempts < 3);
            this.logger.log(`Se encontraron ${subscriptionsToRetry.length} suscripciones para reintentar`);
            for (const subscription of subscriptionsToRetry) {
                try {
                    const lastPayment = await this.getLastPaymentAttempt(subscription.id);
                    if (lastPayment) {
                        const hoursSinceLastAttempt = (Date.now() - lastPayment.createdAt.getTime()) / (1000 * 60 * 60);
                        if (hoursSinceLastAttempt < 4) {
                            continue;
                        }
                    }
                    this.logger.log(`Reintentando pago para suscripción ${subscription.id}`);
                    const result = await this.paymentsService.processRecurringPayment(subscription.id);
                    if (result.success) {
                        this.logger.log(`✅ Reintento exitoso para suscripción ${subscription.id}`);
                    }
                    else {
                        this.logger.warn(`❌ Reintento fallido para suscripción ${subscription.id}`);
                    }
                }
                catch (error) {
                    this.logger.error(`Error en reintento de suscripción ${subscription.id}:`, error);
                }
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }
        catch (error) {
            this.logger.error('Error en el procesamiento de reintentos:', error);
        }
    }
    async getLastPaymentAttempt(subscriptionId) {
        return null;
    }
};
exports.RecurringPaymentsService = RecurringPaymentsService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_2AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RecurringPaymentsService.prototype, "processDuePayments", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RecurringPaymentsService.prototype, "retryFailedPayments", null);
exports.RecurringPaymentsService = RecurringPaymentsService = RecurringPaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService])
], RecurringPaymentsService);
//# sourceMappingURL=recurring-payments.service.js.map