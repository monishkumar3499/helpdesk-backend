import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AssetStatus } from 'src/generated/prisma/enums';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { FilterAssetDto } from './dto/filter-asset.dto';
import { Prisma } from 'src/generated/prisma/client';
import { AssignAssetDto } from './dto/assign-asset.dto';

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class AssetsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAssetDto) {
    if (dto.assignedToId) {
      const user = await this.prisma.user.findUnique({
        where: { id: dto.assignedToId },
      });
      if (!user) throw new BadRequestException('assignedToId user not found');
    }

    return this.prisma.asset.create({
      data: {
        serialNumber: dto.serialNumber,
        assetName: dto.assetName,
        assetType: dto.assetType,
        assignedToId: dto.assignedToId ?? null,
        assignedDate: dto.assignedToId ? new Date() : null,
        assetStatus: dto.assignedToId
          ? AssetStatus.ASSIGNED
          : (dto.assetStatus ?? AssetStatus.AVAILABLE),
      },
      include: { assignedTo: { select: userSelect } },
    });
  }

  // Moved from UsersModule
  async getMyAssets(userId: string) {
    return this.prisma.asset.findMany({
      where: { assignedToId: userId },
      include: { assignedTo: { select: userSelect } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(filter: FilterAssetDto) {
    const {
      assetStatus,
      assetType,
      assignedToId,
      page = 1,
      limit = 100,
    } = filter;
    const skip = (page - 1) * limit;

    const where: Prisma.AssetWhereInput = {
      ...(assetStatus ? { assetStatus } : {}),
      ...(assetType ? { assetType } : {}),
      ...(assignedToId ? { assignedToId } : {}),
    };

    const [total, data] = await Promise.all([
      this.prisma.asset.count({ where }),
      this.prisma.asset.findMany({
        where,
        include: { assignedTo: { select: userSelect } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

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
    const asset = await this.prisma.asset.findUnique({
      where: { id },
      include: {
        assignedTo: { select: userSelect },
        assetAssignments: {
          include: {
            assignedBy: { select: userSelect },
            assignedTo: { select: userSelect },
          },
          orderBy: { assignedAt: 'desc' },
        },
      },
    });

    if (!asset) throw new NotFoundException(`Asset ${id} not found`);
    return asset;
  }

  async findBySerialNumber(serialNumber: string) {
    const asset = await this.prisma.asset.findUnique({
      where: { serialNumber },
      include: {
        assignedTo: { select: userSelect },
        assetAssignments: {
          include: {
            assignedBy: { select: userSelect },
            assignedTo: { select: userSelect },
          },
          orderBy: { assignedAt: 'desc' },
        },
      },
    });

    if (!asset)
      throw new NotFoundException(
        `Asset with serial number ${serialNumber} not found`,
      );
    return asset;
  }

  async update(id: string, dto: UpdateAssetDto) {
    await this.ensureAssetExists(id);

    if (dto.assignedToId !== undefined) {
      const normalizedAssignedToId = dto.assignedToId.trim();
      if (!normalizedAssignedToId) {
        throw new BadRequestException(
          'assignedToId cannot be empty. Use return endpoint to unassign asset.',
        );
      }

      const user = await this.prisma.user.findUnique({
        where: { id: normalizedAssignedToId },
      });
      if (!user) throw new BadRequestException('assignedToId user not found');

      return this.prisma.asset.update({
        where: { id },
        data: {
          ...dto,
          assignedToId: normalizedAssignedToId,
          assignedDate: new Date(),
          assetStatus: AssetStatus.ASSIGNED,
        },
        include: { assignedTo: { select: userSelect } },
      });
    }

    return this.prisma.asset.update({
      where: { id },
      data: dto,
      include: { assignedTo: { select: userSelect } },
    });
  }

  async assign(id: string, dto: AssignAssetDto) {
    return this.prisma.$transaction(async (tx) => {
      const asset = await tx.asset.findUnique({ where: { id } });
      if (!asset) throw new NotFoundException('Asset not found');

      // Verify users exist
      const assignedBy = await tx.user.findUnique({
        where: { id: dto.assignedById },
      });
      if (!assignedBy)
        throw new BadRequestException('assignedById user not found');

      const assignedTo = await tx.user.findUnique({
        where: { id: dto.assignedToId },
      });
      if (!assignedTo)
        throw new BadRequestException('assignedToId user not found');

      // Update asset and add history log
      const updatedAsset = await tx.asset.update({
        where: { id },
        data: {
          assignedToId: dto.assignedToId,
          assignedDate: new Date(),
          assetStatus: AssetStatus.ASSIGNED,
        },
        include: { assignedTo: { select: userSelect } },
      });

      await tx.assetAssignment.create({
        data: {
          assetId: id,
          assignedById: dto.assignedById,
          assignedToId: dto.assignedToId,
        },
      });

      return updatedAsset;
    });
  }

  async remove(id: string) {
    await this.ensureAssetExists(id);

    return this.prisma.$transaction(async (tx) => {
      await tx.assetAssignment.deleteMany({ where: { assetId: id } });
      return tx.asset.delete({ where: { id } });
    });
  }

  async returnAsset(id: string) {
    await this.ensureAssetExists(id);

    return this.prisma.asset.update({
      where: { id },
      data: {
        assignedToId: null,
        assignedDate: null,
        assetStatus: AssetStatus.AVAILABLE,
      },
      include: { assignedTo: { select: userSelect } },
    });
  }

  private async ensureAssetExists(id: string) {
    const asset = await this.prisma.asset.findUnique({ where: { id } });
    if (!asset) throw new NotFoundException('Asset not found');
  }
}
