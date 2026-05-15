import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import crypto from "crypto";
import compression from "compression";

// Secret key for AES-256-CBC encryption
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const IV_LENGTH = 16; 

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Use compression for faster transfers
  app.use(compression());
  app.use(express.json());

  // API Route: Secure Link
  app.get("/api/v1/secure-fetch", (req, res) => {
    const { id, timestamp } = req.query;
    
    // User-Agent validation (reject curl, wget, basic scrapers)
    const userAgent = (req.headers['user-agent'] as string) || '';
    if (!userAgent || /curl|wget|bot|spider|crawler/i.test(userAgent)) {
      res.status(403).json({ error: 'Access Denied: Bot detected' });
      return;
    }

    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'Access Denied: Missing App ID' });
      return;
    }

    // Since we don't have Supabase, we mock fetching the real URL optionally passing it via query
    let targetUrl = `https://example.com/download-secure?fileId=${id}&token=${crypto.randomBytes(16).toString('hex')}`;
    if (req.query.url && typeof req.query.url === 'string') {
      try {
        // Try decoding base64 first
        targetUrl = Buffer.from(req.query.url, 'base64').toString('utf-8');
      } catch (e) {
        // Fallback
        targetUrl = req.query.url;
      }
      
      // If the url was not base64 encoded, decoding it might result in garbage or original string.
      if (!targetUrl.startsWith('http')) {
        if (req.query.url.startsWith('http')) {
           targetUrl = req.query.url;
        } else if (targetUrl === 'U2FsdGVkX19xxxxxx' || targetUrl.trim() === '') {
           targetUrl = `https://example.com/mock-secure-redirect?original=${targetUrl}`;
        } else {
           targetUrl = 'https://' + targetUrl.replace(/^[^\w]+/, '');
        }
      }
    }
    
    // Server-side redirect (302) to mask real URL
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.redirect(302, targetUrl);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static files with aggressive caching for assets
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      maxAge: '1d', // Cache for 1 day instead of 1 year for safety but performance
      etag: true,
      lastModified: true,
      index: false
    }));
    
    // Specifically handle assets (JS, CSS, Images) with long-term caching
    app.use('/assets', express.static(path.join(distPath, 'assets'), {
      maxAge: '1y',
      immutable: true
    }));
    
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT as number, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
