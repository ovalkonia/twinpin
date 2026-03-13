import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import * as bcrypt from 'bcryptjs';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}


  async create(createUserDto: CreateUserDto) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);
    
    const newUser = this.usersRepository.create({
      email: createUserDto.email,
      passwordHash: hashedPassword, 
      fullName: createUserDto.fullName,
      role: createUserDto.role || 'user',
      isVisibleInVisitorList: createUserDto.isVisibleInVisitorList ?? true,
    });
    
    return await this.usersRepository.save(newUser);
  }

  async findAll() {
    return await this.usersRepository.find({select:{
      fullName: true,
      email: true,
      role: true,
    },
  })
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOneBy({ email });
  }

  async findOne(id: number) {
    return await this.usersRepository.findOneBy({ id })
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    await this.usersRepository.update(id, updateUserDto);
    
    return await this.usersRepository.findOneBy({ id })
  }

  async remove(id: number) {
    return await this.usersRepository.delete({ id })
  }
}
