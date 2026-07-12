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

// URL del servicio NLP — en ECS se resuelve vía Cloud Map, en dev apunta al puerto local
const NLP_SERVICE_URL = process.env.NLP_SERVICE_URL ?? 'http://localhost:8000';

type Publicacion = components['schemas']['Publicacion'];
type CreateInput = components['schemas']['CreatePublicacionRequestContent'];
type UpdateInput = components['schemas']['UpdatePublicacionRequestContent'];
type ListOutput = components['schemas']['ListPublicacionesResponseContent'];

const TABLE = process.env.TABLE_NAME ?? 'Publicaciones';

// Tipo de la respuesta del servicio NLP (Fase 1: detección de idioma + traducción)
interface NlpRespuesta {
  idioma_detectado: string;
  confianza: number;
  texto_original: string;
  texto_en: string;
  traducido: boolean;
  idioma_soportado: boolean;
}

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
            AttributeDefinitions: [
              { AttributeName: 'id',        AttributeType: 'S' },
              { AttributeName: 'idUsuario', AttributeType: 'S' },
              { AttributeName: 'fecha',     AttributeType: 'N' },
            ],
            KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
            GlobalSecondaryIndexes: [{
              IndexName: 'IdUsuarioIndex',
              KeySchema: [
                { AttributeName: 'idUsuario', KeyType: 'HASH' },
                { AttributeName: 'fecha',     KeyType: 'RANGE' },
              ],
              Projection: { ProjectionType: 'ALL' },
            }],
            BillingMode: 'PAY_PER_REQUEST',
          }),
        );
      } else {
        throw err;
      }
    }
  }

  async create(body: CreateInput): Promise<Publicacion> {
    // Validar que el usuario existe antes de procesar el contenido
    await this.validateUsuarioExists(body.idUsuario);

    // Analizar el contenido con el servicio NLP:
    // detecta el idioma y traduce al inglés si está en español.
    // No es bloqueante: si el servicio NLP no está disponible se guarda
    // el contenido igual (sin campos NLP) para no bloquear la publicación.
    const nlp = await this.analizarContenidoNlp(body.contenido);

    const item = {
      id: randomUUID(),
      idUsuario: body.idUsuario,
      contenido: body.contenido,
      fecha: Date.now(),
      // Campos enriquecidos por el servicio NLP (null si el servicio no respondió)
      idioma: nlp?.idioma_detectado ?? null,
      contenido_en: nlp?.texto_en ?? null,
    };

    await this.dynamoClient.send(new PutCommand({ TableName: TABLE, Item: item }));
    return item as unknown as Publicacion;
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

    // Re-analizar el nuevo contenido con NLP para mantener idioma y contenido_en sincronizados.
    // Si el servicio NLP no responde, los campos NLP se ponen a null (no bloqueante).
    const nlp = await this.analizarContenidoNlp(body.contenido);

    const result = await this.dynamoClient.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: { id },
        UpdateExpression: 'SET #contenido = :contenido, #idioma = :idioma, #contenido_en = :contenido_en',
        ExpressionAttributeNames: {
          '#contenido':    'contenido',
          '#idioma':       'idioma',
          '#contenido_en': 'contenido_en',
        },
        ExpressionAttributeValues: {
          ':contenido':    body.contenido,
          ':idioma':       nlp?.idioma_detectado ?? null,
          ':contenido_en': nlp?.texto_en ?? null,
        },
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
        this.httpService.get(`${USUARIO_SERVICE_URL}/v1/usuarios/${idUsuario}`, {
          timeout: 5000,
        }),
      );
    } catch (err: any) {
      if (err?.response?.status === 404) {
        throw new BadRequestException(`El usuario con id ${idUsuario} no existe`);
      }
      throw new BadRequestException(`No se pudo verificar el usuario con id ${idUsuario}`);
    }
  }

  // Llama al servicio NLP para detectar el idioma y traducir al inglés.
  // Retorna null si el servicio no está disponible, sin lanzar error,
  // para no bloquear la creación de la publicación.
  private async analizarContenidoNlp(texto: string): Promise<NlpRespuesta | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<NlpRespuesta>(
          `${NLP_SERVICE_URL}/v1/nlp/analyze`,
          { texto },
          { timeout: 10000 },
        ),
      );
      return response.data;
    } catch (err: any) {
      console.warn('[NLP] Servicio no disponible, publicación guardada sin análisis:', err?.message);
      return null;
    }
  }
}
