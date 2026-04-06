import type { PrismaClient } from '@prisma/client';
import type { Reaccion as ReaccionDto } from '../../generated/nest/models';

export type ReaccionRow = Awaited<ReturnType<PrismaClient['reaccion']['findMany']>>[number];

export function toReaccionDto(row: ReaccionRow): ReaccionDto {
  return {
    id: row.idReaccion,
    idPublicacion: row.idPublicacion,
    idUsuario: row.idUsuario,
    meGusta: row.meGusta,
    meEncanta: row.meEncanta,
    meImporta: row.meImporta,
    meDivierte: row.meDivierte,
    meAsombra: row.meAsombra,
    meEntristece: row.meEntristece,
    meEnoja: row.meEnoja,
    fPublicacion: row.fPublicacion.getTime(),
    estado: row.estado,
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
