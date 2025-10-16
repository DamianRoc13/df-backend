import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { setupSwagger } from './docs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Si expones HTTPS desde Node, configura httpsOptions aquí y fuerza minVersion 'TLSv1.2'.
    // En la práctica, termina TLS en Nginx/ALB/CDN y deja Nest detrás.
  });

  // Configuración de CORS para permitir peticiones desde el frontend
  app.enableCors({
    origin: [
      'http://localhost:4321',           // Desarrollo local
      'http://localhost:3000',           // Backend local
      'https://pay.animussociety.com',   // Producción
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  setupSwagger(app); // /docs

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
