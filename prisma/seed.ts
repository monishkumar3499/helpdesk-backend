import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  // -------------------------
  // Clear existing data
  // -------------------------
  await prisma.asset.deleteMany()
  await prisma.ticket.deleteMany()
  await prisma.user.deleteMany()

  // -------------------------
  // Create Users
  // -------------------------
  const admin = await prisma.user.create({
    data: {
      id: 'admin001',
      name: 'Admin User',
      email: 'admin@helpdesk.com',
      password: 'admin123',
      role: 'ADMIN',
      isActive: true,
    },
  })

  const hr = await prisma.user.create({
    data: {
      id: 'hr001',
      name: 'HR Manager',
      email: 'hr@helpdesk.com',
      password: 'hr123',
      role: 'HR',
      isActive: true,
    },
  })

  const it = await prisma.user.create({
    data: {
      id: 'it001',
      name: 'IT Support',
      email: 'it@helpdesk.com',
      password: 'it123',
      role: 'IT',
      isActive: true,
    },
  })

  const emp1 = await prisma.user.create({
    data: {
      id: 'emp001',
      name: 'John Doe',
      email: 'john@company.com',
      password: 'emp123',
      role: 'EMPLOYEE',
      isActive: true,
    },
  })

  const emp2 = await prisma.user.create({
    data: {
      id: 'emp002',
      name: 'Sarah Smith',
      email: 'sarah@company.com',
      password: 'emp123',
      role: 'EMPLOYEE',
      isActive: true,
    },
  })

  console.log('✅ Users created')

  // -------------------------
  // Create Tickets
  // -------------------------
  const tickets = await prisma.ticket.createMany({
    data: [
      {
        title: 'Laptop not starting',
        summary: 'Laptop shows black screen',
        department: 'IT',
        priority: 'HIGH',
        status: 'OPEN',
        createdById: emp1.id,
        assignedToId: it.id,
      },
      {
        title: 'Salary slip request',
        summary: 'Need last month salary slip',
        department: 'HR',
        priority: 'LOW',
        status: 'OPEN',
        createdById: emp2.id,
        assignedToId: hr.id,
      },
      {
        title: 'VPN access required',
        summary: 'Need VPN for remote work',
        department: 'IT',
        priority: 'LOW',
        status: 'IN_PROGRESS',
        createdById: emp1.id,
        assignedToId: it.id,
      },
    ],
  })

  console.log('✅ Tickets created')

  // -------------------------
  // Create Assets
  // -------------------------
  await prisma.asset.createMany({
    data: [
      {
        serialNumber: 'AST001',
        assetName: 'Dell Laptop',
        assetType: 'Computer',
        assetStatus: 'ASSIGNED',
        assignedToId: emp1.id,
        assignedDate: new Date(),
      },
      {
        serialNumber: 'AST002',
        assetName: 'HP Printer',
        assetType: 'Printer',
        assetStatus: 'ASSIGNED',
        assignedToId: emp2.id,
        assignedDate: new Date(),
      },
      {
        serialNumber: 'AST003',
        assetName: 'USB Keyboard',
        assetType: 'Peripheral',
        assetStatus: 'AVAILABLE',
      },
    ],
  })

  console.log('✅ Assets created')

  console.log(`
-----------------------------------
🎉 Database seeded successfully
-----------------------------------

Users:
 Admin → admin@helpdesk.com
 HR → hr@helpdesk.com
 IT → it@helpdesk.com
 Employee → john@company.com

Password: emp123
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