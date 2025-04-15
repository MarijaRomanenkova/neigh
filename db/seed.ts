/**
 * @module db/seed
 * @description Database seeding script that populates the database with initial test data.
 * This script creates categories, task statuses, and users for testing purposes.
 * It first cleans any existing data to ensure a fresh start.
 * 
 * To run this script: npx ts-node db/seed.ts
 */

import { PrismaClient } from '@prisma/client'
import { hashSync } from 'bcrypt-ts'

const prisma = new PrismaClient()

/**
 * Main seeding function that populates the database with test data.
 * Executes in sequence:
 * 1. Cleans existing data
 * 2. Creates categories
 * 3. Creates task statuses
 * 4. Creates users with hashed passwords
 * 
 * @async
 * @returns {Promise<void>}
 */
async function main() {
  // Clean up existing data
  console.log('Cleaning up existing data...')
  await prisma.taskAssignment.deleteMany({})
  await prisma.task.deleteMany({})
  await prisma.user.deleteMany({})
  await prisma.category.deleteMany({})
  await prisma.taskStatus.deleteMany({})

  console.log('Seeding database...')

  // Create Categories
  const categories = await Promise.all([
    prisma.category.create({
      data: { name: 'Home Repair', description: 'House maintenance and repairs' }
    }),
    prisma.category.create({
      data: { name: 'Garden', description: 'Gardening and landscaping services' }
    }),
    prisma.category.create({
      data: { name: 'Tutoring', description: 'teaching and tutoring services' }
    }),
    prisma.category.create({
      data: { name: 'Cleaning', description: 'House and office cleaning' }
    }),
    prisma.category.create({
      data: { name: 'Moving', description: 'Moving and transportation services' }
    }),
  ])

  // Create Task Statuses
  const statuses = await Promise.all([
    prisma.taskStatus.create({
      data: {
        name: 'OPEN',
        description: 'Task is open for contractors',
        color: '#4CAF50',
        order: 1
      }
    }),
    prisma.taskStatus.create({
      data: {
        name: 'IN_PROGRESS',
        description: 'Work is in progress',
        color: '#FFC107',
        order: 2
      }
    }),
    prisma.taskStatus.create({
      data: {
        name: 'COMPLETED',
        description: 'Task has been completed',
        color: '#9C27B0',
        order: 3
      }
    })
  ])

  // Create password for users (same for all to make testing easier)
  const password = hashSync('password123', 10)

  // Create Users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: 'John Client',
        email: 'john@example.com',
        password,
        role: 'user'
      }
    }),
    prisma.user.create({
      data: {
        name: 'Jane Admin',
        email: 'jane@example.com',
        password,
        role: 'admin'
      }
    }),
    prisma.user.create({
      data: {
        name: 'Bob Builder',
        email: 'bob@example.com',
        password,
        role: 'user'
      }
    })
  ])

  console.log('Database seeded successfully!')
}

/**
 * Execute the seeding process and handle any errors
 */
main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


