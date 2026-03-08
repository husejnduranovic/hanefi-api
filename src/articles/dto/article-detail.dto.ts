export class ArticleDetailDto {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  category: string;
  readTime: number;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
}
