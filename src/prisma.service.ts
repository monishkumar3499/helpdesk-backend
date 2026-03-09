import { Injectable } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import type { PrismaClient } from './generated/prisma/client';

// Use require for CJS modules
const { PrismaClient: PrismaClientBase } = require('./generated/prisma/client');

@Injectable()
export class PrismaService extends PrismaClientBase {
  constructor() {
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:guna@localhost:5432/helpdesk';
    const adapter = new PrismaPg({ connectionString });
    super({ adapter });
  }
}
