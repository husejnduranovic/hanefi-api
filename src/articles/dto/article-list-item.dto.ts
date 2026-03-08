export class ArticleListItemDto {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string; // category.name for the UI
  readTime: number;
  imageUrl?: string;
  createdAt: string; // ISO
  viewCount: number;
  status?: string;
  publishedAt?: string;
}
