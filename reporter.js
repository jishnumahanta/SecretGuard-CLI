const chalk = require('chalk');
const { calculateRiskScore, getRiskLevel, getImpactExplanation, assessOverallRisk } = require('./risk-scorer');

/**
 * Get severity level for a key type
 */
function getSeverity(keyType) {
  const severityMap = {
    'AWS Access Key': 'HIGH',
    'GitHub Token': 'HIGH',
    'Stripe Key': 'HIGH',
    'OpenAI Key': 'HIGH',
    'Generic API Key': 'MEDIUM'
  };
  return severityMap[keyType] || 'MEDIUM';
}

/**
 * Get color for severity level
 */
function getSeverityColor(severity) {
  return severity === 'HIGH' ? chalk.red : chalk.yellow;
}

/**
 * Display scan results - clean and concise
 */
function reportScanResults(scanResult, gitignoreCheck = null, gitignoreAudit = null) {
  const { totalFiles, findings } = scanResult;
  
  // Header
  console.log('\n' + chalk.bold.cyan('🛡️  SecretGuard CLI'));
  console.log();
  
  if (findings.length === 0) {
    console.log(chalk.green.bold('✓ No secrets detected') + chalk.gray(` (${totalFiles} files scanned)`));
    console.log();
    return;
  }
  
  // Calculate overall risk
  const riskAssessment = assessOverallRisk(findings);
  const riskColor = riskAssessment.color === 'red' ? chalk.red : chalk.yellow;
  
  // Scan Summary
  console.log(chalk.white('Scan Summary:'));
  console.log(chalk.gray(`  Files scanned: ${totalFiles}`));
  console.log(chalk.gray(`  Secrets found: ${findings.length}`));
  console.log(chalk.gray(`  Risk level: `) + riskColor.bold(riskAssessment.level));
  
  // Findings
  console.log('\n' + chalk.white('--- Findings ---'));
  displayCleanFindings(findings);
  
  // Gitignore Audit (if applicable)
  if (gitignoreAudit && gitignoreAudit.notIgnored.length > 0) {
    console.log('\n' + chalk.white('--- Gitignore Audit ---'));
    displayCleanGitignoreAudit(gitignoreAudit);
  }
  
  // Action
  console.log('\n' + chalk.white('--- Action ---'));
  console.log(chalk.cyan('💡 Run: ') + chalk.cyan.bold('secretguard fix <dir>'));
  
  // Git Security Warning (always at the end)
  if (gitignoreCheck && !gitignoreCheck.safe) {
    console.log('\n' + chalk.white('--- Git Security ---'));
    displayCleanGitignoreWarning(gitignoreCheck);
  }
  
  console.log();
}

/**
 * Display findings in clean format
 */
function displayCleanFindings(findings) {
  // Group findings by file
  const fileGroups = {};
  findings.forEach(finding => {
    if (!fileGroups[finding.file]) {
      fileGroups[finding.file] = [];
    }
    fileGroups[finding.file].push(finding);
  });
  
  Object.keys(fileGroups).forEach(file => {
    console.log('\n' + chalk.cyan(file));
    
    fileGroups[file].forEach(finding => {
      const riskScore = calculateRiskScore(finding);
      const riskLevel = getRiskLevel(riskScore);
      const riskColor = riskLevel.color === 'red' ? chalk.red : chalk.yellow;
      const icon = riskLevel.color === 'red' ? '🔴' : '🟡';
      
      // Simplified output: icon + confidence + type
      const confidenceLabel = finding.confidence || 'HIGH';
      console.log(riskColor(`  ${icon} ${confidenceLabel}`) + chalk.gray(` - ${finding.keyType} (line ${finding.line})`));
      console.log(chalk.gray(`     ${maskKey(finding.key)}`));
      
      // Show gitignore status if not ignored
      if (finding.isIgnored === false) {
        console.log(chalk.red(`     ⚠ Not in .gitignore`));
      }
    });
  });
}

/**
 * Display clean gitignore audit
 */
function displayCleanGitignoreAudit(audit) {
  if (!audit || audit.notIgnored.length === 0) {
    return;
  }
  
  // Only show unique files that should be ignored but aren't
  const uniqueFiles = [...new Set(audit.notIgnored.map(f => f.relativePath))];
  
  console.log(chalk.red('⚠ Files not in .gitignore:'));
  uniqueFiles.forEach(file => {
    console.log(chalk.gray(`  • ${file}`));
  });
}

/**
 * Display clean gitignore warning
 */
function displayCleanGitignoreWarning(gitignoreCheck) {
  console.log(chalk.red('⚠ .env files not protected'));
  console.log(chalk.gray('  Add .env* to your .gitignore file'));
}

/**
 * Display gitignore security warning
 */
function displayGitignoreWarning(gitignoreCheck) {
  console.log(chalk.red.bold('⚠️  Git Security Warning'));
  console.log(chalk.gray('═'.repeat(60)));
  
  console.log(chalk.red.bold('\n🔴 HIGH RISK: .env file not properly protected'));
  console.log(chalk.white(`\n   ${gitignoreCheck.message}`));
  
  console.log(chalk.white('\n   Why this is dangerous:'));
  console.log(chalk.gray('   • Secrets can be committed to version control'));
  console.log(chalk.gray('   • Once pushed, they remain in git history forever'));
  console.log(chalk.gray('   • Attackers scan public repos for exposed credentials'));
  
  console.log(chalk.white('\n   Suggested fix:'));
  if (gitignoreCheck.reason === 'missing_gitignore') {
    console.log(chalk.cyan('   • Create .gitignore file with ".env*" entry'));
    console.log(chalk.gray('   • Or run: ') + chalk.cyan.bold('secretguard fix <dir>') + chalk.gray(' (auto-creates .gitignore)'));
  } else {
    console.log(chalk.cyan('   • Add ".env" or ".env*" to your .gitignore file'));
    console.log(chalk.gray('   • Or run: ') + chalk.cyan.bold('secretguard fix <dir>') + chalk.gray(' (auto-updates .gitignore)'));
  }
  
  console.log('\n');
}

/**
 * Display summary dashboard
 */
function displaySummaryDashboard(scanResult) {
  const { totalFiles, findings } = scanResult;
  const riskAssessment = assessOverallRisk(findings);
  
  console.log(chalk.bold.cyan('📊 Scan Summary'));
  console.log(chalk.gray('═'.repeat(60)));
  
  // Create a clean table-like display
  console.log('\n' + chalk.white('  Scan Statistics:'));
  console.log(chalk.gray('  ┌─────────────────────────────────────────────────────────┐'));
  console.log(chalk.gray('  │ ') + chalk.white('Files Scanned:        ') + chalk.cyan(String(totalFiles).padEnd(30)) + chalk.gray('│'));
  console.log(chalk.gray('  │ ') + chalk.white('Secrets Found:        ') + chalk.yellow(String(findings.length).padEnd(30)) + chalk.gray('│'));
  console.log(chalk.gray('  │ ') + chalk.white('Overall Risk Score:   ') +
    (riskAssessment.color === 'red' ? chalk.red : chalk.yellow)(`${riskAssessment.score}/100`.padEnd(30)) + chalk.gray('│'));
  console.log(chalk.gray('  │ ') + chalk.white('Risk Level:           ') +
    (riskAssessment.color === 'red' ? chalk.red.bold : chalk.yellow.bold)(riskAssessment.level.padEnd(30)) + chalk.gray('│'));
  console.log(chalk.gray('  └─────────────────────────────────────────────────────────┘'));
  
  console.log('\n' + chalk.white('  Risk Breakdown:'));
  console.log(chalk.gray('  ┌─────────────────────────────────────────────────────────┐'));
  console.log(chalk.gray('  │ ') + chalk.red('🔴 Critical Risk:     ') + chalk.red(String(riskAssessment.critical).padEnd(30)) + chalk.gray('│'));
  console.log(chalk.gray('  │ ') + chalk.red('🔴 High Risk:         ') + chalk.red(String(riskAssessment.high).padEnd(30)) + chalk.gray('│'));
  console.log(chalk.gray('  │ ') + chalk.yellow('🟡 Medium Risk:       ') + chalk.yellow(String(riskAssessment.medium).padEnd(30)) + chalk.gray('│'));
  console.log(chalk.gray('  └─────────────────────────────────────────────────────────┘'));
  
  // Recommendation based on risk level
  console.log('\n' + chalk.white('  Recommendation:'));
  if (riskAssessment.critical > 0) {
    console.log(chalk.red.bold('  ⚠️  URGENT: Critical secrets detected - fix immediately!'));
  } else if (riskAssessment.high > 0) {
    console.log(chalk.yellow.bold('  ⚠️  HIGH PRIORITY: Address high-risk secrets soon'));
  } else {
    console.log(chalk.yellow('  ℹ️  Review and fix medium-risk findings'));
  }
  
  console.log('\n');
}

/**
 * Display fix results - clean format
 */
function reportFixResults(fixResult, preview = false, gitignoreCheck = null) {
  const { filesModified, keysReplaced, envVars, changes } = fixResult;
  
  // If preview mode, show before/after comparison
  if (preview) {
    reportPreview(fixResult);
    return;
  }
  
  console.log('\n' + chalk.bold.green('🛡️  SecretGuard CLI'));
  console.log();
  
  if (keysReplaced === 0) {
    console.log(chalk.green.bold('✓ No secrets found'));
    console.log();
    return;
  }
  
  console.log(chalk.green('✓ Fix Complete'));
  console.log(chalk.gray(`  Files modified: ${filesModified}`));
  console.log(chalk.gray(`  Secrets secured: ${keysReplaced}`));
  
  console.log('\n' + chalk.white('--- Environment Variables ---'));
  envVars.forEach(envVar => {
    const [key] = envVar.split('=');
    console.log(chalk.gray(`  ${key}`));
  });
  
  console.log('\n' + chalk.white('--- Files Created ---'));
  console.log(chalk.gray('  .env (actual values)'));
  console.log(chalk.gray('  .env.example (template)'));
  
  console.log('\n' + chalk.white('--- Next Steps ---'));
  console.log(chalk.cyan('  1. Review changes'));
  console.log(chalk.cyan('  2. Add .env* to .gitignore'));
  console.log(chalk.cyan('  3. Never commit .env files'));
  
  // Display gitignore warning if applicable (at the end)
  if (gitignoreCheck && !gitignoreCheck.safe) {
    console.log('\n' + chalk.white('--- Git Security ---'));
    displayCleanGitignoreWarning(gitignoreCheck);
  }
  
  console.log();
}

/**
 * Display preview of changes - clean format
 */
function reportPreview(fixResult) {
  const { filesModified, keysReplaced, envVars, changes } = fixResult;
  
  console.log('\n' + chalk.bold.cyan('🛡️  SecretGuard CLI (Preview)'));
  console.log();
  
  console.log(chalk.white('Preview Summary:'));
  console.log(chalk.gray(`  Files to modify: ${filesModified}`));
  console.log(chalk.gray(`  Secrets to secure: ${keysReplaced}`));
  
  console.log('\n' + chalk.white('--- Proposed Changes ---'));
  
  changes.forEach(({ file, changes: fileChanges }) => {
    console.log('\n' + chalk.cyan(file));
    
    fileChanges.forEach(({ line, before, after, envVar }) => {
      console.log(chalk.gray(`  Line ${line}:`));
      console.log(chalk.red(`  - ${before.trim()}`));
      console.log(chalk.green(`  + ${after.trim()}`));
    });
  });
  
  console.log('\n' + chalk.white('--- Environment Variables ---'));
  envVars.forEach(envVar => {
    const [key] = envVar.split('=');
    console.log(chalk.gray(`  ${key}`));
  });
  
  console.log('\n' + chalk.yellow('💡 Preview only - no files modified'));
  console.log(chalk.cyan('   Run: ') + chalk.cyan.bold('secretguard fix <directory>'));
  console.log();
}

/**
 * Display error message
 */
function reportError(error) {
  console.log('\n' + chalk.bold.red('❌ Error'));
  console.log(chalk.gray('═'.repeat(60)));
  console.log(chalk.red(`\n${error.message}\n`));
}

/**
 * Display help message - clean format
 */
function displayHelp() {
  console.log('\n' + chalk.bold.cyan('🛡️  SecretGuard CLI v1.0.0'));
  console.log();
  
  console.log(chalk.white('Usage:'));
  console.log(chalk.cyan('  secretguard scan <directory>'));
  console.log(chalk.gray('    Scan for hardcoded secrets'));
  console.log();
  
  console.log(chalk.cyan('  secretguard fix <directory> [--preview]'));
  console.log(chalk.gray('    Fix hardcoded secrets'));
  console.log(chalk.gray('    Use --preview or -p to preview changes'));
  console.log();
  
  console.log(chalk.cyan('  secretguard help'));
  console.log(chalk.gray('    Show this help'));
  console.log();
  
  console.log(chalk.white('Examples:'));
  console.log(chalk.gray('  secretguard scan .'));
  console.log(chalk.gray('  secretguard fix . --preview'));
  console.log(chalk.gray('  secretguard fix ./src'));
  console.log();
}

/**
 * Mask API key for display (show first/last few chars)
 */
function maskKey(key) {
  if (key.length <= 8) {
    return '*'.repeat(key.length);
  }
  const start = key.substring(0, 4);
  const end = key.substring(key.length - 4);
  const middle = '*'.repeat(Math.min(key.length - 8, 20));
  return `${start}${middle}${end}`;
}

module.exports = {
  reportScanResults,
  reportFixResults,
  reportError,
  displayHelp
};

// Made with Bob
