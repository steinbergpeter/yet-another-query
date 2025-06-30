#!/usr/bin/env node

/**
 * Test script to demonstrate the Zod validation system
 * Run with: node scripts/test-validation.js
 */

const { runValidationDemo } = require('../src/lib/examples/validation-demo.ts');

async function main() {
  console.log('🧪 Testing Zod Validation System...\n');

  try {
    await runValidationDemo();
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
