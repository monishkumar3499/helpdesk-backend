import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import * as path from 'path';

// Dynamically require the generated Prisma client
const clientPath = path.join(__dirname, '../src/generated/prisma/client.js');
const { PrismaClient } = require(clientPath);

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:guna@localhost:5432/helpdesk';
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data
  await prisma.asset.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  console.log('Creating users...');

  const admin = await prisma.user.create({
    data: {
      id: 'admin001',
      name: 'Admin User',
      email: 'admin@helpdesk.com',
      password: 'admin@123', // For testing - in production use hashed passwords
      role: 'ADMIN',
      isActive: true,
    },
  });

  const hrUser = await prisma.user.create({
    data: {
      id: 'hr001',
      name: 'HR Manager',
      email: 'hr@helpdesk.com',
      password: 'hr@123',
      role: 'HR',
      isActive: true,
    },
  });

  const itUser = await prisma.user.create({
    data: {
      id: 'it001',
      name: 'IT Support',
      email: 'it@helpdesk.com',
      password: 'it@123',
      role: 'IT',
      isActive: true,
    },
  });

  // Create Employees
  const emp1 = await prisma.user.create({
    data: {
      id: 'emp001',
      name: 'John Doe',
      email: 'john@company.com',
      password: 'emp@123',
      role: 'EMPLOYEE',
      isActive: true,
    },
  });

  const emp2 = await prisma.user.create({
    data: {
      id: 'emp002',
      name: 'Sarah Smith',
      email: 'sarah@company.com',
      password: 'emp@123',
      role: 'EMPLOYEE',
      isActive: true,
    },
  });

  const emp3 = await prisma.user.create({
    data: {
      id: 'emp003',
      name: 'Michael Johnson',
      email: 'michael@company.com',
      password: 'emp@123',
      role: 'EMPLOYEE',
      isActive: true,
    },
  });

  const emp4 = await prisma.user.create({
    data: {
      id: 'emp004',
      name: 'Emily Brown',
      email: 'emily@company.com',
      password: 'emp@123',
      role: 'EMPLOYEE',
      isActive: true,
    },
  });

  console.log('✅ Users created');

  // Create HR Tickets
  console.log('🎫 Creating tickets...');

  const ticket1 = await prisma.ticket.create({
    data: {
      title: 'Salary Increment Request',
      summary: 'Requesting salary increment for outstanding performance',
      department: 'HR',
      priority: 'HIGH',
      status: 'OPEN',
      createdById: emp1.id,
      assignedToId: hrUser.id,
    },
  });

  const ticket2 = await prisma.ticket.create({
    data: {
      title: 'Leave Application',
      summary: 'Applying for 5 days leave next month',
      department: 'HR',
      priority: 'LOW',
      status: 'IN_PROGRESS',
      createdById: emp2.id,
      assignedToId: hrUser.id,
    },
  });

  const ticket3 = await prisma.ticket.create({
    data: {
      title: 'Maternity Leave Request',
      summary: 'Applying for maternity leave starting next month',
      department: 'HR',
      priority: 'HIGH',
      status: 'OPEN',
      createdById: emp3.id,
      assignedToId: hrUser.id,
    },
  });

  // Create IT Tickets
  const ticket4 = await prisma.ticket.create({
    data: {
      title: 'Laptop Not Working',
      summary: 'Laptop screen is not turning on, need replacement',
      department: 'IT',
      priority: 'CRITICAL',
      status: 'OPEN',
      createdById: emp1.id,
      assignedToId: itUser.id,
    },
  });

  const ticket5 = await prisma.ticket.create({
    data: {
      title: 'Internet Connection Issues',
      summary: 'WiFi connection keeps dropping throughout the day',
      department: 'IT',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      createdById: emp2.id,
      assignedToId: itUser.id,
    },
  });

  const ticket6 = await prisma.ticket.create({
    data: {
      title: 'Software License Request',
      summary: 'Need Adobe Creative Suite license for design work',
      department: 'IT',
      priority: 'HIGH',
      status: 'OPEN',
      createdById: emp4.id,
      assignedToId: itUser.id,
    },
  });

  const ticket7 = await prisma.ticket.create({
    data: {
      title: 'VPN Setup Request',
      summary: 'Need to set up VPN for remote work',
      department: 'IT',
      priority: 'HIGH',
      status: 'RESOLVED',
      createdById: emp3.id,
      assignedToId: itUser.id,
    },
  });

  console.log('✅ Tickets created');

  // Create Assets
  console.log('📦 Creating assets...');

  const asset1 = await prisma.asset.create({
    data: {
      serialNumber: 'AST-001',
      assetName: 'Dell Laptop',
      assetType: 'Computer',
      assetStatus: 'ASSIGNED',
      assignedToId: emp1.id,
      assignedDate: new Date(),
    },
  });

  const asset2 = await prisma.asset.create({
    data: {
      serialNumber: 'AST-002',
      assetName: 'HP Printer',
      assetType: 'Printer',
      assetStatus: 'ASSIGNED',
      assignedToId: emp2.id,
      assignedDate: new Date(),
    },
  });

  const asset3 = await prisma.asset.create({
    data: {
      serialNumber: 'AST-003',
      assetName: 'MacBook Pro',
      assetType: 'Computer',
      assetStatus: 'ASSIGNED',
      assignedToId: emp3.id,
      assignedDate: new Date(),
    },
  });

  const asset4 = await prisma.asset.create({
    data: {
      serialNumber: 'AST-004',
      assetName: 'Monitor LG 27"',
      assetType: 'Monitor',
      assetStatus: 'ASSIGNED',
      assignedToId: emp1.id,
      assignedDate: new Date(),
    },
  });

  const asset5 = await prisma.asset.create({
    data: {
      serialNumber: 'AST-005',
      assetName: 'Keyboard Mechanical',
      assetType: 'Peripheral',
      assetStatus: 'AVAILABLE',
    },
  });

  const asset6 = await prisma.asset.create({
    data: {
      serialNumber: 'AST-006',
      assetName: 'Mouse Wireless',
      assetType: 'Peripheral',
      assetStatus: 'MAINTENANCE',
    },
  });

  const asset7 = await prisma.asset.create({
    data: {
      serialNumber: 'AST-007',
      assetName: 'Conference Phone',
      assetType: 'Device',
      assetStatus: 'ASSIGNED',
      assignedToId: emp4.id,
      assignedDate: new Date(),
    },
  });

  const asset8 = await prisma.asset.create({
    data: {
      serialNumber: 'AST-008',
      assetName: 'USB-C Hub',
      assetType: 'Peripheral',
      assetStatus: 'AVAILABLE',
    },
  });

  console.log('✅ Assets created');

  // Summary
  console.log(`
  ✨ Database seeding completed successfully!
  
  📊 Summary:
  ├─ Users: 8 (1 Admin, 1 HR, 1 IT, 4 Employees)
  ├─ Tickets: 7 (3 HR, 4 IT)
  └─ Assets: 8 (4 Assigned, 1 Available, 1 Maintenance)
  
  📝 Sample Login Credentials:
  ├─ Admin: admin@helpdesk.com / admin@123
  ├─ HR: hr@helpdesk.com / hr@123
  ├─ IT: it@helpdesk.com / it@123
  └─ Employee: john@company.com / emp@123
  
  🚀 Try these endpoints:
  ├─ GET /users/admin/dashboard (complete system overview)
  ├─ GET /users/hr/dashboard (HR stats)
  ├─ GET /users/it/dashboard (IT stats)
  ├─ GET /tickets (all tickets)
  └─ GET /users (all users)
  `);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
