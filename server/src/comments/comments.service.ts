import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
  ) {}

  async create(eventId: number, userId: number, text: string) {
    const comment = this.commentsRepository.create({
      text,
      user: { id: userId },
      event: { id: eventId },
    });
    
    return await this.commentsRepository.save(comment);
  }

  async findByEvent(eventId: number) {
    return await this.commentsRepository.find({
      where: { event: { id: eventId } },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number) {
    return await this.commentsRepository.findOne({
      where: { id },
      relations: ['user', 'event'],
    });
  }

  async update(id: number, text: string, userId: number) {
    const comment = await this.findOne(id);
    if (!comment) return { error: 'Comment not found' };
    if (comment.userId !== userId) return { error: 'You can only edit your own comments' };

    comment.text = text;
    return await this.commentsRepository.save(comment);
  }

  async remove(id: number, userId: number) {
    const comment = await this.findOne(id);
    if (!comment) return { error: 'Comment not found' };
    if (comment.userId !== userId) return { error: 'You can only delete your own comments' };

    return await this.commentsRepository.delete(id);
  }
}