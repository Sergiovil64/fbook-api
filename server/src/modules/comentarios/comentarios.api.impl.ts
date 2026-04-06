import { Injectable } from '@nestjs/common';
import { ComentariosApi } from '../../generated/nest/api';
import type {
  Comentario,
  CreateComentarioRequestContent,
  ListComentariosResponseContent,
  UpdateComentarioRequestContent,
} from '../../generated/nest/models';
import { ComentariosService } from './comentarios.service';

@Injectable()
export class ComentariosApiImpl extends ComentariosApi {
  constructor(private readonly comentarios: ComentariosService) {
    super();
  }

  createComentario(body: CreateComentarioRequestContent, _req: Request): Promise<Comentario> {
    return this.comentarios.create(body);
  }

  getComentario(id: number, _req: Request): Promise<Comentario> {
    return this.comentarios.getById(id);
  }

  updateComentario(id: number, body: UpdateComentarioRequestContent | undefined, _req: Request): Promise<Comentario> {
    return this.comentarios.update(id, body);
  }

  deleteComentario(id: number, _req: Request): Promise<void> {
    return this.comentarios.remove(id);
  }

  listComentarios(nextToken: string | undefined, maxResults: number | undefined, _req: Request): Promise<ListComentariosResponseContent> {
    return this.comentarios.list(nextToken, maxResults);
  }
}
