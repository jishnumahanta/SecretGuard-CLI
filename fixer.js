const fs = require('fs');
const path = require('path');
const { scanDirectory } = require('./scanner');

/**
 * Generate a unique environment variable name based on context
 */
function generateEnvVarName(finding, index, allFindings) {
  const { envVarName, file } = finding;
  
  // Count how many times this env var name appears
  const sameNameCount = allFindings.filter(f => f.envVarName === envVarName).length;
  
  // If there are multiple keys with the same suggested name, add a suffix
  if (sameNameCount > 1) {
    const occurrenceIndex = allFindings
      .filter(f => f.envVarName === envVarName)
      .indexOf(finding);
    return `${envVarName}_${occurrenceIndex + 1}`;
  }
  
  return envVarName;
}

/**
 * Get the appropriate environment variable syntax for the file type
 */
function getEnvVarSyntax(filePath, envVarName) {
  const ext = path.extname(filePath);
  
  if (ext === '.js' || ext === '.ts' || ext === '.jsx' || ext === '.tsx') {
    return `process.env.${envVarName}`;
  } else if (ext === '.py') {
    return `os.environ.get('${envVarName}')`;
  } else if (ext === '.java') {
    return `System.getenv("${envVarName}")`;
  } else if (ext === '.go') {
    return `os.Getenv("${envVarName}")`;
  } else if (ext === '.rb') {
    return `ENV['${envVarName}']`;
  } else if (ext === '.php') {
    return `$_ENV['${envVarName}']`;
  } else {
    return `\${${envVarName}}`;
  }
}

/**
 * Fix all hardcoded keys in a directory
 */
function fixDirectory(dirPath, preview = false) {
  const scanResult = scanDirectory(dirPath);
  const { findings } = scanResult;
  
  if (findings.length === 0) {
    return {
      filesModified: 0,
      keysReplaced: 0,
      envVars: []
    };
  }
  
  // Generate unique env var names for all findings
  findings.forEach((finding, index) => {
    finding.uniqueEnvVarName = generateEnvVarName(finding, index, findings);
  });
  
  // Group findings by file
  const fileFindings = {};
  findings.forEach(finding => {
    if (!fileFindings[finding.file]) {
      fileFindings[finding.file] = [];
    }
    fileFindings[finding.file].push(finding);
  });
  
  const envVars = new Set();
  let filesModified = 0;
  let keysReplaced = 0;
  const changes = []; // Store changes for preview
  
  // Process each file
  Object.keys(fileFindings).forEach(filePath => {
    const originalContent = fs.readFileSync(filePath, 'utf8');
    let content = originalContent;
    const fileFindingsArray = fileFindings[filePath];
    const fileChanges = [];
    
    // Sort findings by position (reverse order to avoid offset issues)
    fileFindingsArray.sort((a, b) => (b.matchIndex || 0) - (a.matchIndex || 0));
    
    fileFindingsArray.forEach(finding => {
      const { fullMatch, uniqueEnvVarName, key, line } = finding;
      
      // Get the appropriate env var syntax
      const envVarSyntax = getEnvVarSyntax(filePath, uniqueEnvVarName);
      
      // Escape special regex characters in the key
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Try to replace the quoted key value while preserving structure
      let replaced = false;
      let beforeLine = '';
      let afterLine = '';
      
      // Get the line content for preview
      const lines = content.split('\n');
      if (line > 0 && line <= lines.length) {
        beforeLine = lines[line - 1];
      }
      
      // Try double quotes
      const doubleQuotePattern = new RegExp(`"${escapedKey}"`, 'g');
      if (content.includes(`"${key}"`)) {
        content = content.replace(doubleQuotePattern, envVarSyntax);
        replaced = true;
      }
      
      // Try single quotes
      const singleQuotePattern = new RegExp(`'${escapedKey}'`, 'g');
      if (!replaced && content.includes(`'${key}'`)) {
        content = content.replace(singleQuotePattern, envVarSyntax);
        replaced = true;
      }
      
      // If no quotes found, replace the full match
      if (!replaced) {
        content = content.replace(fullMatch, envVarSyntax);
      }
      
      // Get after line for preview
      const linesAfter = content.split('\n');
      if (line > 0 && line <= linesAfter.length) {
        afterLine = linesAfter[line - 1];
      }
      
      fileChanges.push({
        line,
        before: beforeLine,
        after: afterLine,
        envVar: uniqueEnvVarName
      });
      
      envVars.add(`${uniqueEnvVarName}=${key}`);
      keysReplaced++;
    });
    
    // Store changes for preview
    changes.push({
      file: filePath,
      changes: fileChanges
    });
    
    // Write the modified content back (only if not in preview mode)
    if (!preview) {
      fs.writeFileSync(filePath, content, 'utf8');
    }
    filesModified++;
  });
  
  // Create .env files (only if not in preview mode)
  if (!preview) {
    // Create .env.example file
    const envExamplePath = path.join(dirPath, '.env.example');
    const envContent = Array.from(envVars).map(line => {
      const [key] = line.split('=');
      return `${key}=your_${key.toLowerCase()}_here`;
    }).join('\n');
    
    fs.writeFileSync(envExamplePath, envContent + '\n', 'utf8');
    
    // Create .env file with actual values
    const envPath = path.join(dirPath, '.env');
    if (!fs.existsSync(envPath)) {
      fs.writeFileSync(envPath, Array.from(envVars).join('\n') + '\n', 'utf8');
    }
    
    // Ensure .gitignore properly excludes .env
    ensureGitignoreSafety(dirPath);
  }
  
  return {
    filesModified,
    keysReplaced,
    envVars: Array.from(envVars),
    changes: preview ? changes : []
  };
}

/**
 * Ensure environment files are properly excluded in .gitignore
 */
function ensureGitignoreSafety(dirPath) {
  const gitignorePath = path.join(dirPath, '.gitignore');
  
  // Check if .gitignore exists
  if (!fs.existsSync(gitignorePath)) {
    // Create new .gitignore with .env* wildcard entry
    fs.writeFileSync(gitignorePath, '.env*\nnode_modules/\n', 'utf8');
    return;
  }
  
  // Read existing .gitignore
  const content = fs.readFileSync(gitignorePath, 'utf8');
  const lines = content.split('\n').map(line => line.trim());
  
  // Check if .env files are already protected
  const hasEnvProtection = lines.some(line => {
    return line === '.env' ||           // Exact match
           line === '.env*' ||          // Wildcard match
           line === '/.env' ||          // Root exact match
           line === '/.env*';           // Root wildcard match
  });
  
  // Add .env* if not present (wildcard protects all .env variants)
  if (!hasEnvProtection) {
    const newContent = content.endsWith('\n') ? content + '.env*\n' : content + '\n.env*\n';
    fs.writeFileSync(gitignorePath, newContent, 'utf8');
  }
}

module.exports = {
  fixDirectory,
  ensureGitignoreSafety
};

// Made with Bob
