import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode } from '@nestjs/common';
import { PublicacionesService } from './publicaciones.service';
import type { components } from '@api';

type CreateInput = components['schemas']['CreatePublicacionRequestContent'];
type UpdateInput = components['schemas']['UpdatePublicacionRequestContent'];

@Controller('v1/publicaciones')
export class PublicacionesController {
  constructor(private readonly publicacionesService: PublicacionesService) {}

  @Post()
  @HttpCode(201)
  create(@Body() body: CreateInput) {
    return this.publicacionesService.create(body);
  }

  @Get()
  findAll(
    @Query('nextToken') nextToken?: string,
    @Query('maxResults') maxResults?: number,
  ) {
    return this.publicacionesService.findAll(nextToken, maxResults);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.publicacionesService.findOne(Number(id));
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: UpdateInput) {
    return this.publicacionesService.update(Number(id), body);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.publicacionesService.remove(Number(id));
  }
}
