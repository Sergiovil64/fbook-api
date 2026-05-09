import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AmistadesController } from './amistades.controller';
import { AmistadesService } from './amistades.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [HttpModule, AuthModule],
  controllers: [AmistadesController],
  providers: [AmistadesService],
})
export class AmistadesModule {}
