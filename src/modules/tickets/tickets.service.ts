import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma.service'

import { CreateTicketDto } from './dto/create-ticket.dto'
import { UpdateTicketDto } from './dto/update-ticket.dto'

import {
  Department,
  TicketStatus
} from 'src/generated/prisma/client'

@Injectable()
export class TicketsService {

  constructor(private prisma: PrismaService) {}

  /**
   * Create Ticket
   */

  async create(dto: CreateTicketDto) {

    return this.prisma.ticket.create({

      data: {
        title: dto.title,
        summary: dto.summary,
        department: dto.department,
        priority: dto.priority ?? "LOW",
        imageUrl: dto.imageUrl ?? null,
        createdById: dto.createdById,
        assignedToId: dto.assignedToId ?? null
      },

      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }

    })

  }

  /**
   * Get All Tickets
   */

  async findAll(department?: string) {

    return this.prisma.ticket.findMany({

      where: department
        ? { department: department as Department }
        : undefined,

      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },

      orderBy: {
        createdAt: "desc"
      }

    })

  }

  /**
   * Get Single Ticket
   */

  async findOne(id: string) {

    const ticket = await this.prisma.ticket.findUnique({

      where: { id },

      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }

    })

    if (!ticket) {
      throw new NotFoundException(`Ticket ${id} not found`)
    }

    return ticket

  }

  /**
   * Update Ticket
   */

  async update(id: string, dto: UpdateTicketDto) {

    await this.findOne(id)

    return this.prisma.ticket.update({

      where: { id },

      data: {
        ...dto
      },

      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }

    })

  }

  /**
   * Update Ticket Status
   */

  async updateStatus(id: string, status: TicketStatus) {

    await this.findOne(id)

    return this.prisma.ticket.update({

      where: { id },

      data: {
        status
      }

    })

  }

  /**
   * Delete Ticket
   */

  async remove(id: string) {

    await this.findOne(id)

    return this.prisma.ticket.delete({
      where: { id }
    })

  }

}