import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  BadRequestException,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

const uploadFields = FileFieldsInterceptor(
  [{ name: 'avatar', maxCount: 1 }],
  { storage: memoryStorage() },
);

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getMe(@Req() req: { user: User }) {
    return this.usersService.toPublicUser(req.user);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id/events')
  @UseGuards(AuthGuard('jwt'))
  getUserEvents(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.listEventsForUser(id);
  }

  @Get(':id/tickets')
  @UseGuards(AuthGuard('jwt'))
  getUserTickets(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() requester: User,
  ) {
    return this.usersService.listTicketsForUser(id, requester.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOnePublic(id);
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Patch('me/tickets/:eventId')
  @UseGuards(AuthGuard('jwt'))
  async updateTicketVisibility(
    @Param('eventId', new ParseUUIDPipe({ version: '4' })) eventId: string,
    @CurrentUser() user: User,
    @Body() body: { hidden: boolean },
  ): Promise<void> {
    await this.usersService.setTicketHidden(user.id, eventId, body.hidden);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(':id/avatar')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(uploadFields)
  async updateAvatar(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
    @UploadedFiles() files: { avatar?: Express.Multer.File[] },
  ) {
    if (user.id !== id) {
      throw new ForbiddenException('You can only update your own avatar');
    }
    const file = files?.avatar?.[0];
    if (!file) {
      throw new BadRequestException('avatar file is required');
    }

    const avatarUrl = await this.cloudinary.upload(file, 'users/avatars');
    const updated = await this.usersService.updateAvatar(id, avatarUrl);
    return this.usersService.toPublicUser(updated);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
