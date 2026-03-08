import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { QueryArticlesDto } from './dto/query-articles.dto';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { Public } from 'src/auth/public.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';

const uploadImageInterceptor = FileInterceptor('image', {
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const ok = /image\/(png|jpe?g|webp)/i.test(file.mimetype);
    if (!ok) return cb(new Error('Only PNG/JPEG/WEBP allowed'), false);
    cb(null, true);
  },
});

@Controller('articles')
export class ArticlesController {
  constructor(private readonly service: ArticlesService) {}

  // ----- PUBLIC READS -----
  @Public()
  @Get()
  list(@Query() query: QueryArticlesDto) {
    return this.service.list(query);
  }

  @Public()
  @Get('categories/all') // Note: put BEFORE ':slug' route to avoid conflict
  categories() {
    return this.service.getCategories();
  }

  @Public()
  @Get(':slug')
  bySlug(@Param('slug') slug: string) {
    return this.service.bySlug(slug);
  }

  // ----- PROTECTED WRITES -----
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  @Post()
  @UseInterceptors(uploadImageInterceptor)
  create(
    @Body() dto: CreateArticleDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.service.create(dto, file);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  @Patch(':id')
  @UseInterceptors(uploadImageInterceptor)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateArticleDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.service.update(id, dto, file);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
