import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { Department, TicketStatus } from '@prisma/client';

const INCLUDE_USERS = {
  createdBy:  { select: { id: true, name: true, email: true, role: true } },
  assignedTo: { select: { id: true, name: true, email: true, role: true } },
} as const;

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  // ── Create ───────────────────────────────────────────────────────────────
  async create(dto: CreateTicketDto) {
    return this.prisma.ticket.create({
      data: {
        title:              dto.title,
        summary:            dto.summary,
        department:         dto.department,
        priority:           dto.priority ?? 'LOW',
        imageUrl:           dto.imageUrl  ?? null,
        assetDescription:   dto.assetDescription   ?? null,
        serviceDescription: dto.serviceDescription ?? null,
        assignedToId:       dto.assignedToId       ?? null,
        createdById:        dto.createdById!,
      },
      include: INCLUDE_USERS,
    });
  }

  // ── Get all (optional department filter) ─────────────────────────────────
  async findAll(department?: string) {
    const tickets = await this.prisma.ticket.findMany({
      where:   department ? { department: department as Department } : undefined,
      include: INCLUDE_USERS,
      orderBy: { createdAt: 'desc' },
    });
    return { data: tickets };
  }

  // ── Get tickets created by a specific user ────────────────────────────────
  async findByUser(userId: string) {
    const tickets = await this.prisma.ticket.findMany({
      where:   { createdById: userId },
      include: INCLUDE_USERS,
      orderBy: { createdAt: 'desc' },
    });
    return { data: tickets };
  }

  // ── Single ticket ─────────────────────────────────────────────────────────
  async findOne(id: string) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id }, include: INCLUDE_USERS });
    if (!ticket) throw new NotFoundException(`Ticket ${id} not found`);
    return ticket;
  }

  // ── Update ────────────────────────────────────────────────────────────────
  async update(id: string, dto: UpdateTicketDto) {
    await this.findOne(id);
    return this.prisma.ticket.update({ where: { id }, data: dto, include: INCLUDE_USERS });
  }

  // ── Status-only update ────────────────────────────────────────────────────
  async updateStatus(id: string, status: TicketStatus) {
    await this.findOne(id);
    return this.prisma.ticket.update({ where: { id }, data: { status } });
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.ticket.delete({ where: { id } });
  }
}