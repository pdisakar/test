const fs = require('fs');
const path = require('path');

// Recursively find all .tsx and .ts files
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findFiles(filePath, fileList);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Update a single file
function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Check if file needs updating
  if (!content.includes('http://localhost:3001')) {
    return false;
  }
  
  console.log(`Updating: ${path.basename(filePath)}`);
  
  // Add import if not present
  if (!content.includes("from '@/app/admin/lib/api-config'")) {
    const lines = content.split('\n');
    let lastImportIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ')) {
        lastImportIndex = i;
      }
    }
    
    if (lastImportIndex !== -1) {
      lines.splice(lastImportIndex + 1, 0, "import { getApiUrl, getImageUrl } from '@/app/admin/lib/api-config';");
      content = lines.join('\n');
      modified = true;
    }
  }
  
  // Replace API URLs
  content = content.replace(/fetch\('http:\/\/localhost:3001\/api\/([^']+)'\)/g, "fetch(getApiUrl('$1'))");
  content = content.replace(/fetch\("http:\/\/localhost:3001\/api\/([^"]+)"\)/g, 'fetch(getApiUrl("$1"))');
  content = content.replace(/fetch\(`http:\/\/localhost:3001\/api\/([^`]+)`\)/g, 'fetch(getApiUrl(`$1`))');
  
  // Replace image URLs
  content = content.replace(/return `http:\/\/localhost:3001\$\{([^}]+)\}`;/g, 'return getImageUrl($1);');
  content = content.replace(/`http:\/\/localhost:3001\$\{([^}]+)\}`/g, 'getImageUrl($1)');
  
  if (modified || content !== fs.readFileSync(filePath, 'utf8')) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Updated: ${path.basename(filePath)}`);
    return true;
  }
  
  return false;
}

// Main execution
const adminDir = path.join(__dirname, 'client', 'app', 'admin');
console.log(`Scanning: ${adminDir}\n`);

const files = findFiles(adminDir);
let updatedCount = 0;

files.forEach(file => {
  if (updateFile(file)) {
    updatedCount++;
  }
});

console.log(`\n✅ Done! Updated ${updatedCount} files.`);
