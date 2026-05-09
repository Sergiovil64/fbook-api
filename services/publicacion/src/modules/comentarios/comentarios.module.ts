import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ComentariosController } from './comentarios.controller';
import { ComentariosService } from './comentarios.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [HttpModule, AuthModule],
  controllers: [ComentariosController],
  providers: [ComentariosService],
})
export class ComentariosModule {}
