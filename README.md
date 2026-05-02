# 🛡️ SecretGuard

A simple CLI tool to detect and fix hardcoded API keys in your codebase.

## 🚀 Features

- **Scan**: Detect hardcoded API keys using regex patterns
- **Fix**: Automatically replace keys with environment variables
- **Clean Output**: Demo-friendly, colorful terminal output
- **Multi-language Support**: Works with JS, TS, Python, Java, Go, Ruby, PHP, and more

## 📦 Installation

```bash
npm install
npm link
```

Or run directly:

```bash
node index.js <command> <directory>
```

## 🎯 Usage

### Scan for API Keys

```bash
secretguard scan .
secretguard scan ./src
```

This will scan the specified directory and report any hardcoded API keys found.

### Preview Changes Before Fixing

```bash
secretguard fix . --preview
secretguard fix ./src -p
```

This will show you exactly what changes will be made without modifying any files.

### Fix API Keys

```bash
secretguard fix .
secretguard fix ./src
```

This will:
1. Replace hardcoded keys with environment variables
2. Create a `.env` file with the actual keys
3. Create a `.env.example` file as a template

### Help

```bash
secretguard help
```

## 🧪 Demo

Try it with the example file:

```bash
# Scan the example
secretguard scan ./examples

# Fix the example
secretguard fix ./examples

# Check the results
cat examples/vulnerable-app.js
cat examples/.env
```

## 🔍 Detected Patterns

SecretGuard detects the following API key patterns:

- Generic API Keys (`api_key`, `apiKey`, `api-secret`)
- AWS Access Keys (`AKIA...`)
- GitHub Tokens (`ghp_...`)
- Stripe Keys (`sk_live_...`)
- OpenAI Keys (`sk-...`)

## 📁 Project Structure

```
secretguard/
├── index.js                        # CLI entry point
├── scanner.js                      # API key detection logic
├── fixer.js                        # Key replacement logic
├── reporter.js                     # Output formatting
├── risk-scorer.js                  # Risk assessment and scoring
├── demo.sh                         # Automated demo script
├── package.json                    # Project dependencies
├── package-lock.json               # Dependency lock file
├── .gitignore                      # Git ignore rules
│
├── examples/                       # Test files and examples
│   ├── vulnerable-app.js           # Sample vulnerable code
│   ├── test-detection.js           # Detection test cases
│   ├── config.txt                  # Config file example
│   ├── .env                        # Environment variables (generated)
│   ├── .env.example                # Environment template
│   ├── .gitignore                  # Example gitignore
│   └── .github/
│       └── workflows/
│           └── ci.yml              # CI workflow example
│
├── README.md                       # Main documentation
├── QUICKSTART.md                   # Quick start guide
├── RISK_SCORING.md                 # Risk scoring documentation
├── DETECTION_IMPROVEMENTS.md       # Detection enhancements
├── GITIGNORE_SAFETY_IMPROVEMENTS.md # Gitignore safety features
├── CLI_OUTPUT_IMPROVEMENTS.md      # CLI output improvements
├── CLI_REFACTORING_SUMMARY.md      # CLI refactoring details
└── ENV_FILE_EXCLUSION.md           # Environment file handling
```

### Core Files

- **index.js** - Main CLI entry point, handles commands (scan, fix, help)
- **scanner.js** - Secret detection engine with pattern matching and heuristics
- **fixer.js** - Automatic remediation, replaces secrets with env vars
- **reporter.js** - Clean, formatted output for scan and fix results
- **risk-scorer.js** - Calculates risk scores and impact assessments

### Documentation

- **README.md** - Main project documentation
- **QUICKSTART.md** - Quick start guide for new users
- **RISK_SCORING.md** - Risk assessment methodology
- **DETECTION_IMPROVEMENTS.md** - Multi-layer detection approach
- **GITIGNORE_SAFETY_IMPROVEMENTS.md** - Gitignore protection features
- **CLI_OUTPUT_IMPROVEMENTS.md** - Output formatting improvements
- **CLI_REFACTORING_SUMMARY.md** - CLI refactoring details
- **ENV_FILE_EXCLUSION.md** - Environment file handling logic

### Demo & Examples

- **demo.sh** - Automated demo script showcasing full workflow
- **examples/** - Sample vulnerable code and test cases

## ⚙️ How It Works

1. **Scanner**: Recursively scans files using regex patterns to detect API keys
2. **Fixer**: Replaces hardcoded keys with `process.env.VAR_NAME` (or language-specific equivalent)
3. **Reporter**: Displays results in a clean, colorful format

## 🎨 Output Examples

### Scan Output
```
🔍 SecretGuard Scan Results
──────────────────────────────────────────────────

📁 Files scanned: 5
🔑 API keys found: 3

⚠️  examples/vulnerable-app.js
   Line 8: OpenAI Key
   Key: sk-1****************************123456
   Suggested env var: OPENAI_API_KEY
```

### Fix Output
```
✨ SecretGuard Fix Results
──────────────────────────────────────────────────

✓ Files modified: 1
✓ Keys replaced: 3

📝 Environment variables created:
   OPENAI_API_KEY
   STRIPE_SECRET_KEY
   GITHUB_TOKEN

📄 Files created:
   .env (contains actual keys)
   .env.example (template for sharing)
```

## ⚠️ Important Notes

1. Always add `.env` to your `.gitignore`
2. Review changes before committing
3. Share `.env.example` with your team, not `.env`
4. This tool is for demonstration purposes - always review security changes manually

## ⚠️ Safety Note

SecretGuard performs non-destructive fixes and preserves original files. Users should review changes before committing.

## 🏗️ Built For

This project was designed for hackathons and demos, focusing on:
- Simplicity and clarity
- Fast implementation
- Clean, demo-friendly output
- No external dependencies (except chalk for colors)

## 📝 License

MIT

## 🤝 Contributing

This is a minimal hackathon project. Feel free to fork and extend!