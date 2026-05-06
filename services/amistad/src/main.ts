import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { EmfMetricsInterceptor } from './common/emf-metrics.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new EmfMetricsInterceptor('amistad', 'Fbook/Amistad'));
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`service-amistad running on port ${port}`);
}

bootstrap();
