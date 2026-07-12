const http = require('http');

async function measure(url) {
  const start = Date.now();
  try {
    const res = await fetch(url);
    await res.text();
    return { status: res.status, timeMs: Date.now() - start };
  } catch(e) {
    return { error: e.message, timeMs: Date.now() - start };
  }
}

async function run() {
  console.log('Measuring Production Server Performance on Port 3001...\n');
  
  const baseUrl = 'http://localhost:3001';
  
  // Wait for server to be up
  let up = false;
  for(let i=0; i<60; i++) {
    try {
      await fetch(baseUrl);
      up = true;
      break;
    } catch(e) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  
  if(!up) {
    console.log('Server never came up on port 3001');
    process.exit(1);
  }

  const results = {
    html: await measure(baseUrl + '/aptitude/mock-tests'),
    companyApi: await measure(baseUrl + '/api/v1/aptitude/company'),
    historyApi: await measure(baseUrl + '/api/v1/aptitude/mock-history'),
    questionsApi: await measure(baseUrl + '/api/v1/aptitude/questions?lesson_id=lesson-apt-0&limit=15')
  };
  
  console.log(JSON.stringify(results, null, 2));
}

run();
