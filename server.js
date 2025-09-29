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
const EXTENSION_CONFIG = {
  id: 'blpajonlngokjgjeielkjcicdcpffege',
  name: 'pp-extension',
  basePath: '/pp-ext'
};

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
  console.log("path ext dir",ppExtDir);
  console.log(files);
  
  files.forEach(file => {
    if (file.endsWith('.zip') && file.startsWith('crx-pp-extension-')) {
      const version = extractVersion(file);
      if (version) {
        versions.push({
          version,
          filename: file,
          path: path.join(ppExtDir, file),
          url: `http://localhost:${PORT}${EXTENSION_CONFIG.basePath}/${file}`
        });
      }
    }
  });

  // Sort by version (descending)
  return versions.sort((a, b) => semver.rcompare(a.version, b.version));
}

// Generate update XML
function generateUpdateXml(latestVersion) {
  const doc = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('gupdate', {
      xmlns: 'http://www.google.com/update2/response',
      protocol: '2.0'
    })
    .ele('app', { appid: EXTENSION_CONFIG.id })
    .ele('updatecheck', {
      codebase: `http://localhost:${PORT}${EXTENSION_CONFIG.basePath}/${latestVersion.filename}`,
      version: latestVersion.version
    })
    .up()
    .up();

  return doc.end({ prettyPrint: true });
}

// Routes

// Serve update.xml
app.get(`${EXTENSION_CONFIG.basePath}/update.xml`, (req, res) => {
  const versions = getAvailableVersions();

  if (versions.length === 0) {
    return res.status(404).send('No versions available');
  }

  const latestVersion = versions[0];
  const xml = generateUpdateXml(latestVersion);

  res.set('Content-Type', 'application/xml');
  res.send(xml);
});

// List all available versions
app.get(`${EXTENSION_CONFIG.basePath}/versions`, (req, res) => {
  const versions = getAvailableVersions();
  res.json({
    extension: EXTENSION_CONFIG.name,
    versions: versions.map(v => ({
      version: v.version,
      url: v.url,
      filename: v.filename
    }))
  });
});

// Upload new version
app.post(`${EXTENSION_CONFIG.basePath}/upload`, upload.single('extension'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const version = extractVersion(req.file.originalname);
  if (!version) {
    fs.removeSync(req.file.path);
    return res.status(400).json({ error: 'Invalid version format in filename' });
  }

  // // Check if version already exists
  // const existingFile = path.join(ppExtDir, req.file.originalname);
  // if (fs.existsSync(existingFile)) {
  //   fs.removeSync(req.file.path);
  //   return res.status(409).json({ error: 'Version already exists' });
  // }

  res.json({
    message: 'Extension uploaded successfully',
    version,
    filename: req.file.originalname,
    url: `http://localhost:${PORT}${EXTENSION_CONFIG.basePath}/${req.file.originalname}`
  });
});

// Serve extension files
app.use(`${EXTENSION_CONFIG.basePath}`, express.static(ppExtDir));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Update server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Update server running on port ${PORT}`);
  console.log(`Update XML: http://localhost:${PORT}${EXTENSION_CONFIG.basePath}/update.xml`);

  // Log available versions on startup
  const versions = getAvailableVersions();
  if (versions.length > 0) {
    console.log(`Available versions: ${versions.map(v => v.version).join(', ')}`);
    console.log(`Latest version: ${versions[0].version}`);
  } else {
    console.log('No versions available. Upload extension files to get started.');
  }
});