import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNumberString, IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateCheckoutDto {
  @ApiProperty({ example: '12.34' }) @IsNumberString() amount!: string;
  @ApiProperty({ example: 'USD', default: 'USD' }) @IsString() currency: string = 'USD';
  @ApiProperty({ example: 'DB', default: 'DB' }) @IsString() paymentType: string = 'DB';
  @ApiProperty({ example: 'ORD_01HXYZ...' }) @IsString() merchantTransactionId!: string;

  // Identidad (Fase 2)
  @ApiProperty({ example: 'Juan' }) @Length(3,48) givenName!: string;        // customer.givenName
  @ApiProperty({ example: 'Pablo' }) @Length(2,50) middleName!: string;      // customer.middleName
  @ApiProperty({ example: 'Pérez' }) @Length(3,48) surname!: string;         // customer.surname
  @ApiProperty({ example: 'juan.perez@email.com' }) @IsEmail() email!: string; // customer.email

  // IP real del cliente
  @ApiProperty({ example: '181.39.XX.XX' }) @IsString() customerIp!: string; // customer.ip

  // IDs propios
  @ApiProperty({ example: 'USR123' }) @Length(1,16) merchantCustomerId!: string; // customer.merchantCustomerId

  // Impuestos (#######.##)
  @ApiProperty({ example: '0.00' }) @Matches(/^\d+(\.\d{1,2})?$/) base0!: string;
  @ApiProperty({ example: '9.00' }) @Matches(/^\d+(\.\d{1,2})?$/) baseImp!: string;
  @ApiProperty({ example: '3.12' }) @Matches(/^\d+(\.\d{1,2})?$/) iva!: string;

  // One-Click opcional
  @ApiProperty({ required: false }) @IsOptional() oneClick?: boolean;
  @ApiProperty({ required: false, type: [String] }) @IsOptional() registrations?: string[];
}
