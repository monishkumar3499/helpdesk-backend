import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import * as argon2 from 'argon2'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  // ─── Clear Existing Data ──────────────────────────────────────────────────
  console.log('🗑️  Clearing existing data...')
  await prisma.ticketComment.deleteMany()
  await prisma.asset.deleteMany()
  await prisma.ticket.deleteMany()
  await prisma.user.deleteMany()

  // ─── Hash helper ─────────────────────────────────────────────────────────
  const hash = (pw: string) => argon2.hash(pw)

  // ─── Users ────────────────────────────────────────────────────────────────
  console.log('👤 Creating users...')

  const admin = await prisma.user.create({
    data: {
      id: 'admin001',
      name: 'System Admin',
      email: 'admin@helpdesk.com',
      password: await hash('admin123'),
      role: 'ADMIN',
      jobTitle: 'IT Infrastructure Lead',
      department: 'IT',
      isActive: true,
    },
  })

  const hrManager = await prisma.user.create({
    data: {
      id: 'hr_mgr001',
      name: 'Toby Flenderson',
      email: 'hr@helpdesk.com',
      password: await hash('hr123'),
      role: 'HR',
      jobTitle: 'HR Manager',
      department: 'HR',
      employeeId: 'EMP-0001',
      isActive: true,
    },
  })

  const itSupport = await prisma.user.create({
    data: {
      id: 'it_sup001',
      name: 'Dwight Schrute',
      email: 'dwight@helpdesk.com',
      password: await hash('it123'),
      role: 'IT_SUPPORT',
      jobTitle: 'Technical Support Specialist',
      department: 'IT',
      employeeId: 'EMP-0002',
      isActive: true,
      managerId: admin.id,
    },
  })

  const jim = await prisma.user.create({
    data: {
      id: 'emp001',
      name: 'Jim Halpert',
      email: 'jim@company.com',
      password: await hash('emp123'),
      role: 'EMPLOYEE',
      jobTitle: 'Senior Sales Representative',
      department: 'Marketing',
      employeeId: 'EMP-1001',
      phoneNumber: '9876543210',
      isActive: true,
      managerId: admin.id,
    },
  })

  const pam = await prisma.user.create({
    data: {
      id: 'emp002',
      name: 'Pam Beesly',
      email: 'pam@company.com',
      password: await hash('emp123'),
      role: 'EMPLOYEE',
      jobTitle: 'Office Administrator',
      department: 'Operations',
      employeeId: 'EMP-1002',
      phoneNumber: '9123456789',
      isActive: true,
      managerId: admin.id,
    },
  })

  const ryan = await prisma.user.create({
    data: {
      id: 'emp003',
      name: 'Ryan Howard',
      email: 'ryan@company.com',
      password: await hash('emp123'),
      role: 'EMPLOYEE',
      jobTitle: 'Business Development',
      department: 'Finance',
      employeeId: 'EMP-1003',
      isActive: true,
      managerId: admin.id,
    },
  })

  console.log('✅ Users created')

  // ─── Tickets ──────────────────────────────────────────────────────────────
  console.log('🎫 Creating tickets...')

  // IT Tickets
  const t1 = await prisma.ticket.create({
    data: {
      title: 'Broken Laptop Screen',
      summary: 'Screen flickering and dead pixels',
      description: 'The laptop screen started flickering this morning. Now there are vertical lines across the left side. Needs urgent hardware replacement.',
      department: 'IT',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      requestType: 'ASSET',
      assetDescription: 'Dell Latitude 5420 (Serial: AST001)',
      createdById: jim.id,
      assignedToId: itSupport.id,
    },
  })

  const t2 = await prisma.ticket.create({
    data: {
      title: 'New Monitor Request',
      summary: 'Secondary monitor for development setup',
      description: 'Requesting a secondary 24-inch monitor for improved productivity during coding tasks.',
      department: 'IT',
      priority: 'LOW',
      status: 'RESOLVED',
      requestType: 'ASSET',
      assetDescription: '24-inch Monitor (any brand)',
      createdById: jim.id,
      assignedToId: admin.id,
      resolvedAt: new Date(Date.now() - 2 * 86400000), // 2 days ago
    },
  })

  const t3 = await prisma.ticket.create({
    data: {
      title: 'VPN Access Issue',
      summary: 'Unable to connect to company VPN from home',
      description: 'Since Monday I have been unable to connect to the VPN. I have tried reinstalling the client but the issue persists.',
      department: 'IT',
      priority: 'CRITICAL',
      status: 'OPEN',
      requestType: 'SERVICE',
      serviceDescription: 'Network / VPN',
      createdById: pam.id,
      assignedToId: itSupport.id,
    },
  })

  const t4 = await prisma.ticket.create({
    data: {
      title: 'Printer Not Working',
      summary: 'Office printer offline, cannot print documents',
      description: 'The shared printer in the main office shows as offline. Multiple employees are affected. Tried restarting — no help.',
      department: 'IT',
      priority: 'MEDIUM',
      status: 'ON_HOLD',
      requestType: 'ASSET',
      assetDescription: 'HP LaserJet Pro (3rd Floor)',
      createdById: ryan.id,
      assignedToId: itSupport.id,
    },
  })

  // HR Tickets
  const t5 = await prisma.ticket.create({
    data: {
      title: 'Health Insurance Inquiry',
      summary: 'Update beneficiaries for family insurance plan',
      description: 'I need to update my health insurance plan to add my spouse and child as beneficiaries. Please let me know the paperwork needed.',
      department: 'HR',
      priority: 'MEDIUM',
      status: 'OPEN',
      requestType: 'SERVICE',
      serviceDescription: 'Benefits Management',
      createdById: pam.id,
      assignedToId: hrManager.id,
    },
  })

  const t6 = await prisma.ticket.create({
    data: {
      title: 'Leave Balance Query',
      summary: 'Incorrect casual leave balance displayed',
      description: 'My casual leave balance shows 3 days but I should have 8 remaining. Please review and correct it.',
      department: 'HR',
      priority: 'LOW',
      status: 'RESOLVED',
      requestType: 'SERVICE',
      serviceDescription: 'Leave Management',
      createdById: jim.id,
      assignedToId: hrManager.id,
      resolvedAt: new Date(Date.now() - 86400000), // 1 day ago
    },
  })

  const t7 = await prisma.ticket.create({
    data: {
      title: 'Salary Slip Not Received',
      summary: 'April salary slip missing from portal',
      description: 'I did not receive my April salary slip on the portal. Other colleagues received theirs. Please look into this.',
      department: 'HR',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      requestType: 'SERVICE',
      serviceDescription: 'Payroll',
      createdById: ryan.id,
      assignedToId: hrManager.id,
    },
  })

  const t8 = await prisma.ticket.create({
    data: {
      title: 'Onboarding Documents Pending',
      summary: 'New joiner documents not submitted yet',
      description: 'Ryan joined 2 weeks ago and still has pending onboarding documents. Please expedite the process.',
      department: 'HR',
      priority: 'CRITICAL',
      status: 'OPEN',
      requestType: 'SERVICE',
      serviceDescription: 'Onboarding',
      createdById: admin.id,
      assignedToId: hrManager.id,
    },
  })

  const t9 = await prisma.ticket.create({
    data: {
      title: 'Work from Home Policy Clarification',
      summary: 'WFH policy rules unclear for new employees',
      description: 'Requesting a clear WFH policy document for all employees who joined after January 2025.',
      department: 'HR',
      priority: 'LOW',
      status: 'CLOSED',
      requestType: 'SERVICE',
      serviceDescription: 'Policy Clarification',
      createdById: pam.id,
      assignedToId: hrManager.id,
      resolvedAt: new Date(Date.now() - 5 * 86400000),
      closedAt: new Date(Date.now() - 4 * 86400000),
    },
  })

  console.log('✅ Tickets created')

  // ─── Comments ─────────────────────────────────────────────────────────────
  console.log('💬 Creating comments...')

  await prisma.ticketComment.createMany({
    data: [
      {
        content: 'I have ordered a replacement screen. Should arrive in 1–2 business days.',
        ticketId: t1.id,
        userId: itSupport.id,
      },
      {
        content: 'Thanks Dwight! Will bring it in once the part arrives.',
        ticketId: t1.id,
        userId: jim.id,
      },
      {
        content: 'Hi Pam, please fill out Form-B on the HR portal and upload under this ticket.',
        ticketId: t5.id,
        userId: hrManager.id,
      },
      {
        content: 'Done! I have uploaded the required forms. Please review.',
        ticketId: t5.id,
        userId: pam.id,
      },
      {
        content: 'Your leave balance has been corrected to 8 days. Please verify.',
        ticketId: t6.id,
        userId: hrManager.id,
      },
      {
        content: 'Checked — all good now! Thank you.',
        ticketId: t6.id,
        userId: jim.id,
      },
      {
        content: 'We are waiting on the driver from HP. Will update once received.',
        ticketId: t4.id,
        userId: itSupport.id,
      },
      {
        content: 'Payroll team is investigating. We will update by EOD.',
        ticketId: t7.id,
        userId: hrManager.id,
      },
    ],
  })

  console.log('✅ Comments created')

  // ─── Assets ───────────────────────────────────────────────────────────────
  console.log('💻 Creating assets...')

  await prisma.asset.createMany({
    data: [
      {
        serialNumber: 'AST001',
        assetName: 'Dell Latitude 5420',
        assetType: 'Laptop',
        description: '14-inch laptop, Intel i7, 16GB RAM, 512GB SSD',
        assetStatus: 'ASSIGNED',
        assignedToId: jim.id,
        assignedDate: new Date(Date.now() - 30 * 86400000),
      },
      {
        serialNumber: 'AST002',
        assetName: 'Logitech MX Master 3S',
        assetType: 'Peripheral',
        description: 'Wireless ergonomic mouse',
        assetStatus: 'ASSIGNED',
        assignedToId: pam.id,
        assignedDate: new Date(Date.now() - 20 * 86400000),
      },
      {
        serialNumber: 'AST003',
        assetName: 'LG 24" Monitor',
        assetType: 'Monitor',
        description: '24-inch Full HD IPS monitor',
        assetStatus: 'AVAILABLE',
      },
      {
        serialNumber: 'AST004',
        assetName: 'MacBook Pro 14"',
        assetType: 'Laptop',
        description: 'Apple M3 chip, 16GB RAM, 256GB SSD',
        assetStatus: 'ASSIGNED',
        assignedToId: itSupport.id,
        assignedDate: new Date(Date.now() - 60 * 86400000),
      },
      {
        serialNumber: 'AST005',
        assetName: 'HP LaserJet Pro',
        assetType: 'Printer',
        description: 'Mono LaserJet printer, shared on 3rd floor',
        assetStatus: 'MAINTENANCE',
      },
      {
        serialNumber: 'AST006',
        assetName: 'Dell OptiPlex 7090',
        assetType: 'Desktop',
        description: 'Desktop PC, Intel i5, 8GB RAM',
        assetStatus: 'AVAILABLE',
      },
    ],
  })

  console.log('✅ Assets created')

  console.log(`
────────────────────────────────────────
🎉 Database seeded successfully!
────────────────────────────────────────

🔑 Login Credentials:
   Admin      → admin@helpdesk.com    / admin123
   HR Manager → hr@helpdesk.com       / hr123
   IT Support → dwight@helpdesk.com   / it123
   Employee 1 → jim@company.com       / emp123
   Employee 2 → pam@company.com       / emp123
   Employee 3 → ryan@company.com      / emp123

📊 Seeded:
   • 6 users (1 admin, 1 HR, 1 IT support, 3 employees)
   • 9 tickets (4 IT, 5 HR — mixed statuses & priorities)
   • 8 comments across tickets
   • 6 assets (laptops, monitors, peripherals)
────────────────────────────────────────
`)
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })