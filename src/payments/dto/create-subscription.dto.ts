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
}