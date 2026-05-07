import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, UseGuards } from '@nestjs/common';
import { AmistadesService } from './amistades.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { components } from '@api';

type CreateInput = components['schemas']['CreateAmistadRequestContent'];
type UpdateInput = components['schemas']['UpdateAmistadRequestContent'];

@UseGuards(JwtAuthGuard)
@Controller('v1/amistades')
export class AmistadesController {
  constructor(private readonly amistadesService: AmistadesService) {}

  @Post()
  @HttpCode(201)
  create(@Body() body: CreateInput) {
    return this.amistadesService.create(body);
  }

  @Get()
  findAll(
    @Query('nextToken') nextToken?: string,
    @Query('maxResults') maxResults?: number,
  ) {
    return this.amistadesService.findAll(nextToken, maxResults);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.amistadesService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: UpdateInput) {
    return this.amistadesService.update(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.amistadesService.remove(id);
  }
}
