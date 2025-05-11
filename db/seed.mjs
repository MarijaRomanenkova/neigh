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
  try {
    // Clean up existing data using transaction for atomicity
    console.log('Cleaning up existing data...')
    await prisma.$transaction([
      prisma.taskAssignment.deleteMany(),
      prisma.task.deleteMany(),
      prisma.category.deleteMany(),
      prisma.user.deleteMany(),
      prisma.taskAssignmentStatus.deleteMany(),
    ])

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
      prisma.taskAssignmentStatus.create({
        data: {
          id: '38743520-6135-4506-a968-7ecd0bbc64ff', // Open status UUID
          name: 'OPEN',
          description: 'Task is open for contractors',
          color: '#4CAF50',
          order: 1
        }
      }),
      prisma.taskAssignmentStatus.create({
        data: {
          id: '2c043d52-6497-422a-98e0-97d6318ca317', // In Progress status UUID
          name: 'IN_PROGRESS',
          description: 'Work is in progress',
          color: '#FFC107',
          order: 2
        }
      }),
      prisma.taskAssignmentStatus.create({
        data: {
          id: 'a8b9c0d1-e2f3-4567-89ab-cdef01234567', // Completed status UUID
          name: 'COMPLETED',
          description: 'Task has been completed',
          color: '#9C27B0',
          order: 3
        }
      }),
      prisma.taskAssignmentStatus.create({
        data: {
          id: 'b1c2d3e4-f5a6-47b8-89c0-d1e2f3a4b5c6', // Accepted status UUID
          name: 'ACCEPTED',
          description: 'Task has been completed and accepted by the client',
          color: '#4ade80',
          order: 4
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
    console.log("Creating tasks...");
    const tasks = await Promise.all([
      prisma.task.create({
        data: {
          name: "Fix Leaking Roof",
          description: "Need to fix a leaking roof in the kitchen",
          price: 250,
          categoryId: categories[0].id,
          images: [],
          createdById: users[0].id,
        },
      }),
      prisma.task.create({
        data: {
          name: "Mow Lawn",
          description: "Need someone to mow the front and back lawn",
          price: 50,
          categoryId: categories[1].id,
          images: [],
          createdById: users[1].id,
        },
      }),
      prisma.task.create({
        data: {
          name: "Paint Fence",
          description: "Looking for someone to paint the garden fence",
          price: 150,
          categoryId: categories[2].id,
          images: [],
          createdById: users[2].id,
        },
      }),
      prisma.task.create({
        data: {
          name: "Clean Gutters",
          description: "Need gutters cleaned and checked for damage",
          price: 100,
          categoryId: categories[3].id,
          images: [],
          createdById: users[0].id,
        },
      }),
      prisma.task.create({
        data: {
          name: "Install Security Camera",
          description: "Looking for help installing a security camera system",
          price: 300,
          categoryId: categories[4].id,
          images: [],
          createdById: users[1].id,
        },
      }),
    ]);

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
  } catch (e) {
    console.error(e)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * Execute the seeding process and handle any errors
 */
main() 
