# 🛡️ SecretGuard CLI

**Catch API key leaks before they reach GitHub.**

SecretGuard is a developer-first security tool that detects, fixes, and prevents hardcoded secrets in your codebase. Using multi-layer detection (pattern matching, heuristics, entropy analysis), it finds API keys that other tools miss—and fixes them automatically.

> *"The best time to catch a secret leak is before you commit."*

---

## Why SecretGuard?

**The Problem:**
- Developers accidentally commit API keys to GitHub every day
- Once pushed, secrets remain in git history forever
- GitHub's secret scanning only alerts *after* the damage is done
- Manual fixes are tedious and error-prone

**The Solution:**
SecretGuard catches secrets **before they reach version control**, automatically replaces them with environment variables, and ensures your `.env` files are properly protected.

## Why Not Just GitHub Secret Scanning?

| Feature | GitHub Secret Scanning | SecretGuard CLI |
|---------|----------------------|-----------------|
| **Detection Time** | After push (too late) | Before commit ✅ |
| **Auto-Fix** | Manual only | Automated ✅ |
| **Preview Changes** | No | Yes ✅ |
| **Local Workflow** | Cloud-based | Runs locally ✅ |
| **Gitignore Safety** | No | Built-in ✅ |

SecretGuard complements GitHub's scanning by catching issues earlier in your workflow.

---

## ✨ Features

- **🔍 Multi-Layer Detection** - Pattern matching, heuristics, and entropy analysis
- **🤖 Automated Fix** - Replaces secrets with environment variables
- **👀 Preview Mode** - See changes before applying them
- **🔒 Gitignore Safety** - Ensures `.env` files won't be committed
- **⚡ Fast & Local** - No cloud dependencies, runs in seconds
- **🎯 Smart Scanning** - Detects AWS, GitHub, Stripe, OpenAI keys and more
- **📊 Risk Scoring** - Prioritizes critical secrets (0-100 scale)
- **🎨 Clean Output** - Demo-friendly, readable terminal output

---

## 🚀 Quick Start

### Installation

```bash
npm install
npm link
```

### Basic Usage

```bash
# Scan for secrets
secretguard scan .

# Preview fixes
secretguard fix . --preview

# Apply fixes
secretguard fix .
```

---

## 🎬 Demo

Run the automated demo to see SecretGuard in action:

```bash
./demo.sh
```

**What happens:**
1. Creates a vulnerable app with hardcoded secrets
2. Scans and detects 6+ API keys
3. Previews proposed changes
4. Applies fixes automatically
5. Verifies no secrets remain

Perfect for presentations and hackathon demos!

---

## 📖 Usage

### Scan for Secrets

```bash
secretguard scan .
secretguard scan ./src
```

Recursively scans files and reports:
- File locations
- Secret types (AWS, GitHub, Stripe, etc.)
- Risk levels (CRITICAL, HIGH, MEDIUM)
- Gitignore status

### Preview Changes

```bash
secretguard fix . --preview
secretguard fix ./src -p
```

Shows exactly what will change without modifying files:
- Before/after comparison
- Environment variables to be created
- Files that will be modified

### Fix Secrets

```bash
secretguard fix .
secretguard fix ./src
```

Automatically:
1. Replaces hardcoded secrets with `process.env.VAR_NAME`
2. Creates `.env` file with actual values
3. Creates `.env.example` template for your team
4. Updates `.gitignore` to protect `.env` files

### Get Help

```bash
secretguard help
```

---

## 🔍 Detection Capabilities

SecretGuard uses **three detection methods**:

### 1. Pattern Matching (High Confidence)
- AWS Access Keys (`AKIA...`)
- GitHub Tokens (`ghp_...`, `ghs_...`)
- Stripe Keys (`sk_live_...`)
- OpenAI Keys (`sk-...`)
- Generic API keys

### 2. Heuristic Analysis (Medium Confidence)
- Suspicious variable names (`api_key`, `secret_key`, `auth_token`)
- Combined with value analysis
- Reduces false positives

### 3. Entropy Analysis
- Shannon entropy calculation
- Detects random-looking strings
- Catches secrets without obvious patterns

---

## ⚙️ How It Works

```
┌─────────────┐
│   Scanner   │  Detects secrets using multi-layer approach
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Fixer     │  Replaces secrets with environment variables
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Reporter   │  Displays clean, actionable results
└─────────────┘
```

### Scanner
- Recursively scans your codebase
- Applies pattern matching, heuristics, and entropy analysis
- Calculates risk scores (0-100)
- Checks gitignore safety

### Fixer
- Replaces hardcoded secrets with `process.env.VAR_NAME`
- Generates `.env` file with actual values
- Creates `.env.example` template
- Updates `.gitignore` automatically

### Reporter
- Clean, minimal output
- Color-coded risk levels
- Gitignore audit
- Actionable recommendations

---

## 📁 Project Structure

```
secretguard/
├── index.js                        # CLI entry point
├── scanner.js                      # Detection engine
├── fixer.js                        # Auto-remediation
├── reporter.js                     # Output formatting
├── risk-scorer.js                  # Risk assessment
├── demo.sh                         # Automated demo
│
├── examples/                       # Test files
│   ├── vulnerable-app.js
│   ├── test-detection.js
│   └── .github/workflows/ci.yml
│
└── docs/                           # Documentation
    ├── README.md
    ├── QUICKSTART.md
    ├── RISK_SCORING.md
    └── DETECTION_IMPROVEMENTS.md
```

---

## 🎯 Supported Languages

SecretGuard works with:
- JavaScript/TypeScript (`.js`, `.ts`, `.jsx`, `.tsx`)
- Python (`.py`)
- Java (`.java`)
- Go (`.go`)
- Ruby (`.rb`)
- PHP (`.php`)
- Shell scripts (`.sh`, `.bash`)
- Config files (`.json`, `.yaml`, `.yml`, `.ini`, `.cfg`)
- And more!

---

## 🎨 Example Output

### Scan Results
```
🛡️  SecretGuard CLI

Scan Summary:
  Files scanned: 7
  Secrets found: 6
  Risk level: HIGH

--- Findings ---

examples/app.js
  🔴 HIGH - AWS Access Key (line 8)
     AKIA************MPLE
     ⚠ Not in .gitignore

--- Action ---
💡 Run: secretguard fix <dir>
```

### Fix Results
```
🛡️  SecretGuard CLI

✓ Fix Complete
  Files modified: 3
  Secrets secured: 6

--- Environment Variables ---
  AWS_ACCESS_KEY_ID
  GITHUB_TOKEN
  STRIPE_SECRET_KEY

--- Files Created ---
  .env (actual values)
  .env.example (template)
```

---

## ⚠️ Important Notes

1. **Always review changes** before committing
2. **Add `.env` to `.gitignore`** (SecretGuard does this automatically)
3. **Share `.env.example`** with your team, not `.env`
4. **Never commit `.env` files** to version control
5. **Rotate exposed secrets** if they were already pushed

---

## 🔒 Security Best Practices

✅ **Do:**
- Run SecretGuard before every commit
- Use environment variables for all secrets
- Keep `.env` files local only
- Share `.env.example` as a template
- Rotate secrets if exposed

❌ **Don't:**
- Commit `.env` files
- Share secrets in Slack/email
- Hardcode secrets in source code
- Ignore SecretGuard warnings
- Skip the preview step

---

## 🏗️ Built For Hackathons

SecretGuard was designed with hackathons in mind:
- **Fast setup** - Install and run in seconds
- **Clean output** - Perfect for demos and presentations
- **No dependencies** - Works offline (except chalk for colors)
- **Automated demo** - `./demo.sh` showcases full workflow
- **Well-documented** - Clear README and examples

---

## 📝 License

MIT

---

## 🤝 Contributing

This is a hackathon project, but contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests
- Share feedback

---

## 🙏 Acknowledgments

Built with ❤️ for developers who care about security.

Special thanks to the open-source community for inspiration and tools.

---

**Made with Bob** 🤖