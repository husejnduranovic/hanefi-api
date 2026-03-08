import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class ReviewArticleDto {
  @IsString()
  @MinLength(20, { message: 'content minimalno 20 znakova' })
  content!: string;

  @IsOptional()
  @IsIn(['bs', 'hr', 'sr', 'en'])
  lang?: 'bs' | 'hr' | 'sr' | 'en';
}
