import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PublicacionesController } from './publicaciones.controller';
import { PublicacionesService } from './publicaciones.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [HttpModule, AuthModule],
  controllers: [PublicacionesController],
  providers: [PublicacionesService],
  // Exportado para que ComentariosService/ReaccionesService validen idPublicacion con una llamada
  // en-proceso (misma app Nest) en lugar de un HTTP call a sí mismas — ese HTTP call fallaba
  // siempre con 401 porque PublicacionesController exige JwtAuthGuard y la llamada interna no
  // llevaba token.
  exports: [PublicacionesService],
})
export class PublicacionesModule {}
