const fs = require('fs');
const path = require('path');
const semver = require('semver');

// Extension configuration
const EXTENSION_NAME = 'pp-extension';
const BASE_PATH = '/pp-ext';

// Helper function to extract version from filename
function extractVersion(filename) {
  const match = filename.match(/crx-pp-extension-(\d+\.\d+\.\d+)\.zip/);
  return match ? match[1] : null;
}

// Helper function to get all available versions
function getAvailableVersions() {
  try {
    const versions = [];
    const ppExtDir = path.join(process.cwd(), 'public', 'pp-ext');

    if (!fs.existsSync(ppExtDir)) {
      return [];
    }

    const files = fs.readdirSync(ppExtDir);

    files.forEach(file => {
      if (file.endsWith('.zip') && file.startsWith('crx-pp-extension-')) {
        const version = extractVersion(file);
        if (version) {
          versions.push({
            version,
            filename: file,
            path: path.join(ppExtDir, file),
            url: `https://update-automate-extension.vercel.app${BASE_PATH}/${file}`
          });
        }
      }
    });

    // Sort by version (descending)
    return versions.sort((a, b) => semver.rcompare(a.version, b.version));
  } catch (error) {
    console.error('Error reading versions:', error);
    return [];
  }
}

// Generate update XML
function generateUpdateXml(extensionId, latestVersion) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<gupdate xmlns="http://www.google.com/update2/response" protocol="2.0">
    <app appid="${extensionId}">
        <updatecheck codebase="https://update-automate-extension.vercel.app${BASE_PATH}/${latestVersion.filename}" version="${latestVersion.version}"/>
    </app>
</gupdate>`;

  return xml;
}

export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).send('Method not allowed');
    return;
  }

  const extensionId = req.query.id || req.query.appid;

  if (!extensionId) {
    res.status(400).send('Extension ID is required. Use ?id=YOUR_EXTENSION_ID');
    return;
  }

  const versions = getAvailableVersions();

  if (versions.length === 0) {
    res.status(404).send('No versions available');
    return;
  }

  const latestVersion = versions[0];
  const xml = generateUpdateXml(extensionId, latestVersion);

  res.setHeader('Content-Type', 'application/xml');
  res.send(xml);
}