import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNumberString, IsOptional, IsString, Length, Matches, IsEnum, IsUrl } from 'class-validator';

export enum SubscriptionPlanType {
  GYM_MONTHLY = 'GYM_MONTHLY',
  APP_MONTHLY = 'APP_MONTHLY',
  TEST_MONTHLY = 'TEST_MONTHLY'
}

// DTO con estructura plana (igual que CreateCheckoutDto)
export class CreateSubscriptionDto {
  // Datos del pago
  @ApiProperty({ example: 'ORD_01HXYZ...' }) 
  @IsString() 
  merchantTransactionId!: string;

  @ApiProperty({ example: 'GYM_MONTHLY', enum: SubscriptionPlanType }) 
  @IsEnum(SubscriptionPlanType) 
  planType!: SubscriptionPlanType;

  // Datos del cliente
  @ApiProperty({ example: 'Juan' }) 
  @Length(2, 48) 
  givenName!: string;

  @ApiProperty({ example: 'Pablo', required: false }) 
  @IsOptional()
  @Length(2, 50) 
  middleName?: string;

  @ApiProperty({ example: 'Pérez' }) 
  @Length(2, 48) 
  surname!: string;

  @ApiProperty({ example: 'juan.perez@email.com' }) 
  @IsEmail() 
  email!: string;

  @ApiProperty({ example: 'USR123' }) 
  @Length(1, 16) 
  merchantCustomerId!: string;

  // Identificación
  @ApiProperty({ example: 'IDCARD', description: 'Tipo de documento: IDCARD, PASSPORT, etc.' }) 
  @IsString() 
  identificationDocType!: string;

  @ApiProperty({ example: '1234567890', description: 'Número de cédula/documento' }) 
  @IsString() 
  identificationDocId!: string;

  // Teléfono
  @ApiProperty({ example: '+593987654321', description: 'Teléfono o celular del cliente' }) 
  @IsString() 
  phone!: string;

  // Dirección
  @ApiProperty({ example: 'Av. Amazonas N123', description: 'Dirección/Calle' }) 
  @IsString() 
  street1!: string;

  @ApiProperty({ example: 'Quito', description: 'Ciudad' }) 
  @IsString() 
  city!: string;

  @ApiProperty({ example: 'Pichincha', description: 'Provincia/Estado' }) 
  @IsString() 
  state!: string;

  @ApiProperty({ example: 'EC', description: 'Código de país (ISO)' }) 
  @IsString() 
  @Length(2, 2)
  country!: string;

  @ApiProperty({ example: '170515', description: 'Código postal' }) 
  @IsString() 
  postcode!: string;

  // Impuestos
  @ApiProperty({ example: '0.00' }) 
  @Matches(/^\d+(\.\d{1,2})?$/) 
  base0!: string;

  @ApiProperty({ example: '67.86' }) 
  @Matches(/^\d+(\.\d{1,2})?$/) 
  baseImp!: string;

  @ApiProperty({ example: '9.14' }) 
  @Matches(/^\d+(\.\d{1,2})?$/) 
  iva!: string;

  // Moneda
  @ApiProperty({ example: 'USD', required: false }) 
  @IsOptional()
  @IsString() 
  currency?: string;

  // URL de retorno
  @ApiProperty({ example: 'https://pay.animussociety.com/payment-success' })
  @IsUrl()
  returnUrl!: string;

  // IP del cliente (opcional, inyectado por el controller)
  @IsOptional()
  @IsString()
  customerIp?: string;
}