import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { GetTicketsFilterDto } from './dto/filter-ticket.dto';
import { TicketStatus } from 'src/generated/prisma/enums';

// DRY: Reusable include object for relations. Keeps passwords hidden!
const ticketInclude = {
  createdBy: { select: { id: true, name: true, email: true, role: true } },
  assignedTo: { select: { id: true, name: true, email: true, role: true } },
};

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTicketDto) {
    return this.prisma.ticket.create({
      data: {
        title: dto.title,
        summary: dto.summary,
        department: dto.department,
        priority: dto.priority ?? 'LOW', // Default fallback
        imageUrl: dto.imageUrl,
        createdById: dto.createdById,
        assignedToId: dto.assignedToId,
      },
      include: ticketInclude,
    });
  }

  async getMyTickets(userId: string) {
    return this.prisma.ticket.findMany({
      where: {
        OR: [{ createdById: userId }, { assignedToId: userId }],
      },
      include: ticketInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  // Upgraded to handle advanced filtering and pagination for the frontend
  async findAll(filterDto: GetTicketsFilterDto) {
    const { status, priority, department, page = 1, limit = 10 } = filterDto;

    // Calculate pagination offsets
    const skip = (page - 1) * limit;

    // Build the dynamic where clause based on provided filters
    const whereClause: any = {};
    if (status) whereClause.status = status;
    if (priority) whereClause.priority = priority;
    if (department) whereClause.department = department;

    // Run count and fetch in parallel for performance
    const [total, data] = await Promise.all([
      this.prisma.ticket.count({ where: whereClause }),
      this.prisma.ticket.findMany({
        where: whereClause,
        include: ticketInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    // Return data alongside pagination metadata for Next.js tables
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: ticketInclude,
    });

    if (!ticket) throw new NotFoundException(`Ticket ${id} not found`);
    return ticket;
  }

  async update(id: string, dto: UpdateTicketDto) {
    await this.findOne(id); // Ensure existence
    return this.prisma.ticket.update({
      where: { id },
      data: dto,
      include: ticketInclude,
    });
  }

  async updateStatus(id: string, status: TicketStatus) {
    await this.findOne(id); // Ensure existence
    return this.prisma.ticket.update({
      where: { id },
      data: { status },
      include: ticketInclude, // Returning the relations is helpful for frontend UI updates
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Ensure existence
    return this.prisma.ticket.delete({
      where: { id },
      include: ticketInclude, // Return deleted data in case frontend needs it for undo toast
    });
  }
}
