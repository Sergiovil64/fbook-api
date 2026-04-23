import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode } from '@nestjs/common';
import { ComentariosService } from './comentarios.service';
import type { components } from '@api';

type CreateInput = components['schemas']['CreateComentarioRequestContent'];
type UpdateInput = components['schemas']['UpdateComentarioRequestContent'];

@Controller('v1/comentarios')
export class ComentariosController {
  constructor(private readonly comentariosService: ComentariosService) {}

  @Post()
  @HttpCode(201)
  create(@Body() body: CreateInput) {
    return this.comentariosService.create(body);
  }

  @Get()
  findAll(
    @Query('nextToken') nextToken?: string,
    @Query('maxResults') maxResults?: number,
  ) {
    return this.comentariosService.findAll(nextToken, maxResults);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.comentariosService.findOne(Number(id));
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: UpdateInput) {
    return this.comentariosService.update(Number(id), body);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.comentariosService.remove(Number(id));
  }
}
