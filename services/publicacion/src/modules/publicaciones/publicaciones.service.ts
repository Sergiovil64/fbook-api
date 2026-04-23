import { Injectable, Inject } from '@nestjs/common';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import type { components } from '@api';

type Publicacion = components['schemas']['Publicacion'];
type CreateInput = components['schemas']['CreatePublicacionRequestContent'];
type UpdateInput = components['schemas']['UpdatePublicacionRequestContent'];
type ListOutput = components['schemas']['ListPublicacionesResponseContent'];

@Injectable()
export class PublicacionesService {
  constructor(
    @Inject('DYNAMODB_CLIENT') private readonly dynamoClient: DynamoDBDocumentClient,
  ) {}

  create(body: CreateInput): Publicacion {
    return {
      id: 1,
      idUsuario: body.idUsuario,
      contenido: body.contenido,
      fecha: Date.now(),
    };
  }

  findOne(id: number): Publicacion {
    return {
      id,
      idUsuario: 1,
      contenido: 'Publicación stub',
      fecha: Date.now(),
    };
  }

  update(id: number, body: UpdateInput): Publicacion {
    return {
      id,
      idUsuario: 1,
      contenido: body.contenido ?? 'Publicación stub',
      fecha: Date.now(),
    };
  }

  remove(id: number): void {
    // stub — sin BD aún
  }

  findAll(nextToken?: string, maxResults?: number): ListOutput {
    return {
      items: [
        { id: 1, idUsuario: 1, contenido: 'Publicación 1', fecha: Date.now() },
        { id: 2, idUsuario: 2, contenido: 'Publicación 2', fecha: Date.now() },
      ],
      nextToken: undefined,
    };
  }
}
