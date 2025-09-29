const crypto = require('crypto');

// Function to generate Chrome extension ID from public key
function getExtensionId(publicKey) {
  const hash = crypto.createHash('sha256').update(publicKey).digest('base64');
  // Replace + with -, / with _, remove =
  const base64 = hash.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  // Take first 32 characters
  return base64.substring(0, 32);
}

// For extensions packed with CRXJS without a custom key
// Chrome generates a random ID. The format is a 32-character string
// containing lowercase letters (a-p) only.

console.log('🔍 Extension ID Information\n');
console.log('Important notes about Chrome extension IDs:');
console.log('1. For development (unpacked extensions):');
console.log('   - Chrome generates a random ID');
console.log('   - Format: 32 characters, a-p only');
console.log('   - Example: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\n');

console.log('2. For packed extensions with update_url:');
console.log('   - ID is derived from the private key used to sign the CRX');
console.log('   - When using CRXJS without custom key, it generates a random one\n');

console.log('3. To find your actual extension ID:');
console.log('   - Load the extension in Chrome');
console.log('   - Go to chrome://extensions');
console.log('   - Enable Developer mode');
console.log('   - The ID will be shown for your extension\n');

console.log('\n💡 Solution:');
console.log('1. Install your extension first to get the actual ID');
console.log('2. Update the EXTENSION_CONFIG.id in server.js with that ID');
console.log('3. Or generate a consistent key using CRXJS configuration');