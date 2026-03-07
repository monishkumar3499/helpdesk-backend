import { Injectable } from '@nestjs/common';
import { PrismaClient } from './generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    const connectionString = 'postgresql://postgres:postgres@localhost:5432/helpdesk';
    const adapter = new PrismaPg({ connectionString });
    super({ adapter });
  }
}
