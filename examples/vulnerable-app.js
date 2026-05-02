// Vulnerable Application - DO NOT USE IN PRODUCTION
const axios = require('axios');

// ⚠️ SECURITY ISSUE: Hardcoded API Keys
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID;

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
