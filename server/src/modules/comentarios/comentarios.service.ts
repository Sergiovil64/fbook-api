import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  Comentario,
  CreateComentarioRequestContent,
  ListComentariosResponseContent,
  UpdateComentarioRequestContent,
} from '../../generated/nest/models';
import { PrismaService } from '../../prisma/prisma.service';
import {
  clampPageSize,
  decodeListSkip,
  encodeListNextToken,
  toComentarioDto,
} from './comentario.mapper';

@Injectable()
export class ComentariosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(body: CreateComentarioRequestContent): Promise<Comentario> {
    const row = await this.prisma.comentario.create({
      data: {
        idPublicacion: body.idPublicacion,
        idUsuario: body.idUsuario,
        texto: body.texto,
      },
    });
    return toComentarioDto(row);
  }

  async getById(id: number): Promise<Comentario> {
    const row = await this.prisma.comentario.findUnique({ where: { idComentario: id } });
    if (!row) throw new NotFoundException(`Comentario no encontrado: ${id}`);
    return toComentarioDto(row);
  }

  async update(id: number, body: UpdateComentarioRequestContent | undefined): Promise<Comentario> {
    try {
      const row = await this.prisma.comentario.update({
        where: { idComentario: id },
        data: {
          ...(body?.texto !== undefined ? { texto: body.texto } : {}),
        },
      });
      return toComentarioDto(row);
    } catch (e) {
      if (e && typeof e === 'object' && 'code' in e && e.code === 'P2025') {
        throw new NotFoundException(`Comentario no encontrado: ${id}`);
      }
      throw e;
    }
  }

  async remove(id: number): Promise<void> {
    try {
      await this.prisma.comentario.delete({ where: { idComentario: id } });
    } catch (e) {
      if (e && typeof e === 'object' && 'code' in e && e.code === 'P2025') {
        throw new NotFoundException(`Comentario no encontrado: ${id}`);
      }
      throw e;
    }
  }

  async list(nextToken: string | undefined, maxResults: number | undefined): Promise<ListComentariosResponseContent> {
    const take = clampPageSize(maxResults);
    const skip = decodeListSkip(nextToken);
    const rows = await this.prisma.comentario.findMany({
      orderBy: { idComentario: 'asc' },
      skip,
      take: take + 1,
    });
    const hasMore = rows.length > take;
    const page = hasMore ? rows.slice(0, take) : rows;
    const next = hasMore ? encodeListNextToken(skip + take) : undefined;
    return { items: page.map(toComentarioDto), nextToken: next };
  }
}
