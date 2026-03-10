import { PrismaClient } from '../src/generated/prisma/client';
import {
  Role,
  Department,
  AssetType,
  AssetStatus,
  TicketPriority,
  TicketStatus,
} from '../src/generated/prisma/enums';

import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';
import 'dotenv/config';

// Set up the exact same adapter logic from your prisma.service.ts
const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:Eversasi%400108@localhost:5432/helpdesk';

const adapter = new PrismaPg({ connectionString } as any);

// Pass the adapter into the constructor to satisfy TypeScript!
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting database seeding...');

  const usersToSeed = [
    {
      name: 'Aarav Admin',
      email: 'admin@company.com',
      role: Role.IT_ADMIN,
      password: 'Admin123!',
    },
    {
      name: 'Ravi Support',
      email: 'ravi.support@company.com',
      role: Role.IT_SUPPORT,
      password: 'Support123!',
    },
    {
      name: 'Neha Support',
      email: 'neha.support@company.com',
      role: Role.IT_SUPPORT,
      password: 'Support123!',
    },
    {
      name: 'Omar Support',
      email: 'omar.support@company.com',
      role: Role.IT_SUPPORT,
      password: 'Support123!',
    },
    {
      name: 'Meera HR',
      email: 'meera.hr@company.com',
      role: Role.HR,
      password: 'Hr123!',
    },
    {
      name: 'Pooja HR',
      email: 'pooja.hr@company.com',
      role: Role.HR,
      password: 'Hr123!',
    },
    {
      name: 'John Doe',
      email: 'john.employee@company.com',
      role: Role.EMPLOYEE,
      password: 'Employee123!',
    },
    {
      name: 'Priya Sharma',
      email: 'priya.employee@company.com',
      role: Role.EMPLOYEE,
      password: 'Employee123!',
    },
    {
      name: 'Arjun Patel',
      email: 'arjun.employee@company.com',
      role: Role.EMPLOYEE,
      password: 'Employee123!',
    },
  ];

  const passwordCache = new Map<string, string>();
  for (const user of usersToSeed) {
    if (!passwordCache.has(user.password)) {
      passwordCache.set(user.password, await argon2.hash(user.password));
    }
  }

  for (const user of usersToSeed) {
    const hashedPassword = passwordCache.get(user.password)!;
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        password: hashedPassword,
        isActive: true,
      },
      create: {
        name: user.name,
        email: user.email,
        role: user.role,
        password: hashedPassword,
      },
    });
  }
  console.log(`Upserted ${usersToSeed.length} users`);

  const users = await prisma.user.findMany({
    where: {
      email: {
        in: usersToSeed.map((u) => u.email),
      },
    },
  });
  const userByEmail = new Map(users.map((u) => [u.email, u]));

  // Reset transactional data so this seed remains repeatable.
  await prisma.assetAssignment.deleteMany();
  await prisma.assetIssue.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.asset.deleteMany();

  const assetsToSeed = [
    {
      serialNumber: 'AST-LAP-001',
      assetName: 'Dell Latitude 7440',
      assetType: AssetType.HARDWARE,
      assetStatus: AssetStatus.ASSIGNED,
      assignedToEmail: 'john.employee@company.com',
    },
    {
      serialNumber: 'AST-LAP-002',
      assetName: 'HP EliteBook 840',
      assetType: AssetType.HARDWARE,
      assetStatus: AssetStatus.ASSIGNED,
      assignedToEmail: 'priya.employee@company.com',
    },
    {
      serialNumber: 'AST-MON-003',
      assetName: 'LG 27 Inch Monitor',
      assetType: AssetType.HARDWARE,
      assetStatus: AssetStatus.AVAILABLE,
    },
    {
      serialNumber: 'AST-SW-004',
      assetName: 'Adobe Creative Cloud License',
      assetType: AssetType.SOFTWARE,
      assetStatus: AssetStatus.ASSIGNED,
      assignedToEmail: 'arjun.employee@company.com',
    },
    {
      serialNumber: 'AST-NET-005',
      assetName: 'Cisco AnyConnect VPN Token',
      assetType: AssetType.NETWORK,
      assetStatus: AssetStatus.ASSIGNED,
      assignedToEmail: 'arjun.employee@company.com',
    },
    {
      serialNumber: 'AST-LAP-006',
      assetName: 'Lenovo ThinkPad T14',
      assetType: AssetType.HARDWARE,
      assetStatus: AssetStatus.MAINTENANCE,
    },
    {
      serialNumber: 'AST-MOB-007',
      assetName: 'iPhone 15 Corporate',
      assetType: AssetType.HARDWARE,
      assetStatus: AssetStatus.RETIRED,
    },
  ];

  for (const asset of assetsToSeed) {
    const assignedUser = asset.assignedToEmail
      ? userByEmail.get(asset.assignedToEmail)
      : undefined;
    await prisma.asset.create({
      data: {
        serialNumber: asset.serialNumber,
        assetName: asset.assetName,
        assetType: asset.assetType,
        assetStatus: asset.assetStatus,
        assignedToId: assignedUser?.id,
        assignedDate: assignedUser ? new Date() : null,
      },
    });
  }
  console.log(`Created ${assetsToSeed.length} assets`);

  const assets = await prisma.asset.findMany();
  const assetBySerial = new Map(assets.map((a) => [a.serialNumber, a]));

  const ticketsToSeed = [
    {
      title: 'Cannot access company email',
      summary: 'Outlook app crashes immediately after login.',
      department: Department.IT,
      priority: TicketPriority.HIGH,
      status: TicketStatus.OPEN,
      createdByEmail: 'john.employee@company.com',
      assignedToEmail: 'ravi.support@company.com',
    },
    {
      title: 'Laptop overheating frequently',
      summary: 'Laptop fan is noisy and device overheats during meetings.',
      department: Department.IT,
      priority: TicketPriority.CRITICAL,
      status: TicketStatus.IN_PROGRESS,
      createdByEmail: 'priya.employee@company.com',
      assignedToEmail: 'neha.support@company.com',
      assetIssue: {
        assetSerial: 'AST-LAP-002',
        assetCategory: 'Hardware',
        assetClassification: 'Laptop',
        requestedAssetName: 'Cooling Check / Replacement',
      },
    },
    {
      title: 'VPN access not working from home',
      summary: 'AnyConnect reports authentication timeout.',
      department: Department.IT,
      priority: TicketPriority.HIGH,
      status: TicketStatus.OPEN,
      createdByEmail: 'arjun.employee@company.com',
      assignedToEmail: 'omar.support@company.com',
      assetIssue: {
        assetSerial: 'AST-NET-005',
        assetCategory: 'Network',
        assetClassification: 'VPN',
        requestedAssetName: 'VPN Token Re-activation',
      },
    },
    {
      title: 'Need maternity leave policy clarification',
      summary: 'Looking for the latest leave policy details and process.',
      department: Department.HR,
      priority: TicketPriority.LOW,
      status: TicketStatus.RESOLVED,
      createdByEmail: 'priya.employee@company.com',
      assignedToEmail: 'meera.hr@company.com',
    },
    {
      title: 'Request ergonomic keyboard',
      summary: 'Current keyboard is causing wrist pain after long usage.',
      department: Department.IT,
      priority: TicketPriority.LOW,
      status: TicketStatus.OPEN,
      createdByEmail: 'john.employee@company.com',
      assignedToEmail: 'ravi.support@company.com',
      assetIssue: {
        assetCategory: 'Hardware',
        assetClassification: 'Peripheral',
        requestedAssetName: 'Ergonomic Keyboard',
      },
    },
    {
      title: 'Payroll discrepancy in last cycle',
      summary: 'Overtime amount seems missing in salary slip.',
      department: Department.HR,
      priority: TicketPriority.HIGH,
      status: TicketStatus.IN_PROGRESS,
      createdByEmail: 'arjun.employee@company.com',
      assignedToEmail: 'pooja.hr@company.com',
    },
    {
      title: 'Monitor flickering issue',
      summary: 'External display flickers every 10 to 15 minutes.',
      department: Department.IT,
      priority: TicketPriority.HIGH,
      status: TicketStatus.IN_PROGRESS,
      createdByEmail: 'john.employee@company.com',
      assignedToEmail: 'neha.support@company.com',
      assetIssue: {
        assetSerial: 'AST-MON-003',
        assetCategory: 'Hardware',
        assetClassification: 'Monitor',
        requestedAssetName: 'Replacement Monitor',
      },
    },
    {
      title: 'Adobe license activation failed',
      summary: 'Creative Cloud asks for activation repeatedly.',
      department: Department.IT,
      priority: TicketPriority.CRITICAL,
      status: TicketStatus.OPEN,
      createdByEmail: 'arjun.employee@company.com',
      assignedToEmail: 'omar.support@company.com',
      assetIssue: {
        assetSerial: 'AST-SW-004',
        assetCategory: 'Software',
        assetClassification: 'License',
        requestedAssetName: 'Adobe License Reassignment',
      },
    },
    {
      title: 'ID card name correction request',
      summary: 'Need correction in middle name on new ID card.',
      department: Department.HR,
      priority: TicketPriority.LOW,
      status: TicketStatus.RESOLVED,
      createdByEmail: 'john.employee@company.com',
      assignedToEmail: 'pooja.hr@company.com',
    },
    {
      title: 'Slow system startup after updates',
      summary: 'Laptop takes 8 to 10 minutes to reach desktop.',
      department: Department.IT,
      priority: TicketPriority.HIGH,
      status: TicketStatus.OPEN,
      createdByEmail: 'priya.employee@company.com',
      assignedToEmail: 'ravi.support@company.com',
      assetIssue: {
        assetSerial: 'AST-LAP-001',
        assetCategory: 'Hardware',
        assetClassification: 'Laptop',
        requestedAssetName: 'Performance Diagnostics',
      },
    },
  ];

  for (const ticket of ticketsToSeed) {
    const createdBy = userByEmail.get(ticket.createdByEmail);
    const assignedTo = ticket.assignedToEmail
      ? userByEmail.get(ticket.assignedToEmail)
      : undefined;
    const issueAsset = ticket.assetIssue?.assetSerial
      ? assetBySerial.get(ticket.assetIssue.assetSerial)
      : undefined;

    await prisma.ticket.create({
      data: {
        title: ticket.title,
        summary: ticket.summary,
        department: ticket.department,
        priority: ticket.priority,
        status: ticket.status,
        createdById: createdBy!.id,
        assignedToId: assignedTo?.id,
        assetIssue: ticket.assetIssue
          ? {
              create: {
                assetSerialNumber: issueAsset?.serialNumber,
                assetCategory: ticket.assetIssue.assetCategory,
                assetClassification: ticket.assetIssue.assetClassification,
                requestedAssetName: ticket.assetIssue.requestedAssetName,
              },
            }
          : undefined,
      },
    });
  }
  console.log(`Created ${ticketsToSeed.length} tickets`);

  const assignmentLogs = [
    {
      assignedByEmail: 'ravi.support@company.com',
      assignedToEmail: 'john.employee@company.com',
      assetSerial: 'AST-LAP-001',
    },
    {
      assignedByEmail: 'neha.support@company.com',
      assignedToEmail: 'priya.employee@company.com',
      assetSerial: 'AST-LAP-002',
    },
    {
      assignedByEmail: 'omar.support@company.com',
      assignedToEmail: 'arjun.employee@company.com',
      assetSerial: 'AST-SW-004',
    },
    {
      assignedByEmail: 'admin@company.com',
      assignedToEmail: 'arjun.employee@company.com',
      assetSerial: 'AST-NET-005',
    },
    {
      assignedByEmail: 'ravi.support@company.com',
      assignedToEmail: 'john.employee@company.com',
      assetSerial: 'AST-MON-003',
    },
  ];

  for (const log of assignmentLogs) {
    const assignedBy = userByEmail.get(log.assignedByEmail);
    const assignedTo = userByEmail.get(log.assignedToEmail);
    const asset = assetBySerial.get(log.assetSerial);

    if (!assignedBy || !assignedTo || !asset) {
      continue;
    }

    await prisma.assetAssignment.create({
      data: {
        assignedById: assignedBy.id,
        assignedToId: assignedTo.id,
        assetId: asset.id,
      },
    });
  }

  const [userCount, assetCount, ticketCount, issueCount, assignmentCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.asset.count(),
      prisma.ticket.count(),
      prisma.assetIssue.count(),
      prisma.assetAssignment.count(),
    ]);

  console.log('Seeding finished successfully!');
  console.log(
    `Summary -> users: ${userCount}, assets: ${assetCount}, tickets: ${ticketCount}, assetIssues: ${issueCount}, assetAssignments: ${assignmentCount}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
