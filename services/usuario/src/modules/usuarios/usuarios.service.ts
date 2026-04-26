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

type Usuario = components['schemas']['Usuario'];
type CreateInput = components['schemas']['CreateUsuarioRequestContent'];
type UpdateInput = components['schemas']['UpdateUsuarioRequestContent'];
type ListOutput = components['schemas']['ListUsuariosResponseContent'];

const TABLE = process.env.TABLE_NAME ?? 'Usuarios';

@Injectable()
export class UsuariosService implements OnModuleInit {
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

  async create(body: CreateInput): Promise<Usuario> {
    const now = Date.now();
    const usuario: Usuario = {
      id: now,
      nombre: body.nombre,
      correo: body.correo,
      password: body.password,
      fechaRegistro: now,
    };
    await this.dynamoClient.send(new PutCommand({ TableName: TABLE, Item: usuario }));
    return usuario;
  }

  async findOne(id: number): Promise<Usuario> {
    const result = await this.dynamoClient.send(
      new GetCommand({ TableName: TABLE, Key: { id } }),
    );
    if (!result.Item) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }
    return result.Item as Usuario;
  }

  async update(id: number, body: UpdateInput): Promise<Usuario> {
    await this.findOne(id);

    const expressions: string[] = [];
    const names: Record<string, string> = {};
    const values: Record<string, unknown> = {};

    if (body.nombre !== undefined) {
      expressions.push('#nombre = :nombre');
      names['#nombre'] = 'nombre';
      values[':nombre'] = body.nombre;
    }
    if (body.correo !== undefined) {
      expressions.push('#correo = :correo');
      names['#correo'] = 'correo';
      values[':correo'] = body.correo;
    }
    if (body.password !== undefined) {
      expressions.push('#password = :password');
      names['#password'] = 'password';
      values[':password'] = body.password;
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
    return result.Attributes as Usuario;
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
      items: (result.Items ?? []) as Usuario[],
      nextToken: result.LastEvaluatedKey
        ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
        : undefined,
    };
  }
}
