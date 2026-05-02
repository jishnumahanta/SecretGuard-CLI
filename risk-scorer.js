/**
 * Risk scoring and impact assessment for detected secrets
 */

// Risk scores by key type (0-100)
const RISK_SCORES = {
  'AWS Access Key': 95,
  'GitHub Token': 90,
  'Stripe Key': 95,
  'OpenAI Key': 85,
  'Generic API Key': 70,
  'Potential Secret': 60
};

// Impact explanations for each key type
const IMPACT_EXPLANATIONS = {
  'AWS Access Key': 'Full cloud infrastructure access - attackers can spin up resources, access data, and rack up massive bills',
  'GitHub Token': 'Complete repository access - code theft, malicious commits, and supply chain attacks possible',
  'Stripe Key': 'Direct payment processing access - financial fraud, customer data theft, and unauthorized transactions',
  'OpenAI Key': 'API abuse and cost exploitation - attackers can drain your credits and access your usage data',
  'Generic API Key': 'Service access compromise - potential data breach and unauthorized operations',
  'Potential Secret': 'Possible credential exposure - could grant unauthorized access to systems or data'
};

// Risk level thresholds
const RISK_LEVELS = {
  CRITICAL: { min: 90, label: 'CRITICAL', color: 'red' },
  HIGH: { min: 75, label: 'HIGH', color: 'red' },
  MEDIUM: { min: 50, label: 'MEDIUM', color: 'yellow' },
  LOW: { min: 0, label: 'LOW', color: 'yellow' }
};

/**
 * Calculate risk score for a finding
 */
function calculateRiskScore(finding) {
  const baseScore = RISK_SCORES[finding.keyType] || 50;
  
  // Adjust based on confidence level
  const confidenceMultiplier = finding.confidence === 'HIGH' ? 1.0 : 0.85;
  
  return Math.round(baseScore * confidenceMultiplier);
}

/**
 * Get risk level from score
 */
function getRiskLevel(score) {
  if (score >= RISK_LEVELS.CRITICAL.min) return RISK_LEVELS.CRITICAL;
  if (score >= RISK_LEVELS.HIGH.min) return RISK_LEVELS.HIGH;
  if (score >= RISK_LEVELS.MEDIUM.min) return RISK_LEVELS.MEDIUM;
  return RISK_LEVELS.LOW;
}

/**
 * Get impact explanation for a key type
 */
function getImpactExplanation(keyType) {
  return IMPACT_EXPLANATIONS[keyType] || 'Unauthorized access to services or data';
}

/**
 * Calculate overall risk assessment for all findings
 */
function assessOverallRisk(findings) {
  if (findings.length === 0) {
    return {
      score: 0,
      level: 'NONE',
      summary: 'No secrets detected'
    };
  }
  
  // Calculate average risk score
  const totalScore = findings.reduce((sum, finding) => {
    return sum + calculateRiskScore(finding);
  }, 0);
  
  const avgScore = Math.round(totalScore / findings.length);
  const riskLevel = getRiskLevel(avgScore);
  
  // Count by risk level
  const critical = findings.filter(f => calculateRiskScore(f) >= 90).length;
  const high = findings.filter(f => {
    const score = calculateRiskScore(f);
    return score >= 75 && score < 90;
  }).length;
  const medium = findings.filter(f => {
    const score = calculateRiskScore(f);
    return score >= 50 && score < 75;
  }).length;
  
  return {
    score: avgScore,
    level: riskLevel.label,
    color: riskLevel.color,
    critical,
    high,
    medium,
    total: findings.length
  };
}

module.exports = {
  calculateRiskScore,
  getRiskLevel,
  getImpactExplanation,
  assessOverallRisk
};

// Made with Bob
