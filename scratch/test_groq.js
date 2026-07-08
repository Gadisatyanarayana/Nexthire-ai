const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local manually
const envLocalPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envConfig = fs.readFileSync(envLocalPath, 'utf8');
  for (const line of envConfig.split('\n')) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.slice(1, -1);
      }
      process.env[key] = value.trim();
    }
  }
}

async function testGroq() {
  const url = 'https://api.groq.com/openai/v1/chat/completions';
  const apiKey = process.env.GROQ_API_KEY || '';
  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  
  console.log("Using Groq API Key:", apiKey.substring(0, 10) + "...");
  console.log("Using model:", model);

  const payload = {
    model: model,
    messages: [
      { role: 'system', content: 'Respond in valid JSON only.' },
      { role: 'user', content: 'Return a JSON containing {"status": "ok"}' }
    ],
    response_format: { type: 'json_object' }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log("Status:", response.status);
    const body = await response.text();
    console.log("Response:", body);
  } catch (e) {
    console.error("Fetch error:", e);
  }
}

testGroq();
