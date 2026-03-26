import { Module } from '@nestjs/common';
import { ApiModule } from './generated/nest/api.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserProfilesApiImpl } from './modules/user-profiles/user-profiles.api.impl';
import { UserProfilesService } from './modules/user-profiles/user-profiles.service';

@Module({
  imports: [
    PrismaModule,
    ApiModule.forRoot({
      apiImplementations: {
        userProfilesApi: UserProfilesApiImpl,
      },
      providers: [UserProfilesService],
    }),
  ],
})
export class AppModule {}
