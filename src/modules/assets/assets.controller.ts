import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { AssignAssetDto } from './dto/assign-asset.dto';
import { FilterAssetDto } from './dto/filter-asset.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from 'src/generated/prisma/enums';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Roles(Role.IT_ADMIN)
  @Post()
  create(@Body() dto: CreateAssetDto) {
    return this.assetsService.create(dto);
  }

  @Get('mine')
  getMyAssets(@CurrentUser('userId') userId: string) {
    return this.assetsService.getMyAssets(userId);
  }

  @Roles(Role.IT_SUPPORT, Role.IT_ADMIN)
  @Get()
  findAll(@Query() filter: FilterAssetDto) {
    return this.assetsService.findAll(filter);
  }

  @Roles(Role.IT_SUPPORT, Role.IT_ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.assetsService.findOne(id);
  }

  @Roles(Role.IT_SUPPORT)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAssetDto) {
    return this.assetsService.update(id, dto);
  }

  @Roles(Role.IT_SUPPORT)
  @Post(':id/assign')
  assign(@Param('id') id: string, @Body() dto: AssignAssetDto) {
    return this.assetsService.assign(id, dto);
  }

  @Roles(Role.EMPLOYEE)
  @Post(':id/return')
  returnAsset(@Param('id') id: string) {
    return this.assetsService.returnAsset(id);
  }

  @Roles(Role.IT_ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.assetsService.remove(id);
  }
}
