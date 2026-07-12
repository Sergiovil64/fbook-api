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
const PUBLICACION_SERVICE_URL = process.env.PUBLICACION_SERVICE_URL ?? 'http://localhost:3003';

// URL del servicio NLP — en ECS se resuelve vía Cloud Map, en dev apunta al puerto local
const NLP_SERVICE_URL = process.env.NLP_SERVICE_URL ?? 'http://localhost:8000';

type Comentario = components['schemas']['Comentario'];
type CreateInput = components['schemas']['CreateComentarioRequestContent'];
type UpdateInput = components['schemas']['UpdateComentarioRequestContent'];
type ListOutput = components['schemas']['ListComentariosResponseContent'];

const TABLE = process.env.TABLE_COMENTARIOS ?? 'Comentarios';

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
export class ComentariosService implements OnModuleInit {
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
              { AttributeName: 'id',            AttributeType: 'S' },
              { AttributeName: 'idPublicacion', AttributeType: 'S' },
              { AttributeName: 'fComentario',   AttributeType: 'N' },
            ],
            KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
            GlobalSecondaryIndexes: [{
              IndexName: 'IdPublicacionIndex',
              KeySchema: [
                { AttributeName: 'idPublicacion', KeyType: 'HASH' },
                { AttributeName: 'fComentario',   KeyType: 'RANGE' },
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

  async create(body: CreateInput): Promise<Comentario> {
    // Validar usuario y publicación en paralelo (igual que antes)
    await Promise.all([
      this.validateUsuarioExists(body.idUsuario),
      this.validatePublicacionExists(body.idPublicacion),
    ]);

    // Analizar el texto del comentario con el servicio NLP:
    // detecta el idioma y traduce al inglés si está en español.
    // No es bloqueante: si el servicio NLP no está disponible se guarda
    // el comentario igual (sin campos NLP) para no bloquear la operación.
    const nlp = await this.analizarContenidoNlp(body.texto);

    const item = {
      id: randomUUID(),
      idPublicacion: body.idPublicacion,
      idUsuario: body.idUsuario,
      texto: body.texto,
      fComentario: Date.now(),
      // Campos enriquecidos por el servicio NLP (null si el servicio no respondió)
      idioma: nlp?.idioma_detectado ?? null,
      texto_en: nlp?.texto_en ?? null,
    };

    await this.dynamoClient.send(new PutCommand({ TableName: TABLE, Item: item }));
    return item as unknown as Comentario;
  }

  async findOne(id: string): Promise<Comentario> {
    const result = await this.dynamoClient.send(
      new GetCommand({ TableName: TABLE, Key: { id } }),
    );
    if (!result.Item) {
      throw new NotFoundException(`Comentario con id ${id} no encontrado`);
    }
    return result.Item as Comentario;
  }

  async update(id: string, body: UpdateInput): Promise<Comentario> {
    await this.findOne(id);

    // Re-analizar el nuevo texto con NLP para mantener idioma y texto_en sincronizados.
    // Si el servicio NLP no responde, los campos NLP se ponen a null (no bloqueante).
    const nlp = await this.analizarContenidoNlp(body.texto);

    const result = await this.dynamoClient.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: { id },
        UpdateExpression: 'SET #texto = :texto, #idioma = :idioma, #texto_en = :texto_en',
        ExpressionAttributeNames: {
          '#texto':    'texto',
          '#idioma':   'idioma',
          '#texto_en': 'texto_en',
        },
        ExpressionAttributeValues: {
          ':texto':    body.texto,
          ':idioma':   nlp?.idioma_detectado ?? null,
          ':texto_en': nlp?.texto_en ?? null,
        },
        ReturnValues: 'ALL_NEW',
      }),
    );
    return result.Attributes as Comentario;
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
      items: (result.Items ?? []) as Comentario[],
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

  private async validatePublicacionExists(idPublicacion: string): Promise<void> {
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

  // Llama al servicio NLP para detectar el idioma y traducir al inglés.
  // Retorna null si el servicio no está disponible, sin lanzar error,
  // para no bloquear la creación del comentario.
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
      console.warn('[NLP] Servicio no disponible, comentario guardado sin análisis:', err?.message);
      return null;
    }
  }
}
