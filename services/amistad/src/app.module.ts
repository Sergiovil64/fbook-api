import { Module } from '@nestjs/common';
import { DynamoDBModule } from './dynamodb/dynamodb.module';
import { AuthModule } from './modules/auth/auth.module';
import { AmistadesModule } from './modules/amistades/amistades.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [DynamoDBModule, AuthModule, AmistadesModule],
  controllers: [HealthController],
})
export class AppModule {}
