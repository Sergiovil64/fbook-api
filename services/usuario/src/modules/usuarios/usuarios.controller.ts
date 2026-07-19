import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, UseGuards } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import type { components } from '@api';

type CreateInput = components['schemas']['CreateUsuarioRequestContent'];
type UpdateInput = components['schemas']['UpdateUsuarioRequestContent'];

@Controller('v1/usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  // Público: registro de nuevos usuarios
  @Post()
  @HttpCode(201)
  create(@Body() body: CreateInput) {
    return this.usuariosService.create(body);
  }

  // Solo admin: listar todos los usuarios
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get()
  findAll(
    @Query('nextToken') nextToken?: string,
    @Query('maxResults') maxResults?: number,
  ) {
    return this.usuariosService.findAll(nextToken, maxResults);
  }

  // Público: resolver el id (Dynamo) de un usuario a partir de su correo. Necesario porque el
  // login vía Cognito (InitiateAuth) solo devuelve el JWT, no el id de Dynamo — sin este endpoint
  // el cliente tendría que recordarlo por su cuenta (p. ej. localStorage), lo que se rompe entre
  // navegadores/dispositivos.
  @Get('by-correo/:correo')
  findByCorreo(@Param('correo') correo: string) {
    return this.usuariosService.findByCorreo(correo);
  }

  // Público: ver perfil de un usuario (usado también por otros microservicios)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usuariosService.findOne(id);
  }

  // Autenticado: actualizar perfil (validación de propietario pendiente ABAC)
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() body: UpdateInput) {
    return this.usuariosService.update(id, body);
  }

  // Solo admin: eliminar usuario
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.usuariosService.remove(id);
  }
}
