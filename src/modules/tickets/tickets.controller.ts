import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  Query, UseInterceptors, UploadedFile, UseGuards, Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, TicketStatus } from '@prisma/client';

@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  // ── Create ───────────────────────────────────────────────────────────────
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateTicketDto,
    @Req() req: any,
  ) {
    if (file) dto.imageUrl = file.filename;
    // Always use the authenticated user as the creator
    dto.createdById = req.user.userId;
    return this.ticketsService.create(dto);
  }

  // ── My tickets (must come before :id) ───────────────────────────────────
  @Get('mine')
  findMine(@Req() req: any) {
    return this.ticketsService.findByUser(req.user.userId);
  }

  // ── All tickets (with role-based department filtering) ───────────────────
  @Get()
  @Roles(Role.ADMIN, Role.HR, Role.IT_ADMIN, Role.IT_SUPPORT)
  findAll(@Req() req: any, @Query('department') department?: string) {
    const user = req.user;
    
    // Admins can see anything. Others are restricted to their department.
    if (user.role === Role.ADMIN) {
      return this.ticketsService.findAll(department);
    }
    
    if (user.role === Role.HR) {
      return this.ticketsService.findAll('HR');
    }
    
    if (user.role === Role.IT_ADMIN || user.role === Role.IT_SUPPORT) {
      return this.ticketsService.findAll('IT');
    }

    // Default: no access or empty
    return { data: [] };
  }

  // ── Single ticket ─────────────────────────────────────────────────────────
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }

  // ── Update ────────────────────────────────────────────────────────────────
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTicketDto) {
    return this.ticketsService.update(id, dto);
  }

  // ── Status-only update ────────────────────────────────────────────────────
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: TicketStatus) {
    return this.ticketsService.updateStatus(id, status);
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ticketsService.remove(id);
  }
}