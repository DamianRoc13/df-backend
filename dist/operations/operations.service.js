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
exports.OperationsService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
let OperationsService = class OperationsService {
    constructor(http) {
        this.http = http;
    }
    async verifyBy(paymentId, merchantTransactionId) {
        if (!paymentId && !merchantTransactionId) {
            throw new common_1.BadRequestException('Debe enviar paymentId o merchantTransactionId');
        }
        if (paymentId) {
            const url = `${process.env.OPPWA_URL}/v1/payments/${encodeURIComponent(paymentId)}?entityId=${encodeURIComponent(process.env.OPPWA_ENTITY_ID)}`;
            const res = await (0, rxjs_1.firstValueFrom)(this.http.get(url, {
                headers: { Authorization: `Bearer ${process.env.OPPWA_BEARER}` },
            }));
            return { source: 'gateway', data: res.data };
        }
        return { source: 'local', data: null, note: 'Implemente consulta por merchantTransactionId en su persistencia' };
    }
    async voidPayment(paymentId) {
        if (!paymentId)
            throw new common_1.BadRequestException('paymentId requerido');
        const url = `${process.env.OPPWA_URL}/v1/payments/${encodeURIComponent(paymentId)}`;
        const body = new URLSearchParams({
            entityId: process.env.OPPWA_ENTITY_ID,
            paymentType: 'RF',
        });
        const res = await (0, rxjs_1.firstValueFrom)(this.http.post(url, body, {
            headers: {
                Authorization: `Bearer ${process.env.OPPWA_BEARER}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        }));
        return res.data;
    }
};
exports.OperationsService = OperationsService;
exports.OperationsService = OperationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], OperationsService);
//# sourceMappingURL=operations.service.js.map