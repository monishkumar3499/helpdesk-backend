import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';

const INCLUDE_ASSIGNEE = {
  assignedTo: { select: { id: true, name: true, email: true, role: true } },
} as const;

@Injectable()
export class AssetsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAssetDto) {
    return this.prisma.asset.create({ data: dto, include: INCLUDE_ASSIGNEE });
  }

  async findAll() {
    const assets = await this.prisma.asset.findMany({
      include: INCLUDE_ASSIGNEE,
      orderBy: { createdAt: 'desc' },
    });
    return { data: assets };
  }

  /** Assets assigned to a specific user */
  async findByUser(userId: string) {
    const assets = await this.prisma.asset.findMany({
      where:   { assignedToId: userId },
      include: INCLUDE_ASSIGNEE,
      orderBy: { createdAt: 'desc' },
    });
    return { data: assets };
  }

  async findOne(id: string) {
    const asset = await this.prisma.asset.findUnique({ where: { id }, include: INCLUDE_ASSIGNEE });
    if (!asset) throw new NotFoundException(`Asset ${id} not found`);
    return asset;
  }

  async update(id: string, dto: UpdateAssetDto) {
    await this.findOne(id);
    return this.prisma.asset.update({ where: { id }, data: dto, include: INCLUDE_ASSIGNEE });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.asset.delete({ where: { id } });
  }
}
