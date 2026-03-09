import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile
} from '@nestjs/common'

import { FileInterceptor } from '@nestjs/platform-express'

import { TicketsService } from './tickets.service'
import { CreateTicketDto } from './dto/create-ticket.dto'
import { UpdateTicketDto } from './dto/update-ticket.dto'

import { TicketStatus } from '../../generated/prisma/client'

@Controller('tickets')
export class TicketsController {

  constructor(private readonly ticketsService: TicketsService) {}

  /**
   * CREATE TICKET
   * POST /tickets
   * Supports image upload
   */

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() createTicketDto: CreateTicketDto
  ) {

    if (file) {
      createTicketDto.imageUrl = file.filename
    }

    return this.ticketsService.create(createTicketDto)
  }


  /**
   * GET ALL TICKETS
   * GET /tickets
   * Optional query:
   * /tickets?department=IT
   */

  @Get()
  async findAll(
    @Query('department') department?: string
  ) {

    return this.ticketsService.findAll(department)

  }


  /**
   * GET SINGLE TICKET
   * GET /tickets/:id
   */

  @Get(':id')
  async findOne(
    @Param('id') id: string
  ) {

    return this.ticketsService.findOne(id)

  }


  /**
   * UPDATE TICKET
   * PATCH /tickets/:id
   */

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTicketDto: UpdateTicketDto
  ) {

    return this.ticketsService.update(id, updateTicketDto)

  }


  /**
   * UPDATE ONLY STATUS
   * PATCH /tickets/:id/status
   */

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: TicketStatus
  ) {

    return this.ticketsService.updateStatus(id, status)

  }


  /**
   * DELETE TICKET
   * DELETE /tickets/:id
   */

  @Delete(':id')
  async remove(
    @Param('id') id: string
  ) {

    return this.ticketsService.remove(id)

  }

}