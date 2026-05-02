const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Specific API key patterns with high confidence
const SPECIFIC_PATTERNS = [
  {
    name: 'AWS Access Key',
    pattern: /AKIA[0-9A-Z]{16}/g,
    envVarName: 'AWS_ACCESS_KEY_ID'
  },
  {
    name: 'GitHub Token',
    pattern: /gh[ps]_[a-zA-Z0-9]{36,}/g,
    envVarName: 'GITHUB_TOKEN'
  },
  {
    name: 'Stripe Key',
    pattern: /sk_live_[a-zA-Z0-9]{24,}/g,
    envVarName: 'STRIPE_SECRET_KEY'
  },
  {
    name: 'OpenAI Key',
    pattern: /sk-[a-zA-Z0-9]{48}/g,
    envVarName: 'OPENAI_API_KEY'
  },
  {
    name: 'Generic API Key',
    pattern: /(?:api[_-]?key|apikey|api[_-]?secret)\s*[:=]\s*['"]([a-zA-Z0-9_\-]{20,})['"]/gi,
    envVarName: 'API_KEY'
  }
];

// Heuristic patterns - variable names that suggest secrets
const HEURISTIC_KEYWORDS = [
  'api_key', 'apikey', 'api_secret', 'apisecret',
  'secret_key', 'secretkey', 'access_token', 'accesstoken',
  'auth_token', 'authtoken', 'private_key', 'privatekey',
  'client_secret', 'clientsecret', 'password', 'passwd',
  'token', 'bearer', 'credential', 'auth'
];

// File extensions to scan
const SCANNABLE_EXTENSIONS = [
  '.js', '.ts', '.jsx', '.tsx',           // JavaScript/TypeScript
  '.py',                                   // Python
  '.java',                                 // Java
  '.go',                                   // Go
  '.rb',                                   // Ruby
  '.php',                                  // PHP
  '.json',                                 // JSON config
  '.yaml', '.yml',                         // YAML config
  '.md',                                   // Markdown
  '.txt',                                  // Text files
  '.xml',                                  // XML config
  '.ini', '.cfg', '.conf',                 // Config files
  '.sh', '.bash',                          // Shell scripts
  '.properties',                           // Properties files
  '.tfvars',                               // Terraform variables
  '.csv'                                   // CSV files
  // NOTE: .env files are explicitly excluded from scanning
];

// Directories to ignore (heavy/build directories)
const IGNORED_DIRS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'target',
  'out',
  'vendor',
  '.next',
  '.nuxt',
  'coverage'
];

/**
 * Calculate Shannon entropy of a string
 * Higher entropy suggests more randomness (like API keys)
 */
function calculateEntropy(str) {
  const len = str.length;
  const frequencies = {};
  
  for (let i = 0; i < len; i++) {
    const char = str[i];
    frequencies[char] = (frequencies[char] || 0) + 1;
  }
  
  let entropy = 0;
  for (const char in frequencies) {
    const p = frequencies[char] / len;
    entropy -= p * Math.log2(p);
  }
  
  return entropy;
}

/**
 * Check if a string looks like a secret based on entropy and length
 */
function looksLikeSecret(value) {
  // Must be at least 16 characters
  if (value.length < 16) return false;
  
  // Calculate entropy (random strings have higher entropy)
  const entropy = calculateEntropy(value);
  
  // Entropy threshold: ~3.5+ suggests good randomness
  // Length threshold: longer strings are more likely to be secrets
  if (entropy > 3.5 && value.length >= 20) return true;
  if (entropy > 4.0 && value.length >= 16) return true;
  
  // Check for mix of character types (alphanumeric + special chars)
  const hasLower = /[a-z]/.test(value);
  const hasUpper = /[A-Z]/.test(value);
  const hasDigit = /[0-9]/.test(value);
  const hasSpecial = /[_\-]/.test(value);
  
  const charTypeCount = [hasLower, hasUpper, hasDigit, hasSpecial].filter(Boolean).length;
  
  // If it has 3+ character types and decent length, likely a secret
  return charTypeCount >= 3 && value.length >= 20;
}

/**
 * Heuristic detection: find suspicious variable assignments
 */
function findHeuristicSecrets(content) {
  const findings = [];
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    // Match variable assignments with suspicious names
    const assignmentPattern = /(?:const|let|var|final|private|public)?\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*[:=]\s*['"]([^'"]{16,})['"]|([a-zA-Z_][a-zA-Z0-9_]*)\s*[:=]\s*['"]([^'"]{16,})['"]/gi;
    
    let match;
    while ((match = assignmentPattern.exec(line)) !== null) {
      const varName = (match[1] || match[3] || '').toLowerCase();
      const value = match[2] || match[4];
      
      // Check if variable name suggests a secret
      const isSuspiciousName = HEURISTIC_KEYWORDS.some(keyword => 
        varName.includes(keyword)
      );
      
      // Check if value looks like a secret
      const looksSecret = looksLikeSecret(value);
      
      if (isSuspiciousName && looksSecret) {
        findings.push({
          line: index + 1,
          keyType: 'Potential Secret',
          key: value,
          envVarName: varName.toUpperCase(),
          fullMatch: match[0],
          matchIndex: match.index,
          confidence: 'MEDIUM'
        });
      }
    }
  });
  
  return findings;
}

/**
 * Check if a file is an environment file that should be excluded from scanning
 */
function isEnvironmentFile(fileName) {
  return fileName === '.env' || fileName.startsWith('.env.');
}

/**
 * Recursively get all files in a directory
 */
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    
    // Skip heavy/build directories but allow hidden directories like .github, .cache
    if (IGNORED_DIRS.includes(file)) {
      return;
    }

    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      const ext = path.extname(file);
      const fileName = path.basename(file);
      
      // EXCLUDE environment files from secret scanning
      // They are checked separately for .gitignore safety
      if (isEnvironmentFile(fileName)) {
        return;
      }
      
      // Scan files with known extensions or files without extension (like Dockerfile)
      if (SCANNABLE_EXTENSIONS.includes(ext) || ext === '') {
        arrayOfFiles.push(filePath);
      }
    }
  });

  return arrayOfFiles;
}

/**
 * Scan a single file for API keys using multiple detection methods
 */
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const findings = [];
  const foundKeys = new Set(); // Avoid duplicates

  // Method 1: Specific pattern matching (high confidence)
  SPECIFIC_PATTERNS.forEach(({ name, pattern, envVarName }) => {
    const matches = content.matchAll(pattern);
    
    for (const match of matches) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const key = match[1] || match[0];
      
      // Avoid duplicates
      const fingerprint = `${filePath}:${lineNumber}:${key}`;
      if (foundKeys.has(fingerprint)) continue;
      foundKeys.add(fingerprint);
      
      findings.push({
        file: filePath,
        line: lineNumber,
        keyType: name,
        key: key,
        envVarName: envVarName,
        fullMatch: match[0],
        matchIndex: match.index,
        confidence: 'HIGH'
      });
    }
  });

  // Method 2: Heuristic detection (medium confidence)
  const heuristicFindings = findHeuristicSecrets(content);
  heuristicFindings.forEach(finding => {
    const fingerprint = `${filePath}:${finding.line}:${finding.key}`;
    if (!foundKeys.has(fingerprint)) {
      foundKeys.add(fingerprint);
      findings.push({
        file: filePath,
        ...finding
      });
    }
  });

  return findings;
}

/**
 * Scan a directory for hardcoded API keys
 */
function scanDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    throw new Error(`Directory not found: ${dirPath}`);
  }

  const files = getAllFiles(dirPath);
  const allFindings = [];

  files.forEach(file => {
    const findings = scanFile(file);
    allFindings.push(...findings);
  });

  return {
    totalFiles: files.length,
    findings: allFindings
  };
}

/**
 * Check if environment files are properly excluded in .gitignore
 */
function checkGitignoreSafety(dirPath) {
  const gitignorePath = path.join(dirPath, '.gitignore');
  
  // Find all .env* files in the directory (not recursive, just root level)
  const envFiles = [];
  try {
    const files = fs.readdirSync(dirPath);
    files.forEach(file => {
      if (file === '.env' || file.startsWith('.env.')) {
        envFiles.push(file);
      }
    });
  } catch (err) {
    return { safe: true, reason: 'no_access' };
  }
  
  // If no .env files exist, no check needed
  if (envFiles.length === 0) {
    return { safe: true, reason: 'no_env_files' };
  }
  
  // Check if .gitignore exists
  if (!fs.existsSync(gitignorePath)) {
    return {
      safe: false,
      reason: 'missing_gitignore',
      message: `Environment files found (${envFiles.join(', ')}) but .gitignore is missing`,
      envFiles
    };
  }
  
  // Check if .gitignore properly protects .env files
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  const lines = gitignoreContent.split('\n').map(line => line.trim());
  
  // Valid patterns that protect .env files
  const hasEnvProtection = lines.some(line => {
    return line === '.env' ||           // Exact match
           line === '.env*' ||          // Wildcard match
           line === '/.env' ||          // Root exact match
           line === '/.env*' ||         // Root wildcard match
           line.startsWith('.env');     // Any .env prefix
  });
  
  if (!hasEnvProtection) {
    return {
      safe: false,
      reason: 'env_not_ignored',
      message: `Environment files found (${envFiles.join(', ')}) but not protected in .gitignore`,
      envFiles
    };
  }
  
  return { safe: true, reason: 'properly_configured' };
}

/**
 * Check if a file is ignored by .gitignore
 */
function isFileIgnored(filePath, dirPath) {
  try {
    // Use git check-ignore to determine if file is ignored
    const result = execSync(`git -C "${dirPath}" check-ignore "${filePath}"`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return true; // File is ignored
  } catch (error) {
    // If git check-ignore returns non-zero, file is NOT ignored
    return false;
  }
}

/**
 * Check if a file should be ignored (based on common patterns)
 */
function shouldBeIgnored(filePath) {
  const fileName = path.basename(filePath);
  const dirName = path.dirname(filePath);
  
  // Files that should typically be ignored
  const shouldIgnorePatterns = [
    /^\.env/,                    // .env files
    /\.local\./,                 // .local. files
    /\.backup$/,                 // backup files
    /\.bak$/,                    // .bak files
    /\.old$/,                    // .old files
    /^backup/i,                  // backup directories
    /^snapshots?/i,              // snapshot directories
    /\.cache/,                   // cache directories
    /^\.cache/,                  // .cache directories
    /config.*\.local/i,          // local config files
    /secrets?/i,                 // files with 'secret' in name
    /credentials?/i,             // files with 'credential' in name
    /\.csv$/                     // CSV files (often contain sensitive data)
  ];
  
  return shouldIgnorePatterns.some(pattern =>
    pattern.test(fileName) || pattern.test(dirName)
  );
}

/**
 * Perform gitignore audit on findings
 */
function auditGitignore(findings, dirPath) {
  const notIgnored = [];
  const alreadyIgnored = [];
  
  findings.forEach(finding => {
    const relativePath = path.relative(dirPath, finding.file);
    const isIgnored = isFileIgnored(finding.file, dirPath);
    const shouldIgnore = shouldBeIgnored(finding.file);
    
    const auditEntry = {
      ...finding,
      isIgnored,
      shouldBeIgnored: shouldIgnore,
      relativePath
    };
    
    if (shouldIgnore && !isIgnored) {
      notIgnored.push(auditEntry);
    } else if (isIgnored) {
      alreadyIgnored.push(auditEntry);
    }
  });
  
  return {
    notIgnored,
    alreadyIgnored,
    hasIssues: notIgnored.length > 0
  };
}

module.exports = {
  scanDirectory,
  scanFile,
  checkGitignoreSafety,
  isFileIgnored,
  shouldBeIgnored,
  auditGitignore,
  SPECIFIC_PATTERNS
};

// Made with Bob
