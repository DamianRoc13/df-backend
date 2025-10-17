import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNumberString, IsOptional, IsString, Length, Matches, IsEnum, ValidateNested, IsNumber, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';

export enum SubscriptionPlanDto {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
  GYM_MONTHLY = 'GYM_MONTHLY',
  APP_MONTHLY = 'APP_MONTHLY',
  TEST_MONTHLY = 'TEST_MONTHLY'
}

// Sub-DTO para información del cliente
export class CustomerDto {
  @ApiProperty({ example: 'USR123' }) 
  @IsString() 
  merchantCustomerId!: string;

  @ApiProperty({ example: 'juan.perez@email.com' }) 
  @IsEmail() 
  email!: string;

  @ApiProperty({ example: 'Juan' }) 
  @IsString()
  @Length(1, 48) 
  givenName!: string;

  @ApiProperty({ example: 'Pablo', required: false }) 
  @IsString()
  @IsOptional()
  middleName?: string;

  @ApiProperty({ example: 'Pérez' }) 
  @IsString()
  @Length(1, 48) 
  surname!: string;

  @ApiProperty({ example: 'CC', description: 'Tipo de documento: CC, IDCARD, PASSPORT, etc.' }) 
  @IsString() 
  identificationDocType!: string;

  @ApiProperty({ example: '0106607534', description: 'Número de cédula/documento' }) 
  @IsString() 
  identificationDocId!: string;

  @ApiProperty({ example: '0987654321', description: 'Teléfono o celular del cliente' }) 
  @IsString() 
  phone!: string;

  @ApiProperty({ example: 'Av. Principal 123', description: 'Dirección/Calle' }) 
  @IsString() 
  street1!: string;

  @ApiProperty({ example: 'Cuenca', description: 'Ciudad' }) 
  @IsString() 
  city!: string;

  @ApiProperty({ example: 'Azuay', description: 'Provincia/Estado' }) 
  @IsString() 
  state!: string;

  @ApiProperty({ example: 'EC', description: 'Código de país (ISO)' }) 
  @IsString() 
  @Length(2, 2)
  country!: string;

  @ApiProperty({ example: '010101', description: 'Código postal' }) 
  @IsString() 
  postcode!: string;
}

// Sub-DTO para información del pago
export class PaymentDto {
  @ApiProperty({ example: 'TXN_123456' }) 
  @IsString() 
  merchantTransactionId!: string;

  @ApiProperty({ example: 'VISA' }) 
  @IsString() 
  paymentBrand!: string;

  @ApiProperty({ example: 19.00 }) 
  @IsNumber() 
  amount!: number;

  @ApiProperty({ example: 'USD' }) 
  @IsString() 
  currency!: string;

  @ApiProperty({ example: 'MONTHLY', enum: SubscriptionPlanDto }) 
  @IsEnum(SubscriptionPlanDto) 
  planType!: SubscriptionPlanDto;

  @ApiProperty({ example: 'INITIAL' }) 
  @IsString() 
  paymentType!: string;
}

// DTO principal que recibe la estructura del frontend
export class CreateSubscriptionDto {
  @ApiProperty({ type: CustomerDto })
  @ValidateNested()
  @Type(() => CustomerDto)
  customer!: CustomerDto;

  @ApiProperty({ type: PaymentDto })
  @ValidateNested()
  @Type(() => PaymentDto)
  payment!: PaymentDto;

  @ApiProperty({ example: 'https://pay.animussociety.com/payment-success' })
  @IsUrl()
  returnUrl!: string;

  // Campo opcional que será inyectado por el controller
  @IsOptional()
  @IsString()
  customerIp?: string;
}