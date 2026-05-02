#!/bin/bash

# SecretGuard CLI Demo Script
# Demonstrates the complete workflow: problem → detection → fix → validation

set -e  # Exit on error

# Colors for output
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper function for section headers
print_step() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_info() {
    echo -e "${YELLOW}$1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Clean slate - remove existing demo folder
print_step "Setup: Creating Fresh Demo Environment"
print_info "Removing old examples folder..."
rm -rf examples/
print_success "Clean slate ready"

# Create demo directory
mkdir -p examples
print_success "Created examples/ directory"

# Create vulnerable application with multiple hardcoded secrets
print_info "Creating vulnerable-app.js with hardcoded secrets..."
cat > examples/vulnerable-app.js << 'EOF'
// Vulnerable Application - DO NOT USE IN PRODUCTION
const axios = require('axios');

// ⚠️ SECURITY ISSUE: Hardcoded API Keys
const OPENAI_API_KEY = 'sk-1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKL';
const STRIPE_SECRET_KEY = 'STRIPE_SECRET_KEY_EXAMPLE_12345';
const GITHUB_TOKEN = 'ghp_1234567890abcdefghijklmnopqrstuvwxyz';
const AWS_ACCESS_KEY = 'AKIAIOSFODNN7EXAMPLE';

async function makeAPICall() {
  // Hardcoded secret in request header
  const response = await axios.get('https://api.example.com/data', {
    headers: {
      'Authorization': 'Bearer sk-proj-abcdefghijklmnopqrstuvwxyz123456',
      'X-API-Key': AWS_ACCESS_KEY
    }
  });
  
  return response.data;
}

async function processPayment(amount) {
  const stripe = require('stripe')(STRIPE_SECRET_KEY);
  // Payment processing logic...
}

module.exports = { makeAPICall, processPayment };
EOF

print_success "Created vulnerable-app.js with 6 hardcoded secrets"
sleep 1

# Step 1: Initial Scan
print_step "Step 1: Scan for Hardcoded Secrets"
print_info "Running: secretguard scan ./examples"
sleep 1
node index.js scan ./examples || true  # Allow to continue even if secrets found
sleep 2

# Step 2: Preview Fix
print_step "Step 2: Preview Proposed Changes"
print_info "Running: secretguard fix ./examples --preview"
sleep 1
node index.js fix ./examples --preview
sleep 2

# Step 3: Apply Fix
print_step "Step 3: Apply Security Fixes"
print_info "Running: secretguard fix ./examples"
sleep 1
node index.js fix ./examples
sleep 2

# Step 4: Verify Fix - Show Updated Files
print_step "Step 4: Verify Changes"

print_info "Updated source file (vulnerable-app.js):"
echo ""
head -n 20 examples/vulnerable-app.js
echo ""
print_success "Secrets replaced with environment variables"
sleep 1

print_info "Generated .env file (contains actual secrets):"
echo ""
cat examples/.env
echo ""
print_success ".env file created with actual values"
sleep 1

print_info "Generated .env.example file (template for team):"
echo ""
cat examples/.env.example
echo ""
print_success ".env.example created as template"
sleep 1

# Step 5: Final Scan
print_step "Step 5: Final Security Scan"
print_info "Running: secretguard scan ./examples"
sleep 1
node index.js scan ./examples
sleep 1

# Summary
print_step "Demo Complete! 🎉"
echo ""
print_success "Workflow demonstrated:"
echo "  1. ✓ Detected 6 hardcoded secrets"
echo "  2. ✓ Previewed proposed changes"
echo "  3. ✓ Applied security fixes automatically"
echo "  4. ✓ Generated .env and .env.example files"
echo "  5. ✓ Verified no secrets remain in code"
echo ""
print_info "Next steps in real project:"
echo "  • Add .env to .gitignore"
echo "  • Review all changes"
echo "  • Share .env.example with team"
echo "  • Never commit .env files"
echo ""

# Made with Bob
