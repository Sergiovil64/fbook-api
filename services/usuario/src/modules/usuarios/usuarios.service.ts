import { Injectable, Inject } from '@nestjs/common';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import type { components } from '@api';

type Usuario = components['schemas']['Usuario'];
type CreateInput = components['schemas']['CreateUsuarioRequestContent'];
type UpdateInput = components['schemas']['UpdateUsuarioRequestContent'];
type ListOutput = components['schemas']['ListUsuariosResponseContent'];

@Injectable()
export class UsuariosService {
  constructor(
    @Inject('DYNAMODB_CLIENT') private readonly dynamoClient: DynamoDBDocumentClient,
  ) {}

  create(body: CreateInput): Usuario {
    return {
      id: 1,
      nombre: body.nombre,
      correo: body.correo,
      fechaRegistro: Date.now(),
    };
  }

  findOne(id: number): Usuario {
    return {
      id,
      nombre: 'Usuario stub',
      correo: 'stub@example.com',
      fechaRegistro: Date.now(),
    };
  }

  update(id: number, body: UpdateInput): Usuario {
    return {
      id,
      nombre: body.nombre ?? 'Usuario stub',
      correo: body.correo ?? 'stub@example.com',
      fechaRegistro: Date.now(),
    };
  }

  remove(id: number): void {
    // stub — sin BD aún
  }

  findAll(nextToken?: string, maxResults?: number): ListOutput {
    return {
      items: [
        { id: 1, nombre: 'Usuario 1', correo: 'u1@example.com', fechaRegistro: Date.now() },
        { id: 2, nombre: 'Usuario 2', correo: 'u2@example.com', fechaRegistro: Date.now() },
      ],
      nextToken: undefined,
    };
  }
}
