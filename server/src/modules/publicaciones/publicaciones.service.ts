import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  CreatePublicacionRequestContent,
  ListPublicacionesResponseContent,
  Publicacion,
  UpdatePublicacionRequestContent,
} from '../../generated/nest/models';
import { PrismaService } from '../../prisma/prisma.service';
import {
  clampPageSize,
  decodeListSkip,
  encodeListNextToken,
  toPublicacionDto,
} from './publicacion.mapper';

@Injectable()
export class PublicacionesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(body: CreatePublicacionRequestContent): Promise<Publicacion> {
    const row = await this.prisma.publicacion.create({
      data: {
        idUsuario: body.idUsuario,
        contenido: body.contenido,
      },
    });
    return toPublicacionDto(row);
  }

  async getById(id: number): Promise<Publicacion> {
    const row = await this.prisma.publicacion.findUnique({ where: { idPublicacion: id } });
    if (!row) throw new NotFoundException(`Publicación no encontrada: ${id}`);
    return toPublicacionDto(row);
  }

  async update(id: number, body: UpdatePublicacionRequestContent | undefined): Promise<Publicacion> {
    try {
      const row = await this.prisma.publicacion.update({
        where: { idPublicacion: id },
        data: {
          ...(body?.contenido !== undefined ? { contenido: body.contenido } : {}),
        },
      });
      return toPublicacionDto(row);
    } catch (e) {
      if (e && typeof e === 'object' && 'code' in e && e.code === 'P2025') {
        throw new NotFoundException(`Publicación no encontrada: ${id}`);
      }
      throw e;
    }
  }

  async remove(id: number): Promise<void> {
    try {
      await this.prisma.publicacion.delete({ where: { idPublicacion: id } });
    } catch (e) {
      if (e && typeof e === 'object' && 'code' in e && e.code === 'P2025') {
        throw new NotFoundException(`Publicación no encontrada: ${id}`);
      }
      throw e;
    }
  }

  async list(nextToken: string | undefined, maxResults: number | undefined): Promise<ListPublicacionesResponseContent> {
    const take = clampPageSize(maxResults);
    const skip = decodeListSkip(nextToken);
    const rows = await this.prisma.publicacion.findMany({
      orderBy: { idPublicacion: 'asc' },
      skip,
      take: take + 1,
    });
    const hasMore = rows.length > take;
    const page = hasMore ? rows.slice(0, take) : rows;
    const next = hasMore ? encodeListNextToken(skip + take) : undefined;
    return { items: page.map(toPublicacionDto), nextToken: next };
  }
}
