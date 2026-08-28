import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import http from 'http';
import { randomBytes } from 'crypto';

const API_URL = 'http://localhost:3000/api/resume-analysis';
const TEMP_DIR = path.join(process.cwd(), 'tmp_test_files');

async function createTempFile(name: string, size: number, content: Buffer): Promise<string> {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR);
  }
  const filePath = path.join(TEMP_DIR, name);
  let finalBuffer = content;
  if (content.length < size) {
    const padding = Buffer.alloc(size - content.length, 0);
    finalBuffer = Buffer.concat([content, padding]);
  }
  fs.writeFileSync(filePath, finalBuffer);
  return filePath;
}

async function testUpload(testName: string, fileName: string, filePath: string, mimeType: string, expectedStatus: number) {
  const form = new FormData();
  form.append('mode', 'resume');
  form.append('resumeFile', fs.createReadStream(filePath), { contentType: mimeType, filename: fileName });
  
  return new Promise<boolean>((resolve) => {
    const req = http.request(API_URL, {
      method: 'POST',
      headers: form.getHeaders(),
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === expectedStatus) {
          console.log(`[PASS] ${testName} -> Expected ${expectedStatus}, got ${res.statusCode}. Output: ${data}`);
          resolve(true);
        } else {
          console.error(`[FAIL] ${testName} -> Expected ${expectedStatus}, got ${res.statusCode}. Output: ${data}`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (e) => {
      console.error(`[ERROR] ${testName} -> Request failed: ${e.message}`);
      resolve(false);
    });

    form.pipe(req);
  });
}

async function runTests() {
  console.log('Starting File Upload Security Tests...');
  let passed = 0;
  let total = 0;

  // 1. Valid PDF under 5 MB
  const validPdfPath = await createTempFile('valid.pdf', 1024, Buffer.from('%PDF-1.4\n%EOF'));
  total++;
  if (await testUpload('Valid PDF (<5MB)', 'valid.pdf', validPdfPath, 'application/pdf', 400)) passed++; // 400 because text is empty

  // 2. Valid DOCX under 5 MB
  const validDocxPath = await createTempFile('valid.docx', 1024, Buffer.from([0x50, 0x4B, 0x03, 0x04]));
  total++;
  if (await testUpload('Valid DOCX (<5MB)', 'valid.docx', validDocxPath, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 400)) passed++;

  // 3. Valid TXT under 5 MB
  const validTxtPath = await createTempFile('valid.txt', 100, Buffer.from('Hello world this is a resume with skills React Node TypeScript'));
  total++;
  if (await testUpload('Valid TXT (<5MB)', 'valid.txt', validTxtPath, 'text/plain', 200)) passed++;

  // 4. PDF > 5 MB
  const hugePdfPath = await createTempFile('huge.pdf', 6 * 1024 * 1024, Buffer.from('%PDF-'));
  total++;
  if (await testUpload('Huge PDF (>5MB)', 'huge.pdf', hugePdfPath, 'application/pdf', 413)) passed++;

  // 5. DOCX > 5 MB
  const hugeDocxPath = await createTempFile('huge.docx', 6 * 1024 * 1024, Buffer.from([0x50, 0x4B, 0x03, 0x04]));
  total++;
  if (await testUpload('Huge DOCX (>5MB)', 'huge.docx', hugeDocxPath, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 413)) passed++;

  // 6. Spoofed extension
  const spoofedPath = await createTempFile('spoofed.pdf', 1024, Buffer.from('<html>hack</html>'));
  total++;
  if (await testUpload('Spoofed Extension (HTML as PDF)', 'spoofed.pdf', spoofedPath, 'text/html', 415)) passed++;

  // 7. Incorrect MIME
  const incorrectMimePath = await createTempFile('incorrect.txt', 1024, Buffer.from('hello'));
  total++;
  if (await testUpload('Incorrect MIME (TXT as exe)', 'incorrect.txt', incorrectMimePath, 'application/x-msdownload', 415)) passed++;

  // 8. Corrupt PDF
  const corruptPdfPath = await createTempFile('corrupt.pdf', 1024, Buffer.from('NOTAPDF-1.4\n%EOF'));
  total++;
  if (await testUpload('Corrupt PDF (Missing Magic Bytes)', 'corrupt.pdf', corruptPdfPath, 'application/pdf', 415)) passed++;

  // 9. Corrupt DOCX
  const corruptDocxPath = await createTempFile('corrupt.docx', 1024, Buffer.from([0x00, 0x00, 0x00, 0x00]));
  total++;
  if (await testUpload('Corrupt DOCX (Missing Magic Bytes)', 'corrupt.docx', corruptDocxPath, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 415)) passed++;

  // 10. Empty file
  const emptyFilePath = await createTempFile('empty.pdf', 0, Buffer.from(''));
  total++;
  if (await testUpload('Empty File', 'empty.pdf', emptyFilePath, 'application/pdf', 415)) passed++; // Will fail PDF magic byte check

  console.log(`\nResults: ${passed}/${total} passed.`);
  
  // Cleanup
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  }

  process.exit(passed === total ? 0 : 1);
}

runTests();
