import { Global, Module } from '@nestjs/common';
import { ModerationService } from './moderation.service';

/**
 * Módulo global de moderación de cyberbullying.
 * Global para poder inyectar ModerationService tanto en PublicacionesService
 * como en ComentariosService sin importarlo en cada módulo.
 */
@Global()
@Module({
  providers: [ModerationService],
  exports: [ModerationService],
})
export class ModerationModule {}
