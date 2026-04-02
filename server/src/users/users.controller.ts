import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
  getUserTickets(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.listTicketsForUser(id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOnePublic(id);
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
