/**
 * Configuration for Prisma ERD generation
 * Skips diagram generation in production environments like Vercel
 */
module.exports = {
  // Only generate diagrams in development environment
  shouldGenerateDiagrams: process.env.NODE_ENV !== 'production',
  // Additional config options can go here
}; 
