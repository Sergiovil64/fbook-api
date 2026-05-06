import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode } from '@nestjs/common';
import { ReaccionesService } from './reacciones.service';
import type { components } from '@api';

type CreateInput = components['schemas']['CreateReaccionRequestContent'];
type UpdateInput = components['schemas']['UpdateReaccionRequestContent'];

@Controller('v1/reacciones')
export class ReaccionesController {
  constructor(private readonly reaccionesService: ReaccionesService) {}

  @Post()
  @HttpCode(201)
  create(@Body() body: CreateInput) {
    return this.reaccionesService.create(body);
  }

  @Get()
  findAll(
    @Query('nextToken') nextToken?: string,
    @Query('maxResults') maxResults?: number,
  ) {
    return this.reaccionesService.findAll(nextToken, maxResults);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reaccionesService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: UpdateInput) {
    return this.reaccionesService.update(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.reaccionesService.remove(id);
  }
}
