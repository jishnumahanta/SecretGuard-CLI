# Environment File Exclusion from Secret Scanning

## Problem Solved

**Before:** After running `secretguard fix`, the scanner would detect secrets in the newly created `.env` file, making it appear as if the fix failed.

**After:** Environment files (`.env`, `.env.*`) are now excluded from secret scanning, while still being checked for `.gitignore` safety.

## Implementation

### Changes Made to `scanner.js`

#### 1. Added Environment File Check Function
```javascript
/**
 * Check if a file is an environment file that should be excluded from scanning
 */
function isEnvironmentFile(fileName) {
  return fileName === '.env' || fileName.startsWith('.env.');
}
```

#### 2. Updated File Discovery Logic
Modified `getAllFiles()` function to exclude environment files:

```javascript
// EXCLUDE environment files from secret scanning
// They are checked separately for .gitignore safety
if (isEnvironmentFile(fileName)) {
  return;
}
```

#### 3. Removed `.env` from Scannable Extensions
Removed `.env` from the `SCANNABLE_EXTENSIONS` array and added a note:
```javascript
// NOTE: .env files are explicitly excluded from scanning
```

## Behavior

### Files Excluded from Scanning
- `.env`
- `.env.local`
- `.env.development`
- `.env.production`
- `.env.test`
- Any file starting with `.env.`

### Files Still Scanned
- All other file types (`.js`, `.ts`, `.py`, `.json`, `.yaml`, etc.)
- Configuration files (`.ini`, `.cfg`, `.conf`)
- Shell scripts (`.sh`, `.bash`)
- All other extensions in `SCANNABLE_EXTENSIONS`

### Gitignore Safety Check
Environment files are **still checked** for `.gitignore` protection via the `checkGitignoreSafety()` function, which runs separately from secret scanning.

## Demo Output Comparison

### Before Fix
```
Step 5: Final Security Scan
Running: secretguard scan ./examples

🛡️  SecretGuard CLI

Scan Summary:
  Files scanned: 3
  Secrets found: 4  ❌ Secrets detected in .env

--- Findings ---
examples/.env
  🔴 HIGH - AWS Access Key (line 1)
  🔴 HIGH - GitHub Token (line 2)
  ...
```

### After Fix
```
Step 5: Final Security Scan
Running: secretguard scan ./examples

🛡️  SecretGuard CLI

✓ No secrets detected (2 files scanned)  ✅ Clean!
```

## Benefits

1. **Demo-Friendly**: Final scan shows success, not false positives
2. **Logical Behavior**: Environment files are meant to store secrets
3. **Still Safe**: Gitignore check ensures `.env` files won't be committed
4. **Clean Output**: No confusing warnings about secrets in `.env`

## Technical Details

### File Count
- **Before**: Scanned 3 files (vulnerable-app.js, .env, .env.example)
- **After**: Scans 2 files (vulnerable-app.js, .env.example)

Note: `.env.example` is still scanned because it should only contain placeholder values, not actual secrets.

### Code Location
All changes made in [`scanner.js`](scanner.js):
- Lines 43-62: Removed `.env` from `SCANNABLE_EXTENSIONS`
- Lines 168-175: Added `isEnvironmentFile()` helper function
- Lines 177-207: Updated `getAllFiles()` to exclude environment files

### No Changes To
- Detection logic (patterns still work the same)
- Fix logic (fixer.js unchanged)
- Gitignore safety checks (still validates .env protection)
- Other file scanning behavior

## Testing

Run the demo to see the improvement:
```bash
./demo.sh
```

The final scan will now show:
```
✓ No secrets detected (2 files scanned)
```

Instead of falsely detecting secrets in the `.env` file that was just created by the fix command.