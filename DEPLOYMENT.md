# 🚀 Deployment Guide

This guide covers various deployment options for Buzz vs Bite: Backyard Battle.

## 📋 Prerequisites

- Node.js 16+ installed
- Git repository cloned locally
- Build completed successfully (`npm run build`)

## 🌐 Vercel (Recommended)

### Quick Deploy
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from project root
vercel --prod
```

### Manual Deploy
1. Go to [vercel.com](https://vercel.com)
2. Connect your GitHub account
3. Import the Buzz-Bites repository
4. Vercel will auto-detect the framework (Vite)
5. Click "Deploy"

### Environment Variables
In Vercel dashboard:
1. Go to Project Settings → Environment Variables
2. Add `VITE_GEMINI_API_KEY` (optional)
3. Value: Your Gemini API key

## 🔥 Netlify

### Drag & Drop
```bash
# Build the project
npm run build

# Upload the dist/ folder to Netlify
```

### CLI Deploy
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod --dir=dist
```

### Configuration
Create `netlify.toml`:
```toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## 🐳 Docker

### Build Image
```bash
# Build Docker image
docker build -t buzz-bites .

# Run container
docker run -p 3000:3000 buzz-bites
```

### Dockerfile
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf
```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    server {
        listen       80;
        server_name  localhost;
        root         /usr/share/nginx/html;
        index        index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }

        gzip on;
        gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    }
}
```

## 🟢 GitHub Pages

### Build Script
Add to `package.json`:
```json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

### Deploy
```bash
# Install gh-pages
npm i -g gh-pages

# Deploy to GitHub Pages
npm run deploy
```

### Repository Settings
1. Go to repository Settings → Pages
2. Source: Deploy from a branch
3. Branch: gh-pages
4. Folder: / (root)

## ☁️ Cloudflare Pages

### Manual Deploy
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/pages)
2. Click "Create a project"
3. Connect your GitHub account
4. Select Buzz-Bites repository
5. Build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
6. Click "Save and Deploy"

### Wrangler CLI
```bash
# Install Wrangler
npm i -g wrangler

# Login
wrangler login

# Deploy
wrangler pages deploy dist
```

## 🟦 Azure Static Web Apps

### Quick Deploy
```bash
# Install Azure CLI
npm i -g @azure/cli

# Login
az login

# Deploy
az staticwebapp create \
  --name buzz-bites \
  --resource-group my-resource-group \
  --source https://github.com/TheRealFREDP3D/Buzz-Bites \
  --location eastus \
  --branch main \
  --app-build-command "npm run build" \
  --app-artifact-location "dist"
```

## 🟡 AWS Amplify

### Console Deploy
1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Click "New app"
3. Select "GitHub"
4. Choose Buzz-Bites repository
5. Build settings:
   - Build command: `npm run build`
   - Build output: `dist`
6. Click "Save and deploy"

## 🔧 Environment Variables

### Required Variables
- `VITE_GEMINI_API_KEY`: Optional Gemini API key for commentary

### Security Notes
- Never commit API keys to repository
- Use platform-specific environment variable management
- Rotate keys regularly

## 📊 Performance Optimization

### Build Optimization
```bash
# Analyze bundle size
npm run build -- --analyze

# Enable compression
npm run build -- --mode production
```

### CDN Configuration
- Enable Gzip/Brotli compression
- Set appropriate cache headers
- Use CDN for static assets

### SEO Meta Tags
Update `index.html`:
```html
<head>
  <meta name="description" content="Epic real-time strategy game where bees and ants battle for backyard supremacy">
  <meta name="keywords" content="game, strategy, bees, ants, rts, tower defense">
  <meta property="og:title" content="Buzz vs Bite: Backyard Battle">
  <meta property="og:description" content="Command bee colony to defend against invading ant forces">
  <meta property="og:image" content="https://your-domain.com/preview-image.png">
</head>
```

## 🔍 Troubleshooting

### Common Issues

#### Build Fails
```bash
# Clear node_modules
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf .vite dist
npm run build
```

#### 404 Errors on Deploy
- Ensure SPA routing is configured
- Add fallback to `index.html`
- Check server configuration

#### Environment Variables Not Working
- Verify variable names start with `VITE_`
- Check platform-specific configuration
- Restart deployment after adding variables

#### CORS Issues
- Configure CORS headers in server
- Use proper API endpoints
- Check browser console for errors

### Performance Issues
- Enable lazy loading for large assets
- Optimize images and media
- Use code splitting for large bundles

## 📈 Monitoring

### Analytics Integration
```javascript
// Google Analytics
import { GA_TRACKING_ID } from './env';

gtag('config', GA_TRACKING_ID);

// Custom events
gtag('event', 'game_start', {
  'event_category': 'engagement'
});
```

### Error Tracking
```javascript
// Sentry
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN
});
```

## 🔄 CI/CD Pipeline

### GitHub Actions
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
      env:
        VITE_GEMINI_API_KEY: ${{ secrets.VITE_GEMINI_API_KEY }}
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 📱 Mobile Optimization

### PWA Features
Add `manifest.json`:
```json
{
  "name": "Buzz vs Bite",
  "short_name": "BuzzBite",
  "theme_color": "#fbbf24",
  "background_color": "#1f2937",
  "display": "standalone",
  "icons": [
    {
      "src": "icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

### Service Worker
```javascript
// sw.js
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('buzz-bites-v1').then((cache) => {
      return cache.addAll(['/']);
    })
  );
});
```

## 🔐 Security Best Practices

### HTTPS Only
- Redirect HTTP to HTTPS
- Use secure cookies
- Enable HSTS headers

### Content Security Policy
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
">
```

### Input Validation
- Sanitize user inputs
- Validate API responses
- Use HTTPS for all requests

## 📞 Support

For deployment issues:
1. Check platform-specific documentation
2. Review build logs for errors
3. Verify environment variables
4. Test locally before deploying

---

**Happy deploying! 🚀**
