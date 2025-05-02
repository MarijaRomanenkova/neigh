const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Checking TaskAssignmentStatus table:');
  const statuses = await prisma.taskAssignmentStatus.findMany({
    orderBy: { order: 'asc' }
  });
  console.table(statuses);
  
  console.log('\nChecking TaskAssignments with status:');
  const assignmentsByStatus = await prisma.taskAssignment.groupBy({
    by: ['statusId'],
    _count: true
  });
  
  // Get all statuses for mapping IDs to names
  for (const status of assignmentsByStatus) {
    const statusDetails = await prisma.taskAssignmentStatus.findUnique({
      where: { id: status.statusId },
      select: { name: true }
    });
    console.log(`Status: ${statusDetails?.name || 'Unknown'}, Count: ${status._count}`);
  }

  // Check if ACCEPTED status exists
  const acceptedStatus = await prisma.taskAssignmentStatus.findFirst({
    where: { name: 'ACCEPTED' }
  });

  if (!acceptedStatus) {
    console.log('\nCreating ACCEPTED status:');
    // Find the max order
    const maxOrder = Math.max(...statuses.map(s => s.order));
    // Create the ACCEPTED status with the next order value
    const newStatus = await prisma.taskAssignmentStatus.create({
      data: {
        name: 'ACCEPTED',
        description: 'Task has been completed and accepted by the client',
        color: '#4ade80', // Green color
        order: maxOrder + 1
      }
    });
    console.log('Created new status:', newStatus);
  } else {
    console.log('\nACCEPTED status already exists:', acceptedStatus);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
