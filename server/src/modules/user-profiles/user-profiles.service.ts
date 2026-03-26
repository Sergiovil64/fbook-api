/**
 * Application service: Prisma persistence for UserProfile.
 *
 * References:
 * - Pagination (skip / take): https://www.prisma.io/docs/orm/prisma-client/queries/pagination
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import type {
  CreateUserProfileRequestContent,
  ListUserProfilesResponseContent,
  UpdateUserProfileRequestContent,
  UserProfile,
} from '../../generated/nest/models';
import { PrismaService } from '../../prisma/prisma.service';
import {
  clampPageSize,
  decodeListSkip,
  encodeListNextToken,
  toUserProfileDto,
} from './user-profile.mapper';

@Injectable()
export class UserProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(body: CreateUserProfileRequestContent): Promise<UserProfile> {
    const row = await this.prisma.userProfile.create({
      data: {
        displayName: body.displayName,
        email: body.email,
        bio: body.bio,
      },
    });
    return toUserProfileDto(row);
  }

  async getById(id: string): Promise<UserProfile> {
    const row = await this.prisma.userProfile.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException(`UserProfile not found: ${id}`);
    }
    return toUserProfileDto(row);
  }

  async update(id: string, body: UpdateUserProfileRequestContent | undefined): Promise<UserProfile> {
    try {
      const row = await this.prisma.userProfile.update({
        where: { id },
        data: {
          ...(body?.displayName !== undefined ? { displayName: body.displayName } : {}),
          ...(body?.bio !== undefined ? { bio: body.bio } : {}),
        },
      });
      return toUserProfileDto(row);
    } catch (e) {
      // P2025: "An operation failed because it depends on one or more records that were required but not found."
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new NotFoundException(`UserProfile not found: ${id}`);
      }
      throw e;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.userProfile.delete({ where: { id } });
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new NotFoundException(`UserProfile not found: ${id}`);
      }
      throw e;
    }
  }

  /**
   * Offset pagination with `take + 1` to detect a next page without a separate count query.
   * Aligns with Prisma offset pagination (`skip` / `take`).
   */
  async list(nextToken: string | undefined, maxResults: number | undefined): Promise<ListUserProfilesResponseContent> {
    const take = clampPageSize(maxResults);
    const skip = decodeListSkip(nextToken);
    const rows = await this.prisma.userProfile.findMany({
      orderBy: { createdAt: 'asc' },
      skip,
      take: take + 1,
    });
    const hasMore = rows.length > take;
    const page = hasMore ? rows.slice(0, take) : rows;
    const next = hasMore ? encodeListNextToken(skip + take) : undefined;
    return {
      items: page.map(toUserProfileDto),
      nextToken: next,
    };
  }
}
