import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { AiService } from './ai.service';
import { ReviewArticleDto } from './review-article.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  // Stavi/ukloni guard po želji (review obično traži login)
  @UseGuards(JwtAuthGuard)
  @Post('review')
  async review(@Body() dto: ReviewArticleDto) {
    return this.ai.reviewArticle(dto.content, dto.lang ?? 'bs');
  }
}
