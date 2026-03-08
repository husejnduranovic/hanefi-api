import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';

const emptyToUndefined = ({ value }: { value: any }) =>
  value === '' || value === null ? undefined : value;

export class CreateArticleDto {
  @IsString()
  @MinLength(3)
  title!: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  slug?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  excerpt?: string;

  @IsString()
  @MinLength(20)
  content!: string;

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

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  status?: 'DRAFT' | 'PUBLISHED';

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  imageUrl?: string;
}
