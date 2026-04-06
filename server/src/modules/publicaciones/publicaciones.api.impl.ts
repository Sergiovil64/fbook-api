import { Injectable } from '@nestjs/common';
import { PublicacionesApi } from '../../generated/nest/api';
import type {
  CreatePublicacionRequestContent,
  ListPublicacionesResponseContent,
  Publicacion,
  UpdatePublicacionRequestContent,
} from '../../generated/nest/models';
import { PublicacionesService } from './publicaciones.service';

@Injectable()
export class PublicacionesApiImpl extends PublicacionesApi {
  constructor(private readonly publicaciones: PublicacionesService) {
    super();
  }

  createPublicacion(body: CreatePublicacionRequestContent, _req: Request): Promise<Publicacion> {
    return this.publicaciones.create(body);
  }

  getPublicacion(id: number, _req: Request): Promise<Publicacion> {
    return this.publicaciones.getById(id);
  }

  updatePublicacion(id: number, body: UpdatePublicacionRequestContent | undefined, _req: Request): Promise<Publicacion> {
    return this.publicaciones.update(id, body);
  }

  deletePublicacion(id: number, _req: Request): Promise<void> {
    return this.publicaciones.remove(id);
  }

  listPublicaciones(nextToken: string | undefined, maxResults: number | undefined, _req: Request): Promise<ListPublicacionesResponseContent> {
    return this.publicaciones.list(nextToken, maxResults);
  }
}
