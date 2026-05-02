# SecretGuard Detection Improvements

## Overview

SecretGuard now uses a **multi-layered detection approach** combining three methods:

1. **Specific Pattern Matching** (HIGH confidence)
2. **Heuristic Detection** (MEDIUM confidence)
3. **Entropy-Based Analysis** (MEDIUM confidence)

## Detection Methods

### 1. Specific Pattern Matching (HIGH Confidence)

Detects known API key formats with high accuracy:

```javascript
// AWS Access Keys
AKIA[0-9A-Z]{16}

// GitHub Tokens
gh[ps]_[a-zA-Z0-9]{36,}

// Stripe Keys
sk_live_[a-zA-Z0-9]{24,}

// OpenAI Keys
sk-[a-zA-Z0-9]{48}

// Generic API Keys
api_key: "..."
```

**Confidence:** HIGH - These patterns are highly specific and rarely produce false positives.

### 2. Heuristic Detection (MEDIUM Confidence)

Identifies suspicious variable names that commonly hold secrets:

**Keywords monitored:**
- `api_key`, `apikey`, `api_secret`
- `secret_key`, `secretkey`
- `access_token`, `auth_token`
- `private_key`, `client_secret`
- `password`, `passwd`
- `token`, `bearer`, `credential`

**Example:**
```javascript
const secret_key = ${SECRET_KEY};
// ✓ Detected: suspicious name + high entropy value
```

**Confidence:** MEDIUM - Requires both suspicious name AND high-entropy value.

### 3. Entropy-Based Analysis (MEDIUM Confidence)

Uses Shannon entropy to detect random-looking strings:

**Entropy Thresholds:**
- Entropy > 4.0 + length ≥ 16 chars → Likely secret
- Entropy > 3.5 + length ≥ 20 chars → Likely secret
- 3+ character types (lower, upper, digit, special) + length ≥ 20 → Likely secret

**Example:**
```javascript
const value = "xYz123AbC456DeF789GhI012JkL345MnO678";
// Entropy: ~4.2, Length: 36, Types: 3 → Detected
```

**Confidence:** MEDIUM - High entropy suggests randomness typical of secrets.

## What Gets Detected

### ✅ Detected (10 secrets in test file)

| Type | Method | Confidence | Example |
|------|--------|------------|---------|
| AWS Key | Pattern | HIGH | `${AWS_ACCESS_KEY_ID}` |
| GitHub Token | Pattern | HIGH | `ghp_...` |
| Stripe Key | Pattern | HIGH | `sk_live_...` |
| Generic API Key | Pattern | HIGH | `api_key: "sk-..."` |
| Secret Key | Heuristic | MEDIUM | `secret_key = "a8f3..."` |
| Auth Token | Heuristic | MEDIUM | `auth_token = "xYz1..."` |
| Private Key | Heuristic | MEDIUM | `private_key = "pk_live..."` |
| Client Secret | Heuristic | MEDIUM | `client_secret = "cs_test..."` |
| Bearer Token | Heuristic | MEDIUM | `bearer_token = "eyJh..."` |
| Password | Heuristic | MEDIUM | `password = "MyS3..."` |

### ❌ Not Detected (Correctly Ignored)

| Value | Reason |
|-------|--------|
| `"hello-world-123"` | Low entropy, common pattern |
| `"abc123"` | Too short (< 16 chars) |
| `"https://api.example.com"` | URL pattern, low entropy |
| `"9f8e7d6c5b4a3210fedcba9876543210"` | No suspicious variable name |

## Benefits

1. **Fewer False Negatives:** Catches more types of secrets
2. **Confidence Levels:** Users can prioritize HIGH confidence findings
3. **Smart Filtering:** Avoids common false positives (URLs, short strings)
4. **Flexible:** Works across multiple languages and coding styles

## Usage

```bash
# Scan with improved detection
node index.js scan ./examples

# Output shows confidence levels
🔴 High Confidence: 4
🟡 Medium Confidence: 6
```

## Technical Details

### Shannon Entropy Calculation

```javascript
entropy = -Σ(p(x) * log2(p(x)))
```

Where `p(x)` is the probability of character `x` in the string.

**Interpretation:**
- Entropy 0-2: Very predictable (e.g., "aaaaaaa")
- Entropy 2-3: Low randomness (e.g., "hello123")
- Entropy 3-4: Moderate randomness
- Entropy 4+: High randomness (typical of secrets)

### Character Type Detection

Checks for mix of:
- Lowercase letters (a-z)
- Uppercase letters (A-Z)
- Digits (0-9)
- Special characters (_, -, etc.)

Secrets typically use 3+ character types for security.

## Future Improvements

Potential enhancements for future versions:

- Machine learning-based detection
- Context-aware analysis (comments, variable scope)
- Custom pattern configuration
- Integration with secret scanning APIs
- Support for more languages and frameworks