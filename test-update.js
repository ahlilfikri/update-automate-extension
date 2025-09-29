const fs = require('fs');
const path = require('path');
const axios = require('axios');

const UPDATE_SERVER_URL = 'http://localhost:3000';

async function testUpdateSystem() {
  console.log('🔍 Testing PP Extension Update System\n');

  try {
    // Test 1: Check if server is running
    console.log('1. Testing server health...');
    const healthResponse = await axios.get(`${UPDATE_SERVER_URL}/health`);
    if (healthResponse.status === 200) {
      console.log('✅ Server is running\n');
    } else {
      throw new Error('Server not responding');
    }

    // Test 2: Check update.xml
    console.log('2. Testing update.xml endpoint...');
    const xmlResponse = await axios.get(`${UPDATE_SERVER_URL}/pp-ext/update.xml`);
    console.log('✅ Update XML accessible');
    console.log('Content:\n', xmlResponse.data, '\n');

    // Test 3: Check available versions
    console.log('3. Checking available versions...');
    const versionsResponse = await axios.get(`${UPDATE_SERVER_URL}/pp-ext/versions`);
    console.log('✅ Versions endpoint accessible');
    console.log('Available versions:', versionsResponse.data, '\n');

    // Test 4: Check if extension files exist
    console.log('4. Checking extension files...');
    const extensionsDir = path.join(__dirname, 'extensions', 'pp-ext');
    if (fs.existsSync(extensionsDir)) {
      const files = fs.readdirSync(extensionsDir);
      const zipFiles = files.filter(f => f.endsWith('.zip'));
      console.log('✅ Extension directory exists');
      console.log('Available ZIP files:', zipFiles || 'None', '\n');
    } else {
      console.log('❌ Extension directory not found');
      console.log('Creating directory...');
      fs.mkdirSync(extensionsDir, { recursive: true });
    }

    // Test 5: Generate sample update.xml content
    console.log('5. Sample update.xml structure:');
    console.log(`<?xml version="1.0" encoding="UTF-8"?>
<gupdate xmlns="http://www.google.com/update2/response" protocol="2.0">
    <app appid="YOUR_EXTENSION_ID">
        <updatecheck codebase="http://localhost:3000/pp-ext/crx-pp-extension-3.0.1.zip" version="3.0.1"/>
    </app>
</gupdate>\n`);

    console.log('📋 Next Steps:');
    console.log('1. Build your extension: npm run build');
    console.log('2. Upload it: npm run build:upload');
    console.log('3. Install extension in Chrome developer mode');
    console.log('4. Check chrome://extensions for updates');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the update server is running:');
      console.log('   cd update && npm start');
    }
  }
}

if (require.main === module) {
  testUpdateSystem();
}

module.exports = { testUpdateSystem };