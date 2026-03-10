import { Controller, Get, Post, Body, Param, Patch, Query, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ── Create user (admin / HR) ─────────────────────────────────────────────
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.HR, Role.IT_ADMIN, Role.IT_SUPPORT)
  findAll(@Query('role') role?: string) {
    return this.usersService.findAll(role);
  }

  // ── Profile / data for the currently-authenticated user ─────────────────
  @Get('me/profile')
  getMyProfile(@Req() req: any) {
    return this.usersService.findOne(req.user.userId);
  }

  @Get('me/tickets')
  getMyTickets(@Req() req: any) {
    return this.usersService.getUserTickets(req.user.userId);
  }

  @Get('me/assets')
  getMyAssets(@Req() req: any) {
    return this.usersService.getUserAssets(req.user.userId);
  }

  // ── Dashboard aggregates ─────────────────────────────────────────────────
  @Get('hr/dashboard')
  @Roles(Role.HR, Role.ADMIN)
  getHRDashboard() {
    return this.usersService.getHRDashboard();
  }

  @Get('it/dashboard')
  @Roles(Role.IT_ADMIN, Role.IT_SUPPORT, Role.ADMIN)
  getITDashboard() {
    return this.usersService.getITDashboard();
  }

  @Get('admin/dashboard')
  @Roles(Role.ADMIN)
  getAdminDashboard() {
    return this.usersService.getAdminDashboard();
  }

  // ── Single user + user-scoped sub-resources ──────────────────────────────
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Get(':id/tickets')
  getUserTickets(@Param('id') id: string) {
    return this.usersService.getUserTickets(id);
  }

  @Get(':id/assets')
  getUserAssets(@Param('id') id: string) {
    return this.usersService.getUserAssets(id);
  }

  @Get(':id/ticket-stats')
  getEmployeeTicketStats(@Param('id') id: string) {
    return this.usersService.getEmployeeTicketStats(id);
  }

  @Patch(':id/toggle')
  toggleActive(@Param('id') id: string) {
    return this.usersService.toggleActive(id);
  }
}
