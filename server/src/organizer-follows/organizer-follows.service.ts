import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { OrganizerFollow } from './entities/organizer-follow.entity';

@Injectable()
export class OrganizerFollowsService {
  constructor(
    @InjectRepository(OrganizerFollow)
    private readonly followRepo: Repository<OrganizerFollow>,
  ) {}

  async follow(followerId: number, organizerUserId: number): Promise<void> {
    if (followerId === organizerUserId) {
      throw new BadRequestException('Cannot follow yourself');
    }
    const exists = await this.followRepo.exist({
      where: {
        follower: { id: followerId },
        organizer: { id: organizerUserId },
      },
    });
    if (exists) return;
    await this.followRepo.save(
      this.followRepo.create({
        follower: { id: followerId } as User,
        organizer: { id: organizerUserId } as User,
      }),
    );
  }

  async unfollow(followerId: number, organizerUserId: number): Promise<void> {
    await this.followRepo.delete({
      follower: { id: followerId },
      organizer: { id: organizerUserId },
    });
  }
}
