import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('assets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post()
  @Roles(Role.IT_ADMIN, Role.ADMIN)
  create(@Body() dto: CreateAssetDto) {
    return this.assetsService.create(dto);
  }

  // Must come before :id
  @Get('mine')
  findMine(@Req() req: any) {
    return this.assetsService.findByUser(req.user.userId);
  }

  @Get()
  @Roles(Role.IT_ADMIN, Role.IT_SUPPORT, Role.ADMIN)
  findAll() {
    return this.assetsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.assetsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.IT_ADMIN, Role.IT_SUPPORT, Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateAssetDto) {
    return this.assetsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.IT_ADMIN, Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.assetsService.remove(id);
  }
}
