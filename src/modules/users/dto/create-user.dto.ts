import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { Role } from 'src/generated/prisma/enums';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: any }) => (value as string)?.trim()) // Removes accidental leading/trailing spaces
  name: string;

  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }: { value: any }) =>
    (value as string)?.trim().toLowerCase(),
  ) // Standardizes emails to prevent duplicate/login issues
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(32, { message: 'Password cannot exceed 32 characters' })
  // Note: We do NOT transform the password. Spaces might be intentional in passphrases!
  password: string;

  @IsEnum(Role, {
    message: 'Role must be a valid system role (EMPLOYEE, HR, IT, ADMIN)',
  })
  @IsNotEmpty()
  role: Role;
}
