import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // ─── Auth helpers ───────────────────────────────────────────────────────────

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  // ─── CRUD ───────────────────────────────────────────────────────────────────

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already exists');

    const argon2 = await import('argon2');
    const hashedPassword = await argon2.hash(dto.password);

    return this.prisma.user.create({
      data: { ...dto, password: hashedPassword },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });
  }

  async findAll(role?: string) {
    const users = await this.prisma.user.findMany({
      where: role ? { role: role as Role } : undefined,
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return { data: users };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async toggleActive(id: string) {
    const user = await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });
  }

  // ─── User-scoped data ────────────────────────────────────────────────────────

  async getUserTickets(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!user) throw new NotFoundException('User not found');

    const where =
      user.role === 'EMPLOYEE'
        ? { createdById: userId }
        : user.role === 'ADMIN'
        ? {}
        : { assignedToId: userId };

    const tickets = await this.prisma.ticket.findMany({
      where,
      include: {
        createdBy:  { select: { id: true, name: true, email: true, role: true } },
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { data: tickets };
  }

  async getUserAssets(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!user) throw new NotFoundException('User not found');

    const where = user.role === 'EMPLOYEE' ? { assignedToId: userId } : {};

    const assets = await this.prisma.asset.findMany({
      where,
      include: {
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { data: assets };
  }

  async getEmployeeTicketStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const [total, open, inProgress, resolved] = await Promise.all([
      this.prisma.ticket.count({ where: { createdById: userId } }),
      this.prisma.ticket.count({ where: { createdById: userId, status: 'OPEN' } }),
      this.prisma.ticket.count({ where: { createdById: userId, status: 'IN_PROGRESS' } }),
      this.prisma.ticket.count({ where: { createdById: userId, status: 'RESOLVED' } }),
    ]);

    const recentTickets = await this.prisma.ticket.findMany({
      where: { createdById: userId },
      include: {
        createdBy:  { select: { id: true, name: true, email: true, role: true } },
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return {
      user,
      ticketStats: {
        total, open, inProgress, resolved,
        percentage: {
          open:       total > 0 ? Math.round((open       / total) * 100) : 0,
          inProgress: total > 0 ? Math.round((inProgress / total) * 100) : 0,
          resolved:   total > 0 ? Math.round((resolved   / total) * 100) : 0,
        },
      },
      recentTickets,
    };
  }

  // ─── Dashboard summaries ─────────────────────────────────────────────────────

  async getHRDashboard() {
    const [totalUsers, totalTickets, openTickets, hrTickets] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.ticket.count(),
      this.prisma.ticket.count({ where: { status: 'OPEN' } }),
      this.prisma.ticket.count({ where: { department: 'HR' } }),
    ]);

    const recentTickets = await this.prisma.ticket.findMany({
      where: { department: 'HR' },
      include: {
        createdBy:  { select: { id: true, name: true, email: true, role: true } },
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return { totalUsers, totalTickets, openTickets, hrTickets, recentTickets };
  }

  async getITDashboard() {
    const [totalAssets, assignedAssets, maintenanceAssets, itTickets] = await Promise.all([
      this.prisma.asset.count(),
      this.prisma.asset.count({ where: { assetStatus: 'ASSIGNED' } }),
      this.prisma.asset.count({ where: { assetStatus: 'MAINTENANCE' } }),
      this.prisma.ticket.count({ where: { department: 'IT' } }),
    ]);

    const [recentAssets, recentTickets] = await Promise.all([
      this.prisma.asset.findMany({
        include: { assignedTo: { select: { id: true, name: true, email: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.ticket.findMany({
        where: { department: 'IT' },
        include: {
          createdBy:  { select: { id: true, name: true, email: true, role: true } },
          assignedTo: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    return { totalAssets, assignedAssets, maintenanceAssets, itTickets, recentAssets, recentTickets };
  }

  async getAdminDashboard() {
    const [totalUsers, totalTickets, totalAssets, openTickets, assignedAssets] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.ticket.count(),
      this.prisma.asset.count(),
      this.prisma.ticket.count({ where: { status: 'OPEN' } }),
      this.prisma.asset.count({ where: { assetStatus: 'ASSIGNED' } }),
    ]);

    const [usersByRole, ticketsByStatus, assetsByStatus] = await Promise.all([
      this.prisma.user.groupBy({ by: ['role'], _count: { role: true } }),
      this.prisma.ticket.groupBy({ by: ['status'], _count: { status: true } }),
      this.prisma.asset.groupBy({ by: ['assetStatus'], _count: { assetStatus: true } }),
    ]);

    const [recentUsers, recentTickets, recentAssets] = await Promise.all([
      this.prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.ticket.findMany({
        include: {
          createdBy:  { select: { id: true, name: true, email: true, role: true } },
          assignedTo: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.asset.findMany({
        include: { assignedTo: { select: { id: true, name: true, email: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    return {
      overview: { totalUsers, totalTickets, totalAssets, openTickets, assignedAssets },
      usersByRole,
      ticketsByStatus,
      assetsByStatus,
      recentActivity: { users: recentUsers, tickets: recentTickets, assets: recentAssets },
    };
  }
}
