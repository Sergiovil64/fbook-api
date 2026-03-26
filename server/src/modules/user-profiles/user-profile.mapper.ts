import type { PrismaClient } from '@prisma/client';
import type { UserProfile as UserProfileDto } from '../../generated/nest/models';

/**
 * Row type returned by default `userProfile` queries (no `select` / `include`).
 * Pattern: infer element type of `findMany()` via `Awaited` + `ReturnType` + indexed access.
 *
 * References:
 * - https://www.prisma.io/docs/orm/prisma-client/type-safety
 * - https://www.typescriptlang.org/docs/handbook/utility-types.html (Awaited, ReturnType)
 */
export type UserProfileRow = Awaited<ReturnType<PrismaClient['userProfile']['findMany']>>[number];

/**
 * Maps a Prisma row to the OpenAPI-generated DTO. Uses `??` only where the schema allows
 * optional fields (e.g. `bio` null in DB → `undefined` in API).
 *
 * References:
 * - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing
 */
export function toUserProfileDto(row: UserProfileRow): UserProfileDto {
  return {
    id: row.id,
    displayName: row.displayName,
    email: row.email,
    bio: row.bio ?? undefined,
  };
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export function clampPageSize(maxResults: number | undefined): number {
  const n = maxResults ?? DEFAULT_PAGE_SIZE;
  return Math.min(Math.max(n, 1), MAX_PAGE_SIZE);
}

/**
 * Opaque pagination token: JSON `{ skip: number }` encoded as base64url (Node `Buffer`).
 * Invalid tokens decode to `skip === 0`.
 *
 * References:
 * - https://nodejs.org/api/buffer.html
 * - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON
 */
export function decodeListSkip(nextToken: string | undefined): number {
  if (!nextToken?.length) {
    return 0;
  }
  try {
    const json = Buffer.from(nextToken, 'base64url').toString('utf8');
    const parsed = JSON.parse(json) as { skip?: unknown };
    const skip = parsed.skip;
    return typeof skip === 'number' && skip >= 0 ? skip : 0;
  } catch {
    return 0;
  }
}

/** Inverse of {@link decodeListSkip}; see same references. */
export function encodeListNextToken(skip: number): string {
  return Buffer.from(JSON.stringify({ skip }), 'utf8').toString('base64url');
}
