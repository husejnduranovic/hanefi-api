import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { Public } from 'src/auth/public.decorator';
import { QueryQuestionsDto } from './dto/QueryQuestionsDto';
import { CreateQuestionDto } from './dto/CreateQuestionDto';
// adjust path if needed

@Controller('questions')
export class QuestionsController {
  constructor(private readonly service: QuestionsService) {}

  @Public()
  @Get()
  list(@Query() query: QueryQuestionsDto) {
    return this.service.list(query);
  }

  @Public()
  @Get(':slug')
  bySlug(@Param('slug') slug: string) {
    return this.service.bySlug(slug);
  }

  @Public()
  @Post()
  create(@Body() dto: CreateQuestionDto) {
    return this.service.create(dto);
  }
}
