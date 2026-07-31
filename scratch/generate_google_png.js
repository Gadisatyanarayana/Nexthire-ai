const fs = require('fs');
const path = require('path');

async function renderGooglePng() {
  const sharp = require('sharp');
  const svg = fs.readFileSync(path.join(__dirname, '../public/google.svg'));
  const png = await sharp(svg).resize(128, 128).png().toBuffer();
  
  if (!fs.existsSync(path.join(__dirname, '../public/logos'))) {
    fs.mkdirSync(path.join(__dirname, '../public/logos'), { recursive: true });
  }
  fs.writeFileSync(path.join(__dirname, '../public/google.png'), png);
  fs.writeFileSync(path.join(__dirname, '../public/logos/google.png'), png);
  console.log('Google PNG logos generated!');
}

renderGooglePng().catch(console.error);
