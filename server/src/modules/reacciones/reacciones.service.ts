import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type {
  CreateReaccionRequestContent,
  ListReaccionesResponseContent,
  Reaccion,
  UpdateReaccionRequestContent,
} from '../../generated/nest/models';
import { PrismaService } from '../../prisma/prisma.service';
import {
  clampPageSize,
  decodeListSkip,
  encodeListNextToken,
  toReaccionDto,
} from './reaccion.mapper';

@Injectable()
export class ReaccionesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(body: CreateReaccionRequestContent): Promise<Reaccion> {
    try {
      const row = await this.prisma.reaccion.create({
        data: {
          idPublicacion: body.idPublicacion,
          idUsuario: body.idUsuario,
          meGusta: body.meGusta,
          meEncanta: body.meEncanta,
          meImporta: body.meImporta,
          meDivierte: body.meDivierte,
          meAsombra: body.meAsombra,
          meEntristece: body.meEntristece,
          meEnoja: body.meEnoja,
          estado: body.estado,
        },
      });
      return toReaccionDto(row);
    } catch (e) {
      if (e && typeof e === 'object' && 'code' in e && e.code === 'P2002') {
        throw new ConflictException(`Ya existe una reacción del usuario ${body.idUsuario} en la publicación ${body.idPublicacion}`);
      }
      throw e;
    }
  }

  async getById(id: number): Promise<Reaccion> {
    const row = await this.prisma.reaccion.findUnique({ where: { idReaccion: id } });
    if (!row) throw new NotFoundException(`Reacción no encontrada: ${id}`);
    return toReaccionDto(row);
  }

  async update(id: number, body: UpdateReaccionRequestContent | undefined): Promise<Reaccion> {
    try {
      const row = await this.prisma.reaccion.update({
        where: { idReaccion: id },
        data: {
          ...(body?.meGusta !== undefined ? { meGusta: body.meGusta } : {}),
          ...(body?.meEncanta !== undefined ? { meEncanta: body.meEncanta } : {}),
          ...(body?.meImporta !== undefined ? { meImporta: body.meImporta } : {}),
          ...(body?.meDivierte !== undefined ? { meDivierte: body.meDivierte } : {}),
          ...(body?.meAsombra !== undefined ? { meAsombra: body.meAsombra } : {}),
          ...(body?.meEntristece !== undefined ? { meEntristece: body.meEntristece } : {}),
          ...(body?.meEnoja !== undefined ? { meEnoja: body.meEnoja } : {}),
          ...(body?.estado !== undefined ? { estado: body.estado } : {}),
        },
      });
      return toReaccionDto(row);
    } catch (e) {
      if (e && typeof e === 'object' && 'code' in e && e.code === 'P2025') {
        throw new NotFoundException(`Reacción no encontrada: ${id}`);
      }
      throw e;
    }
  }

  async remove(id: number): Promise<void> {
    try {
      await this.prisma.reaccion.delete({ where: { idReaccion: id } });
    } catch (e) {
      if (e && typeof e === 'object' && 'code' in e && e.code === 'P2025') {
        throw new NotFoundException(`Reacción no encontrada: ${id}`);
      }
      throw e;
    }
  }

  async list(nextToken: string | undefined, maxResults: number | undefined): Promise<ListReaccionesResponseContent> {
    const take = clampPageSize(maxResults);
    const skip = decodeListSkip(nextToken);
    const rows = await this.prisma.reaccion.findMany({
      orderBy: { idReaccion: 'asc' },
      skip,
      take: take + 1,
    });
    const hasMore = rows.length > take;
    const page = hasMore ? rows.slice(0, take) : rows;
    const next = hasMore ? encodeListNextToken(skip + take) : undefined;
    return { items: page.map(toReaccionDto), nextToken: next };
  }
}
