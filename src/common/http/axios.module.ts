// src/common/http/axios.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        baseURL: (cfg.get<string>('OPPWA_URL') || process.env.OPPWA_URL || '').trim(),
        timeout: 15000,
        maxRedirects: 2,
        headers: { 'User-Agent': 'df-backend/1.0' },
      }),
    }),
  ],
  exports: [HttpModule],
})
export class AxiosModule {}
