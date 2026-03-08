import { Module } from '@nestjs/common';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';
import { PrismaModule } from 'prisma/prisma.module';
import { StorageModule } from 'src/storage/storage.module';
import { AuthModule } from 'src/auth/auth.module';
import { DevJwtGuard } from 'src/auth/guards/dev-jwt.guard';
import { MediaModule } from 'src/media/media.module';

@Module({
  imports: [PrismaModule, StorageModule, AuthModule, MediaModule],
  controllers: [ArticlesController],
  providers: [ArticlesService, DevJwtGuard],
})
export class ArticlesModule {}
