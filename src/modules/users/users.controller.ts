import { Controller, Get, Post, Body, Param, Patch, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll(@Query('role') role?: string) {
    return this.usersService.findAll(role);
  }

  @Get('me/profile')
  getMyProfile() {
    // TODO: Get from authentication context
    // For now, return example user
    return this.usersService.getUserProfile('example-user-id');
  }

  @Get('me/tickets')
  getMyTickets() {
    // TODO: Get from authentication context
    return this.usersService.getUserTickets('example-user-id');
  }

  @Get('me/assets')
  getMyAssets() {
    // TODO: Get from authentication context
    return this.usersService.getUserAssets('example-user-id');
  }

  @Get('hr/dashboard')
  getHRDashboard() {
    return this.usersService.getHRDashboard();
  }

  @Get('it/dashboard')
  getITDashboard() {
    return this.usersService.getITDashboard();
  }

  @Get('admin/dashboard')
  getAdminDashboard() {
    return this.usersService.getAdminDashboard();
  }

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
