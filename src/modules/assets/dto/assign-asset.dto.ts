import { IsString } from 'class-validator';

export class AssignAssetDto {
  @IsString()
  assignedById: string;

  @IsString()
  assignedToId: string;
}
