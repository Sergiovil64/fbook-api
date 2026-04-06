import { Injectable } from '@nestjs/common';
import { UsuariosApi } from '../../generated/nest/api';
import type {
  CreateUsuarioRequestContent,
  ListUsuariosResponseContent,
  UpdateUsuarioRequestContent,
  Usuario,
} from '../../generated/nest/models';
import { UsuariosService } from './usuarios.service';

@Injectable()
export class UsuariosApiImpl extends UsuariosApi {
  constructor(private readonly usuarios: UsuariosService) {
    super();
  }

  createUsuario(body: CreateUsuarioRequestContent, _req: Request): Promise<Usuario> {
    return this.usuarios.create(body);
  }

  getUsuario(id: number, _req: Request): Promise<Usuario> {
    return this.usuarios.getById(id);
  }

  updateUsuario(id: number, body: UpdateUsuarioRequestContent | undefined, _req: Request): Promise<Usuario> {
    return this.usuarios.update(id, body);
  }

  deleteUsuario(id: number, _req: Request): Promise<void> {
    return this.usuarios.remove(id);
  }

  listUsuarios(nextToken: string | undefined, maxResults: number | undefined, _req: Request): Promise<ListUsuariosResponseContent> {
    return this.usuarios.list(nextToken, maxResults);
  }
}
