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

type Comentario = components['schemas']['Comentario'];
type CreateInput = components['schemas']['CreateComentarioRequestContent'];
type UpdateInput = components['schemas']['UpdateComentarioRequestContent'];
type ListOutput = components['schemas']['ListComentariosResponseContent'];

const TABLE = process.env.TABLE_COMENTARIOS ?? 'Comentarios';

@Injectable()
export class ComentariosService implements OnModuleInit {
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

  async create(body: CreateInput): Promise<Comentario> {
    const item: Comentario = {
      id: Date.now(),
      idPublicacion: body.idPublicacion,
      idUsuario: body.idUsuario,
      texto: body.texto,
      fComentario: Date.now(),
    };
    await this.dynamoClient.send(new PutCommand({ TableName: TABLE, Item: item }));
    return item;
  }

  async findOne(id: number): Promise<Comentario> {
    const result = await this.dynamoClient.send(
      new GetCommand({ TableName: TABLE, Key: { id } }),
    );
    if (!result.Item) {
      throw new NotFoundException(`Comentario con id ${id} no encontrado`);
    }
    return result.Item as Comentario;
  }

  async update(id: number, body: UpdateInput): Promise<Comentario> {
    await this.findOne(id);
    const result = await this.dynamoClient.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: { id },
        UpdateExpression: 'SET #texto = :texto',
        ExpressionAttributeNames: { '#texto': 'texto' },
        ExpressionAttributeValues: { ':texto': body.texto },
        ReturnValues: 'ALL_NEW',
      }),
    );
    return result.Attributes as Comentario;
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
      items: (result.Items ?? []) as Comentario[],
      nextToken: result.LastEvaluatedKey
        ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
        : undefined,
    };
  }
}
