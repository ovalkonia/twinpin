import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

import { Repository } from 'typeorm';
import { Company } from "./entities/company.entity";


@Injectable()
export class CompaniesService {
  constructor (
    @InjectRepository(Company)
    private companiesRepository: Repository<Company>,
  ) {}

  async createCompany(createCompanyDto: CreateCompanyDto, userId: number) {
    const newCompany = this.companiesRepository.create({ ...createCompanyDto, owner: { id: userId } })
    return await this.companiesRepository.save(newCompany)
  }

  async updateCompany(id: number, updateCompanyDto: UpdateCompanyDto) {
    await this.companiesRepository.update(id, updateCompanyDto)
    return await this.companiesRepository.findOneBy({ id });
  }

  async getCompanies() {
    return await this.companiesRepository.find({ relations: ['owner'] })
  }

  async getCompany(id: number) {
    return await this.companiesRepository.findOne({
      where: { id },
      relations: ['owner'] 
    })
  }

  async removeCompany(id: number) {
    return await this.companiesRepository.delete({ id });
  }
}
