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
exports.CreateSubscriptionDto = exports.SubscriptionPlanDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var SubscriptionPlanDto;
(function (SubscriptionPlanDto) {
    SubscriptionPlanDto["GYM_MONTHLY"] = "GYM_MONTHLY";
    SubscriptionPlanDto["APP_MONTHLY"] = "APP_MONTHLY";
    SubscriptionPlanDto["TEST_MONTHLY"] = "TEST_MONTHLY";
})(SubscriptionPlanDto || (exports.SubscriptionPlanDto = SubscriptionPlanDto = {}));
class CreateSubscriptionDto {
}
exports.CreateSubscriptionDto = CreateSubscriptionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'juan.perez@email.com' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateSubscriptionDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Juan' }),
    (0, class_validator_1.Length)(3, 48),
    __metadata("design:type", String)
], CreateSubscriptionDto.prototype, "givenName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Pablo' }),
    (0, class_validator_1.Length)(2, 50),
    __metadata("design:type", String)
], CreateSubscriptionDto.prototype, "middleName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Pérez' }),
    (0, class_validator_1.Length)(3, 48),
    __metadata("design:type", String)
], CreateSubscriptionDto.prototype, "surname", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'USR123' }),
    (0, class_validator_1.Length)(1, 16),
    __metadata("design:type", String)
], CreateSubscriptionDto.prototype, "merchantCustomerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'GYM_MONTHLY', enum: SubscriptionPlanDto }),
    (0, class_validator_1.IsEnum)(SubscriptionPlanDto),
    __metadata("design:type", String)
], CreateSubscriptionDto.prototype, "planType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ORD_01HXYZ...' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSubscriptionDto.prototype, "merchantTransactionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '181.39.XX.XX' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSubscriptionDto.prototype, "customerIp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '0.00' }),
    (0, class_validator_1.Matches)(/^\d+(\.\d{1,2})?$/),
    __metadata("design:type", String)
], CreateSubscriptionDto.prototype, "base0", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '68.75' }),
    (0, class_validator_1.Matches)(/^\d+(\.\d{1,2})?$/),
    __metadata("design:type", String)
], CreateSubscriptionDto.prototype, "baseImp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '8.25' }),
    (0, class_validator_1.Matches)(/^\d+(\.\d{1,2})?$/),
    __metadata("design:type", String)
], CreateSubscriptionDto.prototype, "iva", void 0);
//# sourceMappingURL=create-subscription.dto.js.map