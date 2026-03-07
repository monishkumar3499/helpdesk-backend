import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateTicketDto, CurrentUser } from './dto/create-ticket.dto';
import {
  AssignTicketDto,
  UpdateTicketStatusDto,
} from './dto/update-ticket.dto';
import {
  Department,
  Prisma,
  PrismaClient,
  Role,
  TicketPriority,
  TicketStatus,
} from 'src/generated/prisma/client';
import { GetTicketsFilterDto } from './dto/filter-ticket.dto';

@Injectable()
export class TicketsService {
  // Inject the Prisma client via constructor for easier testing/mocking
  constructor(private prisma: PrismaClient) {}

  // ==========================================
  // 1. CREATE TICKET
  // ==========================================
  async createTicket(data: CreateTicketDto, currentUser: CurrentUser) {
    // 1. Business Logic: Is the user active?
    const user = await this.prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { isActive: true },
    });

    if (!user || !user.isActive) {
      throw new ForbiddenException(
        'Your account is inactive. You cannot create tickets.',
      );
    }

    // 2. Business Logic: Rate Limiting
    // How many requests can be sent at a time
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentTickets = await this.prisma.ticket.count({
      where: {
        createdById: currentUser.id,
        createdAt: { gte: fiveMinutesAgo },
      },
    });

    if (recentTickets >= 5) {
      throw new BadRequestException(
        'Creating tickets too quickly. Please wait.',
      );
    }

    // 3. Database Operation
    return this.prisma.ticket.create({
      data: {
        title: data.title, // Guaranteed to be a valid, non-empty string by DTO
        summary: data.summary, // Guaranteed to be a valid, non-empty string by DTO
        department: data.department, // Guaranteed to be a valid enum by DTO
        priority: data.priority || TicketPriority.LOW,
        imageUrl: data.imageUrl,
        createdById: currentUser.id,
      },
    });
  }

  // ==========================================
  // 2. GET TICKETS (WITH ROLE-BASED FILTERING)
  // ==========================================
  async getTickets(
    currentUser: CurrentUser,
    filters: GetTicketsFilterDto = {},
  ) {
    // Pagination (Performance & DoS Protection)
    // Never allow fetching ALL tickets at once.
    // Default to page 1, 10 items. Cap max items at 50.
    const page = filters.page || 1;
    const limit = Math.min(50, filters.limit || 10);
    const skip = (page - 1) * limit;

    // This guarantees we only query valid schema fields.
    const whereClause: Prisma.TicketWhereInput = {};

    // Apply basic user-requested filters
    if (filters.status) whereClause.status = filters.status;
    if (filters.priority) whereClause.priority = filters.priority;

    // Strict Role-Based Access Control (RBAC)
    // We must ensure that a user passing `department=IT`
    // in the URL cannot bypass their role restrictions.
    switch (currentUser.role) {
      case Role.EMPLOYEE:
        // Employees CANNOT see other people's tickets, period.
        whereClause.createdById = currentUser.id;
        if (filters.department) whereClause.department = filters.department;
        break;

      case Role.HR:
      case Role.IT: {
        // HR and IT sees their own tickets OR
        // any ticket in the HR and IT department respectively
        const targetDept =
          currentUser.role === Role.HR ? Department.HR : Department.IT;

        if (filters.department) {
          if (filters.department === targetDept) {
            whereClause.department = targetDept;
          } else {
            // If they ask for the OTHER department, they only see ones they created
            whereClause.department = filters.department;
            whereClause.createdById = currentUser.id;
          }
        } else {
          whereClause.OR = [
            { department: targetDept },
            { createdById: currentUser.id },
          ];
        }
        break;
      }

      case Role.ADMIN:
        // Admins have no forced restrictions. Apply department filter if requested.
        if (filters.department) whereClause.department = filters.department;
        break;
    }

    // DB CALL: Use $transaction to run count and fetch in parallel
    try {
      const [tickets, totalCount] = await this.prisma.$transaction([
        this.prisma.ticket.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }, // Show newest tickets first
          include: {
            createdBy: { select: { id: true, name: true, email: true } },
            assignedTo: { select: { id: true, name: true } },
          },
        }),
        this.prisma.ticket.count({ where: whereClause }),
      ]);

      return {
        data: tickets,
        meta: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit),
        },
      };
    } catch (error) {
      console.error('[TicketService.getTickets] Database Error:', error);
      throw new InternalServerErrorException(
        'Failed to fetch tickets. Please try again later.',
      );
    }
  }

  // ==========================================
  // 3. ASSIGN TICKET
  // ==========================================
  async assignTicket(
    ticketId: string,
    data: AssignTicketDto,
    currentUser: CurrentUser,
  ) {
    // Basic Role Check
    // Employees cannot assign tickets at all.
    if (currentUser.role === Role.EMPLOYEE) {
      throw new ForbiddenException('Employees cannot assign tickets.');
    }

    // Fetch the ticket to check its current state and department
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) throw new NotFoundException('Ticket not found.');

    // Prevent re-assigning resolved tickets
    if (ticket.status === TicketStatus.RESOLVED) {
      throw new BadRequestException('Cannot reassign a resolved ticket.');
    }

    // Validate the Assignee
    // Ensure the person being assigned exists, is active,
    // and belongs to the correct department.
    const assignee = await this.prisma.user.findUnique({
      where: { id: data.assigneeId },
      select: { role: true, isActive: true },
    });

    if (!assignee || !assignee.isActive) {
      throw new BadRequestException('Target assignee is invalid or inactive.');
    }
    if (
      ticket.department === Department.HR &&
      assignee.role !== Role.HR &&
      assignee.role !== Role.ADMIN
    ) {
      throw new BadRequestException('HR tickets must be assigned to HR.');
    }
    if (
      ticket.department === Department.IT &&
      assignee.role !== Role.IT &&
      assignee.role !== Role.ADMIN
    ) {
      throw new BadRequestException('IT tickets must be assigned to IT.');
    }

    // DB CALL: Update Assignment and Auto-Shift Status
    try {
      return await this.prisma.ticket.update({
        where: { id: ticketId },
        data: {
          assignedToId: data.assigneeId,
          // Auto-transition status
          // If the ticket was OPEN, picking it up should move it to IN_PROGRESS
          status:
            ticket.status === TicketStatus.OPEN
              ? TicketStatus.IN_PROGRESS
              : ticket.status,
        },
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
        },
      });
    } catch (error) {
      console.error('[TicketService.assignTicket] Database Error:', error);
      throw new InternalServerErrorException('Failed to assign ticket.');
    }
  }

  // ==========================================
  // 4. UPDATE TICKET STATUS
  // ==========================================
  async updateTicketStatus(
    ticketId: string,
    data: UpdateTicketStatusDto,
    currentUser: CurrentUser,
  ) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) throw new NotFoundException('Ticket not found.');

    // State Machine Logic
    // Agents shouldn't be able to resolve a ticket that nobody has investigated.
    // However, the original creator CAN cancel/resolve their own unassigned ticket.
    if (
      data.status === TicketStatus.RESOLVED &&
      !ticket.assignedToId &&
      currentUser.id !== ticket.createdById
    ) {
      throw new BadRequestException(
        'Cannot resolve a ticket that has not been assigned to anyone.',
      );
    }

    // Strict Update Permissions
    if (currentUser.role === Role.EMPLOYEE) {
      // Employees can only close their OWN tickets
      if (ticket.createdById !== currentUser.id) {
        throw new ForbiddenException(
          'You do not have permission to modify this ticket.',
        );
      }
      if (data.status !== TicketStatus.RESOLVED) {
        throw new ForbiddenException(
          'Employees can only resolve/close their own tickets.',
        );
      }
    } else if (currentUser.role === Role.HR || currentUser.role === Role.IT) {
      // Agents can only update tickets in their specific department
      if (
        (currentUser.role === Role.HR && ticket.department !== Department.HR) ||
        (currentUser.role === Role.IT && ticket.department !== Department.IT)
      ) {
        throw new ForbiddenException(
          `You do not have permission to update ${ticket.department} tickets.`,
        );
      }
    }
    // Admins bypass the above checks.

    // DB CALL: Update Status
    try {
      return await this.prisma.ticket.update({
        where: { id: ticketId },
        data: { status: data.status },
      });
    } catch (error) {
      console.error(
        '[TicketService.updateTicketStatus] Database Error:',
        error,
      );
      throw new InternalServerErrorException('Failed to update ticket status.');
    }
  }
}
