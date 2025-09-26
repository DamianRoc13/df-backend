import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class VerifyDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString()
  paymentId?: string;

  @ApiProperty({ required: false }) @IsOptional() @IsString()
  merchantTransactionId?: string;
}
