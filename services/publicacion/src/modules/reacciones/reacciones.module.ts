import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ReaccionesController } from './reacciones.controller';
import { ReaccionesService } from './reacciones.service';

@Module({
  imports: [HttpModule],
  controllers: [ReaccionesController],
  providers: [ReaccionesService],
})
export class ReaccionesModule {}
