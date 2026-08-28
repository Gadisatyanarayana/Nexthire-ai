import { ResumeApplicationService } from './platform/ai/services/ResumeApplicationService';
import { db } from './db';
import fs from 'fs';
import path from 'path';

async function runTest() {
  console.log('🚀 Starting Local Parse Test...');
  try {
    const resumeId = 'test-uuid-1234';
    const mockText = "John Doe\nSoftware Engineer\nExperience: 5 years at Google. Skills: React, Node.js.";
    const buffer = Buffer.from(mockText, 'utf-8');
    
    console.log('📦 Simulating upload...');
    const result = await ResumeApplicationService.processResumeUpload(resumeId, buffer, 'text/plain');
    
    console.log('✅ Parse Succeeded!');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error: any) {
    console.error('❌ Parse Failed:', error.message);
  }
  process.exit(0);
}

runTest();
