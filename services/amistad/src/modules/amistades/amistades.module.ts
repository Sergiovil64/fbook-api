import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AmistadesController } from './amistades.controller';
import { AmistadesService } from './amistades.service';

@Module({
  imports: [HttpModule],
  controllers: [AmistadesController],
  providers: [AmistadesService],
})
export class AmistadesModule {}
