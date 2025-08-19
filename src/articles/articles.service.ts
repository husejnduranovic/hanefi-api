import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { Prisma, Status } from '@prisma/client';
import { uniqueSlug } from '../utils/slug.util';
import { StorageService } from '../storage/storage.service';
import { PrismaService } from 'prisma/prisma.service';
import { ListArticlesDto } from './dto/list-articles.dto';

type JwtUser = { sub?: string; email?: string; name?: string; role?: string };

@Injectable()
export class ArticlesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async create(
    dto: CreateArticleDto,
    image?: Express.Multer.File,
    currentUser?: JwtUser,
  ) {
    // 1) obavezno imamo user id iz tokena
    const authorId = currentUser?.sub;
    if (!authorId) {
      throw new ForbiddenException('Nedostaje korisnik (JWT sub).');
    }

    const slug = await uniqueSlug(this.prisma, dto.title);
    const status = dto.status ?? Status.DRAFT;
    const publishedAt = status === Status.PUBLISHED ? new Date() : null;

    // 2) kreiraj i POVEŽI autora (bolje od ručnog authorId)
    const article = await this.prisma.article.create({
      data: {
        title: dto.title,
        subtitle: dto.subtitle,
        excerpt: dto.excerpt,
        content: dto.content,
        category: dto.category,
        slug,
        status,
        publishedAt,
        author: { connect: { id: authorId } }, // <— KLJUČNO
      },
      include: { author: { select: { id: true, name: true, email: true } } },
    });

    if (!image) return article;

    const { path, publicUrl } = await this.storage.uploadArticleImage(
      image,
      article.id,
    );
    return this.prisma.article.update({
      where: { id: article.id },
      data: { imagePath: path, imageUrl: publicUrl },
      include: { author: { select: { id: true, name: true, email: true } } },
    });
  }

  async findAll(qs: ListArticlesDto) {
    const page = Math.max(1, Number(qs.page ?? 1));
    const limit = Math.min(50, Math.max(1, Number(qs.limit ?? 10)));

    const where: Prisma.ArticleWhereInput = {};

    if (qs.q) {
      const q = qs.q;
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { subtitle: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (qs.category) where.category = qs.category;

    const total = await this.prisma.article.count({ where });

    const items = await this.prisma.article.findMany({
      where,
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }], // <— inline
      skip: (page - 1) * limit, // <— nema kolizije
      take: limit, // <— nema kolizije
      include: { author: { select: { id: true, name: true, email: true } } },
    });

    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: { author: { select: { id: true, name: true, email: true } } }, // ⬅️ bitno
    });
    if (!article) throw new NotFoundException('Article not found');
    return article;
  }

  async update(id: string, dto: UpdateArticleDto, image?: Express.Multer.File) {
    const existing = await this.prisma.article.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Article not found');

    let slug = existing.slug;
    if (dto.title && dto.title !== existing.title) {
      slug = await uniqueSlug(this.prisma, dto.title);
    }

    let publishedAt = existing.publishedAt;
    if (dto.status === Status.PUBLISHED && !existing.publishedAt) {
      publishedAt = new Date();
    }

    // 1) update text fields
    const updated = await this.prisma.article.update({
      where: { id },
      data: {
        title: dto.title ?? existing.title,
        subtitle: dto.subtitle ?? existing.subtitle,
        excerpt: dto.excerpt ?? existing.excerpt,
        content: dto.content ?? existing.content,
        category: dto.category ?? existing.category,
        status: dto.status ?? existing.status,
        slug,
        publishedAt,
      },
    });

    // 2) optional image replacement (upload new, delete old, then save)
    if (!image) return updated;

    const { path, publicUrl } = await this.storage.uploadArticleImage(
      image,
      updated.id,
    );
    await this.storage.deleteArticleImage(existing.imagePath);
    return this.prisma.article.update({
      where: { id },
      data: { imagePath: path, imageUrl: publicUrl },
    });
  }
}
