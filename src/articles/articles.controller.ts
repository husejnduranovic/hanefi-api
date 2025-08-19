// src/articles/articles.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ListArticlesDto } from './dto/list-articles.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly service: ArticlesService) {}

  // Create (multipart; file field name = "image")
  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Body() dto: CreateArticleDto,
    @UploadedFile() image?: Express.Multer.File,
    @Req() req?: any,
  ) {
    return this.service.create(dto, image, req?.user);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  // List (public)
  @Get()
  list(@Query() qs: ListArticlesDto) {
    return this.service.findAll(qs);
  }
  // Get by id (public)
  @Get(':id')
  get(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findOne(id);
  }

  // Update (multipart; optional new image)
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateArticleDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.service.update(id, dto, image);
  }
}
