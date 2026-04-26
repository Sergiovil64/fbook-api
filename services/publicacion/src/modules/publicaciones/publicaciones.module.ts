import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PublicacionesController } from './publicaciones.controller';
import { PublicacionesService } from './publicaciones.service';

@Module({
  imports: [HttpModule],
  controllers: [PublicacionesController],
  providers: [PublicacionesService],
})
export class PublicacionesModule {}
