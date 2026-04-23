import { Injectable, Inject } from '@nestjs/common';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import type { components } from '@api';

type Amistad = components['schemas']['Amistad'];
type CreateInput = components['schemas']['CreateAmistadRequestContent'];
type UpdateInput = components['schemas']['UpdateAmistadRequestContent'];
type ListOutput = components['schemas']['ListAmistadesResponseContent'];

@Injectable()
export class AmistadesService {
  constructor(
    @Inject('DYNAMODB_CLIENT') private readonly dynamoClient: DynamoDBDocumentClient,
  ) {}

  create(body: CreateInput): Amistad {
    return {
      id: 1,
      idUsuario1: body.idUsuario1,
      idUsuario2: body.idUsuario2,
      estado: body.estado,
    };
  }

  findOne(id: number): Amistad {
    return {
      id,
      idUsuario1: 1,
      idUsuario2: 2,
      estado: 'pendiente',
    };
  }

  update(id: number, body: UpdateInput): Amistad {
    return {
      id,
      idUsuario1: 1,
      idUsuario2: 2,
      estado: body.estado ?? 'pendiente',
    };
  }

  remove(id: number): void {
    // stub — sin BD aún
  }

  findAll(nextToken?: string, maxResults?: number): ListOutput {
    return {
      items: [
        { id: 1, idUsuario1: 1, idUsuario2: 2, estado: 'aceptada' },
        { id: 2, idUsuario1: 1, idUsuario2: 3, estado: 'pendiente' },
      ],
      nextToken: undefined,
    };
  }
}
