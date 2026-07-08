const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local manually for node script
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

async function testOpenRouter() {
  console.log("GROQ_API_KEY set:", !!process.env.GROQ_API_KEY);
  console.log("OPENROUTER_API_KEY set:", !!process.env.OPENROUTER_API_KEY);
  console.log("OPENROUTER_API_KEY value:", process.env.OPENROUTER_API_KEY);

  const url = 'https://openrouter.io/api/v1/chat/completions';
  const apiKey = process.env.OPENROUTER_API_KEY || '';
  
  const payload = {
    model: 'anthropic/claude-3.5-sonnet',
    messages: [{ role: 'user', content: 'Hello' }],
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

testOpenRouter();
