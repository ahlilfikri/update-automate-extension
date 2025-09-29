const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');
const { log } = require('console');

const UPDATE_SERVER_URL = process.env.UPDATE_SERVER_URL || 'http://localhost:3000';
const EXTENSION_PATH = process.env.EXTENSION_PATH || '../pp-extension/release';

async function uploadLatestVersion() {
  try {
    // Read the release directory
    const releaseDir = path.resolve(__dirname, EXTENSION_PATH);
    const files = fs.readdirSync(releaseDir);
    log(releaseDir)

    // Find the latest zip file
    const zipFiles = files
      .filter(file => file.startsWith('crx-pp-extension-') && file.endsWith('.zip'))
      .sort()
      .reverse();

    if (zipFiles.length === 0) {
      console.log('No extension zip files found in release directory');
      return;
    }

    const latestZip = zipFiles[0];
    const filePath = path.join(releaseDir, latestZip);
    const version = latestZip.match(/crx-pp-extension-(\d+\.\d+\.\d+)\.zip/)[1];

    console.log(`Uploading ${latestZip} (version ${version})...`);

    // Create form data
    const form = new FormData();
    form.append('extension', fs.createReadStream(filePath));

    log(form)

    // Upload to update server
    const response = await axios.post(`${UPDATE_SERVER_URL}/pp-ext/upload`, form)

    log(response)

    if (response.status === 200) {
      console.log('✅ Upload successful!');
      console.log(`Version: ${response.data.version}`);
      console.log(`URL: ${response.data.url}`);
    }
  } catch (error) {
    console.error('❌ Error uploading extension:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  uploadLatestVersion();
}

module.exports = { uploadLatestVersion };