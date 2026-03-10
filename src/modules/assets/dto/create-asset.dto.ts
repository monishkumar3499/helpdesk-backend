import { AssetStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateAssetDto {
  @IsString()
  serialNumber: string;

  @IsString()
  assetName: string;

  @IsString()
  assetType: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(AssetStatus)
  assetStatus?: AssetStatus;

  @IsOptional()
  @IsString()
  assignedToId?: string;

  @IsOptional()
  @IsDateString()
  assignedDate?: Date;
}
