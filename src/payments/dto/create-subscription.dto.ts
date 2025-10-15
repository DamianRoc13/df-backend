import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNumberString, IsOptional, IsString, Length, Matches, IsEnum } from 'class-validator';

export enum SubscriptionPlanDto {
  GYM_MONTHLY = 'GYM_MONTHLY',
  APP_MONTHLY = 'APP_MONTHLY',
  TEST_MONTHLY = 'TEST_MONTHLY'
}

export class CreateSubscriptionDto {
  // Información del cliente
  @ApiProperty({ example: 'juan.perez@email.com' }) 
  @IsEmail() 
  email!: string;

  @ApiProperty({ example: 'Juan' }) 
  @Length(3,48) 
  givenName!: string;

  @ApiProperty({ example: 'Pablo' }) 
  @Length(2,50) 
  middleName!: string;

  @ApiProperty({ example: 'Pérez' }) 
  @Length(3,48) 
  surname!: string;

  @ApiProperty({ example: 'USR123' }) 
  @Length(1,16) 
  merchantCustomerId!: string;

  // Plan de suscripción
  @ApiProperty({ example: 'GYM_MONTHLY', enum: SubscriptionPlanDto }) 
  @IsEnum(SubscriptionPlanDto) 
  planType!: SubscriptionPlanDto;

  // Datos del pago inicial
  @ApiProperty({ example: 'ORD_01HXYZ...' }) 
  @IsString() 
  merchantTransactionId!: string;

  // IP del cliente
  @ApiProperty({ example: '181.39.XX.XX' }) 
  @IsString() 
  customerIp!: string;

  // Impuestos (calculados en frontend)
  @ApiProperty({ example: '0.00' }) 
  @Matches(/^\d+(\.\d{1,2})?$/) 
  base0!: string;

  @ApiProperty({ example: '68.75' }) 
  @Matches(/^\d+(\.\d{1,2})?$/) 
  baseImp!: string;

  @ApiProperty({ example: '8.25' }) 
  @Matches(/^\d+(\.\d{1,2})?$/) 
  iva!: string;

  // Identificación (Fase 2 - Obligatorio DataFast)
  @ApiProperty({ example: 'IDCARD', description: 'Tipo de documento: IDCARD, PASSPORT, etc.' }) 
  @IsString() 
  identificationDocType!: string;

  @ApiProperty({ example: '1234567890', description: 'Número de cédula/documento' }) 
  @IsString() 
  identificationDocId!: string;

  // Teléfono (Fase 2 - Obligatorio DataFast)
  @ApiProperty({ example: '+593987654321', description: 'Teléfono o celular del cliente' }) 
  @IsString() 
  phone!: string;

  // Dirección (Fase 2 - Obligatorio DataFast)
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
}