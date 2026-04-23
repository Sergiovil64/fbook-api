import { Module } from '@nestjs/common';
import { DynamoDBModule } from './dynamodb/dynamodb.module';
import { AmistadesModule } from './modules/amistades/amistades.module';

@Module({
  imports: [DynamoDBModule, AmistadesModule],
})
export class AppModule {}
