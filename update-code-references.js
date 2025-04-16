const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function executeCommand(command) {
  console.log(`Executing: ${command}`);
  try {
    const output = execSync(command, { encoding: 'utf8' });
    return output;
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    throw error;
  }
}

function findFiles(pattern) {
  return executeCommand(`find . -type f -not -path "*/node_modules/*" -not -path "*/.git/*" -name "${pattern}"`)
    .trim()
    .split('\n')
    .filter(file => file);
}

function replaceInFile(filePath, oldText, newText) {
  console.log(`Checking ${filePath}...`);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(oldText)) {
      const updatedContent = content.replace(new RegExp(oldText, 'g'), newText);
      fs.writeFileSync(filePath, updatedContent);
      console.log(`  Updated: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`  Error updating ${filePath}: ${error.message}`);
    return false;
  }
}

function moveFile(oldPath, newPath) {
  console.log(`Moving: ${oldPath} -> ${newPath}`);
  try {
    // Ensure directory exists
    const dir = path.dirname(newPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Move the file
    fs.renameSync(oldPath, newPath);
    console.log(`  Successfully moved ${oldPath} to ${newPath}`);
    return true;
  } catch (error) {
    console.error(`  Error moving ${oldPath}: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('Updating code references from TaskAssignmentStatus to TaskAssignmentStatus...');
  
  // 1. Move the task-assignment-status.actions.ts file to task-assignment-status.actions.ts
  moveFile(
    'lib/actions/task-assignment-status.actions.ts',
    'lib/actions/task-assignment-status.actions.ts'
  );
  
  // 2. Find all TypeScript and JavaScript files
  const files = [
    ...findFiles("*.ts"),
    ...findFiles("*.tsx"),
    ...findFiles("*.js"),
    ...findFiles("*.jsx")
  ];
  
  // 3. Replace references in files
  const replacements = [
    { from: 'taskAssignmentStatus', to: 'taskAssignmentStatus' },
    { from: 'TaskAssignmentStatus', to: 'TaskAssignmentStatus' },
    { from: 'getAllTaskAssignmentStatuses', to: 'getAllTaskAssignmentStatuses' },
    { from: 'getTaskAssignmentStatusByName', to: 'getTaskAssignmentStatusByName' },
    { from: 'task-assignment-status.actions', to: 'task-assignment-status.actions' }
  ];
  
  let updatedFiles = 0;
  for (const file of files) {
    let fileUpdated = false;
    for (const { from, to } of replacements) {
      if (replaceInFile(file, from, to)) {
        fileUpdated = true;
      }
    }
    if (fileUpdated) {
      updatedFiles++;
    }
  }
  
  console.log(`\nUpdated ${updatedFiles} files.`);
  console.log('\nNow run the following commands to finalize the changes:');
  console.log('1. npm run build (to check for any TypeScript errors)');
  console.log('2. npm test (to make sure everything still works)');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  }); 
