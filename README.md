# PP Extension Update Server

A local update server for the pp-extension Chrome extension.

## Setup Instructions

### 1. Install Dependencies

```bash
cd update
npm install
```

### 2. Start the Update Server

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

### 3. Upload Extension Versions

#### Option A: Manual Upload
1. Build the extension:
   ```bash
   cd pp-extension
   npm run build
   ```

2. Upload the generated zip file:
   ```bash
   # Using curl
   curl -X POST -F "extension=@release/crx-pp-extension-x.x.x.zip" http://localhost:3000/pp-ext/upload
   ```

#### Option B: Automated Upload
Build and upload in one command:
```bash
cd pp-extension
npm run build:upload
```

### 4. Verify Setup

Check the update XML:
```bash
curl http://localhost:3000/pp-ext/update.xml
```

List available versions:
```bash
curl http://localhost:3000/pp-ext/versions
```

## API Endpoints

### GET /pp-ext/update.xml
Returns the update XML for Chrome extension auto-updates.

### GET /pp-ext/versions
Lists all available extension versions.

### POST /pp-ext/upload
Upload a new extension version.
- Requires multipart/form-data with a file field named "extension"
- File must be named `crx-pp-extension-VERSION.zip`

### GET /health
Health check endpoint.

## Extension Configuration

The extension is configured to check for updates at:
```
http://localhost:3000/pp-ext/update.xml
```

## How Auto-Updates Work

1. Chrome checks the update URL periodically (typically every few hours)
2. The server returns an XML file with the latest version information
3. If the local version is older than the latest version, Chrome downloads and installs the update

## Testing Updates

1. Install the extension in developer mode
2. Make changes and increment the version in `package.json`
3. Run `npm run build:upload`
4. Chrome should automatically detect and install the update within a few hours

To force an update check:
1. Go to `chrome://extensions`
2. Enable Developer mode
3. Click Update button for the extension

## Notes

- The server stores extension files in the `extensions/pp-ext/` directory
- Version numbers are extracted from filenames (format: `crx-pp-extension-VERSION.zip`)
- The server automatically generates the update XML based on the latest available version