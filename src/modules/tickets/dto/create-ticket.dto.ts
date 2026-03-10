import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Department, TicketPriority } from '@prisma/client';

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  summary: string;

  @IsEnum(Department)
  department: Department;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  assetDescription?: string;

  @IsOptional()
  @IsString()
  serviceDescription?: string;

  @IsOptional()
  @IsString()
  assignedToId?: string;

  // Set by controller from JWT — not user-supplied
  createdById?: string;
}
