import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Req,
    UploadedFiles,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { AuthGuard } from '@nestjs/passport';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiNoContentResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiProperty,
    ApiPropertyOptional,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CompaniesService } from './companies.service';
import { CompanyFollowsService } from '../company-follows/company-follows.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

const uploadFields = FileFieldsInterceptor(
    [{ name: 'logo', maxCount: 1 }, { name: 'cover', maxCount: 1 }],
    { storage: memoryStorage() },
);

class CompanyResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 'Acme Events' })
    name: string;

    @ApiProperty({ example: 'acme-events' })
    slug: string;

    @ApiProperty({ example: 'We organise tech conferences.' })
    description: string;

    @ApiPropertyOptional({ example: ['tech', 'music'] })
    categories?: string[];

    @ApiPropertyOptional({ example: 'https://res.cloudinary.com/…' })
    logoUrl?: string;

    @ApiPropertyOptional({ example: 'https://res.cloudinary.com/…' })
    coverUrl?: string;

    @ApiPropertyOptional({ example: 'https://acme.io' })
    website?: string;

    @ApiPropertyOptional({ example: 'info@acme.io' })
    email?: string;

    @ApiPropertyOptional()
    address?: string;

    @ApiPropertyOptional()
    linkedin?: string;

    @ApiPropertyOptional()
    instagram?: string;

    @ApiPropertyOptional()
    tiktok?: string;

    @ApiPropertyOptional()
    telegram?: string;
}

class CompanyMemberDto {
    @ApiProperty({ example: 2 })
    id: number;

    @ApiProperty({ example: 'Bob Jones' })
    name: string;

    @ApiProperty({ example: 'bob@example.com' })
    email: string;

    @ApiPropertyOptional()
    avatarUrl?: string;
}

class FollowStatusDto {
    @ApiProperty({ example: false })
    following: boolean;
}

@ApiTags('companies')
@Controller('companies')
export class CompaniesController {
    constructor(
        private readonly companiesService: CompaniesService,
        private readonly cloudinaryService: CloudinaryService,
        private readonly companyFollows: CompanyFollowsService,
    ) {}

    @Post()
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth('bearer')
    @UseInterceptors(uploadFields)
    @ApiOperation({ summary: 'Create a new company (organizer profile)' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'Company fields plus optional `logo` and `cover` image files.',
        schema: {
            type: 'object',
            required: ['name', 'slug', 'description'],
            properties: {
                name:        { type: 'string', example: 'Acme Events' },
                slug:        { type: 'string', example: 'acme-events' },
                description: { type: 'string', example: 'We organise tech conferences.' },
                categories:  { type: 'array', items: { type: 'string' }, example: ['tech'] },
                website:     { type: 'string', example: 'https://acme.io' },
                email:       { type: 'string', example: 'info@acme.io' },
                address:     { type: 'string' },
                linkedin:    { type: 'string' },
                instagram:   { type: 'string' },
                tiktok:      { type: 'string' },
                telegram:    { type: 'string' },
                logo:        { type: 'string', format: 'binary', description: 'Company logo image' },
                cover:       { type: 'string', format: 'binary', description: 'Company cover/banner image' },
            },
        },
    })
    @ApiOkResponse({ type: CompanyResponseDto })
    @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
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
    @ApiBearerAuth('bearer')
    @ApiOperation({ summary: 'Get the company owned by the current user' })
    @ApiOkResponse({ type: CompanyResponseDto })
    @ApiNotFoundResponse({ description: 'Current user has no company' })
    @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
    findMy(@Req() req: any) {
        return this.companiesService.findMy(req.user.id);
    }

    @Get(':slug')
    @ApiOperation({ summary: 'Get a company by its URL slug' })
    @ApiParam({ name: 'slug', description: 'Company slug', example: 'acme-events' })
    @ApiOkResponse({ type: CompanyResponseDto })
    @ApiNotFoundResponse({ description: 'Company not found' })
    findBySlug(@Param('slug') slug: string) {
        return this.companiesService.findBySlug(slug);
    }

    @Patch(':id')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth('bearer')
    @UseInterceptors(uploadFields)
    @ApiOperation({ summary: 'Update company details and/or images (owner only)' })
    @ApiParam({ name: 'id', description: 'Company ID', example: 1 })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'Partial company fields; only sent keys are updated. Images are replaced when provided.',
        schema: {
            type: 'object',
            properties: {
                name:        { type: 'string' },
                slug:        { type: 'string' },
                description: { type: 'string' },
                categories:  { type: 'array', items: { type: 'string' } },
                website:     { type: 'string' },
                email:       { type: 'string' },
                address:     { type: 'string' },
                linkedin:    { type: 'string' },
                instagram:   { type: 'string' },
                tiktok:      { type: 'string' },
                telegram:    { type: 'string' },
                logo:        { type: 'string', format: 'binary' },
                cover:       { type: 'string', format: 'binary' },
            },
        },
    })
    @ApiOkResponse({ type: CompanyResponseDto })
    @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
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
    @ApiBearerAuth('bearer')
    @ApiOperation({ summary: 'List members of a company (owner only)' })
    @ApiParam({ name: 'companyId', description: 'Company ID', example: 1 })
    @ApiOkResponse({ type: [CompanyMemberDto] })
    @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
    getMembers(@Param('companyId', ParseIntPipe) companyId: number) {
        return this.companiesService.getMembers(companyId);
    }

    @Post(':companyId/members')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth('bearer')
    @ApiOperation({ summary: 'Add a member to a company by email (owner only)' })
    @ApiParam({ name: 'companyId', description: 'Company ID', example: 1 })
    @ApiBody({
        schema: {
            type: 'object',
            required: ['email'],
            properties: { email: { type: 'string', example: 'bob@example.com' } },
        },
    })
    @ApiOkResponse({ type: CompanyMemberDto })
    @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
    addMember(
        @Param('companyId', ParseIntPipe) companyId: number,
        @Req() req: any,
        @Body('email') email: string,
    ) {
        return this.companiesService.addMember(companyId, email, req.user.id);
    }

    @Delete(':companyId/members/:memberId')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth('bearer')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Remove a member from a company (owner only)' })
    @ApiParam({ name: 'companyId', description: 'Company ID', example: 1 })
    @ApiParam({ name: 'memberId', description: 'User ID of the member to remove', example: 2 })
    @ApiNoContentResponse({ description: 'Member removed' })
    @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
    removeMember(
        @Param('companyId', ParseIntPipe) companyId: number,
        @Param('memberId', ParseIntPipe) memberId: number,
        @Req() req: any,
    ) {
        return this.companiesService.removeMember(companyId, memberId, req.user.id);
    }

    @Post(':id/follow')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth('bearer')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({
        summary: 'Follow a company',
        description: 'The current user will receive notifications when this company publishes a new event.',
    })
    @ApiParam({ name: 'id', description: 'Company ID', example: 1 })
    @ApiNoContentResponse({ description: 'Now following' })
    @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
    followCompany(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: User,
    ): Promise<void> {
        return this.companyFollows.follow(user.id, id);
    }

    @Delete(':id/follow')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth('bearer')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Unfollow a company' })
    @ApiParam({ name: 'id', description: 'Company ID', example: 1 })
    @ApiNoContentResponse({ description: 'Unfollowed' })
    @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
    unfollowCompany(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: User,
    ): Promise<void> {
        return this.companyFollows.unfollow(user.id, id);
    }

    @Get(':id/follow')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth('bearer')
    @ApiOperation({ summary: 'Check if the current user follows a company' })
    @ApiParam({ name: 'id', description: 'Company ID', example: 1 })
    @ApiOkResponse({ type: FollowStatusDto })
    @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
    async isFollowing(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: User,
    ): Promise<{ following: boolean }> {
        const following = await this.companyFollows.isFollowing(user.id, id);
        return { following };
    }
}