require('dotenv').config();
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:monish2005@localhost:5432/helpdesk';
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seeding...');

  const hash = (pw) => argon2.hash(pw);

  // ── Ensure TicketComment table exists (in case migration was never applied) ─
  console.log('🔧 Ensuring TicketComment table exists...');
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "TicketComment" (
      "id" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "ticketId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      CONSTRAINT "TicketComment_pkey" PRIMARY KEY ("id")
    )
  `);
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'TicketComment_ticketId_fkey'
      ) THEN
        ALTER TABLE "TicketComment"
          ADD CONSTRAINT "TicketComment_ticketId_fkey"
          FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$
  `);
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'TicketComment_userId_fkey'
      ) THEN
        ALTER TABLE "TicketComment"
          ADD CONSTRAINT "TicketComment_userId_fkey"
          FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$
  `);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "TicketComment_ticketId_idx" ON "TicketComment"("ticketId")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "TicketComment_userId_idx" ON "TicketComment"("userId")`);

  // ── Wipe existing data (order matters due to FK constraints) ───────────────
  console.log('🧹 Clearing existing data...');
  await prisma.ticketComment.deleteMany({});
  await prisma.ticket.deleteMany({});
  await prisma.asset.deleteMany({});
  await prisma.user.deleteMany({});

  // ── Users ──────────────────────────────────────────────────────────────────
  console.log('👥 Creating users...');

  const admin = await prisma.user.create({
    data: {
      name:        'Admin User',
      email:       'admin@helpdesk.com',
      password:    await hash('admin@123'),
      role:        'ADMIN',
      isActive:    true,
      jobTitle:    'System Administrator',
      department:  'IT',
      phoneNumber: '+91-9000000001',
      employeeId:  'EMP-ADMIN',
      joiningDate: new Date('2022-01-01'),
    },
  });

  const hrManager = await prisma.user.create({
    data: {
      name:        'Priya Sharma',
      email:       'hr@helpdesk.com',
      password:    await hash('hr@123'),
      role:        'HR',
      isActive:    true,
      jobTitle:    'HR Manager',
      department:  'Human Resources',
      phoneNumber: '+91-9000000002',
      employeeId:  'EMP-HR001',
      joiningDate: new Date('2022-03-15'),
    },
  });

  const hrStaff = await prisma.user.create({
    data: {
      name:        'Anjali Verma',
      email:       'hr2@helpdesk.com',
      password:    await hash('hr@123'),
      role:        'HR',
      isActive:    true,
      jobTitle:    'HR Executive',
      department:  'Human Resources',
      phoneNumber: '+91-9000000003',
      employeeId:  'EMP-HR002',
      joiningDate: new Date('2022-06-01'),
      managerId:   hrManager.id,
    },
  });

  const itAdmin = await prisma.user.create({
    data: {
      name:        'Rahul Mehta',
      email:       'itadmin@helpdesk.com',
      password:    await hash('it@123'),
      role:        'IT_ADMIN',
      isActive:    true,
      jobTitle:    'IT Administrator',
      department:  'Information Technology',
      phoneNumber: '+91-9000000004',
      employeeId:  'EMP-ITA001',
      joiningDate: new Date('2021-11-01'),
    },
  });

  const itSupport = await prisma.user.create({
    data: {
      name:        'Kiran Patel',
      email:       'it@helpdesk.com',
      password:    await hash('it@123'),
      role:        'IT_SUPPORT',
      isActive:    true,
      jobTitle:    'IT Support Engineer',
      department:  'Information Technology',
      phoneNumber: '+91-9000000005',
      employeeId:  'EMP-ITS001',
      joiningDate: new Date('2022-02-01'),
      managerId:   itAdmin.id,
    },
  });

  const emp1 = await prisma.user.create({
    data: {
      name:        'John Doe',
      email:       'john@company.com',
      password:    await hash('emp@123'),
      role:        'EMPLOYEE',
      isActive:    true,
      jobTitle:    'Software Engineer',
      department:  'Engineering',
      phoneNumber: '+91-9100000001',
      employeeId:  'EMP-001',
      joiningDate: new Date('2023-01-10'),
      managerId:   admin.id,
    },
  });

  const emp2 = await prisma.user.create({
    data: {
      name:        'Sarah Smith',
      email:       'sarah@company.com',
      password:    await hash('emp@123'),
      role:        'EMPLOYEE',
      isActive:    true,
      jobTitle:    'UI/UX Designer',
      department:  'Design',
      phoneNumber: '+91-9100000002',
      employeeId:  'EMP-002',
      joiningDate: new Date('2023-03-05'),
      managerId:   admin.id,
    },
  });

  const emp3 = await prisma.user.create({
    data: {
      name:        'Michael Johnson',
      email:       'michael@company.com',
      password:    await hash('emp@123'),
      role:        'EMPLOYEE',
      isActive:    true,
      jobTitle:    'Marketing Analyst',
      department:  'Marketing',
      phoneNumber: '+91-9100000003',
      employeeId:  'EMP-003',
      joiningDate: new Date('2023-05-20'),
    },
  });

  const emp4 = await prisma.user.create({
    data: {
      name:        'Emily Brown',
      email:       'emily@company.com',
      password:    await hash('emp@123'),
      role:        'EMPLOYEE',
      isActive:    true,
      jobTitle:    'Finance Analyst',
      department:  'Finance',
      phoneNumber: '+91-9100000004',
      employeeId:  'EMP-004',
      joiningDate: new Date('2023-07-01'),
    },
  });

  const emp5 = await prisma.user.create({
    data: {
      name:        'Ravi Kumar',
      email:       'ravi@company.com',
      password:    await hash('emp@123'),
      role:        'EMPLOYEE',
      isActive:    true,
      jobTitle:    'Operations Manager',
      department:  'Operations',
      phoneNumber: '+91-9100000005',
      employeeId:  'EMP-005',
      joiningDate: new Date('2022-10-15'),
    },
  });

  console.log('✅ Users created:', [admin, hrManager, hrStaff, itAdmin, itSupport, emp1, emp2, emp3, emp4, emp5].length);

  // ── Assets ─────────────────────────────────────────────────────────────────
  console.log('📦 Creating assets...');

  const assets = await Promise.all([
    prisma.asset.create({ data: { serialNumber: 'AST-DELL-001', assetName: 'Dell Laptop XPS 15', assetType: 'Laptop', description: '16GB RAM, 512GB SSD, i7 processor', assetStatus: 'ASSIGNED', assignedToId: emp1.id, assignedDate: new Date('2023-01-12') } }),
    prisma.asset.create({ data: { serialNumber: 'AST-MAC-001',  assetName: 'MacBook Pro 14"',    assetType: 'Laptop', description: 'M2 chip, 16GB RAM, 512GB SSD',    assetStatus: 'ASSIGNED', assignedToId: emp2.id, assignedDate: new Date('2023-03-06') } }),
    prisma.asset.create({ data: { serialNumber: 'AST-HP-001',   assetName: 'HP EliteBook 840',   assetType: 'Laptop', description: '8GB RAM, 256GB SSD',               assetStatus: 'ASSIGNED', assignedToId: emp3.id, assignedDate: new Date('2023-05-22') } }),
    prisma.asset.create({ data: { serialNumber: 'AST-LG-001',   assetName: 'LG 27" 4K Monitor',  assetType: 'Monitor', description: 'IPS panel, 4K UHD resolution',     assetStatus: 'ASSIGNED', assignedToId: emp1.id, assignedDate: new Date('2023-01-12') } }),
    prisma.asset.create({ data: { serialNumber: 'AST-LG-002',   assetName: 'LG 24" FHD Monitor', assetType: 'Monitor', description: 'IPS panel, Full HD',               assetStatus: 'ASSIGNED', assignedToId: emp4.id, assignedDate: new Date('2023-07-03') } }),
    prisma.asset.create({ data: { serialNumber: 'AST-KEY-001',  assetName: 'Logitech MX Keys',   assetType: 'Peripheral', description: 'Wireless mechanical keyboard',  assetStatus: 'AVAILABLE' } }),
    prisma.asset.create({ data: { serialNumber: 'AST-MOU-001',  assetName: 'Logitech MX Master', assetType: 'Peripheral', description: 'Wireless ergonomic mouse',       assetStatus: 'MAINTENANCE' } }),
    prisma.asset.create({ data: { serialNumber: 'AST-PHN-001',  assetName: 'iPhone 14 Pro',      assetType: 'Phone', description: 'Company phone for field use',       assetStatus: 'ASSIGNED', assignedToId: emp5.id, assignedDate: new Date('2022-10-20') } }),
    prisma.asset.create({ data: { serialNumber: 'AST-TAB-001',  assetName: 'iPad Pro 12.9"',     assetType: 'Tablet', description: 'For presentations and design work', assetStatus: 'AVAILABLE' } }),
    prisma.asset.create({ data: { serialNumber: 'AST-DELL-002', assetName: 'Dell Laptop Vostro', assetType: 'Laptop', description: '8GB RAM, 256GB SSD',               assetStatus: 'RETIRED' } }),
  ]);

  console.log('✅ Assets created:', assets.length);

  // ── Tickets ────────────────────────────────────────────────────────────────
  console.log('🎫 Creating tickets...');

  // HR Tickets
  const hrTickets = await Promise.all([
    prisma.ticket.create({ data: {
      title: 'Salary Increment Request', summary: 'Requesting annual salary revision',
      description: 'I have been with the company for 2 years and my performance reviews have been excellent. I would like to discuss a salary revision.',
      department: 'HR', priority: 'HIGH', status: 'OPEN',
      createdById: emp1.id, assignedToId: hrManager.id,
    }}),
    prisma.ticket.create({ data: {
      title: 'Maternity Leave Application', summary: 'Requesting 6 months maternity leave',
      description: 'I am expecting in April 2026 and would like to apply for 6 months of maternity leave starting March 1st.',
      department: 'HR', priority: 'HIGH', status: 'IN_PROGRESS',
      createdById: emp2.id, assignedToId: hrManager.id,
    }}),
    prisma.ticket.create({ data: {
      title: 'Work From Home Request', summary: 'Request to work remotely for 2 weeks',
      description: 'Due to a family situation, I would like to request permission to work from home for the next 2 weeks.',
      department: 'HR', priority: 'MEDIUM', status: 'RESOLVED',
      createdById: emp3.id, assignedToId: hrStaff.id,
      resolvedAt: new Date('2026-02-28'),
    }}),
    prisma.ticket.create({ data: {
      title: 'Onboarding Documentation', summary: 'Missing documents for new hire onboarding',
      description: 'Need policy documents and NDA signed for the new engineering hire starting next Monday.',
      department: 'HR', priority: 'CRITICAL', status: 'OPEN',
      createdById: emp1.id, assignedToId: hrManager.id,
    }}),
    prisma.ticket.create({ data: {
      title: 'Leave Encashment Request', summary: 'Requesting encashment of 12 unused leave days',
      description: 'I have 12 remaining leave days from 2025 which I would like to encash as per company policy.',
      department: 'HR', priority: 'LOW', status: 'CLOSED',
      createdById: emp4.id, assignedToId: hrStaff.id,
      resolvedAt: new Date('2026-01-15'),
      closedAt:   new Date('2026-01-20'),
    }}),
  ]);

  // IT Tickets
  const itTickets = await Promise.all([
    prisma.ticket.create({ data: {
      title: 'Laptop Screen Broken', summary: 'Screen cracked after accidental drop',
      description: 'I accidentally dropped my Dell laptop and the screen is now cracked. I need a replacement or repair.',
      department: 'IT', priority: 'CRITICAL', status: 'IN_PROGRESS',
      requestType: 'ASSET', assetDescription: 'Dell Laptop XPS 15 (SN: AST-DELL-001)',
      createdById: emp1.id, assignedToId: itSupport.id,
    }}),
    prisma.ticket.create({ data: {
      title: 'VPN Access Required', summary: 'Need VPN for remote work setup',
      description: 'I need VPN credentials configured to work from home securely. IT needs to set up the VPN profile on my machine.',
      department: 'IT', priority: 'HIGH', status: 'RESOLVED',
      requestType: 'SERVICE', serviceDescription: 'VPN client setup and credentials required',
      createdById: emp2.id, assignedToId: itSupport.id,
      resolvedAt: new Date('2026-03-05'),
    }}),
    prisma.ticket.create({ data: {
      title: 'Adobe Creative Suite License', summary: 'Need design software license for new project',
      description: 'I need Adobe Photoshop and Illustrator for the upcoming rebranding project starting next week.',
      department: 'IT', priority: 'HIGH', status: 'OPEN',
      requestType: 'SERVICE', serviceDescription: 'Adobe Creative Cloud subscription needed',
      createdById: emp2.id, assignedToId: itAdmin.id,
    }}),
    prisma.ticket.create({ data: {
      title: 'New Monitor Request', summary: 'Requesting an additional monitor for dual-screen setup',
      description: 'To improve productivity, I would like an additional monitor to set up a dual-screen workstation.',
      department: 'IT', priority: 'MEDIUM', status: 'OPEN',
      requestType: 'ASSET', assetDescription: 'Monitor 24" FHD or higher',
      createdById: emp3.id, assignedToId: itAdmin.id,
    }}),
    prisma.ticket.create({ data: {
      title: 'Internet Speed Issues', summary: 'WiFi keeps dropping in conference rooms',
      description: 'The WiFi signal in conference rooms A and B is very weak and drops frequently during video calls.',
      department: 'IT', priority: 'HIGH', status: 'IN_PROGRESS',
      requestType: 'SERVICE', serviceDescription: 'Network infrastructure check needed for conference rooms',
      createdById: emp5.id, assignedToId: itSupport.id,
    }}),
    prisma.ticket.create({ data: {
      title: 'New Laptop for Onboarding', summary: 'New hire needs a laptop before Monday',
      description: 'New software engineer joining Monday needs a laptop configured with development tools.',
      department: 'IT', priority: 'CRITICAL', status: 'OPEN',
      requestType: 'ASSET', assetDescription: 'Dell XPS or MacBook Pro with dev tools pre-installed',
      createdById: emp1.id, assignedToId: itAdmin.id,
    }}),
  ]);

  console.log('✅ Tickets created:', [...hrTickets, ...itTickets].length);

  // ── Ticket Comments ────────────────────────────────────────────────────────
  console.log('💬 Adding ticket comments...');

  await Promise.all([
    prisma.ticketComment.create({ data: { content: 'I have reviewed your request. Can you share your last performance review document?', ticketId: hrTickets[0].id, userId: hrManager.id } }),
    prisma.ticketComment.create({ data: { content: 'Sure, I will share it shortly. Thank you!', ticketId: hrTickets[0].id, userId: emp1.id } }),
    prisma.ticketComment.create({ data: { content: 'Leave approved. Please fill the leave form in HR portal.', ticketId: hrTickets[1].id, userId: hrManager.id } }),
    prisma.ticketComment.create({ data: { content: 'VPN configured. Please restart your machine and try connecting.', ticketId: itTickets[1].id, userId: itSupport.id } }),
    prisma.ticketComment.create({ data: { content: 'Thank you! It is working now.', ticketId: itTickets[1].id, userId: emp2.id } }),
    prisma.ticketComment.create({ data: { content: 'We are ordering the screen. Will take 3-5 business days.', ticketId: itTickets[0].id, userId: itSupport.id } }),
  ]);

  console.log('✅ Comments added');

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log(`
  ✨ Database seeding completed!

  👤 Users (10):
  ├─ Admin:      admin@helpdesk.com     / admin@123
  ├─ HR Manager: hr@helpdesk.com        / hr@123
  ├─ HR Staff:   hr2@helpdesk.com       / hr@123
  ├─ IT Admin:   itadmin@helpdesk.com   / it@123
  ├─ IT Support: it@helpdesk.com        / it@123
  ├─ Employee 1: john@company.com       / emp@123
  ├─ Employee 2: sarah@company.com      / emp@123
  ├─ Employee 3: michael@company.com    / emp@123
  ├─ Employee 4: emily@company.com      / emp@123
  └─ Employee 5: ravi@company.com       / emp@123

  🎫 Tickets: 11  (5 HR, 6 IT)
  📦 Assets:  10  (7 Assigned/In-use, 2 Available, 1 Retired, 1 Maintenance)
  💬 Comments: 6
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
