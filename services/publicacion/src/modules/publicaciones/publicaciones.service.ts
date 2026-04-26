import { Injectable, Inject, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
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
import { randomUUID } from 'crypto';

const USUARIO_SERVICE_URL = process.env.USUARIO_SERVICE_URL ?? 'http://localhost:3001';

type Publicacion = components['schemas']['Publicacion'];
type CreateInput = components['schemas']['CreatePublicacionRequestContent'];
type UpdateInput = components['schemas']['UpdatePublicacionRequestContent'];
type ListOutput = components['schemas']['ListPublicacionesResponseContent'];

const TABLE = process.env.TABLE_NAME ?? 'Publicaciones';

@Injectable()
export class PublicacionesService implements OnModuleInit {
  constructor(
    @Inject('DYNAMODB_CLIENT') private readonly dynamoClient: DynamoDBDocumentClient,
    private readonly httpService: HttpService,
  ) {}

  async onModuleInit() {
    try {
      await this.dynamoClient.send(new DescribeTableCommand({ TableName: TABLE }));
    } catch (err: any) {
      if (err?.name === 'ResourceNotFoundException') {
        await this.dynamoClient.send(
          new CreateTableCommand({
            TableName: TABLE,
            AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
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
    await this.validateUsuarioExists(body.idUsuario);

    const item: Publicacion = {
      id: randomUUID(),
      idUsuario: body.idUsuario,
      contenido: body.contenido,
      fecha: Date.now(),
    };
    await this.dynamoClient.send(new PutCommand({ TableName: TABLE, Item: item }));
    return item;
  }

  async findOne(id: string): Promise<Publicacion> {
    const result = await this.dynamoClient.send(
      new GetCommand({ TableName: TABLE, Key: { id } }),
    );
    if (!result.Item) {
      throw new NotFoundException(`Publicacion con id ${id} no encontrada`);
    }
    return result.Item as Publicacion;
  }

  async update(id: string, body: UpdateInput): Promise<Publicacion> {
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

  async remove(id: string): Promise<void> {
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

  private async validateUsuarioExists(idUsuario: string): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.get(`${USUARIO_SERVICE_URL}/v1/usuarios/${idUsuario}`),
      );
    } catch (err: any) {
      if (err?.response?.status === 404) {
        throw new BadRequestException(`El usuario con id ${idUsuario} no existe`);
      }
      throw new BadRequestException(`No se pudo verificar el usuario con id ${idUsuario}`);
    }
  }
}
