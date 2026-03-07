import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import type { GetTicketsFilterDto } from './dto/filter-ticket.dto';
import type {
  UpdateTicketStatusDto,
  AssignTicketDto,
} from './dto/update-ticket.dto';

// Adjust these imports based on your auth module's location
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser as CurrentUserType } from '../auth/interfaces/current-user.interface';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('tickets')
@UseGuards(JwtAuthGuard) // 🔒 Locks down every route in this controller
export class TicketsController {
  constructor(private readonly ticketService: TicketsService) {}

  // POST /tickets
  @Post()
  createTicket(
    @Body() createTicketDto: CreateTicketDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.ticketService.createTicket(createTicketDto, user);
  }

  // GET /tickets?page=1&limit=10&department=IT
  @Get()
  getTickets(
    @Query() filters: GetTicketsFilterDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.ticketService.getTickets(user, filters);
  }

  // PATCH /tickets/:id/assign
  @Patch(':id/assign')
  assignTicket(
    @Param('id') ticketId: string,
    @Body() assignTicketDto: AssignTicketDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.ticketService.assignTicket(ticketId, assignTicketDto, user);
  }

  // PATCH /tickets/:id/status
  @Patch(':id/status')
  updateTicketStatus(
    @Param('id') ticketId: string,
    @Body() updateStatusDto: UpdateTicketStatusDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.ticketService.updateTicketStatus(
      ticketId,
      updateStatusDto,
      user,
    );
  }
}
