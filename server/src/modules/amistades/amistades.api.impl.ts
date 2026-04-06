import { Injectable } from '@nestjs/common';
import { AmistadesApi } from '../../generated/nest/api';
import type {
  Amistad,
  CreateAmistadRequestContent,
  ListAmistadesResponseContent,
  UpdateAmistadRequestContent,
} from '../../generated/nest/models';
import { AmistadService } from './amistades.service';

@Injectable()
export class AmistadApiImpl extends AmistadesApi {
  constructor(private readonly amistades: AmistadService) {
    super();
  }

  createAmistad(body: CreateAmistadRequestContent, _req: Request): Promise<Amistad> {
    return this.amistades.create(body);
  }

  getAmistad(id: number, _req: Request): Promise<Amistad> {
    return this.amistades.getById(id);
  }

  updateAmistad(id: number, body: UpdateAmistadRequestContent | undefined, _req: Request): Promise<Amistad> {
    return this.amistades.update(id, body);
  }

  deleteAmistad(id: number, _req: Request): Promise<void> {
    return this.amistades.remove(id);
  }

  listAmistades(nextToken: string | undefined, maxResults: number | undefined, _req: Request): Promise<ListAmistadesResponseContent> {
    return this.amistades.list(nextToken, maxResults);
  }
}
