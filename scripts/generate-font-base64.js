const fs = require('fs');
const path = require('path');

// Path to the fonts directory
const fontsDir = path.join(__dirname, '../public/fonts');
const outputFile = path.join(__dirname, '../src/utils/amiriFontBase64.js');

// Font files to encode
const fontFiles = [
  { name: 'amiri-regular', path: path.join(fontsDir, 'Amiri-Regular.ttf') },
  { name: 'amiri-bold', path: path.join(fontsDir, 'Amiri-Bold.ttf') },
];

// Create the output directory if it doesn't exist
if (!fs.existsSync(path.dirname(outputFile))) {
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
}

// Generate the output content
let outputContent = '// This file is auto-generated. Do not edit directly.\n';
outputContent += '// Run `node scripts/generate-font-base64.js` to update.\n\n';

// Process each font file
fontFiles.forEach(({ name, path: fontPath }) => {
  if (fs.existsSync(fontPath)) {
    const fontData = fs.readFileSync(fontPath);
    const base64 = fontData.toString('base64');
    
    // Split into smaller chunks for better readability
    const chunkSize = 80;
    const chunks = [];
    for (let i = 0; i < base64.length; i += chunkSize) {
      chunks.push(`'${base64.substr(i, chunkSize)}'`);
    }
    
    const varName = name.replace(/-/g, '');
    outputContent += `export const ${varName} = ${chunks.join(' +\n  ')};\n\n`;
  } else {
    console.warn(`Warning: Font file not found: ${fontPath}`);
  }
});

// Write the output file
fs.writeFileSync(outputFile, outputContent);

console.log(`Font base64 data written to ${outputFile}`);
