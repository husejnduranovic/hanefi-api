import { Injectable } from '@nestjs/common';
import { CreateQuestionDto } from './dto/CreateQuestionDto';
import { QueryQuestionsDto } from './dto/QueryQuestionsDto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(q: QueryQuestionsDto) {
    const { page = 1, pageSize = 10, status, q: query } = q;

    const where: any = { status: 'PUBLISHED' };

    if (status === 'answered') where.answered = true;
    if (status === 'unanswered') where.answered = false;

    if (query?.trim()) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { body: { contains: query, mode: 'insensitive' } },
        { tags: { some: { name: { contains: query, mode: 'insensitive' } } } },
      ];
    }

    const [total, rows] = await Promise.all([
      this.prisma.question.count({ where }),
      this.prisma.question.findMany({
        where,
        include: { tags: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      items: rows.map((q) => this.toListItem(q)),
      total,
      page,
      pageSize,
      pages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async bySlug(slug: string) {
    const question = await this.prisma.question.findUniqueOrThrow({
      where: { slug },
      include: {
        answers: {
          orderBy: { createdAt: 'asc' },
          include: { author: { select: { id: true, name: true } } },
        },
        tags: {
          include: { tag: true }, // ← go through the join table to the actual tag
        },
      },
    });

    return {
      id: question.id,
      title: question.title,
      slug: question.slug,
      body: question.body,
      answered: question.answered,
      createdAt: question.createdAt.toISOString(),
      tags: question.tags.map((t) => ({
        id: t.tag.id,
        name: t.tag.name,
        slug: t.tag.slug,
      })),
      answers: question.answers.map((a) => ({
        id: a.id,
        body: a.body,
        createdAt: a.createdAt.toISOString(),
        author: a.author ? { name: a.author.name } : null,
      })),
    };
  }

  async create(dto: CreateQuestionDto) {
    // Generate slug from title
    const slug =
      dto.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .slice(0, 80) +
      '-' +
      Date.now();

    const question = await this.prisma.question.create({
      data: {
        title: dto.title,
        slug,
        body: dto.body,
        status: 'PUBLISHED', // or 'DRAFT' if you want admin review first
        answered: false,
      },
    });

    return { id: question.id, slug: question.slug };
  }

  private toListItem(q: any) {
    return {
      id: q.id,
      title: q.title,
      slug: q.slug,
      body: q.body,
      answered: q.answered,
      createdAt: q.createdAt.toISOString(),
      tags: q.tags.map((t: any) => ({ id: t.id, name: t.name, slug: t.slug })),
    };
  }
}
