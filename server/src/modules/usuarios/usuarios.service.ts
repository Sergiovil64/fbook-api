import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type {
  CreateUsuarioRequestContent,
  ListUsuariosResponseContent,
  UpdateUsuarioRequestContent,
  Usuario,
} from '../../generated/nest/models';
import { PrismaService } from '../../prisma/prisma.service';
import {
  clampPageSize,
  decodeListSkip,
  encodeListNextToken,
  toUsuarioDto,
} from './usuario.mapper';

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(body: CreateUsuarioRequestContent): Promise<Usuario> {
    try {
      const row = await this.prisma.usuario.create({
        data: {
          nombre: body.nombre,
          correo: body.correo,
          password: body.password,
        },
      });
      return toUsuarioDto(row);
    } catch (e) {
      if (e && typeof e === 'object' && 'code' in e && e.code === 'P2002') {
        throw new ConflictException(`Ya existe un usuario con el correo: ${body.correo}`);
      }
      throw e;
    }
  }

  async getById(id: number): Promise<Usuario> {
    const row = await this.prisma.usuario.findUnique({ where: { idUsuario: id } });
    if (!row) throw new NotFoundException(`Usuario no encontrado: ${id}`);
    return toUsuarioDto(row);
  }

  async update(id: number, body: UpdateUsuarioRequestContent | undefined): Promise<Usuario> {
    try {
      const row = await this.prisma.usuario.update({
        where: { idUsuario: id },
        data: {
          ...(body?.nombre !== undefined ? { nombre: body.nombre } : {}),
          ...(body?.correo !== undefined ? { correo: body.correo } : {}),
          ...(body?.password !== undefined ? { password: body.password } : {}),
        },
      });
      return toUsuarioDto(row);
    } catch (e) {
      if (e && typeof e === 'object' && 'code' in e) {
        if (e.code === 'P2025') throw new NotFoundException(`Usuario no encontrado: ${id}`);
        if (e.code === 'P2002') throw new ConflictException(`Correo ya en uso`);
      }
      throw e;
    }
  }

  async remove(id: number): Promise<void> {
    try {
      await this.prisma.usuario.delete({ where: { idUsuario: id } });
    } catch (e) {
      if (e && typeof e === 'object' && 'code' in e && e.code === 'P2025') {
        throw new NotFoundException(`Usuario no encontrado: ${id}`);
      }
      throw e;
    }
  }

  async list(nextToken: string | undefined, maxResults: number | undefined): Promise<ListUsuariosResponseContent> {
    const take = clampPageSize(maxResults);
    const skip = decodeListSkip(nextToken);
    const rows = await this.prisma.usuario.findMany({
      orderBy: { idUsuario: 'asc' },
      skip,
      take: take + 1,
    });
    const hasMore = rows.length > take;
    const page = hasMore ? rows.slice(0, take) : rows;
    const next = hasMore ? encodeListNextToken(skip + take) : undefined;
    return { items: page.map(toUsuarioDto), nextToken: next };
  }
}
