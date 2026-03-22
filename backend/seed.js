require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create Admin — Sarah
  const sarahHash = await bcrypt.hash('admin123', 10);
  const sarah = await prisma.user.upsert({
    where: { email: 'sarah@agency.com' },
    update: {},
    create: {
      name: 'Sarah',
      email: 'sarah@agency.com',
      passwordHash: sarahHash,
      role: 'ADMIN',
      isActive: true
    }
  });
  console.log('Admin created:', sarah.email);

  // Create Staff — Budi
  const budiHash = await bcrypt.hash('staff123', 10);
  const budi = await prisma.user.upsert({
    where: { email: 'budi@agency.com' },
    update: {},
    create: {
      name: 'Budi',
      email: 'budi@agency.com',
      passwordHash: budiHash,
      role: 'STAFF',
      isActive: true
    }
  });
  console.log('Staff created:', budi.email);

  // Create Staff — Rina
  const rinaHash = await bcrypt.hash('staff123', 10);
  const rina = await prisma.user.upsert({
    where: { email: 'rina@agency.com' },
    update: {},
    create: {
      name: 'Rina',
      email: 'rina@agency.com',
      passwordHash: rinaHash,
      role: 'STAFF',
      isActive: true
    }
  });
  console.log('Staff created:', rina.email);

  // Create Staff — Deni
  const deniHash = await bcrypt.hash('staff123', 10);
  const deni = await prisma.user.upsert({
    where: { email: 'deni@agency.com' },
    update: {},
    create: {
      name: 'Deni',
      email: 'deni@agency.com',
      passwordHash: deniHash,
      role: 'STAFF',
      isActive: true
    }
  });
  console.log('Staff created:', deni.email);

  // Create Staff — Sari
  const sariHash = await bcrypt.hash('staff123', 10);
  const sari = await prisma.user.upsert({
    where: { email: 'sari@agency.com' },
    update: {},
    create: {
      name: 'Sari',
      email: 'sari@agency.com',
      passwordHash: sariHash,
      role: 'STAFF',
      isActive: true
    }
  });
  console.log('Staff created:', sari.email);

  // Create a sample task assigned to Budi
  const task1 = await prisma.task.create({
    data: {
      title: 'Write client report Q1',
      description: 'Write the Q1 performance report for PT Maju Bersama. Include social media stats and ad spend summary.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: new Date('2026-03-24'),
      assignedToId: budi.id,
      createdById: sarah.id
    }
  });
  console.log('Sample task created:', task1.title);

  // Create a sample task assigned to Rina
  const task2 = await prisma.task.create({
    data: {
      title: 'Design social media banner',
      description: 'Create banner in 3 sizes: 1080x1080, 1080x1920, 1200x628',
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: new Date('2026-03-25'),
      assignedToId: rina.id,
      createdById: sarah.id
    }
  });
  console.log('Sample task created:', task2.title);

  // Create a sample task assigned to Sari
  const task3 = await prisma.task.create({
    data: {
      title: 'Send newsletter to client list',
      description: 'Send the March newsletter to all 240 subscribers using Mailchimp.',
      status: 'DONE',
      priority: 'LOW',
      dueDate: new Date('2026-03-26'),
      completedAt: new Date(),
      assignedToId: sari.id,
      createdById: sarah.id
    }
  });
  console.log('Sample task created:', task3.title);

  console.log('');
  console.log('Seed complete!');
  console.log('Users created: 5 (1 admin + 4 staff)');
  console.log('Tasks created: 3 sample tasks');
  console.log('');
  console.log('Login credentials:');
  console.log('  Admin  — sarah@agency.com  / admin123');
  console.log('  Staff  — budi@agency.com   / staff123');
  console.log('  Staff  — rina@agency.com   / staff123');
  console.log('  Staff  — deni@agency.com   / staff123');
  console.log('  Staff  — sari@agency.com   / staff123');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });