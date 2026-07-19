import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ReaccionesController } from './reacciones.controller';
import { ReaccionesService } from './reacciones.service';
import { AuthModule } from '../auth/auth.module';
import { PublicacionesModule } from '../publicaciones/publicaciones.module';

@Module({
  imports: [HttpModule, AuthModule, PublicacionesModule],
  controllers: [ReaccionesController],
  providers: [ReaccionesService],
})
export class ReaccionesModule {}
