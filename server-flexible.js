const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const semver = require('semver');
const { create } = require('xmlbuilder2');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Extension configuration
const EXTENSION_NAME = 'pp-extension';
const BASE_PATH = '/pp-ext';

// Ensure directories exist
const extensionsDir = path.join(__dirname, 'extensions');
const ppExtDir = path.join(extensionsDir, 'pp-ext');
fs.ensureDirSync(ppExtDir);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, ppExtDir);
  },
  filename: (req, file, cb) => {
    // Keep original filename
    cb(null, file.originalname);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith('.zip') && file.originalname.startsWith('crx-pp-extension-')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file name. Must be crx-pp-extension-*.zip'));
    }
  }
});

// Helper function to extract version from filename
function extractVersion(filename) {
  const match = filename.match(/crx-pp-extension-(\d+\.\d+\.\d+)\.zip/);
  return match ? match[1] : null;
}

// Helper function to get all available versions
function getAvailableVersions() {
  const versions = [];
  const files = fs.readdirSync(ppExtDir);

  files.forEach(file => {
    if (file.endsWith('.zip') && file.startsWith('crx-pp-extension-')) {
      const version = extractVersion(file);
      if (version) {
        versions.push({
          version,
          filename: file,
          path: path.join(ppExtDir, file),
          url: `http://localhost:${PORT}${BASE_PATH}/${file}`
        });
      }
    }
  });

  // Sort by version (descending)
  return versions.sort((a, b) => semver.rcompare(a.version, b.version));
}

// Generate update XML
function generateUpdateXml(extensionId, latestVersion) {
  const doc = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('gupdate', {
      xmlns: 'http://www.google.com/update2/response',
      protocol: '2.0'
    })
    .ele('app', { appid: extensionId })
    .ele('updatecheck', {
      codebase: `http://localhost:${PORT}${BASE_PATH}/${latestVersion.filename}`,
      version: latestVersion.version
    })
    .up()
    .up();

  return doc.end({ prettyPrint: true });
}

// Routes

// Serve update.xml with extension ID from query parameter
app.get(`${BASE_PATH}/update.xml`, (req, res) => {
  const extensionId = req.query.id || req.query.appid;

  if (!extensionId) {
    return res.status(400).send('Extension ID is required. Use ?id=YOUR_EXTENSION_ID');
  }

  const versions = getAvailableVersions();

  if (versions.length === 0) {
    return res.status(404).send('No versions available');
  }

  const latestVersion = versions[0];
  const xml = generateUpdateXml(extensionId, latestVersion);

  res.set('Content-Type', 'application/xml');
  res.send(xml);
});

// Update the manifest URL format to support dynamic IDs
app.get(`${BASE_PATH}/update-manifest.json`, (req, res) => {
  const extensionId = req.query.id;

  if (!extensionId) {
    return res.status(400).json({ error: 'Extension ID is required' });
  }

  const versions = getAvailableVersions();

  if (versions.length === 0) {
    return res.status(404).json({ error: 'No versions available' });
  }

  const latestVersion = versions[0];

  res.json({
    update_url: `http://localhost:${PORT}${BASE_PATH}/update.xml?id=${extensionId}`,
    latest_version: latestVersion.version,
    download_url: latestVersion.url
  });
});

// List all available versions
app.get(`${BASE_PATH}/versions`, (req, res) => {
  const versions = getAvailableVersions();
  res.json({
    extension: EXTENSION_NAME,
    versions: versions.map(v => ({
      version: v.version,
      url: v.url,
      filename: v.filename
    }))
  });
});

// Upload new version
app.post(`${BASE_PATH}/upload`, upload.single('extension'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const version = extractVersion(req.file.originalname);
  if (!version) {
    fs.removeSync(req.file.path);
    return res.status(400).json({ error: 'Invalid version format in filename' });
  }

  res.json({
    message: 'Extension uploaded successfully',
    version,
    filename: req.file.originalname,
    url: `http://localhost:${PORT}${BASE_PATH}/${req.file.originalname}`
  });
});

// Serve extension files
app.use(`${BASE_PATH}`, express.static(ppExtDir));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Update server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Update server running on port ${PORT}`);
  console.log(`\n📋 Endpoints:`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`   Update XML: http://localhost:${PORT}${BASE_PATH}/update.xml?id=YOUR_EXTENSION_ID`);
  console.log(`   Versions: http://localhost:${PORT}${BASE_PATH}/versions`);
  console.log(`   Upload: POST http://localhost:${PORT}${BASE_PATH}/upload`);

  console.log(`\n💡 Usage:`);
  console.log(`   1. Install your extension in Chrome`);
  console.log(`   2. Get the extension ID from chrome://extensions`);
  console.log(`   3. Update your manifest.config.ts with:`);
  console.log(`      update_url: "http://localhost:${PORT}${BASE_PATH}/update.xml?id=YOUR_EXTENSION_ID"`);

  // Log available versions on startup
  const versions = getAvailableVersions();
  if (versions.length > 0) {
    console.log(`\n📦 Available versions: ${versions.map(v => v.version).join(', ')}`);
    console.log(`Latest version: ${versions[0].version}`);
  } else {
    console.log(`\n⚠️  No versions available. Upload extension files to get started.`);
  }
});