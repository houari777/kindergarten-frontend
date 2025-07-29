// This file is used to customize the build process for Vercel
const { execSync } = require('child_process');

console.log('Starting custom build process...');

// Install dependencies with legacy peer deps
try {
  console.log('Installing dependencies with legacy peer deps...');
  execSync('npm install --legacy-peer-deps --prefer-offline', { stdio: 'inherit' });
  
  // Run the build
  console.log('Running build...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('Build completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
