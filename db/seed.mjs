/**
 * @module db/seed.mjs
 * @description Database seeding script that populates the database with initial test data.
 * This is the ESM (ECMAScript Module) version of the seed script for environments that require ES modules.
 * This script creates categories, task statuses, users, tasks, and task assignments for testing purposes.
 * It first cleans any existing data to ensure a fresh start.
 * 
 * To run this script: node db/seed.mjs
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
 * 5. Creates tasks
 * 6. Creates task assignments
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

  // Create Tasks
  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        name: 'Fix Leaking Roof',
        slug: 'fix-leaking-roof',
        description: 'Need to fix a leaking roof in the kitchen',
        price: 250.00,
        categoryId: categories[0].id,
        statusId: statuses[0].id,
        images: [],
        createdById: users[0].id
      }
    }),
    prisma.task.create({
      data: {
        name: 'Garden Maintenance',
        slug: 'garden-maintenance',
        description: 'Monthly garden maintenance needed',
        price: 100.00,
        categoryId: categories[1].id,
        statusId: statuses[0].id,
        images: [],
        createdById: users[0].id
      }
    }),
    prisma.task.create({
      data: {
        name: 'Computer Setup',
        slug: 'computer-setup',
        description: 'Need help setting up new computer and transferring data',
        price: 80.00,
        categoryId: categories[2].id,
        statusId: statuses[1].id,
        images: [],
        createdById: users[0].id
      }
    }),
    prisma.task.create({
      data: {
        name: 'House Cleaning',
        slug: 'house-cleaning',
        description: 'Deep cleaning for 3-bedroom house',
        price: 150.00,
        categoryId: categories[3].id,
        statusId: statuses[2].id,
        images: [],
        createdById: users[0].id
      }
    }),
    prisma.task.create({
      data: {
        name: 'Moving Help',
        slug: 'moving-help',
        description: 'Need help moving furniture to new apartment',
        price: 200.00,
        categoryId: categories[4].id,
        statusId: statuses[0].id,
        images: [],
        createdById: users[0].id
      }
    })
  ])

  // Create Task Assignments
  const assignments = await Promise.all([
    prisma.taskAssignment.create({
      data: {
        taskId: tasks[0].id,
        clientId: users[0].id,
        contractorId: users[2].id,
        statusId: statuses[1].id
      }
    }),
    prisma.taskAssignment.create({
      data: {
        taskId: tasks[3].id,
        clientId: users[0].id,
        contractorId: users[2].id,
        statusId: statuses[2].id,
        completedAt: new Date()
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
