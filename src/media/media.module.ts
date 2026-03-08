import { Module } from '@nestjs/common';
import { SupabaseStorageService } from './supabase-storage.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [SupabaseStorageService],
  exports: [SupabaseStorageService],
})
export class MediaModule {}
