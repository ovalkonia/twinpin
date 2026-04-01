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
    UploadedFiles,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

const uploadFields = FileFieldsInterceptor(
    [{ name: 'logo', maxCount: 1 }, { name: 'cover', maxCount: 1 }],
    { storage: memoryStorage() },
);

@Controller('companies')
export class CompaniesController {
    constructor(
        private readonly companiesService: CompaniesService,
        private readonly cloudinaryService: CloudinaryService,
    ) {}

    @Post()
    @UseGuards(AuthGuard('jwt'))
    @UseInterceptors(uploadFields)
    async create(
        @Req() req: any,
        @Body() dto: CreateCompanyDto,
        @UploadedFiles() files: { logo?: Express.Multer.File[]; cover?: Express.Multer.File[] },
    ) {
        const logoUrl = files?.logo?.[0]
            ? await this.cloudinaryService.upload(files.logo[0], 'companies')
            : undefined;
        const coverUrl = files?.cover?.[0]
            ? await this.cloudinaryService.upload(files.cover[0], 'companies')
            : undefined;

        return this.companiesService.create(req.user.id, dto, logoUrl, coverUrl);
    }

    @Get('my')
    @UseGuards(AuthGuard('jwt'))
    findMy(@Req() req: any) {
        return this.companiesService.findMy(req.user.id);
    }

    @Get(':slug')
    findBySlug(@Param('slug') slug: string) {
        return this.companiesService.findBySlug(slug);
    }

    @Patch(':id')
    @UseGuards(AuthGuard('jwt'))
    @UseInterceptors(uploadFields)
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Req() req: any,
        @Body() dto: UpdateCompanyDto,
        @UploadedFiles() files: { logo?: Express.Multer.File[]; cover?: Express.Multer.File[] },
    ) {
        const logoUrl = files?.logo?.[0]
            ? await this.cloudinaryService.upload(files.logo[0], 'companies')
            : undefined;
        const coverUrl = files?.cover?.[0]
            ? await this.cloudinaryService.upload(files.cover[0], 'companies')
            : undefined;

        return this.companiesService.update(id, req.user.id, dto, logoUrl, coverUrl);
    }

    @Get(':companyId/members')
    @UseGuards(AuthGuard('jwt'))
    getMembers(@Param('companyId', ParseIntPipe) companyId: number) {
        return this.companiesService.getMembers(companyId);
    }

    @Post(':companyId/members')
    @UseGuards(AuthGuard('jwt'))
    addMember(
        @Param('companyId', ParseIntPipe) companyId: number,
        @Req() req: any,
        @Body('email') email: string,
    ) {
        return this.companiesService.addMember(companyId, email, req.user.id);
    }

    @Delete(':companyId/members/:memberId')
    @UseGuards(AuthGuard('jwt'))
    removeMember(
        @Param('companyId', ParseIntPipe) companyId: number,
        @Param('memberId', ParseIntPipe) memberId: number,
        @Req() req: any,
    ) {
        return this.companiesService.removeMember(companyId, memberId, req.user.id);
    }
}