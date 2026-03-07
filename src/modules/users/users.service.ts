import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as argon2 from 'argon2';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  // Inject the Prisma client via constructor for easier testing/mocking
  constructor(private prisma: PrismaService) {}

  // ==========================================
  // 1. CREATE USERS
  // ==========================================
  async create(createUserDto: CreateUserDto) {
    const { email, password, name, role } = createUserDto;

    // Prevent 500 Internal Server Errors from Prisma
    // We actively check if the email exists to throw a clean 409 error
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists.');
    }

    // Securely hash the password using Argon2
    const hashedPassword = await argon2.hash(password);

    // Create the user in the database
    const newUser = await this.prisma.user.create({
      data: {
        name,
        email,
        role,
        password: hashedPassword,
      },
    });

    // Never leak the password hash to the frontend
    // We use JS destructuring to separate the password from the rest of the user data
    const { password: _, ...userWithoutPassword } = newUser;

    return userWithoutPassword;
  }

  // ==========================================
  // 2. GET ALL USERS (WITHOUT PASSWORD)
  // ==========================================
  async findAll() {
    // Explicitly select only safe fields.
    // The password hash never even leaves the database.
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  // ==========================================
  // 3. GET USERS BASED ON ID
  // ==========================================
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // What if someone searches for an ID that doesn't exist?
    // We intercept the null value and throw a clean 404 error.
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }

    return user;
  }

  // ==========================================
  // 4. UPDATE USERS DATA
  // ==========================================
  async update(id: string, updateUserDto: UpdateUserDto) {
    // Check if the user even exists first
    await this.findOne(id); // Reuses our existing 404 logic!

    const { email, password, ...rest } = updateUserDto;
    const dataToUpdate: Record<string, any> = { ...rest };

    // If they are changing their email, ensure it isn't taken by someone else
    if (email) {
      const emailCollision = await this.prisma.user.findUnique({
        where: { email },
      });
      if (emailCollision && emailCollision.id !== id) {
        throw new ConflictException(
          'This email is already taken by another user.',
        );
      }
      dataToUpdate.email = email;
    }

    // If they are changing their password, we MUST hash the new one
    if (password) {
      dataToUpdate.password = await argon2.hash(password);
    }

    // Perform the update and safely return data without the password
    return this.prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  // ==========================================
  // 5. SOFT DELETE FOR USERS
  // ==========================================
  async remove(id: string) {
    // Verify existence
    await this.findOne(id);

    // Soft Delete. We DO NOT use this.prisma.user.delete()
    // Doing so would orphan tickets and assets attached to this user.
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
      },
    });
  }
}
