import type { PrismaClient } from '@prisma/client';
import type { Comentario as ComentarioDto } from '../../generated/nest/models';

export type ComentarioRow = Awaited<ReturnType<PrismaClient['comentario']['findMany']>>[number];

export function toComentarioDto(row: ComentarioRow): ComentarioDto {
  return {
    id: row.idComentario,
    idPublicacion: row.idPublicacion,
    idUsuario: row.idUsuario,
    texto: row.texto,
    fComentario: row.fComentario.getTime(),
  };
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export function clampPageSize(maxResults: number | undefined): number {
  const n = maxResults ?? DEFAULT_PAGE_SIZE;
  return Math.min(Math.max(n, 1), MAX_PAGE_SIZE);
}

export function decodeListSkip(nextToken: string | undefined): number {
  if (!nextToken?.length) return 0;
  try {
    const json = Buffer.from(nextToken, 'base64url').toString('utf8');
    const parsed = JSON.parse(json) as { skip?: unknown };
    const skip = parsed.skip;
    return typeof skip === 'number' && skip >= 0 ? skip : 0;
  } catch {
    return 0;
  }
}

export function encodeListNextToken(skip: number): string {
  return Buffer.from(JSON.stringify({ skip }), 'utf8').toString('base64url');
}
