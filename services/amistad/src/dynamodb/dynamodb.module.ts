import { Global, Module } from '@nestjs/common';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

@Global()
@Module({
  providers: [
    {
      provide: 'DYNAMODB_CLIENT',
      useFactory: () => {
        const client = new DynamoDBClient({
          region: process.env.AWS_REGION ?? 'us-east-1',
          ...(process.env.DYNAMODB_ENDPOINT && { endpoint: process.env.DYNAMODB_ENDPOINT }),
          ...(process.env.AWS_ACCESS_KEY_ID && {
            credentials: {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
            },
          }),
        });
        return DynamoDBDocumentClient.from(client);
      },
    },
  ],
  exports: ['DYNAMODB_CLIENT'],
})
export class DynamoDBModule {}
