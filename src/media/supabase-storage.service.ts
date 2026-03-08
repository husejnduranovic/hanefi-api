import { BadRequestException, Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SupabaseStorageService {
  private sb: SupabaseClient;
  private bucket: string;

  constructor(private readonly cfg: ConfigService) {
    const url = this.cfg.get<string>('SUPABASE_URL');
    const key = this.cfg.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    this.bucket = this.cfg.get<string>('SUPABASE_BUCKET') || 'articles';

    if (!url) throw new Error('SUPABASE_URL is required');
    if (!key)
      throw new Error(
        'SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) is required',
      );

    this.sb = createClient(url, key, {
      auth: { persistSession: false },
    });
  }

  async uploadArticleImage(
    slug: string,
    file: { buffer: Buffer; mimetype: string },
  ) {
    const ext = file.mimetype.includes('png')
      ? 'png'
      : file.mimetype.includes('webp')
        ? 'webp'
        : 'jpg';
    const path = `articles/${slug}-${Date.now()}.${ext}`;

    const { error } = await this.sb.storage
      .from(this.bucket)
      .upload(path, file.buffer, {
        cacheControl: '31536000',
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) throw new BadRequestException('Upload failed: ' + error.message);

    const { data } = this.sb.storage.from(this.bucket).getPublicUrl(path);
    return { path, publicUrl: data.publicUrl };
  }

  async deletePath(path: string) {
    const { error } = await this.sb.storage.from(this.bucket).remove([path]);
    if (error) throw new BadRequestException('Delete failed: ' + error.message);
  }
}
