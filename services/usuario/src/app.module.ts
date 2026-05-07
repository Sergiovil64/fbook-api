import { Module } from '@nestjs/common';
import { DynamoDBModule } from './dynamodb/dynamodb.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [DynamoDBModule, AuthModule, UsuariosModule],
  controllers: [HealthController],
})
export class AppModule {}
