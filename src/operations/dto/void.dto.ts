import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VoidDto {
  @ApiProperty() @IsNotEmpty() @IsString()
  paymentId!: string;
}
