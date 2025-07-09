#!/usr/bin/env node

// Script to generate a secure JWT secret
const crypto = require('crypto');

console.log('Generating JWT secret...');
const jwtSecret = crypto.randomBytes(64).toString('hex');
console.log('\nYour JWT secret:');
console.log(jwtSecret);
console.log('\nAdd this to your environment variables as JWT_SECRET');
console.log('\nFor Vercel:');
console.log('1. Go to your Vercel project dashboard');
console.log('2. Settings → Environment Variables');
console.log('3. Add new variable: JWT_SECRET');
console.log('4. Paste the secret above as the value');
console.log('5. Select all environments (Production, Preview, Development)');
console.log('6. Save'); 