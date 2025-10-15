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

  // One-Click opcional
  @ApiProperty({ required: false }) @IsOptional() oneClick?: boolean;
  @ApiProperty({ required: false, type: [String] }) @IsOptional() registrations?: string[];
}
