import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { EmfMetricsInterceptor } from './common/emf-metrics.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Habilitado para la UI de prueba (fbook-api/web-test), servida desde otro origen.
  app.enableCors();
  app.useGlobalInterceptors(new EmfMetricsInterceptor('publicacion', 'Fbook/Publicacion'));
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`service-publicacion running on port ${port}`);
}

bootstrap();
