import express from "express";
import crypto from "crypto";
import compression from "compression";

const app = express();

app.use(compression());
app.use(express.json());

// API Route: Secure Link
app.get("/api/v1/secure-fetch", (req, res) => {
  const { id } = req.query;
  
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

  // Setup the target secure URL
  let targetUrl = `https://example.com/download-secure?fileId=${id}&token=${crypto.randomBytes(16).toString('hex')}`;
  if (req.query.url && typeof req.query.url === 'string') {
    try {
      // Decode base64 URL
      targetUrl = Buffer.from(req.query.url, 'base64').toString('utf-8');
    } catch (e) {
      targetUrl = req.query.url;
    }
    
    // Safety checks / formating
    if (!targetUrl.startsWith('http')) {
      if (req.query.url.startsWith('http')) {
         targetUrl = req.query.url;
      } else {
         targetUrl = 'https://' + targetUrl.replace(/^[^\w]+/, '');
      }
    }
  }
  
  // Disable caching to safeguard download requests
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.redirect(302, targetUrl);
});

// For any other api path, return a fallback 404
app.all("/api/*", (req, res) => {
  res.status(404).json({ error: "API Endpoint not found" });
});

// Export default app instance as Vercel expects
export default app;
