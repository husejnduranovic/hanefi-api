import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import slugify from 'slugify';

@Injectable()
export class StorageService {
  private readonly supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
  private readonly bucket = process.env.SUPABASE_BUCKET ?? 'articles';

  async uploadArticleImage(file: Express.Multer.File, articleId: string) {
    const safe = slugify(file.originalname, { lower: true, strict: true });
    const path = `${articleId}/${Date.now()}-${safe}`;
    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(path, file.buffer, { contentType: file.mimetype, upsert: true });
    if (error) throw error;
    const { data } = this.supabase.storage.from(this.bucket).getPublicUrl(path);
    return { path, publicUrl: data.publicUrl };
  }

  async deleteArticleImage(path?: string | null) {
    if (!path) return;
    await this.supabase.storage.from(this.bucket).remove([path]);
  }
}
