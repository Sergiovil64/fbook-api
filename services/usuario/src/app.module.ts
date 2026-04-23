import { Module } from '@nestjs/common';
import { DynamoDBModule } from './dynamodb/dynamodb.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';

@Module({
  imports: [DynamoDBModule, UsuariosModule],
})
export class AppModule {}
