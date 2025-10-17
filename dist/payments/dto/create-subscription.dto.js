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
exports.CreateSubscriptionDto = exports.PaymentDto = exports.CustomerDto = exports.SubscriptionPlanDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
var SubscriptionPlanDto;
(function (SubscriptionPlanDto) {
    SubscriptionPlanDto["MONTHLY"] = "MONTHLY";
    SubscriptionPlanDto["YEARLY"] = "YEARLY";
    SubscriptionPlanDto["GYM_MONTHLY"] = "GYM_MONTHLY";
    SubscriptionPlanDto["APP_MONTHLY"] = "APP_MONTHLY";
    SubscriptionPlanDto["TEST_MONTHLY"] = "TEST_MONTHLY";
})(SubscriptionPlanDto || (exports.SubscriptionPlanDto = SubscriptionPlanDto = {}));
class CustomerDto {
}
exports.CustomerDto = CustomerDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'USR123' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CustomerDto.prototype, "merchantCustomerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'juan.perez@email.com' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CustomerDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Juan' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 48),
    __metadata("design:type", String)
], CustomerDto.prototype, "givenName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Pablo', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CustomerDto.prototype, "middleName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Pérez' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 48),
    __metadata("design:type", String)
], CustomerDto.prototype, "surname", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'CC', description: 'Tipo de documento: CC, IDCARD, PASSPORT, etc.' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CustomerDto.prototype, "identificationDocType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '0106607534', description: 'Número de cédula/documento' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CustomerDto.prototype, "identificationDocId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '0987654321', description: 'Teléfono o celular del cliente' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CustomerDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Av. Principal 123', description: 'Dirección/Calle' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CustomerDto.prototype, "street1", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Cuenca', description: 'Ciudad' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CustomerDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Azuay', description: 'Provincia/Estado' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CustomerDto.prototype, "state", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'EC', description: 'Código de país (ISO)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 2),
    __metadata("design:type", String)
], CustomerDto.prototype, "country", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '010101', description: 'Código postal' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CustomerDto.prototype, "postcode", void 0);
class PaymentDto {
}
exports.PaymentDto = PaymentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'TXN_123456' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PaymentDto.prototype, "merchantTransactionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'VISA' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PaymentDto.prototype, "paymentBrand", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 19.00 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], PaymentDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'USD' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PaymentDto.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'MONTHLY', enum: SubscriptionPlanDto }),
    (0, class_validator_1.IsEnum)(SubscriptionPlanDto),
    __metadata("design:type", String)
], PaymentDto.prototype, "planType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'INITIAL' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PaymentDto.prototype, "paymentType", void 0);
class CreateSubscriptionDto {
}
exports.CreateSubscriptionDto = CreateSubscriptionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: CustomerDto }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => CustomerDto),
    __metadata("design:type", CustomerDto)
], CreateSubscriptionDto.prototype, "customer", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: PaymentDto }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => PaymentDto),
    __metadata("design:type", PaymentDto)
], CreateSubscriptionDto.prototype, "payment", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'https://pay.animussociety.com/payment-success' }),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], CreateSubscriptionDto.prototype, "returnUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSubscriptionDto.prototype, "customerIp", void 0);
//# sourceMappingURL=create-subscription.dto.js.map