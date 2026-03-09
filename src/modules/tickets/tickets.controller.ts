import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketStatus } from 'src/generated/prisma/enums';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { GetTicketsFilterDto } from './dto/filter-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  create(@Body() createTicketDto: CreateTicketDto) {
    return this.ticketsService.create(createTicketDto);
  }

  // --- "MINE" ROUTE (Must come before /:id) ---
  @Get('mine')
  getMyTickets() {
    // TODO: Extract ID from JWT Auth Guard
    const userId = 'example-user-id';
    return this.ticketsService.getMyTickets(userId);
  }

  // Uses the full Filter DTO for pagination and multi-filtering
  @Get()
  findAll(@Query() filterDto: GetTicketsFilterDto) {
    return this.ticketsService.findAll(filterDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTicketDto: UpdateTicketDto) {
    return this.ticketsService.update(id, updateTicketDto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: TicketStatus) {
    return this.ticketsService.updateStatus(id, status);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ticketsService.remove(id);
  }
}
