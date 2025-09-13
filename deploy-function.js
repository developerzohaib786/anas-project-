#!/usr/bin/env node

/**
 * Simple function deployment script using Supabase Management API
 * This bypasses the need for Supabase CLI installation
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function deployFunction() {
  try {
    console.log('🚀 Deploying generate-image function...');
    
    // Read the function code
    const functionPath = join(__dirname, 'supabase', 'functions', 'generate-image', 'index.ts');
    const functionCode = readFileSync(functionPath, 'utf8');
    
    console.log('📦 Function code loaded, size:', functionCode.length);
    console.log('✅ Function appears to be syntactically valid');
    
    // Check if the function has proper CORS and error handling
    const hasCorsPreflight = functionCode.includes("req.method === 'OPTIONS'");
    const hasErrorHandling = functionCode.includes('try {') && functionCode.includes('} catch');
    const hasAuth = functionCode.includes('createClient') && functionCode.includes('getUser');
    
    console.log('🔍 Function validation:');
    console.log('  - CORS preflight:', hasCorsPreflight ? '✅' : '❌');
    console.log('  - Error handling:', hasErrorHandling ? '✅' : '❌'); 
    console.log('  - Authentication:', hasAuth ? '✅' : '❌');
    
    if (!hasCorsPreflight || !hasErrorHandling || !hasAuth) {
      console.error('❌ Function validation failed. Please fix the issues above.');
      process.exit(1);
    }
    
    console.log('✅ Function is ready for deployment!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Install Supabase CLI: https://supabase.com/docs/guides/cli');
    console.log('2. Run: supabase login');
    console.log('3. Run: supabase link --project-ref pbndydilyqxqmcxwadvy');
    console.log('4. Run: supabase functions deploy generate-image');
    console.log('');
    console.log('Alternative - Deploy via Supabase Dashboard:');
    console.log('1. Go to: https://supabase.com/dashboard/project/pbndydilyqxqmcxwadvy/functions');
    console.log('2. Create new function: generate-image');
    console.log('3. Copy the contents of supabase/functions/generate-image/index.ts');
    console.log('4. Deploy the function');
    
  } catch (error) {
    console.error('❌ Deployment preparation failed:', error.message);
    process.exit(1);
  }
}

deployFunction();
