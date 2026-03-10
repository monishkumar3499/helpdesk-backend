import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { GetTicketsFilterDto } from './dto/filter-ticket.dto';
import { Department, Role, TicketStatus } from 'src/generated/prisma/enums';
import { AssetsService } from '../assets/assets.service';

@Injectable()
export class TicketsService {
  private ticketInclude = {
    createdBy: { select: { id: true, name: true, email: true, role: true } },
    assignedTo: { select: { id: true, name: true, email: true, role: true } },
    assetIssue: {
      include: {
        asset: true,
      },
    },
  };

  constructor(
    private prisma: PrismaService,
    private assetsService: AssetsService,
  ) {}

  private normalizeRole(role?: string | null) {
    if (!role) return role;
    if (role === 'It_ADMIN') return 'IT_ADMIN';
    if (role === 'IT') return 'IT_SUPPORT';
    return role;
  }

  private hasText(value?: string | null): boolean {
    return typeof value === 'string' && value.trim().length > 0;
  }

  private deriveIssueType(ticket: {
    assetIssue?: {
      assetSerialNumber?: string | null;
      assetCategory?: string | null;
      assetClassification?: string | null;
      requestedAssetName?: string | null;
    } | null;
  }): 'GENERAL' | 'ASSET_REQUEST' | 'ASSET_PROBLEM' {
    const issue = ticket.assetIssue;
    if (!issue) return 'GENERAL';

    const category = issue.assetCategory?.trim().toUpperCase();
    if (category === 'ASSET_PROBLEM') return 'ASSET_PROBLEM';
    if (category === 'ASSET_REQUEST') return 'ASSET_REQUEST';

    const hasAssetSerialNumber = this.hasText(issue.assetSerialNumber);
    const hasRequestedAssetName = this.hasText(issue.requestedAssetName);
    const hasCategory = this.hasText(issue.assetCategory);
    const hasClassification = this.hasText(issue.assetClassification);

    // Matches the workflow rule: existing asset reference means this is a problem ticket.
    if (
      hasAssetSerialNumber &&
      hasRequestedAssetName &&
      hasCategory &&
      hasClassification
    ) {
      return 'ASSET_PROBLEM';
    }

    // Matches the workflow rule: no assetSerialNumber but request details means this is an asset request.
    if (
      !hasAssetSerialNumber &&
      hasRequestedAssetName &&
      hasCategory &&
      hasClassification
    ) {
      return 'ASSET_REQUEST';
    }

    if (hasAssetSerialNumber) return 'ASSET_PROBLEM';
    if (hasRequestedAssetName) return 'ASSET_REQUEST';
    return 'GENERAL';
  }

  private normalizeTicketResponse(ticket: any) {
    const issueType = this.deriveIssueType(ticket);

    const normalizedTicket = {
      ...ticket,
      issueType,
      createdBy: ticket.createdBy
        ? {
            ...ticket.createdBy,
            role: this.normalizeRole(ticket.createdBy.role),
          }
        : ticket.createdBy,
      assignedTo: ticket.assignedTo
        ? {
            ...ticket.assignedTo,
            role: this.normalizeRole(ticket.assignedTo.role),
          }
        : ticket.assignedTo,
    };

    if (!normalizedTicket.assetIssue) {
      const { assetIssue, ...ticketWithoutAssetIssue } = normalizedTicket;
      return ticketWithoutAssetIssue;
    }

    return normalizedTicket;
  }

  private mapAssetIssueInput(dto: {
    assetIssue?: {
      assetSerialNumber?: string | null;
      assetCategory?: string | null;
      assetClassification?: 'NETWORK' | 'SOFTWARE' | 'HARDWARE' | null;
      requestedAssetName?: string | null;
    } | null;
  }) {
    return dto.assetIssue;
  }

  private async pickAutoAssignee(department: Department): Promise<string | null> {
    const targetRoles =
      department === Department.IT
        ? [Role.IT_SUPPORT]
        : [Role.HR];

    const candidates = await this.prisma.user.findMany({
      where: {
        role: { in: targetRoles },
        isActive: true,
      },
      select: { id: true },
    });

    if (candidates.length === 0) {
      return null;
    }

    const candidateIds = candidates.map((c) => c.id);
    const loadByUser = await this.prisma.ticket.groupBy({
      by: ['assignedToId'],
      where: {
        assignedToId: { in: candidateIds },
        status: { in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS] },
      },
      _count: { _all: true },
      _max: { createdAt: true },
    });

    const loadMap = new Map(
      loadByUser.map((item) => [
        item.assignedToId as string,
        {
          count: item._count._all,
          lastAssignedAt: item._max.createdAt ?? null,
        },
      ]),
    );

    const sorted = candidateIds
      .map((id) => ({
        id,
        count: loadMap.get(id)?.count ?? 0,
        lastAssignedAt: loadMap.get(id)?.lastAssignedAt ?? null,
      }))
      .sort((a, b) => {
        if (a.count !== b.count) return a.count - b.count;
        if (!a.lastAssignedAt && !b.lastAssignedAt) return 0;
        if (!a.lastAssignedAt) return -1;
        if (!b.lastAssignedAt) return 1;
        return a.lastAssignedAt.getTime() - b.lastAssignedAt.getTime();
      });

    return sorted[0]?.id ?? null;
  }

  async create(dto: CreateTicketDto) {
    const assetIssue = this.mapAssetIssueInput(dto);

    if (assetIssue?.assetSerialNumber) {
      await this.assetsService.findBySerialNumber(assetIssue.assetSerialNumber);
    }

    const resolvedAssignedToId =
      dto.assignedToId ?? (await this.pickAutoAssignee(dto.department));

    const created = await this.prisma.ticket.create({
      data: {
        title: dto.title,
        summary: dto.summary,
        department: dto.department,
        priority: dto.priority ?? 'LOW', // Default fallback
        imageUrl: dto.imageUrl,
        createdById: dto.createdById,
        assignedToId: resolvedAssignedToId,
        ...(assetIssue
          ? {
              assetIssue: {
                create: {
                  assetSerialNumber: assetIssue.assetSerialNumber ?? null,
                  assetCategory: assetIssue.assetCategory ?? null,
                  assetClassification: assetIssue.assetClassification ?? null,
                  requestedAssetName: assetIssue.requestedAssetName ?? null,
                },
              },
            }
          : {}),
      },
      include: this.ticketInclude,
    });

    return this.normalizeTicketResponse(created);
  }

  async getMyTickets(userId: string) {
    const tickets = await this.prisma.ticket.findMany({
      where: {
        OR: [{ createdById: userId }, { assignedToId: userId }],
      },
      include: this.ticketInclude,
      orderBy: { createdAt: 'desc' },
    });

    return tickets.map((ticket) => this.normalizeTicketResponse(ticket));
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
        include: this.ticketInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    // Return data alongside pagination metadata for Next.js tables
    return {
      data: data.map((ticket) => this.normalizeTicketResponse(ticket)),
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
      include: this.ticketInclude,
    });

    if (!ticket) throw new NotFoundException(`Ticket ${id} not found`);
    return this.normalizeTicketResponse(ticket);
  }

  async update(id: string, dto: UpdateTicketDto) {
    const existing = await this.findOne(id);
    const assetIssue = this.mapAssetIssueInput(dto);

    if (assetIssue?.assetSerialNumber) {
      await this.assetsService.findBySerialNumber(assetIssue.assetSerialNumber);
    }

    if (dto.assignedToId) {
      const assignee = await this.prisma.user.findUnique({
        where: { id: dto.assignedToId },
        select: { id: true, role: true, isActive: true },
      });

      if (!assignee || !assignee.isActive) {
        throw new BadRequestException('assignedToId user not found or inactive');
      }
    }

    const updated = await this.prisma.ticket.update({
      where: { id },
      data: {
        title: dto.title,
        summary: dto.summary,
        department: dto.department,
        priority: dto.priority,
        imageUrl: dto.imageUrl,
        createdById: dto.createdById,
        assignedToId: dto.assignedToId,
        status: dto.status,
        ...(assetIssue !== undefined
          ? assetIssue === null
            ? existing.assetIssue
              ? { assetIssue: { delete: true } }
              : {}
            : {
                assetIssue: {
                  upsert: {
                    create: {
                      assetSerialNumber: assetIssue.assetSerialNumber ?? null,
                      assetCategory: assetIssue.assetCategory ?? null,
                      assetClassification: assetIssue.assetClassification ?? null,
                      requestedAssetName: assetIssue.requestedAssetName ?? null,
                    },
                    update: {
                      assetSerialNumber: assetIssue.assetSerialNumber ?? null,
                      assetCategory: assetIssue.assetCategory ?? null,
                      assetClassification: assetIssue.assetClassification ?? null,
                      requestedAssetName: assetIssue.requestedAssetName ?? null,
                    },
                  },
                },
              }
          : {}),
      },
      include: this.ticketInclude,
    });

    return this.normalizeTicketResponse(updated);
  }

  async updateStatus(id: string, status: TicketStatus) {
    await this.findOne(id); // Ensure existence
    const updated = await this.prisma.ticket.update({
      where: { id },
      data: { status },
      include: this.ticketInclude, // Returning the relations is helpful for frontend UI updates
    });

    return this.normalizeTicketResponse(updated);
  }

  async remove(id: string) {
    await this.findOne(id); // Ensure existence
    const removed = await this.prisma.ticket.delete({
      where: { id },
      include: this.ticketInclude, // Return deleted data in case frontend needs it for undo toast
    });

    return this.normalizeTicketResponse(removed);
  }

  private async ensureTicketExists(id: string) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException(`Ticket ${id} not found`);
  }
}
