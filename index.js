#!/usr/bin/env node

const { scanDirectory, checkGitignoreSafety, isFileIgnored, auditGitignore } = require('./scanner');
const { fixDirectory } = require('./fixer');
const { reportScanResults, reportFixResults, reportError, displayHelp } = require('./reporter');

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];
const hasPreviewFlag = args.includes('--preview') || args.includes('-p');
const targetDir = args.find(arg => !arg.startsWith('--') && !arg.startsWith('-') && arg !== command) || '.';

/**
 * Main CLI handler
 */
function main() {
  try {
    switch (command) {
      case 'scan':
        handleScan(targetDir);
        break;
      
      case 'fix':
        handleFix(targetDir, hasPreviewFlag);
        break;
      
      case 'help':
      case '--help':
      case '-h':
        displayHelp();
        break;
      
      default:
        displayHelp();
        if (command) {
          console.log(`\n❌ Unknown command: ${command}\n`);
        }
        process.exit(1);
    }
  } catch (error) {
    reportError(error);
    process.exit(1);
  }
}

/**
 * Handle scan command
 */
function handleScan(dirPath) {
  const result = scanDirectory(dirPath);
  
  // Add gitignore status to each finding
  result.findings.forEach(finding => {
    finding.isIgnored = isFileIgnored(finding.file, dirPath);
  });
  
  // Perform gitignore audit
  const gitignoreAudit = auditGitignore(result.findings, dirPath);
  const gitignoreCheck = checkGitignoreSafety(dirPath);
  
  reportScanResults(result, gitignoreCheck, gitignoreAudit);
  
  // Exit with error code if keys found or gitignore unsafe
  if (result.findings.length > 0 || !gitignoreCheck.safe) {
    process.exit(1);
  }
}

/**
 * Handle fix command
 */
function handleFix(dirPath, preview = false) {
  const result = fixDirectory(dirPath, preview);
  
  // Check gitignore safety after fix (only if not in preview mode)
  const gitignoreCheck = !preview ? checkGitignoreSafety(dirPath) : null;
  
  reportFixResults(result, preview, gitignoreCheck);
}

// Run the CLI
main();

// Made with Bob
