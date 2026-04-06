import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  Amistad,
  CreateAmistadRequestContent,
  ListAmistadesResponseContent,
  UpdateAmistadRequestContent,
} from '../../generated/nest/models';
import { PrismaService } from '../../prisma/prisma.service';
import {
  clampPageSize,
  decodeListSkip,
  encodeListNextToken,
  toAmistadDto,
} from './amistad.mapper';

@Injectable()
export class AmistadService {
  constructor(private readonly prisma: PrismaService) {}

  async create(body: CreateAmistadRequestContent): Promise<Amistad> {
    const row = await this.prisma.amistad.create({
      data: {
        idUsuario1: body.idUsuario1,
        idUsuario2: body.idUsuario2,
        estado: body.estado,
      },
    });
    return toAmistadDto(row);
  }

  async getById(id: number): Promise<Amistad> {
    const row = await this.prisma.amistad.findUnique({ where: { idAmistad: id } });
    if (!row) throw new NotFoundException(`Amistad no encontrada: ${id}`);
    return toAmistadDto(row);
  }

  async update(id: number, body: UpdateAmistadRequestContent | undefined): Promise<Amistad> {
    try {
      const row = await this.prisma.amistad.update({
        where: { idAmistad: id },
        data: {
          ...(body?.estado !== undefined ? { estado: body.estado } : {}),
        },
      });
      return toAmistadDto(row);
    } catch (e) {
      if (e && typeof e === 'object' && 'code' in e && e.code === 'P2025') {
        throw new NotFoundException(`Amistad no encontrada: ${id}`);
      }
      throw e;
    }
  }

  async remove(id: number): Promise<void> {
    try {
      await this.prisma.amistad.delete({ where: { idAmistad: id } });
    } catch (e) {
      if (e && typeof e === 'object' && 'code' in e && e.code === 'P2025') {
        throw new NotFoundException(`Amistad no encontrada: ${id}`);
      }
      throw e;
    }
  }

  async list(nextToken: string | undefined, maxResults: number | undefined): Promise<ListAmistadesResponseContent> {
    const take = clampPageSize(maxResults);
    const skip = decodeListSkip(nextToken);
    const rows = await this.prisma.amistad.findMany({
      orderBy: { idAmistad: 'asc' },
      skip,
      take: take + 1,
    });
    const hasMore = rows.length > take;
    const page = hasMore ? rows.slice(0, take) : rows;
    const next = hasMore ? encodeListNextToken(skip + take) : undefined;
    return { items: page.map(toAmistadDto), nextToken: next };
  }
}
