# PP Extension Auto-Update Setup Guide

## Quick Setup Steps

### 1. Start the Update Server

```bash
cd update
npm install
node server-flexible.js
```

### 2. Get Your Extension ID

1. Build and load your extension in Chrome:
   ```bash
   cd pp-extension
   npm run build
   ```

2. Go to `chrome://extensions`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `dist` folder from your pp-extension
6. Copy the Extension ID shown (it's a 32-character string)

### 3. Update Your Manifest

Edit `D:\reacteev\pp-extension\manifest.config.ts`:

```typescript
// Replace YOUR_EXTENSION_ID with the actual ID from step 2
update_url: "http://localhost:3000/pp-ext/update.xml?id=YOUR_EXTENSION_ID",
```

### 4. Upload Your Extension

```bash
cd pp-extension
npm run build:upload
```

### 5. Test Updates

1. Increment version in `package.json` (e.g., from "3.0.1" to "3.0.2")
2. Run `npm run build:upload`
3. In Chrome, go to `chrome://extensions`
4. Click the Update button for your extension

## Testing the Update System

Run the test script:
```bash
cd update
node test-update.js
```

## Troubleshooting

### Extension won't update?
1. Ensure the update server is running
2. Check that the extension ID in the URL matches your actual extension ID
3. Verify the new version number is higher than the current one
4. Chrome checks for updates every few hours - you can force check by clicking Update

### Can't access the update server?
1. Make sure port 3000 is not blocked
2. Check if the server started successfully (look for "Update server running" message)

### File upload fails?
1. Ensure the ZIP file follows the naming convention: `crx-pp-extension-VERSION.zip`
2. Check file permissions in the `extensions/pp-ext` directory

## API Reference

### Update XML URL Format
```
http://localhost:3000/pp-ext/update.xml?id=YOUR_EXTENSION_ID
```

### Upload Endpoint
```
POST http://localhost:3000/pp-ext/upload
Content-Type: multipart/form-data
Body: extension=@crx-pp-extension-x.x.x.zip
```

### List Versions
```
GET http://localhost:3000/pp-ext/versions
```