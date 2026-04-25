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

type Reaccion = components['schemas']['Reaccion'];
type CreateInput = components['schemas']['CreateReaccionRequestContent'];
type UpdateInput = components['schemas']['UpdateReaccionRequestContent'];
type ListOutput = components['schemas']['ListReaccionesResponseContent'];

const TABLE = process.env.TABLE_REACCIONES ?? 'Reacciones';

@Injectable()
export class ReaccionesService implements OnModuleInit {
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

  async create(body: CreateInput): Promise<Reaccion> {
    const item: Reaccion = {
      id: Date.now(),
      idPublicacion: body.idPublicacion,
      idUsuario: body.idUsuario,
      meGusta: body.meGusta,
      meEncanta: body.meEncanta,
      meImporta: body.meImporta,
      meDivierte: body.meDivierte,
      meAsombra: body.meAsombra,
      meEntristece: body.meEntristece,
      meEnoja: body.meEnoja,
      fPublicacion: Date.now(),
      estado: body.estado,
    };
    await this.dynamoClient.send(new PutCommand({ TableName: TABLE, Item: item }));
    return item;
  }

  async findOne(id: number): Promise<Reaccion> {
    const result = await this.dynamoClient.send(
      new GetCommand({ TableName: TABLE, Key: { id } }),
    );
    if (!result.Item) {
      throw new NotFoundException(`Reaccion con id ${id} no encontrada`);
    }
    return result.Item as Reaccion;
  }

  async update(id: number, body: UpdateInput): Promise<Reaccion> {
    await this.findOne(id);

    const expressions: string[] = [];
    const names: Record<string, string> = {};
    const values: Record<string, unknown> = {};

    const fields: (keyof UpdateInput)[] = [
      'meGusta', 'meEncanta', 'meImporta', 'meDivierte',
      'meAsombra', 'meEntristece', 'meEnoja', 'estado',
    ];
    for (const field of fields) {
      if (body[field] !== undefined) {
        expressions.push(`#${field} = :${field}`);
        names[`#${field}`] = field;
        values[`:${field}`] = body[field];
      }
    }

    const result = await this.dynamoClient.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: { id },
        UpdateExpression: `SET ${expressions.join(', ')}`,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        ReturnValues: 'ALL_NEW',
      }),
    );
    return result.Attributes as Reaccion;
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
      items: (result.Items ?? []) as Reaccion[],
      nextToken: result.LastEvaluatedKey
        ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
        : undefined,
    };
  }
}
