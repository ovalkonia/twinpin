import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator'

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createCompany(
    @Body() createCompanyDto: CreateCompanyDto,
    @CurrentUser() user,
  ) {
    return await this.companiesService.createCompany(createCompanyDto, user.id)
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateCompany(
    @Param('id') id: string, 
    @Body() updateCompanyDto: UpdateCompanyDto,
    @CurrentUser() user,
  ) {
    const company = await this.companiesService.getCompany(+id);

    if (!company) return { error: 'Company not found' }

    if (company.ownerId !== user.id) return { error: 'You can only edit your own companies' }

    return this.companiesService.updateCompany(+id, updateCompanyDto)
  }

  @Get()
  async getCompanies() {
    return await this.companiesService.getCompanies()
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getCompany(@Param('id') id: string) {
    const company = await this.companiesService.getCompany(+id);
    if (!company) return { error: 'Company not found' }

    return company
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async removeCompany(
    @Param('id') id: string,
    @CurrentUser() user,
  ) {
    const company = await this.companiesService.getCompany(+id)
    if (!company) return { error: 'Company not found' }

    if (company.ownerId !== user.id) return { error: 'You can only remove your own companies' }

    const result = await this.companiesService.removeCompany(+id)
    return { message: 'Company deleted successfully', result }
  }
}
