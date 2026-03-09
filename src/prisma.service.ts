import { Injectable } from '@nestjs/common';
import { PrismaClient } from './generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
dotenv.config();
@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:guna@localhost:5432/helpdesk'; 
    const adapter = new PrismaPg({ connectionString });
    super({ adapter });
  }
}
