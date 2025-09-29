const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

const VERCEL_URL = 'https://update-automate-extension.vercel.app';
const EXTENSION_PATH = process.env.EXTENSION_PATH || '../pp-extension/release';

async function uploadToVercel() {
  try {
    console.log('📤 Uploading extension to Vercel update server...\n');

    // Read the release directory
    const releaseDir = path.resolve(__dirname, EXTENSION_PATH);
    const files = fs.readdirSync(releaseDir);

    // Find the latest zip file
    const zipFiles = files
      .filter(file => file.startsWith('crx-pp-extension-') && file.endsWith('.zip'))
      .sort()
      .reverse();

    if (zipFiles.length === 0) {
      console.log('❌ No extension zip files found in release directory');
      console.log(`Make sure you've built the extension first: npm run build`);
      return;
    }

    const latestZip = zipFiles[0];
    const filePath = path.join(releaseDir, latestZip);
    const version = latestZip.match(/crx-pp-extension-(\d+\.\d+\.\d+)\.zip/)[1];

    console.log(`📦 Found extension: ${latestZip}`);
    console.log(`📋 Version: ${version}`);
    console.log('');

    // Check file size
    const stats = fs.statSync(filePath);
    console.log(`📊 File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log('');

    // For Vercel, we need to manually copy the file to the public directory
    const publicDir = path.join(__dirname, 'public', 'pp-ext');
    const destPath = path.join(publicDir, latestZip);

    // Ensure directory exists
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // Copy file to public directory
    fs.copyFileSync(filePath, destPath);
    console.log(`✅ Copied to public/pp-ext/${latestZip}`);
    console.log('');

    console.log('🚀 Next steps:');
    console.log('1. Commit and push the changes to deploy to Vercel');
    console.log('2. Or manually upload the file to Vercel dashboard');
    console.log('');
    console.log('📋 Extension will be available at:');
    console.log(`   ${VERCEL_URL}/pp-ext/${latestZip}`);
    console.log('');
    console.log('🔗 Update XML URL format:');
    console.log(`   ${VERCEL_URL}/pp-ext/update.xml?id=YOUR_EXTENSION_ID`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  uploadToVercel();
}

module.exports = { uploadToVercel };