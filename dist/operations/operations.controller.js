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
exports.OperationsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const operations_service_1 = require("./operations.service");
const void_dto_1 = require("./dto/void.dto");
const verify_dto_1 = require("./dto/verify.dto");
let OperationsController = class OperationsController {
    constructor(svc) {
        this.svc = svc;
    }
    async verify(q) {
        return this.svc.verifyBy(q.paymentId, q.merchantTransactionId);
    }
    async void(dto) {
        return this.svc.voidPayment(dto.paymentId);
    }
};
exports.OperationsController = OperationsController;
__decorate([
    (0, common_1.Get)('verify'),
    (0, swagger_1.ApiOperation)({ summary: 'Verificar estado (paymentId o merchantTransactionId)' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [verify_dto_1.VerifyDto]),
    __metadata("design:returntype", Promise)
], OperationsController.prototype, "verify", null);
__decorate([
    (0, common_1.Post)('void'),
    (0, swagger_1.ApiOperation)({ summary: 'Anulación (RF) de una transacción aprobada' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [void_dto_1.VoidDto]),
    __metadata("design:returntype", Promise)
], OperationsController.prototype, "void", null);
exports.OperationsController = OperationsController = __decorate([
    (0, swagger_1.ApiTags)('operations'),
    (0, common_1.Controller)('payments'),
    __metadata("design:paramtypes", [operations_service_1.OperationsService])
], OperationsController);
//# sourceMappingURL=operations.controller.js.map