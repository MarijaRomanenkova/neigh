/**
 * @module db/prisma
 * @description This file creates and exports a singleton instance of the Prisma client.
 * The Prisma client provides typesafe access to the database based on the schema defined in prisma/schema.prisma.
 * This singleton pattern ensures we reuse the same database connection throughout the application.
 */

import { PrismaClient } from '@prisma/client'

/**
 * A singleton instance of the Prisma client for database interactions.
 * Import this instance when database access is needed throughout the application.
 */
export const prisma = new PrismaClient() 
