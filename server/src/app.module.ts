import { Module } from '@nestjs/common';
import { ApiModule } from './generated/nest/api.module';
import { PrismaModule } from './prisma/prisma.module';

import { UsuariosApiImpl } from './modules/usuarios/usuarios.api.impl';
import { UsuariosService } from './modules/usuarios/usuarios.service';

import { AmistadApiImpl } from './modules/amistades/amistades.api.impl';
import { AmistadService } from './modules/amistades/amistades.service';

import { PublicacionesApiImpl } from './modules/publicaciones/publicaciones.api.impl';
import { PublicacionesService } from './modules/publicaciones/publicaciones.service';

import { ComentariosApiImpl } from './modules/comentarios/comentarios.api.impl';
import { ComentariosService } from './modules/comentarios/comentarios.service';

import { ReaccionesApiImpl } from './modules/reacciones/reacciones.api.impl';
import { ReaccionesService } from './modules/reacciones/reacciones.service';

@Module({
  imports: [
    PrismaModule,
    ApiModule.forRoot({
      apiImplementations: {
        usuariosApi: UsuariosApiImpl,
        amistadesApi: AmistadApiImpl,
        publicacionesApi: PublicacionesApiImpl,
        comentariosApi: ComentariosApiImpl,
        reaccionesApi: ReaccionesApiImpl,
      },
      providers: [
        UsuariosService,
        AmistadService,
        PublicacionesService,
        ComentariosService,
        ReaccionesService,
      ],
    }),
  ],
})
export class AppModule {}
