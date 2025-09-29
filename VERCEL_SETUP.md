# Vercel Deployment Guide for PP Extension Update Server

## Overview

This setup allows you to host your Chrome extension update server on Vercel, providing a reliable and scalable solution for automatic updates.

## Structure

```
update/
├── api/                 # Vercel serverless functions
│   ├── health.js
│   └── pp-ext/
│       ├── update.xml.js
│       └── versions.js
├── public/
│   └── pp-ext/          # Extension files go here
├── vercel.json          # Vercel configuration
└── upload-vercel.js     # Upload script
```

## Setup Steps

### 1. Prepare Your Extension

Build your extension:
```bash
cd pp-extension
npm run build
```

### 2. Upload Extension Files

Copy the built extension to the public directory:
```bash
cd update
node upload-vercel.js
```

This will:
- Find the latest extension zip file in `../pp-extension/release/`
- Copy it to `public/pp-ext/`
- Show you the download URLs

### 3. Deploy to Vercel

**Option A: Via Git (Recommended)**

1. Push your changes to your Git repository
2. Connect your repository to Vercel
3. Deploy automatically

**Option B: Via Vercel CLI**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# For production
vercel --prod
```

### 4. Upload Extension Files to Vercel

After deployment, you need to upload the extension files:

1. Go to your Vercel project dashboard
2. Navigate to the "Files" tab
3. Upload the extension zip files to the `public/pp-ext/` directory

OR

Use the Vercel CLI to upload files:
```bash
# Copy extension files to the deployed public directory
vercel cp ../pp-extension/release/crx-pp-extension-*.zip public/pp-ext/
```

## API Endpoints

### Update XML
```
https://update-automate-extension.vercel.app/pp-ext/update.xml?id=YOUR_EXTENSION_ID
```

### List Versions
```
https://update-automate-extension.vercel.app/pp-ext/versions
```

### Health Check
```
https://update-automate-extension.vercel.app/api/health
```

### Download Extension
```
https://update-automate-extension.vercel.app/pp-ext/crx-pp-extension-VERSION.zip
```

## Important Notes

### Extension ID

The update URL requires your extension ID:
1. Install your extension in Chrome
2. Go to `chrome://extensions`
3. Copy the Extension ID
4. Use it in the update URL: `?id=YOUR_EXTENSION_ID`

### File Naming Convention

Extension files must follow this naming pattern:
- `crx-pp-extension-MAJOR.MINOR.PATCH.zip`
- Example: `crx-pp-extension-3.0.1.zip`

### CORS Headers

The server includes CORS headers to allow Chrome to access the update XML from any domain.

## Testing the Setup

1. Deploy your changes to Vercel
2. Upload an extension file
3. Test the endpoints:
   ```bash
   curl https://update-automate-extension.vercel.app/api/health
   curl https://update-automate-extension.vercel.app/pp-ext/versions
   curl "https://update-automate-extension.vercel.app/pp-ext/update.xml?id=test"
   ```

## Troubleshooting

### 404 Errors
- Ensure files are uploaded to the correct directory in Vercel
- Check the vercel.json configuration

### Update Not Working
- Verify the extension ID matches
- Ensure the version number is incremented
- Check that the update XML is accessible

### File Upload Issues
- Vercel has a 250MB file size limit for the hobby tier
- Ensure files are in the `public/pp-ext/` directory
- Check file permissions

## Automation

To automate the upload process, you can:

1. Use GitHub Actions to build and upload
2. Create a script that copies files after build
3. Use Vercel's webhook integration

## Example GitHub Action

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Extension Update

on:
  push:
    branches: [main]
    paths: ['pp-extension/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Build Extension
        run: |
          cd pp-extension
          npm ci
          npm run build

      - name: Copy to Update Server
        run: |
          mkdir -p update/public/pp-ext
          cp pp-extension/release/crx-pp-extension-*.zip update/public/pp-ext/

      - name: Deploy to Vercel
        uses: vercel/action@v2
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```