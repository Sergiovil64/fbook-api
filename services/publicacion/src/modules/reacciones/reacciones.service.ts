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

const USUARIO_SERVICE_URL = process.env.USUARIO_SERVICE_URL ?? 'http://localhost:3001';
const PUBLICACION_SERVICE_URL = process.env.PUBLICACION_SERVICE_URL ?? 'http://localhost:3003';

type Reaccion = components['schemas']['Reaccion'];
type CreateInput = components['schemas']['CreateReaccionRequestContent'];
type UpdateInput = components['schemas']['UpdateReaccionRequestContent'];
type ListOutput = components['schemas']['ListReaccionesResponseContent'];

const TABLE = process.env.TABLE_REACCIONES ?? 'Reacciones';

@Injectable()
export class ReaccionesService implements OnModuleInit {
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
    await Promise.all([
      this.validateUsuarioExists(body.idUsuario),
      this.validatePublicacionExists(body.idPublicacion),
      this.validateReaccionUnica(body.idUsuario, body.idPublicacion),
    ]);

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

  private async validateReaccionUnica(idUsuario: number, idPublicacion: number): Promise<void> {
    const result = await this.dynamoClient.send(
      new ScanCommand({
        TableName: TABLE,
        FilterExpression: 'idUsuario = :u AND idPublicacion = :p',
        ExpressionAttributeValues: { ':u': idUsuario, ':p': idPublicacion },
        Limit: 1,
      }),
    );
    if (result.Items && result.Items.length > 0) {
      throw new BadRequestException(
        `El usuario con id ${idUsuario} ya tiene una reacción en la publicación con id ${idPublicacion}`,
      );
    }
  }

  private async validateUsuarioExists(idUsuario: number): Promise<void> {
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

  private async validatePublicacionExists(idPublicacion: number): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.get(`${PUBLICACION_SERVICE_URL}/v1/publicaciones/${idPublicacion}`),
      );
    } catch (err: any) {
      if (err?.response?.status === 404) {
        throw new BadRequestException(`La publicación con id ${idPublicacion} no existe`);
      }
      throw new BadRequestException(`No se pudo verificar la publicación con id ${idPublicacion}`);
    }
  }
}
