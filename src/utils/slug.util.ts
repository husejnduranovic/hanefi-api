import slugify from 'slugify';
import { PrismaClient } from '@prisma/client';

export async function uniqueSlug(
  prisma: PrismaClient,
  title: string,
): Promise<string> {
  const base =
    slugify(title, { lower: true, strict: true }) || Date.now().toString();
  let slug = base;
  let i = 2;
  while (await prisma.article.findUnique({ where: { slug } })) {
    slug = `${base}-${i++}`;
  }
  return slug;
}
