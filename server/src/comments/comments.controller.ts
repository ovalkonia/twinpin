import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('events/:id/comments')
  @UseGuards(JwtAuthGuard)
  async create(
    @Param('id') id: string,
    @Body('text') text: string,
    @CurrentUser() user,
  ) {
    if (!text) return { error: 'Text is required' };
    return await this.commentsService.create(+id, user.id, text);
  }

  @Get('events/:id/comments')
  async findByEvent(@Param('id') id: string) {
    return await this.commentsService.findByEvent(+id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.commentsService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body('text') text: string,
    @CurrentUser() user,
  ) {
    if (!text) return { error: 'Text is required' };
    return await this.commentsService.update(+id, text, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user,
  ) {
    return await this.commentsService.remove(+id, user.id);
  }
}