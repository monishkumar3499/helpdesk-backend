import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Role } from '../../generated/prisma/client.js';
@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already exists');
    return this.prisma.user.create({
      data: dto,
      select: {
        id: true, name: true, email: true,
        role: true, isActive: true, createdAt: true,
      },
    });
  }

  async findAll(role?: string) {
    return this.prisma.user.findMany({
      where: role ? { role: role as Role } : undefined,
      select: {
        id: true, name: true, email: true,
        role: true, isActive: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, name: true, email: true,
        role: true, isActive: true, createdAt: true,
      },
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async toggleActive(id: string) {
    const user = await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: {
        id: true, name: true, email: true,
        role: true, isActive: true, createdAt: true,
      },
    });
  }

  // Role-specific methods
  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, email: true,
        role: true, isActive: true, createdAt: true,
      },
    });
    if (!user) throw new NotFoundException(`User not found`);
    return user;
  }

  async getUserTickets(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!user) throw new NotFoundException(`User not found`);

    // Different logic based on role
    if (user.role === 'EMPLOYEE') {
      // Employees see tickets they created
      return this.prisma.ticket.findMany({
        where: { createdById: userId },
        include: {
          createdBy: { select: { id: true, name: true, email: true, role: true } },
          assignedTo: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (user.role === 'HR' || user.role === 'IT') {
      // HR/IT see tickets assigned to them
      return this.prisma.ticket.findMany({
        where: { assignedToId: userId },
        include: {
          createdBy: { select: { id: true, name: true, email: true, role: true } },
          assignedTo: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (user.role === 'ADMIN') {
      // Admin sees all tickets
      return this.prisma.ticket.findMany({
        include: {
          createdBy: { select: { id: true, name: true, email: true, role: true } },
          assignedTo: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }
  }

  async getUserAssets(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!user) throw new NotFoundException(`User not found`);

    if (user.role === 'EMPLOYEE') {
      // Employees see assets assigned to them
      return this.prisma.asset.findMany({
        where: { assignedToId: userId },
        include: {
          assignedTo: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (user.role === 'HR' || user.role === 'IT' || user.role === 'ADMIN') {
      // HR/IT/Admin see all assets they manage
      return this.prisma.asset.findMany({
        include: {
          assignedTo: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }
  }

  async getHRDashboard() {
    const [totalUsers, totalTickets, openTickets, hrTickets] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.ticket.count(),
      this.prisma.ticket.count({ where: { status: 'OPEN' } }),
      this.prisma.ticket.count({ where: { department: 'HR' } }),
    ]);

    return {
      totalUsers,
      totalTickets,
      openTickets,
      hrTickets,
      recentTickets: await this.prisma.ticket.findMany({
        where: { department: 'HR' },
        include: {
          createdBy: { select: { id: true, name: true, email: true, role: true } },
          assignedTo: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    };
  }

  async getITDashboard() {
    const [totalAssets, assignedAssets, maintenanceAssets, itTickets] = await Promise.all([
      this.prisma.asset.count(),
      this.prisma.asset.count({ where: { assetStatus: 'ASSIGNED' } }),
      this.prisma.asset.count({ where: { assetStatus: 'MAINTENANCE' } }),
      this.prisma.ticket.count({ where: { department: 'IT' } }),
    ]);

    return {
      totalAssets,
      assignedAssets,
      maintenanceAssets,
      itTickets,
      recentAssets: await this.prisma.asset.findMany({
        include: {
          assignedTo: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      recentTickets: await this.prisma.ticket.findMany({
        where: { department: 'IT' },
        include: {
          createdBy: { select: { id: true, name: true, email: true, role: true } },
          assignedTo: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    };
  }

  async getAdminDashboard() {
    const [
      totalUsers,
      totalTickets,
      totalAssets,
      openTickets,
      assignedAssets,
      usersByRole,
      ticketsByStatus,
      assetsByStatus,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.ticket.count(),
      this.prisma.asset.count(),
      this.prisma.ticket.count({ where: { status: 'OPEN' } }),
      this.prisma.asset.count({ where: { assetStatus: 'ASSIGNED' } }),
      this.prisma.user.groupBy({
        by: ['role'],
        _count: { role: true },
      }),
      this.prisma.ticket.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      this.prisma.asset.groupBy({
        by: ['assetStatus'],
        _count: { assetStatus: true },
      }),
    ]);

    return {
      overview: {
        totalUsers,
        totalTickets,
        totalAssets,
        openTickets,
        assignedAssets,
      },
      usersByRole,
      ticketsByStatus,
      assetsByStatus,
      recentActivity: {
        users: await this.prisma.user.findMany({
          select: { id: true, name: true, email: true, role: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        tickets: await this.prisma.ticket.findMany({
          include: {
            createdBy: { select: { id: true, name: true, email: true, role: true } },
            assignedTo: { select: { id: true, name: true, email: true, role: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        assets: await this.prisma.asset.findMany({
          include: {
            assignedTo: { select: { id: true, name: true, email: true, role: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
      },
    };
  }

  async getEmployeeTicketStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!user) throw new NotFoundException(`User not found`);

    // Get total count of tickets created by employee
    const totalRequests = await this.prisma.ticket.count({
      where: { createdById: userId },
    });

    // Get breakdown by status
    const openCount = await this.prisma.ticket.count({
      where: { createdById: userId, status: 'OPEN' },
    });

    const inProgressCount = await this.prisma.ticket.count({
      where: { createdById: userId, status: 'IN_PROGRESS' },
    });

    const resolvedCount = await this.prisma.ticket.count({
      where: { createdById: userId, status: 'RESOLVED' },
    });

    // Get recent 5 tickets created by employee
    const recentTickets = await this.prisma.ticket.findMany({
      where: { createdById: userId },
      include: {
        createdBy: { select: { id: true, name: true, email: true, role: true } },
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      ticketStats: {
        total: totalRequests,
        open: openCount,
        inProgress: inProgressCount,
        resolved: resolvedCount,
        percentage: {
          open: totalRequests > 0 ? Math.round((openCount / totalRequests) * 100) : 0,
          inProgress: totalRequests > 0 ? Math.round((inProgressCount / totalRequests) * 100) : 0,
          resolved: totalRequests > 0 ? Math.round((resolvedCount / totalRequests) * 100) : 0,
        },
      },
      recentTickets,
    };
  }
}
