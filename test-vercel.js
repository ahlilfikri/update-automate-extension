const axios = require('axios');

const VERCEL_URL = 'https://update-automate-extension.vercel.app';

async function testVercelDeployment() {
  console.log('🧪 Testing Vercel Deployment\n');

  const tests = [
    {
      name: 'Health Check',
      url: `${VERCEL_URL}/api/health`,
      method: 'GET'
    },
    {
      name: 'Versions List',
      url: `${VERCEL_URL}/pp-ext/versions`,
      method: 'GET'
    },
    {
      name: 'Update XML (with dummy ID)',
      url: `${VERCEL_URL}/pp-ext/update.xml?id=test123`,
      method: 'GET',
      expectXml: true
    }
  ];

  for (const test of tests) {
    try {
      console.log(`📋 Testing: ${test.name}`);
      console.log(`URL: ${test.url}`);

      const response = await axios({
        method: test.method,
        url: test.url,
        validateStatus: () => true
      });

      if (response.status === 200) {
        console.log('✅ Success');

        if (test.expectXml) {
          console.log('Content Type:', response.headers['content-type']);
          console.log('XML Preview:');
          console.log(response.data.substring(0, 200) + '...');
        } else if (response.headers['content-type']?.includes('application/json')) {
          console.log('Response:', JSON.stringify(response.data, null, 2));
        }
      } else {
        console.log('❌ Failed with status:', response.status);
        console.log('Response:', response.data);
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }

    console.log('---\n');
  }

  console.log('📚 Usage Instructions:');
  console.log('1. Get your extension ID from chrome://extensions');
  console.log('2. Use this URL for updates:');
  console.log(`   ${VERCEL_URL}/pp-ext/update.xml?id=YOUR_EXTENSION_ID`);
  console.log('3. Upload extension files to public/pp-ext/ directory');
}

if (require.main === module) {
  testVercelDeployment();
}

module.exports = { testVercelDeployment };