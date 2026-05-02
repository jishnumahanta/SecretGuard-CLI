# SecretGuard Quick Start Guide

## Installation

```bash
npm install
```

## Usage

### 1. Scan for Secrets

```bash
node index.js scan <directory>
```

Example:
```bash
node index.js scan ./examples
```

**Output includes:**
- Total files scanned
- Number of secrets found
- Severity levels (HIGH/MEDIUM)
- Detailed findings with line numbers
- Suggested environment variable names

### 2. Preview Changes (Recommended)

```bash
node index.js fix <directory> --preview
```

Example:
```bash
node index.js fix ./examples --preview
```

**What it shows:**
- Before/after comparison for each change
- Line-by-line diff with color coding
- Environment variables that will be created
- No files are modified in preview mode

### 3. Fix Secrets Automatically

```bash
node index.js fix <directory>
```

Example:
```bash
node index.js fix ./examples
```

**What it does:**
- Replaces hardcoded secrets with `process.env.VAR_NAME`
- Creates `.env` file with actual values
- Creates `.env.example` template for sharing
- Generates unique variable names for duplicate keys

### 4. Get Help

```bash
node index.js help
```

## Detected Secret Types

| Type | Severity | Example Pattern |
|------|----------|----------------|
| AWS Access Key | HIGH | `AKIA...` |
| GitHub Token | HIGH | `ghp_...` |
| Stripe Key | HIGH | `sk_live_...` |
| OpenAI Key | HIGH | `sk-...` |
| Generic API Key | MEDIUM | `api_key: "..."` |

## After Running Fix

1. **Add to .gitignore:**
   ```
   .env
   ```

2. **Review changes:**
   ```bash
   git diff
   ```

3. **Share template:**
   - Commit `.env.example` to version control
   - Share with team members
   - Never commit `.env` file

4. **Load environment variables:**
   ```javascript
   require('dotenv').config();
   ```

## Demo

Run the interactive demo:
```bash
./demo.sh
```

## Project Structure

```
secretguard/
├── index.js          # CLI entry point
├── scanner.js        # Secret detection logic
├── fixer.js          # Replacement logic
├── reporter.js       # Output formatting
├── examples/         # Test files
│   ├── vulnerable-app.js
│   ├── .env
│   └── .env.example
└── README.md         # Full documentation
```

## Tips

- Run scan before committing code
- Use in CI/CD pipelines (exit code 1 if secrets found)
- Review all changes before committing
- Keep `.env` files out of version control
- Use `.env.example` for documentation

## Support

For issues or questions, refer to the main [README.md](README.md)