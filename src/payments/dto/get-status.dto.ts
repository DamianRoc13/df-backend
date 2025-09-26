import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class GetStatusDto {
  @ApiProperty({ example: '/v1/checkouts/{id}/payment' })
  @IsString()
  resourcePath!: string;
}
