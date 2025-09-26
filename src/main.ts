import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { setupSwagger } from './docs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Si expones HTTPS desde Node, configura httpsOptions aquí y fuerza minVersion 'TLSv1.2'.
    // En la práctica, termina TLS en Nginx/ALB/CDN y deja Nest detrás.
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  setupSwagger(app); // /docs

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
