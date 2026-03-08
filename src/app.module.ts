import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { ArticlesModule } from './articles/articles.module';
import { PrismaModule } from 'prisma/prisma.module';
import { JwtAuthGuard } from './auth/guards/jwt.guard';
import { ConfigModule } from '@nestjs/config';
import { QuestionsModule } from './questions/questions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    PrismaModule,
    AuthModule,
    ArticlesModule,
    QuestionsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard }, // global guard
  ],
})
export class AppModule {}
