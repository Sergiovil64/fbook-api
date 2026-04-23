import { Injectable, Inject } from '@nestjs/common';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import type { components } from '@api';

type Reaccion = components['schemas']['Reaccion'];
type CreateInput = components['schemas']['CreateReaccionRequestContent'];
type UpdateInput = components['schemas']['UpdateReaccionRequestContent'];
type ListOutput = components['schemas']['ListReaccionesResponseContent'];

@Injectable()
export class ReaccionesService {
  constructor(
    @Inject('DYNAMODB_CLIENT') private readonly dynamoClient: DynamoDBDocumentClient,
  ) {}

  create(body: CreateInput): Reaccion {
    return {
      id: 1,
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
  }

  findOne(id: number): Reaccion {
    return {
      id,
      idPublicacion: 1,
      idUsuario: 1,
      meGusta: true,
      meEncanta: false,
      meImporta: false,
      meDivierte: false,
      meAsombra: false,
      meEntristece: false,
      meEnoja: false,
      fPublicacion: Date.now(),
      estado: 'activo',
    };
  }

  update(id: number, body: UpdateInput): Reaccion {
    return {
      id,
      idPublicacion: 1,
      idUsuario: 1,
      meGusta: body.meGusta ?? false,
      meEncanta: body.meEncanta ?? false,
      meImporta: body.meImporta ?? false,
      meDivierte: body.meDivierte ?? false,
      meAsombra: body.meAsombra ?? false,
      meEntristece: body.meEntristece ?? false,
      meEnoja: body.meEnoja ?? false,
      fPublicacion: Date.now(),
      estado: body.estado ?? 'activo',
    };
  }

  remove(id: number): void {
    // stub — sin BD aún
  }

  findAll(nextToken?: string, maxResults?: number): ListOutput {
    return {
      items: [
        {
          id: 1, idPublicacion: 1, idUsuario: 1,
          meGusta: true, meEncanta: false, meImporta: false,
          meDivierte: false, meAsombra: false, meEntristece: false, meEnoja: false,
          fPublicacion: Date.now(), estado: 'activo',
        },
      ],
      nextToken: undefined,
    };
  }
}
