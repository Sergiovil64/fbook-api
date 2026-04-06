import { Injectable } from '@nestjs/common';
import { ReaccionesApi } from '../../generated/nest/api';
import type {
  CreateReaccionRequestContent,
  ListReaccionesResponseContent,
  Reaccion,
  UpdateReaccionRequestContent,
} from '../../generated/nest/models';
import { ReaccionesService } from './reacciones.service';

@Injectable()
export class ReaccionesApiImpl extends ReaccionesApi {
  constructor(private readonly reacciones: ReaccionesService) {
    super();
  }

  createReaccion(body: CreateReaccionRequestContent, _req: Request): Promise<Reaccion> {
    return this.reacciones.create(body);
  }

  getReaccion(id: number, _req: Request): Promise<Reaccion> {
    return this.reacciones.getById(id);
  }

  updateReaccion(id: number, body: UpdateReaccionRequestContent | undefined, _req: Request): Promise<Reaccion> {
    return this.reacciones.update(id, body);
  }

  deleteReaccion(id: number, _req: Request): Promise<void> {
    return this.reacciones.remove(id);
  }

  listReacciones(nextToken: string | undefined, maxResults: number | undefined, _req: Request): Promise<ListReaccionesResponseContent> {
    return this.reacciones.list(nextToken, maxResults);
  }
}
