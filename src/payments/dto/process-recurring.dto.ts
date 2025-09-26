import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ProcessRecurringPaymentDto {
  @ApiProperty({ example: 'sub_clx1234...' }) 
  @IsString() 
  subscriptionId!: string;
}