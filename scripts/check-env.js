#!/usr/bin/env node

// Script to check environment variables
require('dotenv').config({ path: '.env.local' });

const requiredVars = [
  'OPENAI_API_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET',
  'DATABASE_URL'
];

console.log('Checking environment variables...\n');

let allSet = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  const isSet = !!value;
  const status = isSet ? '✅' : '❌';
  const displayValue = isSet ? 
    (varName.includes('KEY') || varName.includes('SECRET') ? 
      `${value.substring(0, 10)}...` : value) : 
    'NOT SET';
  
  console.log(`${status} ${varName}: ${displayValue}`);
  
  if (!isSet) {
    allSet = false;
  }
});

console.log('\n' + (allSet ? '✅ All environment variables are set!' : '❌ Some environment variables are missing.'));
console.log('\nFor Vercel deployment, make sure to set these in your Vercel project settings.');
console.log('See VERCEL_SETUP.md for detailed instructions.'); 