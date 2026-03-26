/**
 * Bridges the OpenAPI-generated abstract {@link UserProfilesApi} to {@link UserProfilesService}.
 * Wiring matches NestJS dependency injection for custom providers.
 *
 * References:
 * - https://docs.nestjs.com/providers
 * - Generated contract lives under `src/generated/nest` (OpenAPI Generator output from Smithy).
 */
import { Injectable } from '@nestjs/common';
import { UserProfilesApi } from '../../generated/nest/api';
import type {
  CreateUserProfileRequestContent,
  ListUserProfilesResponseContent,
  UpdateUserProfileRequestContent,
  UserProfile,
} from '../../generated/nest/models';
import { UserProfilesService } from './user-profiles.service';

@Injectable()
export class UserProfilesApiImpl extends UserProfilesApi {
  constructor(private readonly profiles: UserProfilesService) {
    super();
  }

  createUserProfile(
    createUserProfileRequestContent: CreateUserProfileRequestContent,
    _request: Request,
  ): Promise<UserProfile> {
    return this.profiles.create(createUserProfileRequestContent);
  }

  deleteUserProfile(id: string, _request: Request): Promise<void> {
    return this.profiles.remove(id);
  }

  getUserProfile(id: string, _request: Request): Promise<UserProfile> {
    return this.profiles.getById(id);
  }

  listUserProfiles(
    nextToken: string | undefined,
    maxResults: number | undefined,
    _request: Request,
  ): Promise<ListUserProfilesResponseContent> {
    return this.profiles.list(nextToken, maxResults);
  }

  updateUserProfile(
    id: string,
    updateUserProfileRequestContent: UpdateUserProfileRequestContent | undefined,
    _request: Request,
  ): Promise<UserProfile> {
    return this.profiles.update(id, updateUserProfileRequestContent);
  }
}
