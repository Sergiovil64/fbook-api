import { Module } from '@nestjs/common';
import { DynamoDBModule } from './dynamodb/dynamodb.module';
import { AuthModule } from './modules/auth/auth.module';
import { PublicacionesModule } from './modules/publicaciones/publicaciones.module';
import { ComentariosModule } from './modules/comentarios/comentarios.module';
import { ReaccionesModule } from './modules/reacciones/reacciones.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [DynamoDBModule, AuthModule, PublicacionesModule, ComentariosModule, ReaccionesModule],
  controllers: [HealthController],
})
export class AppModule {}
