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

type Publicacion = components['schemas']['Publicacion'];
type CreateInput = components['schemas']['CreatePublicacionRequestContent'];
type UpdateInput = components['schemas']['UpdatePublicacionRequestContent'];
type ListOutput = components['schemas']['ListPublicacionesResponseContent'];

const TABLE = process.env.TABLE_NAME ?? 'Publicaciones';

@Injectable()
export class PublicacionesService implements OnModuleInit {
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

  async create(body: CreateInput): Promise<Publicacion> {
    const item: Publicacion = {
      id: Date.now(),
      idUsuario: body.idUsuario,
      contenido: body.contenido,
      fecha: Date.now(),
    };
    await this.dynamoClient.send(new PutCommand({ TableName: TABLE, Item: item }));
    return item;
  }

  async findOne(id: number): Promise<Publicacion> {
    const result = await this.dynamoClient.send(
      new GetCommand({ TableName: TABLE, Key: { id } }),
    );
    if (!result.Item) {
      throw new NotFoundException(`Publicacion con id ${id} no encontrada`);
    }
    return result.Item as Publicacion;
  }

  async update(id: number, body: UpdateInput): Promise<Publicacion> {
    await this.findOne(id);
    const result = await this.dynamoClient.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: { id },
        UpdateExpression: 'SET #contenido = :contenido',
        ExpressionAttributeNames: { '#contenido': 'contenido' },
        ExpressionAttributeValues: { ':contenido': body.contenido },
        ReturnValues: 'ALL_NEW',
      }),
    );
    return result.Attributes as Publicacion;
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
      items: (result.Items ?? []) as Publicacion[],
      nextToken: result.LastEvaluatedKey
        ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
        : undefined,
    };
  }
}
