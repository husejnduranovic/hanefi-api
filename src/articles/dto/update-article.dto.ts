import { PartialType } from '@nestjs/mapped-types';
import { CreateArticleDto } from './create-article.dto';
import { Transform, Type } from 'class-transformer';
import { IsOptional, IsString, IsUUID, IsInt, Min } from 'class-validator';

const emptyToUndefined = ({ value }: { value: any }) =>
  value === '' || value === null ? undefined : value;

export class UpdateArticleDto extends PartialType(CreateArticleDto) {
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  slug?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  categoryName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readTime?: number;
}
