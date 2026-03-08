import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ArticleDetailDto } from './dto/article-detail.dto';
import { randomUUID } from 'crypto';
import { PrismaService } from 'prisma/prisma.service';
import { SupabaseStorageService } from 'src/media/supabase-storage.service';
import { QueryArticlesDto } from './dto/query-articles.dto';
import { ArticleListItemDto } from './dto/article-list-item.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ArticlesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: SupabaseStorageService,
  ) {}

  // ... keep your existing list() and bySlug() here ...

  private toListItem(
    a: Prisma.ArticleGetPayload<{ include: { category: true } }>,
  ): ArticleListItemDto {
    return {
      id: a.id,
      title: a.title,
      slug: a.slug,
      excerpt: a.excerpt ?? '',
      category: a.category.name, // now TypeScript knows this is valid
      readTime: a.readTime,
      imageUrl: a.imageUrl ?? undefined,
      createdAt: a.createdAt.toISOString(),
      viewCount: a.viewCount,
      status: a.status,
      publishedAt: a.publishedAt?.toISOString(),
    };
  }

  private toDetail(a: any): ArticleDetailDto {
    return {
      id: a.id,
      title: a.title,
      slug: a.slug,
      excerpt: a.excerpt ?? null,
      content: a.content,
      category: a.category.name,
      readTime: a.readTime,
      imageUrl: a.imageUrl ?? null,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
      viewCount: a.viewCount,
    };
  }

  async getCategories() {
    return this.prisma.category.findMany({
      select: { id: true, name: true, slug: true },
    });
  }

  async list(q: QueryArticlesDto) {
    const { page = 1, pageSize = 9, sort = 'latest', category, q: query } = q;

    const where: Prisma.ArticleWhereInput = { status: 'PUBLISHED' };

    // Search across title, excerpt, content, category name
    if (query?.trim()) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { excerpt: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } },
        { category: { name: { contains: query, mode: 'insensitive' } } },
      ];
    }

    // Category filter — combine with AND so it works alongside search
    if (category) {
      where.AND = [
        { category: { name: { equals: category, mode: 'insensitive' } } },
      ];
    }

    const orderBy =
      sort === 'popular'
        ? [{ viewCount: 'desc' as const }, { createdAt: 'desc' as const }]
        : [{ publishedAt: 'desc' as const }, { createdAt: 'desc' as const }];

    const [total, rows] = await Promise.all([
      this.prisma.article.count({ where }),
      this.prisma.article.findMany({
        where,
        include: { category: true },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      items: rows.map((a) => this.toListItem(a)),
      total,
      page,
      pageSize,
      pages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async bySlug(slug: string): Promise<ArticleDetailDto> {
    const a = await this.prisma.article.findUnique({
      where: { slug },
      include: { category: true },
    });
    if (!a || a.status !== 'PUBLISHED')
      throw new NotFoundException('Article not found');
    return this.toDetail(a);
  }

  private slugify(s: string) {
    return s
      .toLowerCase()
      .trim()
      .replace(/[\s_]+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/--+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private async ensureUniqueSlug(base: string) {
    let slug = this.slugify(base) || randomUUID().slice(0, 8);
    let n = 0;
    while (true) {
      const exists = await this.prisma.article.findUnique({ where: { slug } });
      if (!exists) return slug;
      n += 1;
      slug = `${this.slugify(base)}-${n}`;
    }
  }

  private async resolveCategoryId(dto: {
    categoryId?: string;
    categoryName?: string;
  }) {
    if (dto.categoryId) return dto.categoryId;
    if (dto.categoryName) {
      const cat = await this.prisma.category.findFirst({
        where: { name: dto.categoryName },
      });
      if (!cat) throw new BadRequestException('Unknown categoryName');
      return cat.id;
    }
    throw new BadRequestException('categoryId or categoryName is required');
  }

  async create(
    dto: CreateArticleDto,
    file?: Express.Multer.File,
  ): Promise<ArticleDetailDto> {
    const categoryId = await this.resolveCategoryId(dto);
    const slug = dto.slug
      ? await this.ensureUniqueSlug(dto.slug)
      : await this.ensureUniqueSlug(dto.title);

    // Decide imageUrl
    let imageUrl: string | null = dto.imageUrl ?? null;
    let imagePath: string | null = null;

    if (!imageUrl && file) {
      const up = await this.storage.uploadArticleImage(slug, {
        buffer: file.buffer,
        mimetype: file.mimetype,
      });
      imageUrl = up.publicUrl;
      imagePath = up.path;
    }

    const a = await this.prisma.article.create({
      data: {
        title: dto.title,
        slug,
        excerpt: dto.excerpt ?? null,
        content: dto.content,
        readTime: dto.readTime ?? 5,
        status: (dto.status as any) ?? 'DRAFT',
        categoryId,
        imageUrl,
        imagePath,
        publishedAt: dto.status === 'PUBLISHED' ? new Date() : null,
      },
      include: { category: true },
    });

    return {
      id: a.id,
      title: a.title,
      slug: a.slug,
      excerpt: a.excerpt,
      content: a.content,
      category: a.category.name,
      readTime: a.readTime,
      imageUrl: a.imageUrl,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
      viewCount: a.viewCount,
    };
  }

  async update(
    id: string,
    dto: UpdateArticleDto,
    file?: Express.Multer.File,
  ): Promise<ArticleDetailDto> {
    const existing = await this.prisma.article.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!existing) throw new NotFoundException('Article not found');

    // compute new slug if provided
    let slug = existing.slug;
    if (typeof dto.slug === 'string' && dto.slug.trim()) {
      slug = await this.ensureUniqueSlug(dto.slug);
    } else if (
      typeof dto.title === 'string' &&
      dto.title.trim() &&
      dto.title !== existing.title
    ) {
      // optional: re-slug on title change? Only if you want it
      // slug = await this.ensureUniqueSlug(dto.title);
    }

    // compute category
    let categoryId = existing.categoryId;
    if (dto.categoryId || dto.categoryName) {
      categoryId = await this.resolveCategoryId(dto);
    }

    // image handling
    let imageUrl = existing.imageUrl ?? null;
    let imagePath = existing.imagePath ?? null;

    if (file) {
      const up = await this.storage.uploadArticleImage(slug, {
        buffer: file.buffer,
        mimetype: file.mimetype,
      });
      imageUrl = up.publicUrl;
      imagePath = up.path;
    } else if (dto.imageUrl) {
      imageUrl = dto.imageUrl;
    }

    const next = await this.prisma.article.update({
      where: { id },
      data: {
        title: dto.title ?? existing.title,
        slug,
        excerpt: dto.excerpt ?? existing.excerpt,
        content: dto.content ?? existing.content,
        readTime: dto.readTime ?? existing.readTime,
        status: (dto.status as any) ?? existing.status,
        categoryId,
        imageUrl,
        imagePath,
        publishedAt:
          dto.status === 'PUBLISHED' && !existing.publishedAt
            ? new Date()
            : dto.status === 'DRAFT'
              ? null
              : existing.publishedAt,
      },
      include: { category: true },
    });

    return {
      id: next.id,
      title: next.title,
      slug: next.slug,
      excerpt: next.excerpt,
      content: next.content,
      category: next.category.name,
      readTime: next.readTime,
      imageUrl: next.imageUrl,
      createdAt: next.createdAt.toISOString(),
      updatedAt: next.updatedAt.toISOString(),
      viewCount: next.viewCount,
    };
  }

  async remove(id: string) {
    const existing = await this.prisma.article.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Article not found');

    // optional: delete stored image
    if (existing.imagePath) {
      try {
        await this.storage.deletePath(existing.imagePath);
      } catch {
        /* ignore */
      }
    }
    await this.prisma.article.delete({ where: { id } });
    return { ok: true };
  }
}
