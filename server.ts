import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import crypto from "crypto";

// Secret key for AES-256-CBC encryption
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const IV_LENGTH = 16; 

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // API Route: Secure Link
  app.get("/api/v1/secure-fetch", (req, res) => {
    const { id, timestamp } = req.query;
    
    // User-Agent validation (reject curl, wget, basic scrapers)
    const userAgent = req.headers['user-agent'] || '';
    if (!userAgent || /curl|wget|bot|spider|crawler/i.test(userAgent)) {
      res.status(403).json({ error: 'Access Denied: Bot detected' });
      return;
    }

    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'Access Denied: Missing App ID' });
      return;
    }

    if (!timestamp || typeof timestamp !== 'string') {
      res.status(400).json({ error: 'Access Denied: Invalid parameters' });
      return;
    }

    // Require at least 3 seconds (3000ms) difference
    const clickTime = parseInt(timestamp, 10);
    const now = Date.now();
    if (isNaN(clickTime) || now - clickTime < 3000) {
      res.status(403).json({ error: 'Security Exception: Request too fast. Human verification failed.' });
      return;
    }

    // Since we don't have Supabase, we mock fetching the real URL
    const mockSecureUrl = `https://example.com/download-secure?fileId=${id}&token=${crypto.randomBytes(16).toString('hex')}`;
    
    // Server-side redirect (302) to mask real URL
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.redirect(302, mockSecureUrl);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static files
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
