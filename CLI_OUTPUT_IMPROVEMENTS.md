# CLI Output Improvements - Separated Concerns

## Overview
Improved SecretGuard CLI output to clearly separate three distinct concerns:
1. **Secret Detection** - What secrets were found and their risk level
2. **Gitignore Status** - Whether files are protected by .gitignore
3. **Fix Recommendations** - What actions to take

## Changes Made

### 1. Enhanced Scanner Module (`scanner.js`)

**New Functions:**
- `isFileIgnored(filePath, dirPath)` - Uses `git check-ignore` to determine if a file is ignored
- `shouldBeIgnored(filePath)` - Checks if a file matches patterns that should typically be ignored
- `auditGitignore(findings, dirPath)` - Performs comprehensive gitignore audit

**Detection Patterns for Files That Should Be Ignored:**
- `.env` and `.env.*` files
- `.local.` files (e.g., `config.local.json`)
- Backup files (`.backup`, `.bak`, `.old`)
- Backup directories (`backup/`, `backups/`)
- Snapshot directories (`snapshots/`, `snapshot/`)
- Cache directories (`.cache/`, `.cache`)
- Files with 'secret' or 'credential' in name
- CSV files (often contain sensitive data)

### 2. Improved Reporter Module (`reporter.js`)

**New Output Structure:**

#### Section 1: Secret Findings
```
🔍 Secret Findings:
────────────────────────────────────────────────────────────

📄 examples/.env

   🔴 AWS Access Key
   Line 4
   Confidence: HIGH
   Key: AKIA************MPLE
   Env Variable: AWS_ACCESS_KEY_ID
   Gitignore Status: ✗ Not Ignored
   Impact: Full cloud infrastructure access...
```

**Key Features:**
- Shows confidence level (HIGH/MEDIUM) for each finding
- Displays gitignore status (✓ Ignored / ✗ Not Ignored)
- Includes impact explanation for high-risk secrets

#### Section 2: Gitignore Audit
```
📦 Gitignore Audit:
────────────────────────────────────────────────────────────

🔴 Should be ignored (HIGH RISK):
   • .env → AWS Access Key (HIGH)
   • .env → GitHub Token (HIGH)
   • .env → Stripe Key (HIGH)

🟡 Already ignored (lower risk):
   • config/service.local.json → API Key (MEDIUM)
```

**Key Features:**
- Separates files into two categories:
  - **Should be ignored** - Files that contain secrets but aren't in .gitignore (HIGH RISK)
  - **Already ignored** - Files that are protected by .gitignore (lower risk)
- Shows file path, secret type, and confidence level

#### Section 3: Fix Recommendations
```
💡 Fix Recommendations:
────────────────────────────────────────────────────────────

⚠️  SECURITY WARNING
   Hardcoded secrets detected in your codebase!
   These credentials could be exposed in version control.

Recommended actions:
   1. Run secretguard fix <dir> to automatically secure secrets
   2. Review all changes before committing
   3. Ensure .env files are in .gitignore
   4. Never commit secrets to version control
```

**Key Features:**
- Clear, actionable recommendations
- Numbered steps for easy follow-through
- Includes gitignore warning if applicable

### 3. Updated Index Module (`index.js`)

**Enhanced Scan Handler:**
```javascript
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
```

## Benefits

### 1. Clear Separation of Concerns
- **Secret Detection** is now distinct from **Gitignore Status**
- Users can quickly see:
  - What secrets exist
  - Whether they're protected
  - What needs to be fixed

### 2. Better Risk Assessment
- Gitignore audit highlights HIGH RISK files (secrets not ignored)
- Shows lower risk files (secrets already ignored)
- Helps prioritize remediation efforts

### 3. Actionable Insights
- Clear recommendations section
- Numbered steps for easy follow-through
- Specific guidance for each situation

### 4. No New Dependencies
- Uses built-in `git check-ignore` command
- Leverages existing scanner and reporter modules
- Simple, maintainable implementation

## Example Output

### Complete Scan Output
```
🔍 SecretGuard CLI Security Scan
════════════════════════════════════════════════════════════

📁 Files Scanned: 7
🔑 Secrets Found: 6

Risk Assessment:
────────────────────────────────────────────────────────────
  Overall Risk: HIGH (Score: 89/100)
  🔴 Critical Risk: 5 secrets
  🟡 Medium Risk: 1 secrets

🔍 Secret Findings:
────────────────────────────────────────────────────────────

📄 examples/.env

   🔴 AWS Access Key
   Line 4
   Confidence: HIGH
   Key: AKIA************MPLE
   Env Variable: AWS_ACCESS_KEY_ID
   Gitignore Status: ✗ Not Ignored
   Impact: Full cloud infrastructure access...

   🔴 GitHub Token
   Line 3
   Confidence: HIGH
   Key: ghp_********************wxyz
   Env Variable: GITHUB_TOKEN
   Gitignore Status: ✗ Not Ignored
   Impact: Complete repository access...

📦 Gitignore Audit:
────────────────────────────────────────────────────────────

🔴 Should be ignored (HIGH RISK):
   • .env → AWS Access Key (HIGH)
   • .env → GitHub Token (HIGH)
   • .env → Stripe Key (HIGH)

💡 Fix Recommendations:
────────────────────────────────────────────────────────────

⚠️  SECURITY WARNING
   Hardcoded secrets detected in your codebase!
   These credentials could be exposed in version control.

Recommended actions:
   1. Run secretguard fix <dir> to automatically secure secrets
   2. Review all changes before committing
   3. Ensure .env files are in .gitignore
   4. Never commit secrets to version control

📊 Scan Summary
════════════════════════════════════════════════════════════
...
```

## Files Modified

1. **scanner.js** - Added gitignore checking and audit functions
2. **reporter.js** - Restructured output with three distinct sections
3. **index.js** - Integrated gitignore audit into scan command

## Testing

Run the scan command to see the improved output:
```bash
node index.js scan examples/
```

The output now clearly shows:
- ✓ Which secrets were found (with confidence levels)
- ✓ Whether each file is ignored by .gitignore
- ✓ Which files should be ignored but aren't (HIGH RISK)
- ✓ Clear recommendations for fixing issues

## Implementation Notes

- **Simple**: No new dependencies, uses built-in git commands
- **Modular**: Each concern is handled by a separate function
- **Maintainable**: Clear separation makes future updates easier
- **User-friendly**: Output is easy to read and understand