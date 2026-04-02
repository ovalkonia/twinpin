import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../events/entities/event.entity';
import { User } from '../users/entities/user.entity';
import { AddEventCommentDto } from '../events/dto/add-event-comment.dto';
import { EventCommentResponseDto } from '../events/dto/api-response.dto';
import { EventStatus } from '../events/enums/event-status.enum';
import { EventComment } from './entities/event-comment.entity';

const EVENT_RELATIONS = ['company', 'company.owner'] as const;

@Injectable()
export class EventCommentsService {
  constructor(
    @InjectRepository(EventComment)
    private readonly commentRepo: Repository<EventComment>,
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
  ) {}

  private now(): Date {
    return new Date();
  }

  private isPubliclyVisible(event: Event, at: Date): boolean {
    if (event.status !== EventStatus.PUBLISHED) return false;
    if (event.publishAt && event.publishAt > at) return false;
    return true;
  }

  private async assertEventReadable(
    eventId: string,
    viewer: User | null | undefined,
  ): Promise<Event> {
    const event = await this.eventRepo.findOne({
      where: { id: eventId },
      relations: [...EVENT_RELATIONS],
    });
    if (!event) throw new NotFoundException('Event not found');
    const isOwner =
      viewer != null && event.company.owner.id === viewer.id;
    if (!this.isPubliclyVisible(event, this.now()) && !isOwner) {
      throw new NotFoundException('Event not found');
    }
    return event;
  }

  async listComments(
    eventId: string,
    viewer?: User | null,
  ): Promise<EventCommentResponseDto[]> {
    await this.assertEventReadable(eventId, viewer);

    const rows = await this.commentRepo.find({
      where: { event: { id: eventId } },
      relations: ['author'],
      order: { createdAt: 'ASC' },
    });

    return rows.map((c) => ({
      id: c.id,
      authorId: String(c.author.id),
      authorName: c.author.name?.trim() || 'Member',
      authorAvatarUrl: c.author.avatarUrl ?? undefined,
      body: c.body,
      createdAt: c.createdAt.toISOString(),
    }));
  }

  async addComment(
    eventId: string,
    userId: number,
    dto: AddEventCommentDto,
  ): Promise<EventCommentResponseDto> {
    await this.assertEventReadable(eventId, { id: userId } as User);

    const row = this.commentRepo.create({
      event: { id: eventId } as Event,
      author: { id: userId } as User,
      body: dto.body,
    });
    const saved = await this.commentRepo.save(row);
    const full = await this.commentRepo.findOneOrFail({
      where: { id: saved.id },
      relations: ['author'],
    });
    return {
      id: full.id,
      authorId: String(full.author.id),
      authorName: full.author.name?.trim() || 'Member',
      authorAvatarUrl: full.author.avatarUrl ?? undefined,
      body: full.body,
      createdAt: full.createdAt.toISOString(),
    };
  }

  async deleteComment(
    eventId: string,
    commentId: string,
    userId: number,
  ): Promise<void> {
    const comment = await this.commentRepo.findOne({
      where: { id: commentId, event: { id: eventId } },
      relations: ['author', 'event', 'event.company', 'event.company.owner'],
    });
    if (!comment) throw new NotFoundException('Comment not found');

    const isAuthor = comment.author.id === userId;
    const isOrganizer = comment.event.company.owner.id === userId;
    if (!isAuthor && !isOrganizer) {
      throw new ForbiddenException('Cannot delete this comment');
    }

    await this.commentRepo.remove(comment);
  }
}
