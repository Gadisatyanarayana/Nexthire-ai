import fs from 'fs';
import path from 'path';
import { ResumeApplicationService } from '../platform/ai/services/ResumeApplicationService';

const TEST_DIR = path.join(process.cwd(), 'test-resumes');

async function validateRC1() {
  console.log('🚀 Starting RC1 Automated Resume Parsing Validation Harness');
  console.log('===========================================================');

  if (!fs.existsSync(TEST_DIR)) {
    console.error(`❌ Test directory not found: ${TEST_DIR}`);
    console.log('Please create the "test-resumes" folder and populate it with diverse PDFs/DOCXs.');
    process.exit(1);
  }

  const files = fs.readdirSync(TEST_DIR).filter(f => f.endsWith('.pdf') || f.endsWith('.docx') || f.endsWith('.txt'));
  
  if (files.length === 0) {
    console.warn(`⚠️ No resumes found in ${TEST_DIR}. Please add test files.`);
    process.exit(1);
  }

  console.log(`Found ${files.length} resumes to test.\n`);
  
  const results = [];

  for (const file of files) {
    const filePath = path.join(TEST_DIR, file);
    const buffer = fs.readFileSync(filePath);
    let mimeType = 'application/pdf';
    if (file.endsWith('.docx')) mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (file.endsWith('.txt')) mimeType = 'text/plain';

    console.log(`Testing: ${file}...`);
    const startTime = Date.now();
    let status = 'PASS';
    let warnings = 'None';
    let doc = null;
    let intel = null;

    try {
      const resumeId = `test-rc1-${file.replace(/[^a-zA-Z0-9]/g, '-')}`;
      
      const result = await ResumeApplicationService.processResumeUpload(resumeId, buffer, mimeType);
      
      doc = result.resumeDocument;
      intel = result.intelligence;

      // Basic structure validation
      if (!doc || !doc.personal || !doc.experience) {
         status = 'FAIL';
         warnings = 'Missing core ResumeDocument sections';
      }

      if (!intel || !intel.resumeProfile || !intel.resumeProfile.careerLevel) {
        status = 'FAIL';
        warnings = 'Missing core ResumeIntelligence sections';
      }

    } catch (error: any) {
      status = 'ERROR';
      warnings = error.message || 'Unknown exception';
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    results.push({
      file,
      status,
      latency: `${duration}s`,
      cache: 'MISS', // First pass is always miss unless pre-warmed
      confidence: doc?.confidenceScores ? 'Present' : 'Missing',
      warnings
    });
  }

  console.log('\n📊 RC1 VALIDATION REPORT (Pass 1)');
  console.log('===================================');
  results.forEach(r => {
    console.log(`Resume: ${r.file}`);
    console.log(`Status: ${r.status === 'PASS' ? '✅ PASS' : '❌ ' + r.status}`);
    console.log(`Total Latency: ${r.latency}`);
    console.log(`Warnings: ${r.warnings}`);
    console.log('-----------------------------------');
  });

  const passed = results.filter(r => r.status === 'PASS').length;
  console.log(`\nSummary: ${passed}/${files.length} PASSED.`);
  
  if (passed === files.length) {
    console.log('\n🟢 RC1 VALIDATION COMPLETE. Ready for Phase 2 / ATS Engine.');
  } else {
    console.log('\n🔴 RC1 VALIDATION FAILED. Please review the errors above before proceeding.');
  }
}

validateRC1().catch(console.error);
