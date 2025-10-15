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
exports.CreateCheckoutDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateCheckoutDto {
    constructor() {
        this.currency = 'USD';
        this.paymentType = 'DB';
    }
}
exports.CreateCheckoutDto = CreateCheckoutDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '12.34' }),
    (0, class_validator_1.IsNumberString)(),
    __metadata("design:type", String)
], CreateCheckoutDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'USD', default: 'USD' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCheckoutDto.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'DB', default: 'DB' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCheckoutDto.prototype, "paymentType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ORD_01HXYZ...' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCheckoutDto.prototype, "merchantTransactionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Juan' }),
    (0, class_validator_1.Length)(3, 48),
    __metadata("design:type", String)
], CreateCheckoutDto.prototype, "givenName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Pablo' }),
    (0, class_validator_1.Length)(2, 50),
    __metadata("design:type", String)
], CreateCheckoutDto.prototype, "middleName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Pérez' }),
    (0, class_validator_1.Length)(3, 48),
    __metadata("design:type", String)
], CreateCheckoutDto.prototype, "surname", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'juan.perez@email.com' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateCheckoutDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '181.39.XX.XX' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCheckoutDto.prototype, "customerIp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'USR123' }),
    (0, class_validator_1.Length)(1, 16),
    __metadata("design:type", String)
], CreateCheckoutDto.prototype, "merchantCustomerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '0.00' }),
    (0, class_validator_1.Matches)(/^\d+(\.\d{1,2})?$/),
    __metadata("design:type", String)
], CreateCheckoutDto.prototype, "base0", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '9.00' }),
    (0, class_validator_1.Matches)(/^\d+(\.\d{1,2})?$/),
    __metadata("design:type", String)
], CreateCheckoutDto.prototype, "baseImp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '3.12' }),
    (0, class_validator_1.Matches)(/^\d+(\.\d{1,2})?$/),
    __metadata("design:type", String)
], CreateCheckoutDto.prototype, "iva", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'IDCARD', description: 'Tipo de documento: IDCARD, PASSPORT, etc.' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCheckoutDto.prototype, "identificationDocType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '1234567890', description: 'Número de cédula/documento' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCheckoutDto.prototype, "identificationDocId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '+593987654321', description: 'Teléfono o celular del cliente' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCheckoutDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Av. Amazonas N123', description: 'Dirección/Calle' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCheckoutDto.prototype, "street1", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Quito', description: 'Ciudad' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCheckoutDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Pichincha', description: 'Provincia/Estado' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCheckoutDto.prototype, "state", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'EC', description: 'Código de país (ISO)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 2),
    __metadata("design:type", String)
], CreateCheckoutDto.prototype, "country", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '170515', description: 'Código postal' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCheckoutDto.prototype, "postcode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateCheckoutDto.prototype, "oneClick", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, type: [String] }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateCheckoutDto.prototype, "registrations", void 0);
//# sourceMappingURL=create-checkout.dto.js.map