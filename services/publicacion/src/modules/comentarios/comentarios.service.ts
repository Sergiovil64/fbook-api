import { Injectable, Inject } from '@nestjs/common';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import type { components } from '@api';

type Comentario = components['schemas']['Comentario'];
type CreateInput = components['schemas']['CreateComentarioRequestContent'];
type UpdateInput = components['schemas']['UpdateComentarioRequestContent'];
type ListOutput = components['schemas']['ListComentariosResponseContent'];

@Injectable()
export class ComentariosService {
  constructor(
    @Inject('DYNAMODB_CLIENT') private readonly dynamoClient: DynamoDBDocumentClient,
  ) {}

  create(body: CreateInput): Comentario {
    return {
      id: 1,
      idPublicacion: body.idPublicacion,
      idUsuario: body.idUsuario,
      texto: body.texto,
      fComentario: Date.now(),
    };
  }

  findOne(id: number): Comentario {
    return {
      id,
      idPublicacion: 1,
      idUsuario: 1,
      texto: 'Comentario stub',
      fComentario: Date.now(),
    };
  }

  update(id: number, body: UpdateInput): Comentario {
    return {
      id,
      idPublicacion: 1,
      idUsuario: 1,
      texto: body.texto ?? 'Comentario stub',
      fComentario: Date.now(),
    };
  }

  remove(id: number): void {
    // stub — sin BD aún
  }

  findAll(nextToken?: string, maxResults?: number): ListOutput {
    return {
      items: [
        { id: 1, idPublicacion: 1, idUsuario: 1, texto: 'Comentario 1', fComentario: Date.now() },
        { id: 2, idPublicacion: 1, idUsuario: 2, texto: 'Comentario 2', fComentario: Date.now() },
      ],
      nextToken: undefined,
    };
  }
}
