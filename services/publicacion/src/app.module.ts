import { Module } from '@nestjs/common';
import { DynamoDBModule } from './dynamodb/dynamodb.module';
import { PublicacionesModule } from './modules/publicaciones/publicaciones.module';
import { ComentariosModule } from './modules/comentarios/comentarios.module';
import { ReaccionesModule } from './modules/reacciones/reacciones.module';

@Module({
  imports: [DynamoDBModule, PublicacionesModule, ComentariosModule, ReaccionesModule],
})
export class AppModule {}
