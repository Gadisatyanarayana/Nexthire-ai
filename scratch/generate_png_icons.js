const fs = require('fs');
const path = require('path');

async function generateIcons() {
  const svgBuffer = fs.readFileSync(path.join(__dirname, '../public/icon.svg'));

  let sharp;
  try {
    sharp = require('sharp');
  } catch (e) {
    console.log('Sharp not installed, attempting canvas...');
  }

  if (sharp) {
    console.log('Rendering high-res PNG icons using Sharp...');
    
    const png512 = await sharp(svgBuffer).resize(512, 512).png().toBuffer();
    const png180 = await sharp(svgBuffer).resize(180, 180).png().toBuffer();
    const png64 = await sharp(svgBuffer).resize(64, 64).png().toBuffer();
    const png32 = await sharp(svgBuffer).resize(32, 32).png().toBuffer();

    fs.writeFileSync(path.join(__dirname, '../public/icon.png'), png512);
    fs.writeFileSync(path.join(__dirname, '../src/app/icon.png'), png512);
    fs.writeFileSync(path.join(__dirname, '../src/app/apple-icon.png'), png180);
    fs.writeFileSync(path.join(__dirname, '../public/apple-touch-icon.png'), png180);
    
    // Replace default Next.js favicons
    fs.writeFileSync(path.join(__dirname, '../src/app/favicon.ico'), png64);
    fs.writeFileSync(path.join(__dirname, '../public/favicon.ico'), png64);

    console.log('Successfully generated icon.png, apple-icon.png, and updated favicon.ico in src/app/ and public/!');
  } else {
    console.log('Sharp unavailable. SVG icons created successfully.');
  }
}

generateIcons().catch(console.error);
