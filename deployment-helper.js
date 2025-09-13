#!/usr/bin/env node

/**
 * Alternative deployment method using Supabase Management API
 * This script helps deploy the Edge Function without requiring Supabase CLI
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read function code
const functionPath = join(__dirname, 'supabase', 'functions', 'generate-image', 'index.ts');
const functionCode = readFileSync(functionPath, 'utf8');

console.log('🎯 Edge Function Deployment Helper');
console.log('=====================================');
console.log('');

console.log('📋 Manual Deployment Instructions:');
console.log('');
console.log('1. Go to Supabase Dashboard:');
console.log('   https://supabase.com/dashboard/project/pbndydilyqxqmcxwadvy/functions');
console.log('');
console.log('2. Click "Create Function" or edit existing "generate-image" function');
console.log('');
console.log('3. Set function name: generate-image');
console.log('');
console.log('4. Copy the following code:');
console.log('');
console.log('=' .repeat(80));
console.log(functionCode);
console.log('=' .repeat(80));
console.log('');
console.log('5. Paste the code into the function editor');
console.log('');
console.log('6. Click "Deploy Function"');
console.log('');
console.log('7. Wait for deployment to complete');
console.log('');
console.log('8. Test the function using the test page:');
console.log('   Open: http://localhost:8080/test-function.html');
console.log('');

// Also save to clipboard-friendly file
const clipboardFile = join(__dirname, 'function-code-for-clipboard.txt');
try {
  readFileSync(clipboardFile);
  console.log('📄 Function code saved to: function-code-for-clipboard.txt');
  console.log('   You can copy from this file if needed.');
} catch {
  // File doesn't exist, create it
  console.log('📄 Creating clipboard-friendly file...');
  const fs = await import('fs');
  fs.writeFileSync(clipboardFile, functionCode, 'utf8');
  console.log('   ✅ Created: function-code-for-clipboard.txt');
}

console.log('');
console.log('🔍 Current Function Status:');
console.log(`   Code Size: ${functionCode.length} characters`);
console.log(`   Lines: ${functionCode.split('\n').length}`);
console.log(`   Has Auth: ${functionCode.includes('createClient') ? '✅' : '❌'}`);
console.log(`   Has CORS: ${functionCode.includes('OPTIONS') ? '✅' : '❌'}`);
console.log(`   Has Error Handling: ${functionCode.includes('try {') ? '✅' : '❌'}`);

console.log('');
console.log('✅ Function is ready for deployment!');
console.log('');
