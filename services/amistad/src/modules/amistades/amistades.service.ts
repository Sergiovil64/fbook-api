import { Injectable, Inject, NotFoundException, OnModuleInit } from '@nestjs/common';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { CreateTableCommand, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import type { components } from '@api';

type Amistad = components['schemas']['Amistad'];
type CreateInput = components['schemas']['CreateAmistadRequestContent'];
type UpdateInput = components['schemas']['UpdateAmistadRequestContent'];
type ListOutput = components['schemas']['ListAmistadesResponseContent'];

const TABLE = process.env.TABLE_NAME ?? 'Amistades';

@Injectable()
export class AmistadesService implements OnModuleInit {
  constructor(
    @Inject('DYNAMODB_CLIENT') private readonly dynamoClient: DynamoDBDocumentClient,
  ) {}

  async onModuleInit() {
    try {
      await this.dynamoClient.send(new DescribeTableCommand({ TableName: TABLE }));
    } catch (err: any) {
      if (err?.name === 'ResourceNotFoundException') {
        await this.dynamoClient.send(
          new CreateTableCommand({
            TableName: TABLE,
            AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'N' }],
            KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
            BillingMode: 'PAY_PER_REQUEST',
          }),
        );
      } else {
        throw err;
      }
    }
  }

  async create(body: CreateInput): Promise<Amistad> {
    const item: Amistad = {
      id: Date.now(),
      idUsuario1: body.idUsuario1,
      idUsuario2: body.idUsuario2,
      estado: body.estado,
    };
    await this.dynamoClient.send(new PutCommand({ TableName: TABLE, Item: item }));
    return item;
  }

  async findOne(id: number): Promise<Amistad> {
    const result = await this.dynamoClient.send(
      new GetCommand({ TableName: TABLE, Key: { id } }),
    );
    if (!result.Item) {
      throw new NotFoundException(`Amistad con id ${id} no encontrada`);
    }
    return result.Item as Amistad;
  }

  async update(id: number, body: UpdateInput): Promise<Amistad> {
    await this.findOne(id);
    const result = await this.dynamoClient.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: { id },
        UpdateExpression: 'SET #estado = :estado',
        ExpressionAttributeNames: { '#estado': 'estado' },
        ExpressionAttributeValues: { ':estado': body.estado },
        ReturnValues: 'ALL_NEW',
      }),
    );
    return result.Attributes as Amistad;
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.dynamoClient.send(new DeleteCommand({ TableName: TABLE, Key: { id } }));
  }

  async findAll(nextToken?: string, maxResults?: number): Promise<ListOutput> {
    const result = await this.dynamoClient.send(
      new ScanCommand({
        TableName: TABLE,
        Limit: maxResults ? Number(maxResults) : undefined,
        ExclusiveStartKey: nextToken
          ? JSON.parse(Buffer.from(nextToken, 'base64').toString('utf-8'))
          : undefined,
      }),
    );
    return {
      items: (result.Items ?? []) as Amistad[],
      nextToken: result.LastEvaluatedKey
        ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
        : undefined,
    };
  }
}
