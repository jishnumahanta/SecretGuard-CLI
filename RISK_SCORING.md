# SecretGuard Risk Scoring System

## Overview

SecretGuard uses a simple but effective risk scoring system (0-100) to help prioritize security remediation efforts.

## Risk Scores by Secret Type

| Secret Type | Base Score | Risk Level | Reasoning |
|-------------|------------|------------|-----------|
| AWS Access Key | 95 | CRITICAL | Full cloud infrastructure access |
| Stripe Key | 95 | CRITICAL | Direct payment processing access |
| GitHub Token | 90 | CRITICAL | Complete repository control |
| OpenAI Key | 85 | HIGH | API abuse and cost exploitation |
| Generic API Key | 70 | MEDIUM | Service access compromise |
| Potential Secret | 60 | MEDIUM | Possible credential exposure |

## Risk Level Thresholds

- **CRITICAL** (90-100): Immediate action required
- **HIGH** (75-89): High priority remediation
- **MEDIUM** (50-74): Should be addressed soon
- **LOW** (0-49): Monitor and review

## Confidence Adjustment

Risk scores are adjusted based on detection confidence:

- **HIGH confidence**: 100% of base score (specific pattern match)
- **MEDIUM confidence**: 85% of base score (heuristic/entropy detection)

**Example:**
- AWS Key (HIGH confidence): 95 × 1.0 = **95/100**
- Potential Secret (MEDIUM confidence): 60 × 0.85 = **51/100**

## Overall Risk Calculation

The overall risk score is the **average** of all individual findings:

```
Overall Score = Sum of all risk scores / Number of findings
```

**Example:**
- 3 findings at 95/100
- 7 findings at 51/100
- Overall: (3×95 + 7×51) / 10 = **66/100 (MEDIUM)**

## Impact Explanations

High-risk findings (≥75) display impact explanations:

### AWS Access Key (95/100)
> Full cloud infrastructure access - attackers can spin up resources, access data, and rack up massive bills

### GitHub Token (90/100)
> Complete repository access - code theft, malicious commits, and supply chain attacks possible

### Stripe Key (95/100)
> Direct payment processing access - financial fraud, customer data theft, and unauthorized transactions

### OpenAI Key (85/100)
> API abuse and cost exploitation - attackers can drain your credits and access your usage data

### Generic API Key (70/100)
> Service access compromise - potential data breach and unauthorized operations

### Potential Secret (60/100)
> Possible credential exposure - could grant unauthorized access to systems or data

## CLI Output Example

```
Risk Assessment:
────────────────────────────────────────────────────────────
  Overall Risk: MEDIUM (Score: 66/100)
  🔴 Critical Risk: 3 secrets
  🟡 Medium Risk: 7 secrets

Findings:
────────────────────────────────────────────────────────────

📄 examples/app.js

   🔴 CRITICAL (95/100) - AWS Access Key
   Line 4
   Key: AKIA************MPLE
   Env Variable: AWS_ACCESS_KEY_ID
   Impact: Full cloud infrastructure access - attackers can spin up 
           resources, access data, and rack up massive bills
```

## Prioritization Strategy

1. **Fix CRITICAL (90+) first**: These can cause immediate financial or security damage
2. **Address HIGH (75-89) next**: Significant security risks that need prompt attention
3. **Plan for MEDIUM (50-74)**: Should be fixed but less urgent
4. **Review LOW (<50)**: May be false positives, review manually

## Benefits

- **Clear prioritization**: Know which secrets to fix first
- **Risk awareness**: Understand the impact of each finding
- **Efficient remediation**: Focus efforts where they matter most
- **Stakeholder communication**: Easy to explain risk to non-technical teams

## Technical Implementation

The risk scoring system is implemented in [`risk-scorer.js`](risk-scorer.js:1) with:

- Simple lookup tables for base scores
- Confidence-based adjustments
- Overall risk aggregation
- Impact explanation mapping

No complex algorithms - just clear, actionable risk assessment.