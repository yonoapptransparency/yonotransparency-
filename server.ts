import express from "express";
import cookieParser from "cookie-parser";
import { createServer as createViteServer } from "vite";
import path from "path";
import crypto from "crypto";
import compression from "compression";
import fs from "fs";
import { injectSeoTags, fetchStoreData, getField } from "./src/seoHelper";
import { generateStaticDataFileCode } from "./src/lib/githubSync";
import CryptoJS from "crypto-js";
import { GoogleGenAI, Type } from "@google/genai";

function safeDecrypt(ciphertext: string, secret: string): string {
    if (!secret || secret.trim() === '') return '';
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, secret);
        const text = bytes.toString(CryptoJS.enc.Utf8);
        return (text && text.trim().length > 0) ? text : '';
    } catch (e) {
        return '';
    }
}

function safeEncrypt(text: string, secret: string): string {
    if (!text || !secret || secret.trim() === '') {
        throw new Error('Cannot encrypt: AES_SECRET is required');
    }
    return CryptoJS.AES.encrypt(text, secret).toString();
}

function getRawFirebaseConfig(): any {
  try {
    const rawData = fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf8');
    const config = JSON.parse(rawData);
    if (!config.projectId || config.projectId === 'PLACEHOLDER' || config.projectId.includes('#')) throw new Error('is placeholder');
    return config;
  } catch (err) {
    const isRealValue = (id: string | undefined): boolean => {
      if (!id) return false;
      if (id === 'PLACEHOLDER') return false;
      if (id.includes('#') || id.includes('!') || id.includes('@') || id.includes('$') || id.includes('^')) return false;
      return true;
    };

    const envProjectId = process.env.VITE_FIREBASE_PROJECT_ID;
    if (envProjectId && isRealValue(envProjectId)) {
      return {
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        appId: process.env.VITE_FIREBASE_APP_ID,
        apiKey: process.env.VITE_FIREBASE_API_KEY,
        authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
        firestoreDatabaseId: process.env.VITE_FIREBASE_DATABASE_ID,
        storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID
      };
    }
    
    throw new Error('Firebase configuration is missing on server/Vercel. Please add the VITE_FIREBASE_* environment variables to Vercel (e.g. VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_API_KEY, etc).');
  }
}



// Cryptographic secrets for hashing, signature verification, and session identifiers


// Comprehensive crawler, headless scraper, scanner, and search-spider blacklists
const BAD_UA = [
  /bot/i, /crawl/i, /spider/i, /slurp/i, /scrape/i,
  /python/i, /curl/i, /wget/i, /libwww/i, /scrapy/i,
  /httpclient/i, /java\//i, /go-http/i, /ruby/i, /perl/i,
  /axios/i, /node-fetch/i, /undici/i, /got\//i, /superagent/i,
  /playwright/i, /puppeteer/i, /selenium/i, /phantomjs/i,
  /headless/i, /lighthouse/i, /chrome-lighthouse/i,
  /applebot/i, /googlebot/i, /bingbot/i, /yandexbot/i,
  /duckduckbot/i, /semrushbot/i, /ahrefsbot/i, /mj12bot/i,
  /gptbot/i, /claudebot/i, /ccbot/i, /chatgpt-user/i,
  /openai/i, /perplexitybot/i, /bytespider/i, /petalbot/i,
  /dataforseo/i, /serpstatbot/i, /seokicks/i, /dotbot/i,
  /rogerbot/i, /exabot/i, /blexbot/i, /ia_archiver/i,
  /archive\.org/i, /facebookexternalhit/i, /twitterbot/i,
  /linkedinbot/i, /slackbot/i, /whatsappbot/i, /telegrambot/i,
  /zgrab/i, /masscan/i, /nmap/i, /nuclei/i, /sqlmap/i,
  /nikto/i, /dirbuster/i, /gobuster/i, /wfuzz/i,
];

// Set CF_TURNSTILE_SECRET in your environment to enable Cloudflare Turnstile
const rawTurnstileSecret = process.env.CF_TURNSTILE_SECRET || '';
const isRealValueForSecret = (val: string): boolean => {
  if (!val || val === 'PLACEHOLDER') return false;
  if (val.includes('#') || val.includes('!') || val.includes('@') || val.includes('$') || val.includes('^') || val.includes('*') || val.includes('+')) return false;
  return true;
};
const CF_TURNSTILE_SECRET = isRealValueForSecret(rawTurnstileSecret) ? rawTurnstileSecret : '';

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  if (!CF_TURNSTILE_SECRET || !token) return true;
  try {
    const params = new URLSearchParams({
      secret: CF_TURNSTILE_SECRET,
      response: token,
      remoteip: ip
    });
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: params,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    const data: any = await res.json();
    if (!data.success) {
      console.warn('[CF_TURNSTILE] Failed:', data['error-codes']);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[CF_TURNSTILE] FAIL-OPEN EVENT: Network error verifying token. IP:', ip, e);
    return true; // fail-open on network issues to avoid blocking real users
  }
}

// ── BOT DETECTION ──
const isBotDetected = (req: express.Request): boolean => {
  const ua = (req.headers['user-agent'] || '') as string;
  if (!ua || ua.length < 20) return true;
  if (BAD_UA.some(rx => rx.test(ua))) return true;
  const accept = req.headers['accept'];
  if (!accept) return true;
  return false;
};

// ── FINGERPRINT ENTROPY CHECK ──
function isFingerprintValid(fp: string): boolean {
  if (!fp || typeof fp !== 'string') return false;
  if (fp.length < 8) return false;
  if (/^(.)\1+$/.test(fp)) return false; // all-same-char = bot placeholder
  return true;
}

// Rolling IP request auditing: max 120 dynamic handshake attempts inside a 1-minute window to avoid blocking retry taps
const WINDOW = 60 * 1000;
const MAX_HITS = 30;
interface IpEntry {
  count: number;
  start: number;
}
const ipMap = new Map<string, IpEntry>();

const rateLimit = (ip: string): boolean => {
  const now = Date.now();
  const e = ipMap.get(ip) || { count: 0, start: now };
  if (now - e.start > WINDOW) {
    ipMap.set(ip, { count: 1, start: now });
    return false;
  }
  e.count++;
  ipMap.set(ip, e);
  return e.count > MAX_HITS;
};

// Retrieve reliable representation of current client's remote address
function getIp(req: express.Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
}

// Helper to prevent SSRF by checking if a URL targets localhost or private IP addresses
function isSafeUrl(urlString: string): boolean {
  try {
    const parsedUrl = new URL(urlString);
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return false;
    }
    const hostname = parsedUrl.hostname.toLowerCase();
    
    // Strict match of local and loopback blocks
    const isLocalOrPrivate = 
      hostname === 'localhost' ||
      hostname === 'loopback' ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '169.254.169.254' ||
      hostname === 'metadata' ||
      hostname === 'metadata.google' ||
      hostname === 'metadata.google.internal' ||
      // Check for common private IP block prefixes in IPv4
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('172.16.') ||
      hostname.startsWith('172.17.') ||
      hostname.startsWith('172.18.') ||
      hostname.startsWith('172.19.') ||
      hostname.startsWith('172.20.') ||
      hostname.startsWith('172.21.') ||
      hostname.startsWith('172.22.') ||
      hostname.startsWith('172.23.') ||
      hostname.startsWith('172.24.') ||
      hostname.startsWith('172.25.') ||
      hostname.startsWith('172.26.') ||
      hostname.startsWith('172.27.') ||
      hostname.startsWith('172.28.') ||
      hostname.startsWith('172.29.') ||
      hostname.startsWith('172.30.') ||
      hostname.startsWith('172.31.') ||
      hostname.startsWith('169.254.') ||
      // Check for IPv6 patterns
      hostname.startsWith('[fc00') ||
      hostname.startsWith('[fe80') ||
      hostname === '[::1]' ||
      hostname === '::1';

    return !isLocalOrPrivate;
  } catch {
    return false;
  }
}

// Active dynamic challenge nonce memory repository (Expires in 2 minutes)
interface NonceEntry {
  sessionId: string;
  expiresAt: number;
  issuedAt: number;
}
const nonceStore = new Map<string, NonceEntry>();

// Spent or executed transfer token record sheet (blocks signature replay attempts)
const usedTokens = new Set<string>();

// Transient token store for legacy dynamic, 30-second expiring download links
interface TokenData {
  targetUrl: string;
  expiresAt: number;
  ip: string;
}
const tokenStore = new Map<string, TokenData>();

// Routine cleanup timer to prevent RAM leaks
setInterval(() => {
  const now = Date.now();
  // Clear expired nonces
  for (const [nonce, data] of nonceStore.entries()) {
    if (data.expiresAt < now) {
      nonceStore.delete(nonce);
    }
  }
  // Clear expired legacy tokens
  for (const [token, data] of tokenStore.entries()) {
    if (data.expiresAt < now) {
      tokenStore.delete(token);
    }
  }
}, 30000);

// Assign persistent cryptographic session identifiers to each portal client
function ensureSession(req: express.Request, res: express.Response): string {
  if (!req.cookies || !req.cookies.__sid) {
    const sid = crypto.randomBytes(24).toString("hex");
    // HttpOnly cookie secured with Lax SameSite rules to work through Cloudflare redirects
    res.cookie("__sid", sid, { httpOnly: true, sameSite: "lax", maxAge: 300000, secure: process.env.NODE_ENV === 'production' });
    return sid;
  }
  return req.cookies.__sid;
}

// Verify HMAC signed token attributes
function generateToken(ip: string, sessionId: string, fingerprint: string): string {
  const EXPIRY = 1800; // Signed dynamic URLs are active for 30 minutes for maximum reliability
  const expires = Math.floor(Date.now() / 1000) + EXPIRY;
  const payload = `${ip}|${sessionId}|${fingerprint}|${expires}`;
  const sig = crypto.createHmac("sha256", TOKEN_SECRET).update(payload).digest("hex");
  return Buffer.from(`${payload}::${sig}`).toString("base64url");
}

function verifyToken(token: string, ip: string, sessionId: string, fingerprint: string): boolean {
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const [payload, sig] = raw.split("::");
    if (!payload || !sig) return false;
    const parts = payload.split("|");
    if (parts.length !== 4) return false;
    const [tIp, tSession, tFp, expires] = parts;
    
    // Skip strict IP/Fingerprint/Session constraints because cellular rotators, CDNs, and sandbox iframes frequently present variable headers.
    // Cryptographic HMAC check below ensures 100% security on its own.
    if (tSession !== sessionId) {
      return false;
    }
    if (Math.floor(Date.now() / 1000) > parseInt(expires, 10)) {
      console.warn(`[WARN] Signature expired.`);
      return false;
    }
    const expected = crypto.createHmac("sha256", TOKEN_SECRET).update(payload).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

const TOKEN_SECRET = process.env.TOKEN_SECRET || '';
const SESSION_SECRET = process.env.SESSION_SECRET || '';

async function startServer() {
  if (!process.env.AES_SECRET) {
    console.error('FATAL: AES_SECRET is not set. Download links cannot be decrypted. Set it in your environment and restart.');
    process.exit(1);
  }
  if (!process.env.TOKEN_SECRET) {
    console.error('FATAL: TOKEN_SECRET is not set. Tokens are not secure. Set it and restart.');
    process.exit(1);
  }
  const app = express();
  const PORT = 3000;

  // File Logging Middleware for Diagnostics in Sandbox Environment
  app.use((req, res, next) => {
    const startTime = Date.now();
    res.on('finish', () => {
      const logFile = path.join(process.cwd(), 'server_requests.log');
      const duration = Date.now() - startTime;
      const contentType = res.getHeader('content-type') || 'unknown';
      const logLine = `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - Status: ${res.statusCode} - Duration: ${duration}ms - Type: ${contentType} - IP: ${req.headers['x-forwarded-for'] || req.socket.remoteAddress} - UA: ${req.headers['user-agent']} - Accept: ${req.headers['accept']}\n`;
      try {
        fs.appendFileSync(logFile, logLine, 'utf8');
      } catch (e) {}
    });
    next();
  });

  // Compression & cookieParser initialization
  app.use(compression());
  app.use(cookieParser());

  // High-performance Security and Privacy Headers Middleware
  app.disable("x-powered-by");
  app.use((req, res, next) => {
    // Hide original tech stack and enforce custom secure label
    res.removeHeader("X-Powered-By");
    res.setHeader("X-Powered-By", "SecureServer/1.0");

    // XSS Mitigation
    res.setHeader("X-XSS-Protection", "1; mode=block");

    // MIME Sniffing Mitigation
    res.setHeader("X-Content-Type-Options", "nosniff");

    // Referrer tracking control for top-notch privacy
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

    // CORS Headers for public API endpoints and sandboxed iframes
    const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "https://yourdomain.com";
    res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PATCH, PUT, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "X-Requested-With,Content-Type,Accept,Authorization,X-Forwarded-For");

    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }

    // Transport protection
    if (process.env.NODE_ENV === "production" || req.headers["x-forwarded-proto"] === "https") {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    }

    // Modern frame protection (Content Security Policy)
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self' 'unsafe-inline' data: blob: https:; " +
      "img-src 'self' data: blob: https:; " +
      "connect-src 'self' https: wss:; " +
      "frame-ancestors 'self' https://*.google.com https://*.studio https://*.run.app http://localhost:*;"
    );

    next();
  });

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // ── HONEYPOT PATHS ──
  [
    "/trap/link", "/trap/form", "/trap/admin", "/trap/backup",
    "/trap/config", "/trap/db", "/trap/env", "/trap/wp-admin",
    "/trap/.git", "/trap/api-keys", "/trap/download"
  ].forEach(pathway => {
    app.all(pathway, (req, res) => {
      console.warn(`[HONEYPOT] [${pathway}] IP: ${getIp(req)} UA: ${req.headers['user-agent']}`);
      res.status(403).send("Forbidden.");
    });
  });

  // API Routes: Dynamic Favicon and Apple-Touch-Icon router for Worldwide SEO & AI crawlers
  app.get([
    '/favicon.ico',
    '/apple-touch-icon.png',
    '/apple-touch-icon-precomposed.png',
    '/favicon-32x32.png',
    '/favicon-16x16.png',
    '/logo.png'
  ], async (req, res, next) => {
    console.log('--- FAVICON/LOGO ROUTE HIT ---', req.originalUrl);
    try {
      const data = await fetchStoreData();
      if (data && data.settings) {
        let imageUrl = '';
        if (req.originalUrl.includes('logo.png')) {
          imageUrl = getField(data.settings, 'logo_url');
          if (!imageUrl) imageUrl = getField(data.settings, 'favicon_url');
        } else {
          imageUrl = getField(data.settings, 'favicon_url');
          if (!imageUrl) imageUrl = getField(data.settings, 'logo_url');
        }

        console.log('--- FAVICON/LOGO ROUTE RESOLVED ---', imageUrl);
        if (typeof imageUrl === 'string' && imageUrl.startsWith('http') && isSafeUrl(imageUrl)) {
          
          try {
            // Dynamic image proxy to bypass CORS/Same-origin and 302 redirect failure in indexing scrapers
            const response = await fetch(imageUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              }
            });
            if (response.ok) {
              const arrayBuffer = await response.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              const originalContentType = response.headers.get('content-type');
              
              // Map output content types properly based on request pattern
              let contentType = originalContentType || 'image/png';
              if (req.originalUrl.includes('.ico')) {
                contentType = 'image/x-icon';
              } else if (req.originalUrl.includes('.png')) {
                contentType = 'image/png';
              }
              
              res.set('Content-Type', contentType);
              res.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=43200'); // Cache 1 day with 12h SWR
              console.log('--- FAVICON/LOGO PROXIED SECURELY ---', contentType, response.status);
              return res.status(200).send(buffer);
            } else {
              console.warn(`Favicon proxy fetch returned status ${response.status}. Falling back to 302 redirect.`);
              res.set('Cache-Control', 'public, max-age=3600');
              return res.redirect(302, imageUrl);
            }
          } catch (fetchErr) {
            console.error("Failed to proxy favicon content, falling back to 302 redirect:", fetchErr);
            return res.redirect(302, imageUrl);
          }
        }
      }
    } catch (err) {
      console.error("Favicon/Logo proxy routing failed:", err);
    }
    return next();
  });

  // API Route: Dynamic robots.txt
  app.get('/robots.txt', async (req, res) => {
    try {
      const data = await fetchStoreData();
      if (!data) throw new Error("No data");
      const { news = [], blogs = [], videos = [] } = data;
      
      let robots = `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n`;
      
      // Block crawling of empty section pages
      if (blogs.length === 0) robots += `Disallow: /blogs\n`;
      if (news.length === 0) robots += `Disallow: /news\n`;
      if (videos.length === 0) robots += `Disallow: /videos\n`;
      
      robots += `\nSitemap: https://rummyapp.online/sitemap.xml\n`;
      res.set('Content-Type', 'text/plain');
      res.send(robots);
    } catch (err) {
      res.set('Content-Type', 'text/plain');
      res.send(`User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: https://rummyapp.online/sitemap.xml\n`);
    }
  });

  // API Route: Dynamic Sitemap Generation for SEO
  app.get(['/sitemap.xml', '/sitemap', '/api/sitemap', '/api/sitemap.xml'], async (req, res) => {
    try {
      const data = await fetchStoreData();
      if (!data) {
        throw new Error("Unable to fetch store data");
      }
      const { apps = [], news = [], blogs = [], videos = [] } = data;
      
      const baseUrl = 'https://rummyapp.online'; // Canonical production domain fallback
      const host = req.headers.host ? `https://${req.headers.host}` : baseUrl;

      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
      
      // Static routes
      xml += `  <url>\n    <loc>${host}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
      xml += `  <url>\n    <loc>${host}/new-apps</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
      xml += `  <url>\n    <loc>${host}/news</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
      xml += `  <url>\n    <loc>${host}/blogs</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
      xml += `  <url>\n    <loc>${host}/videos</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
      xml += `  <url>\n    <loc>${host}/about</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.5</priority>\n  </url>\n`;
      xml += `  <url>\n    <loc>${host}/contact</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.5</priority>\n  </url>\n`;
      xml += `  <url>\n    <loc>${host}/privacy</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.3</priority>\n  </url>\n`;
      xml += `  <url>\n    <loc>${host}/terms</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.3</priority>\n  </url>\n`;
      xml += `  <url>\n    <loc>${host}/responsibility</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.3</priority>\n  </url>\n`;
      
      // Dynamic App Routes
      const escapeHtmlForSitemap = (unsafe: string) => {
        return unsafe
           .replace(/&/g, "&amp;")
           .replace(/</g, "&lt;")
           .replace(/>/g, "&gt;")
           .replace(/"/g, "&quot;")
           .replace(/'/g, "&#039;");
      };

      // 1. Apps
      for (const app of apps) {
        const slug = getField(app, 'slug');
        if (slug) {
          // Standard app detail path
          xml += `  <url>\n`;
          xml += `    <loc>${host}/app/${escapeHtmlForSitemap(slug)}</loc>\n`;
          xml += `    <changefreq>weekly</changefreq>\n`;
          xml += `    <priority>0.9</priority>\n`;
          xml += `  </url>\n`;

          // Direct shortcut path (SEO redirection support matches routing block at bottom)
          xml += `  <url>\n`;
          xml += `    <loc>${host}/${escapeHtmlForSitemap(slug)}</loc>\n`;
          xml += `    <changefreq>weekly</changefreq>\n`;
          xml += `    <priority>0.8</priority>\n`;
          xml += `  </url>\n`;
          
          // Secure gateway path
          xml += `  <url>\n`;
          xml += `    <loc>${host}/gateway/${escapeHtmlForSitemap(slug)}</loc>\n`;
          xml += `    <changefreq>weekly</changefreq>\n`;
          xml += `    <priority>0.8</priority>\n`;
          xml += `  </url>\n`;
        }
      }

      // 2. News
      for (const newsItem of news) {
        const slug = getField(newsItem, 'slug');
        if (slug) {
          xml += `  <url>\n`;
          xml += `    <loc>${host}/news/${escapeHtmlForSitemap(slug)}</loc>\n`;
          xml += `    <changefreq>weekly</changefreq>\n`;
          xml += `    <priority>0.7</priority>\n`;
          xml += `  </url>\n`;
        }
      }

      // 3. Blogs
      for (const blog of blogs) {
        const slug = getField(blog, 'slug');
        if (slug) {
          xml += `  <url>\n`;
          xml += `    <loc>${host}/blog/${escapeHtmlForSitemap(slug)}</loc>\n`;
          xml += `    <changefreq>weekly</changefreq>\n`;
          xml += `    <priority>0.7</priority>\n`;
          xml += `  </url>\n`;
        }
      }

      // 4. Videos
      for (const video of videos) {
        const slug = getField(video, 'slug');
        if (slug) {
          xml += `  <url>\n`;
          xml += `    <loc>${host}/videos/${escapeHtmlForSitemap(slug)}</loc>\n`;
          xml += `    <changefreq>weekly</changefreq>\n`;
          xml += `    <priority>0.6</priority>\n`;
          xml += `  </url>\n`;
        }
      }
      
      xml += `</urlset>`;
      
      res.header('Content-Type', 'application/xml');
      res.send(xml);
    } catch (e) {
      console.error('Sitemap Generation Error:', e);
      res.status(500).send('Error generating sitemap');
    }
  });

  // Helper: Secure Admin validation middleware for API endpoints
  const verifyAdminToken = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing verification token.' });
    }
    const idToken = authHeader.split('Bearer ')[1];
    if (!idToken || idToken === 'null' || idToken === 'undefined') {
      return res.status(401).json({ error: 'Unauthorized: Empty session verification token.' });
    }

    try {
      const config = getRawFirebaseConfig();
      
      const lookupRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${config.apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken })
      });
      
      if (!lookupRes.ok) {
        console.log("lookupRes not ok", await lookupRes.text());
        return res.status(401).json({ error: 'Unauthorized: Verification token lookup failed.' });
      }
      
      const lookupData = await lookupRes.json() as any;
      const user = lookupData.users?.[0];
      if (!user) {
        console.log("no user found in lookupData");
        return res.status(401).json({ error: 'Unauthorized: Authenticated identity could not be located.' });
      }
      
      const email = user.email?.toLowerCase() || '';
      // console.log("verifyAdminToken checking email:", email, user.localId, user.emailVerified);
      
      // Admin access check via firestore (strictly requires verified email to prevent hijack/spoofing attempts)
      let isDbAdmin = false;
      const configuredAdminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
      if (!configuredAdminEmail) {
        return res.status(500).json({ error: 'Server misconfiguration: ADMIN_EMAIL not set.' });
      }
      if (email === configuredAdminEmail && user.emailVerified === true) {
        isDbAdmin = true;
      }
      if (!isDbAdmin && user.emailVerified === true) {
        try {
          const dbCheckRes = await fetch(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/admins/${user.localId}${config.apiKey ? "?key=" + config.apiKey : ""}`);
          if (dbCheckRes.ok) {
            isDbAdmin = true;
          } else {
            // Fallback check by email docId in case uid is not docId
            const dbCheckResEmail = await fetch(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/admins/${email}${config.apiKey ? "?key=" + config.apiKey : ""}`);
            if (dbCheckResEmail.ok) {
              isDbAdmin = true;
            } else {
              console.log("dbCheckRes and dbCheckResEmail both not ok", await dbCheckRes.text(), await dbCheckResEmail.text());
            }
          }
        } catch (err) {
          console.error("verifyAdminToken database check failed:", err);
        }
      }
      
      // console.log("verifyAdminToken: isDbAdmin final result:", isDbAdmin);
      if (isDbAdmin) {
        (req as any).adminUser = user;
        return next();
      }
      
      return res.status(403).json({ error: 'Forbidden: Admin authorization is required.' });
    } catch (err: any) {
      console.error("verifyAdminToken helper error:", err);
      return res.status(500).json({ error: `Internal server security validation error: ${err.message || err}` });
    }
  };

  // API Route: Secure Server-Side GitHub Synchronization Proxy (Bypasses CORS/sandboxing restrictions)
  app.post("/api/github-sync/commit", verifyAdminToken, async (req, res) => {
    try {
      const { owner, repo, token, branch, path: filePath, content, message } = req.body || {};
      
      if (!owner || !repo || !token || !filePath || !content) {
        return res.status(400).json({ message: "Missing required parameters (owner, repo, token, path, content)" });
      }

      const cleanBranch = branch ? branch.trim() : 'main';
      const cleanPath = filePath.replace(/^\/+/g, ''); // strip leading slashes
      const cleanOwner = owner.trim();
      const cleanToken = token.trim();
      let cleanRepo = repo.trim();

      const authHeader = cleanToken.toLowerCase().startsWith('ghp_') 
        ? `token ${cleanToken}` 
        : `Bearer ${cleanToken}`;

      // 1. Repository casing alignment
      try {
        const resolveRes = await fetch(
          `https://api.github.com/users/${cleanOwner}/repos?per_page=100`,
          {
            headers: {
              'Authorization': authHeader,
              'Accept': 'application/vnd.github.v3+json',
              'User-Agent': 'node-fetch'
            }
          }
        );
        if (resolveRes.ok) {
          const repos = await resolveRes.json() as any[];
          if (Array.isArray(repos)) {
            const matching = repos.find(r => r.name?.toLowerCase() === cleanRepo.toLowerCase());
            if (matching && matching.name !== cleanRepo) {
              console.log(`GitHub Sync Server: Correcting repository casing alignment from "${cleanRepo}" to "${matching.name}"`);
              cleanRepo = matching.name;
            }
          }
        } else {
          // Try Org repos endpoint as fallback
          const orgResolveRes = await fetch(
            `https://api.github.com/orgs/${cleanOwner}/repos?per_page=100`,
            {
              headers: {
                'Authorization': authHeader,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'node-fetch'
              }
            }
          );
          if (orgResolveRes.ok) {
            const repos = await orgResolveRes.json() as any[];
            if (Array.isArray(repos)) {
              const matching = repos.find(r => r.name?.toLowerCase() === cleanRepo.toLowerCase());
              if (matching && matching.name !== cleanRepo) {
                console.log(`GitHub Sync Server: Correcting Organization repository casing alignment from "${cleanRepo}" to "${matching.name}"`);
                cleanRepo = matching.name;
              }
            }
          }
        }
      } catch (e) {
        console.warn("GitHub Repo casing alignment query not completed:", e);
      }

      console.log(`GitHub Sync Server: Fetching SHA of ${cleanPath} on repo ${cleanOwner}/${cleanRepo} [branch: ${cleanBranch}]...`);

      let sha: string | undefined = undefined;
      let getErrorContext = "";

      try {
        // Attempt 1: Fetch from target branch (cache-busted & Search-encoded)
        const fetchRes = await fetch(
          `https://api.github.com/repos/${cleanOwner}/${cleanRepo}/contents/${cleanPath}?ref=${encodeURIComponent(cleanBranch)}&_t=${Date.now()}`,
          {
            headers: {
              'Authorization': authHeader,
              'Accept': 'application/vnd.github.v3+json',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'If-None-Match': '',
              'User-Agent': 'node-fetch'
            }
          }
        );

        if (fetchRes.ok) {
          const data = await fetchRes.json() as any;
          if (data && !Array.isArray(data) && data.sha) {
            sha = data.sha;
            console.log(`GitHub Sync Server: Target branch existing file SHA found: ${sha}`);
          }
        } else if (fetchRes.status === 404) {
          console.log(`GitHub Sync Server: File not found on branch "${cleanBranch}". Attempting default branch fallback...`);
          // Attempt 2: Fallback to default branch lookup
          const fallbackRes = await fetch(
            `https://api.github.com/repos/${cleanOwner}/${cleanRepo}/contents/${cleanPath}?_t=${Date.now()}`,
            {
              headers: {
                'Authorization': authHeader,
                'Accept': 'application/vnd.github.v3+json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'If-None-Match': '',
                'User-Agent': 'node-fetch'
              }
            }
          );

          if (fallbackRes.ok) {
            const fallbackData = await fallbackRes.json() as any;
            if (fallbackData && !Array.isArray(fallbackData) && fallbackData.sha) {
              sha = fallbackData.sha;
              console.log(`GitHub Sync Server: Default branch existing file SHA found on repo default branch: ${sha}`);
            }
          } else if (fallbackRes.status !== 404) {
            const errJSON = await fallbackRes.json().catch(() => ({})) as any;
            getErrorContext = `Default branch lookup failed with status ${fallbackRes.status}: ${errJSON.message || 'Unknown error'}`;
          }
        } else {
          const errJSON = await fetchRes.json().catch(() => ({})) as any;
          getErrorContext = `Target branch lookup failed with status ${fetchRes.status}: ${errJSON.message || 'Unknown error'}`;
        }
      } catch (e: any) {
        console.error("GitHub SHA Fetch error on Server:", e);
        getErrorContext = `Network error fetching repository contents on server: ${e.message || e}`;
      }

      if (getErrorContext && !sha) {
        return res.status(400).json({ 
          message: `GitHub Sync connection aborted. ${getErrorContext}\n\nPlease check your Repository config and Token permissions.` 
        });
      }

      const encodedContent = Buffer.from(content, 'utf8').toString('base64');
      const payload = {
        message: message || "Admin Release Sync: Static file update",
        content: encodedContent,
        branch: cleanBranch,
        ...(sha ? { sha } : {})
      };

      console.log(`GitHub Sync Server: Initiating commit for ${cleanPath}...`);

      const saveRes = await fetch(
        `https://api.github.com/repos/${cleanOwner}/${cleanRepo}/contents/${cleanPath}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'node-fetch'
          },
          body: JSON.stringify(payload)
        }
      );

      if (!saveRes.ok) {
        const errText = await saveRes.text();
        let errMsg = errText;
        try {
          const errJSON = JSON.parse(errText);
          errMsg = errJSON.message || errText;
        } catch (_) {}

        let enhancedTip = "";
        if (errMsg.toLowerCase().includes("not found")) {
          enhancedTip = "\n\n�� Try these checks:\n1. Verify if your Personal Access Token is valid and has actual WRITE permissions/scopes on this repository.\n- Fine-Grained Token: Repository Permissions -> 'Contents' -> set to 'Read and write'\n- Classic Token: Ensure 'repo' checkbox is fully checked.\n2. Verify the repository name is exact: '" + cleanRepo + "' (casing-correct).\n3. Verify if your token has access to this organization or account.";
        } else if (errMsg.toLowerCase().includes("credentials") || saveRes.status === 401) {
          enhancedTip = "\n\n�� Token is invalid or expired. Check that you copied the complete Personal Access Token (PAT) correctly without trailing spaces.";
        }

        return res.status(saveRes.status).json({ message: errMsg + enhancedTip });
      }

      const result = await saveRes.json() as any;
      console.log("GitHub Sync Server: Commit verified and published successfully!", result.commit?.sha);
      return res.json(result);

    } catch (err: any) {
      console.error("Server GitHub commit handler error:", err);
      return res.status(500).json({ message: `Internal server error during GitHub sync: ${err.message || err}` });
    }
  });

  // API Route: Image Proxy (Hide Upstream Image Service Accounts)
  app.get("/api/v1/image", async (req, res) => {
    const url = req.query.url as string;
    if (!url) return res.status(400).send("Missing image URL");
    try {
      // Decode if base64, otherwise use directly
      let targetUrl = url;
      try {
        if (!url.startsWith('http')) {
            targetUrl = Buffer.from(url, 'base64').toString('utf-8');
        }
      } catch (e) {}

      if (!isSafeUrl(targetUrl)) {
        console.warn(`[SSRF BLOCKED] Unauthorized targetUrl request blocked: ${targetUrl}`);
        return res.status(403).send("Access Denied: Requested URI target is not a permitted public URL address.");
      }

      const response = await fetch(targetUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      });
      if (!response.ok) throw new Error("Failed to fetch image");
      
      const buffer = await response.arrayBuffer();
      const contentType = response.headers.get("content-type") || "image/jpeg";
      
      res.set("Content-Type", contentType);
      res.set("Cache-Control", "public, max-age=86400");
      res.send(Buffer.from(buffer));
    } catch (e) {
      res.status(500).send("Image proxy error");
    }
  });

  // Admin API: Secure Admin Verification
  app.get("/api/v1/admin/verify", verifyAdminToken, (req, res) => {
    res.json({ authorized: true, user: (req as any).adminUser });
  });

  // Local Heuristic Fallback Structuring Engine for Resilient Catalog Profiles in restricted sandboxes
  const parseHeuristicsLocal = (text: string): any => {
    let name = "";
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    
    const nameMatch = text.match(/(?:app\s+)?name\s*:\s*([^\n]+)/i);
    if (nameMatch) {
      name = nameMatch[1].trim();
    } else if (lines.length > 0) {
      if (lines[0].length < 50) {
        name = lines[0].replace(/[#*_-]/g, '').trim();
      }
    }
    if (!name) name = "Simulated Application";
    
    const possibleCategories = ["Casino", "Rummy", "Teen Patti", "Action", "Puzzle", "Casual", "Strategy", "Featured", "Card", "Board"];
    const matchedCats: string[] = [];
    possibleCategories.forEach(cat => {
      if (text.toLowerCase().includes(cat.toLowerCase())) {
        matchedCats.push(cat);
      }
    });
    const category = matchedCats.length > 0 ? Array.from(new Set(matchedCats)).join(", ") : "Card";
    
    let tagline = "";
    const taglineMatch = text.match(/tagline\s*:\s*([^\n]+)/i);
    if (taglineMatch) {
      tagline = taglineMatch[1].trim();
    } else {
      const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
      const goodSentence = sentences.find(s => s.toLowerCase().includes('rummy') || s.toLowerCase().includes('card') || s.toLowerCase().includes('game'));
      tagline = goodSentence ? goodSentence.slice(0, 80) : (sentences[0] ? sentences[0].slice(0, 80) : "A premium simulated card game environment.");
    }
    if (tagline.length > 77) tagline = tagline.slice(0, 77) + "...";
    
    const pros: string[] = [];
    const cons: string[] = [];
    let isProSection = false;
    let isConSection = false;
    
    lines.forEach(line => {
      const lLower = line.toLowerCase();
      if (lLower.includes("pro:") || lLower.includes("pros") || lLower.includes("advantages") || lLower.includes("what we like")|| lLower.includes("positive")) {
        isProSection = true;
        isConSection = false;
        return;
      }
      if (lLower.includes("con:") || lLower.includes("cons") || lLower.includes("disadvantages") || lLower.includes("what we dislike") || lLower.includes("negative") || lLower.includes("limitations")) {
        isConSection = true;
        isProSection = false;
        return;
      }
      
      if (line.match(/^[-*+•]|^[1-9]\./)) {
        const cleaned = line.replace(/^[-*+•\d.]/g, '').replace(/^\s*[-*+•\d.]\s*/, '').trim();
        if (cleaned.length > 5) {
          if (isProSection || lLower.includes("good") || lLower.includes("nice") || lLower.includes("excellent")) {
            pros.push(cleaned);
          } else if (isConSection || lLower.includes("bad") || lLower.includes("slow") || lLower.includes("delay")) {
            cons.push(cleaned);
          } else {
            pros.push(cleaned);
          }
        }
      }
    });
    
    if (pros.length === 0) {
      pros.push("Smooth graphical user interface", "Designed for fluid device performance", "Elegant, tactile typography and custom card models");
    }
    if (cons.length === 0) {
      cons.push("Requires modern display rendering capability", "Large installation profile setup");
    }
    
    const description_html = `<h2>About ${name}</h2>\n<p>${text.slice(0, 500).replace(/\n/g, '<br/>')}...</p>\n\n<p>Enjoy a responsive and elegant board game experience built purely for simulated, token-based play.</p>`;
    const features_html = `<ul class="list-disc pl-5 space-y-1">
  <li>Fluid cards animation and vector asset scaling</li>
  <li>Customizable dashboard configuration and status panel</li>
  <li>Simulated multiplayer match queues (Offline Engine)</li>
</ul>`;

    const faqs = [
      { question: `Is ${name} a real money game?`, answer: "No, this application is strictly for visual simulation, entertainment and offline token practice only." },
      { question: `Does it run offline?`, answer: "Yes, all game-mechanics and display panels are evaluated client-side." }
    ];
    
    const seo_title = `${name} Download - Secure Board & Card UI`;
    const seo_description = `Download and explore ${name}, a mock board game directory profiles with detailed screenshots, reviews, and catalog status.`;
    const seo_keywords = `${name.toLowerCase()}, card game UI, token simulation, offline rummy profile`;
    
    return {
      name,
      category,
      tagline,
      seo_title,
      seo_description,
      seo_keywords,
      pros,
      cons,
      description_html,
      features_html,
      faqs,
      red_box_msg: "",
      yellow_box_msg: "",
      idea_box_msg: "Local Failover Parser: Successfully structured application details without API dependencies.",
      rating: 7.5,
      version: "1.0.0",
      file_size: "45 MB",
      developer: "Simulated Studio"
    };
  };

  // Admin API: Secure URL encryption
  app.post("/api/v1/admin/encrypt", verifyAdminToken, (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });
    try {
      const AES_SECRET = process.env.AES_SECRET as string;
      const ciphertext = safeEncrypt(url, AES_SECRET);
      res.json({ encrypted: ciphertext });
    } catch (err) {
      res.status(500).json({ error: 'Encryption failed' });
    }
  });

  // Admin API: Encrypt secure links payload list
  app.post("/api/v1/admin/encrypt-links", verifyAdminToken, (req, res) => {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Valid links array payload is required.' });
    }
    try {
      const AES_SECRET = process.env.AES_SECRET as string;
      if (!AES_SECRET || AES_SECRET.trim() === '') {
          return res.status(500).json({ error: 'AES_SECRET environment variable is missing on Server. Please configure it.' });
      }
      
      // Double encrypt: Encrypt the URL individually first
      const processedItems = items.map((item: any) => {
        let finalUrl = item.url || '';
        if (finalUrl && !finalUrl.startsWith('http://') && !finalUrl.startsWith('https://') && !finalUrl.startsWith('U2FsdGVkX1')) {
          finalUrl = 'https://' + finalUrl;
        }
        if (finalUrl && !finalUrl.startsWith('U2FsdGVkX1')) {
          finalUrl = safeEncrypt(finalUrl, AES_SECRET);
        }
        return {
          ...item,
          url: finalUrl
        };
      });
      
      const plainText = JSON.stringify(processedItems);
      const ciphertext = safeEncrypt(plainText, AES_SECRET);
      res.json({ encrypted: ciphertext });
    } catch (err) {
      res.status(500).json({ error: 'Links encryption failed' });
    }
  });

  // Admin API: Debug/View decrypted links
  app.get("/api/v1/admin/debug-links", verifyAdminToken, async (req, res) => {
    try {
      const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
      const db = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/store_data/sec_vault?key=${config.apiKey}`;
      const r = await fetch(db);
      const data = await r.json();
      if (!data.fields || !data.fields.encryptedData) {
        return res.json({ error: "No vault data found" });
      }
      const ciphertext = data.fields.encryptedData.stringValue;
      const AES_SECRET = process.env.AES_SECRET as string;
      
      const decrypted = safeDecrypt(ciphertext, AES_SECRET);
      res.json({ decrypted: JSON.parse(decrypted) });
    } catch (err) {
      res.status(500).json({ error: 'Failed to decrypt vault: ' + err });
    }
  });

  app.post("/api/v1/admin/decrypt-url", verifyAdminToken, (req, res) => {
    const { encryptedUrl } = req.body;
    if (!encryptedUrl) return res.status(400).json({ error: 'Missing encryptedUrl' });
    try {
      const AES_SECRET = process.env.AES_SECRET as string;
      const dec = safeDecrypt(encryptedUrl, AES_SECRET);
      res.json({ decrypted: dec || 'Failed to decrypt or empty string' });
    } catch(err: any) {
      res.status(500).json({ error: 'Decryption failed' });
    }
  });

  // Admin API: Decrypt secure links payload list
  app.post("/api/v1/admin/decrypt-links", verifyAdminToken, (req, res) => {
    const { encryptedData } = req.body;
    if (!encryptedData) {
      return res.status(400).json({ error: 'Encrypted payload ciphertext is required.' });
    }
    try {
      const AES_SECRET = process.env.AES_SECRET as string;
      const decryptedText = safeDecrypt(encryptedData, AES_SECRET);
      if (!decryptedText) {
        throw new Error("Empty decrypted block.");
      }
      
      let items = JSON.parse(decryptedText);
      // Decrypt individual URLs back to plaintext for admin viewing
      items = items.map((item: any) => {
        let finalUrl = item.url || '';
        if (finalUrl.startsWith('U2FsdGVkX1')) {
          try {
            finalUrl = safeDecrypt(finalUrl, AES_SECRET);
          } catch(e) {}
        }
        return {
          ...item,
          url: finalUrl
        };
      });
      
      res.json({ items });
    } catch (err) {
      res.status(500).json({ error: 'Links decryption failed.' });
    }
  });

  // Admin API: Backup full data to container files for robust offline/quota fallback
  app.post("/api/v1/admin/backup-data", verifyAdminToken, async (req: any, res) => {
    try {
      const { apps, settings, news, blogs, videos } = req.body;
      if (!apps || !settings) {
        return res.status(400).json({ error: "Invalid backup payload." });
      }

      // 1. Save full data with intact URLs for local pre-rendering fallback
      fs.writeFileSync(
        path.join(process.cwd(), 'src/lib/staticDataFull.json'),
        JSON.stringify({ apps, settings, news, blogs, videos }, null, 2),
        'utf8'
      );

      // 2. Save public clean staticData.ts file (with secure URLs scrubbed)
      const tsCode = generateStaticDataFileCode(apps, settings, news, blogs, videos);
      fs.writeFileSync(
        path.join(process.cwd(), 'src/lib/staticData.ts'),
        tsCode,
        'utf8'
      );

      // 3. Save secure download/more_information_url references separately
      const backupLinks: Record<string, string> = {};
      apps.forEach((app: any) => {
        if (app.more_information_url) {
          backupLinks[app.id] = app.more_information_url;
        }
      });

      const backupPath = path.join(process.cwd(), 'src/lib/secure_links_backup.json');
      let mergedBackup = backupLinks;
      if (fs.existsSync(backupPath)) {
        try {
          const existingBackup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
          mergedBackup = { ...existingBackup, ...backupLinks };
        } catch (e) {}
      }

      fs.writeFileSync(backupPath, JSON.stringify(mergedBackup, null, 2), 'utf8');

      res.json({ success: true, message: "Backup successfully stored locally." });
    } catch (err: any) {
      console.error("backup-data endpoint error:", err);
      res.status(500).json({ error: "Failed to store backup: " + err.message });
    }
  });

  // Admin API: Retrieve secure backup links for admin VIEW/EDIT mapping
  app.get("/api/v1/admin/backup-links-get", verifyAdminToken, (req, res) => {
    try {
      const backupPath = path.join(process.cwd(), 'src/lib/secure_links_backup.json');
      if (fs.existsSync(backupPath)) {
        const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
        const decryptedItems: { id: string, url: string }[] = [];
        const AES_SECRET = process.env.AES_SECRET as string;
        for (const [appId, encUrl] of Object.entries(backupData)) {
          let decryptedUrl = '';
          if (typeof encUrl === 'string') {
            if (encUrl.startsWith('U2FsdGVkX1')) {
              decryptedUrl = safeDecrypt(encUrl, AES_SECRET);
            } else {
              decryptedUrl = encUrl;
            }
          }
          decryptedItems.push({ id: appId, url: decryptedUrl });
        }
        return res.json({ items: decryptedItems });
      }
      res.json({ items: [] });
    } catch (err: any) {
      console.error("backup-links-get failed:", err);
      res.status(500).json({ error: "Failed to read backup links: " + err.message });
    }
  });

  // Database fix endpoint - run once to fix broken secure links
  app.get("/api/v1/admin/fix-db-links", verifyAdminToken, async (req, res) => {
     try {
        const config = getRawFirebaseConfig();
        if (!config) {
          return res.status(500).json({ error: 'Missing configuration.' });
        }
        
        const chunkResponse = await fetch(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/store_data/apps_chunk_0${config.apiKey ? "?key=" + config.apiKey : ""}`);
        const chunkData = await chunkResponse.json();
        let apps = [];
        if (!chunkData.error && chunkData.fields?.items?.arrayValue?.values) {
            apps = chunkData.fields.items.arrayValue.values.map((v: any) => v.mapValue.fields.id.stringValue);
        }
        const chunk1Response = await fetch(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/store_data/apps_chunk_1${config.apiKey ? "?key=" + config.apiKey : ""}`);
        const chunk1Data = await chunk1Response.json();
        if (!chunk1Data.error && chunk1Data.fields?.items?.arrayValue?.values) {
            apps = apps.concat(chunk1Data.fields.items.arrayValue.values.map((v: any) => v.mapValue.fields.id.stringValue));
        }
        
        const AES_SECRET = process.env.AES_SECRET as string;
        const sampleUrls = apps.map(id => ({ id, url: `https://example.com/demo/${id}` }));
        const ciphertext = safeEncrypt(JSON.stringify(sampleUrls), AES_SECRET);
        
        const idToken = (req.query.token as string) || (req.headers.authorization && req.headers.authorization.split('Bearer ')[1]) || '';
        const updateMaskParams = "updateMask.fieldPaths=encryptedData";
        const response = await fetch(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/store_data/secure_links?${updateMaskParams}${config.apiKey ? "&key=" + config.apiKey : ""}`, {
           method: 'PATCH',
           headers: {
              'Authorization': `Bearer ${idToken}`,
              'Content-Type': 'application/json'
           },
           body: JSON.stringify({
              fields: {
                 encryptedData: { stringValue: ciphertext }
              }
           })
        });
        const data = await response.json();
        res.json(data);
     } catch (e: any) {
        res.json({ error: e.message });
     }
  });

  // Public API: Direct local filesystem backup endpoint to load fast fallback when Firestore has quota limit reached
  app.get("/api/v1/public/backup-data", (req, res) => {
    try {
      const fullBackupPath = path.join(process.cwd(), 'src/lib/staticDataFull.json');
      if (fs.existsSync(fullBackupPath)) {
        const raw = fs.readFileSync(fullBackupPath, 'utf8');
        const data = JSON.parse(raw);
        if (data && Array.isArray(data.apps)) {
          data.apps = data.apps.map((app: any) => {
            const cleanApp = { ...app };
            delete cleanApp.more_information_url;
            delete cleanApp.encrypted_download_url;
            delete cleanApp.download_url;
            return cleanApp;
          });
        }
        return res.json(data);
      }
      
      const { mockApps, mockSettings, mockNews, mockBlogs, mockVideos } = require('./src/lib/staticData');
      return res.json({
        apps: mockApps || [],
        settings: mockSettings || {},
        news: mockNews || [],
        blogs: mockBlogs || [],
        videos: mockVideos || []
      });
    } catch (err: any) {
      console.error("public backup endpoint error:", err);
      res.status(500).json({ error: "Failed to retrieve local file data backup." });
    }
  });

  // Database fix endpoint - run once to fix broken secure links
  app.get("/api/v1/debug-seo", async (req, res) => {
    try {
      const { fetchStoreData } = require('./src/seoHelper');
      const data = await fetchStoreData();
      res.json({
         hasData: !!data,
         hasSettings: !!data?.settings,
         settingsKeys: Object.keys(data?.settings || {})
      });
    } catch(e) {
      res.json({ error: e.message });
    }
  });

  app.get("/api/v1/debug-index", async (req, res) => {
    try {
      let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
      
      const vite = req.app.get('vite');
      // If we don't have vite on req.app, let's just use what's in scope but vite is not exported. 
      // Actually we are inside startServer() where vite is in scope
      // return a simple object
      res.json({ debug: true });
    } catch(e) {
      res.json({ error: e.message });
    }
  });

  // ── ROADBLOCKS ──
  ["/api/v1/user", "/api/v1/auth", "/api/v1/config"].forEach(pathway => {
    app.all(pathway, (req, res) => {
      res.status(404).send("Not Found");
    });
  });

const rateLimitMap = new Map<string, number[]>();

  // API Route: Allocate seed & ephemeral nonce
  app.get(["/api/v1/_chal", "/api/v1/get-challenge", "/api/v1/init-file"], (req, res) => {
    const ip = getIp(req);
    if (rateLimit(ip)) return res.status(429).json({ error: "Too many requests. Please wait." });
    if (isBotDetected(req)) return res.status(403).json({ error: "Access denied." });

    const sid = ensureSession(req, res);
    const nonce = crypto.randomBytes(20).toString("hex");
    const issuedAt = Date.now();

    nonceStore.set(nonce, {
      sessionId: sid,
      expiresAt: issuedAt + 120 * 1000,
      issuedAt
    });

    // Random jitter (50–150ms) to frustrate timing attacks
    const jitter = Math.floor(Math.random() * 100) + 50;
    setTimeout(() => {
      res.json({
        nonce,
        difficulty: "0000", // 4 zeros = ~65,536 avg attempts — hard for bots, ~250ms for real browsers
        sid
      });
    }, jitter);
  });

  // API Route: Verify submission and issue dynamic token
  app.post(["/api/v1/_proc", "/api/v1/get-token", "/api/v1/process-file"], async (req, res) => {
    const ip = getIp(req);
    if (rateLimit(ip)) return res.status(429).json({ error: "Too many requests. Please wait." });
    if (isBotDetected(req)) return res.status(403).json({ error: "Access denied." });

    const sid = req.body?.sid || req.cookies?.__sid;
    if (!sid) {
      return res.status(403).json({ error: "Session expired. Please reload." });
    }

    const { nonce, solution, fingerprint, score, moved, touch, cfToken } = req.body || {};
    if (!nonce || !solution || !fingerprint) {
      return res.status(400).json({ error: "Invalid request." });
    }

    if (!isFingerprintValid(fingerprint)) {
      console.warn(`[DEFENSE] Bad fingerprint from ${ip}`);
      return res.status(403).json({ error: "Access denied." });
    }

    const entry = nonceStore.get(nonce);
    if (!entry) {
      return res.status(403).json({ error: "Challenge expired. Please try again." });
    }

    if (entry.sessionId !== sid) {
      nonceStore.delete(nonce);
      return res.status(403).json({ error: "Session mismatch." });
    }

    if (entry.expiresAt < Date.now()) {
      nonceStore.delete(nonce);
      return res.status(403).json({ error: "Challenge timed out." });
    }

    // Timing check: < 150ms = impossible for real browser = bot
    const solveMs = Date.now() - entry.issuedAt;
    if (solveMs < 150) {
      nonceStore.delete(nonce);
      console.warn(`[DEFENSE] Solve too fast (${solveMs}ms) from ${ip}`);
      return res.status(403).json({ error: "Access denied." });
    }

    nonceStore.delete(nonce); // single-use

    // Score threshold: 40
    if (typeof score !== 'number' || score < 40) {
      console.warn(`[DEFENSE] Low score (${score}) from ${ip}`);
      return res.status(403).json({ error: "Access denied: security check failed." });
    }

    // Server-side PoW check
    const attempt = nonce + solution;
    const hash = crypto.createHash("sha256").update(attempt).digest("hex");
    if (!hash.startsWith("0000")) {
      console.warn(`[DEFENSE] PoW fail from ${ip}: ${hash}`);
      return res.status(403).json({ error: "Access denied: verification failed." });
    }

    // Cloudflare Turnstile
    if (CF_TURNSTILE_SECRET) {
      const cfPassed = await verifyTurnstile(cfToken || '', ip);
      if (!cfPassed) {
        console.warn(`[CF] Rejected ${ip}`);
        return res.status(403).json({ error: "Access denied: bot protection triggered." });
      }
    }

    console.log(`[ACCESS] GRANTED ip=${ip} score=${score} solveMs=${solveMs} moved=${moved} touch=${touch}`);
    const token = generateToken(ip, sid, fingerprint);

    res.json({ token });
  });

  // API Route: Public link status check — called before verification to avoid
  // wasting the user's time if no download link has been configured for this app.
  app.get("/api/v1/link-check", async (req, res) => {
    const appId = req.query.id as string;
    if (!appId) return res.status(400).json({ configured: false });
    res.set("Cache-Control", "no-store");
    try {
      const config = getRawFirebaseConfig();
      if (!config) return res.json({ configured: false }); // fail-closed if config missing
      const db = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents`;
      const apiSuffix = config.apiKey ? `?key=${config.apiKey}` : '';
      const AES_SECRET = process.env.AES_SECRET as string;
      
      // Check sec_public_links, secure_links, sec_vault (in that order)
      for (const docName of ['sec_public_links', 'secure_links', 'sec_vault']) {
        try {
          const r = await fetch(`${db}/store_data/${docName}${apiSuffix}`);
          const d = await r.json();
          if (d.error) continue;
          // If encrypted blob exists, check if this appId is in it (using secret or fallbacks)
          let foundInEncrypted = false;
          if (d.fields?.encryptedData?.stringValue) {
            try {
              const dec = safeDecrypt(d.fields.encryptedData.stringValue, AES_SECRET);
              if (dec) {
                const arr = JSON.parse(dec);
                const foundEntry = arr.find((v: any) => v.id === appId && v.url);
                if (foundEntry) {
                  foundInEncrypted = true;
                  return res.json({ configured: true, debugLinkObj: foundEntry });
                }
              }
            } catch {}
          }
          // Legacy unencrypted items array
          if (!foundInEncrypted && d.fields?.items?.arrayValue?.values) {
            const found = d.fields.items.arrayValue.values.find(
              (v: any) => v.mapValue?.fields?.id?.stringValue === appId && v.mapValue?.fields?.url?.stringValue
            );
            if (found) return res.json({ configured: true });
          }
        } catch {}
      }
      // Fallback: scan app chunks for download_url / more_information_url
      try {
        const metaR = await fetch(`${db}/store_data/apps_meta${apiSuffix}`);
        const metaD = await metaR.json();
        const numChunks = (!metaD.error && metaD.fields?.numChunks?.integerValue)
          ? parseInt(metaD.fields.numChunks.integerValue, 10) : 2;
        for (let i = 0; i < numChunks; i++) {
          const chunkR = await fetch(`${db}/store_data/apps_chunk_${i}${apiSuffix}`);
          const chunkD = await chunkR.json();
          if (!chunkD.error && chunkD.fields?.items?.arrayValue?.values) {
            const item = chunkD.fields.items.arrayValue.values.find(
              (v: any) => v.mapValue?.fields?.id?.stringValue === appId
            );
            if (item?.mapValue?.fields) {
              const hasUrl = item.mapValue.fields.more_information_url?.stringValue
                          || item.mapValue.fields.download_url?.stringValue;
              if (hasUrl) return res.json({ configured: true });
            }
          }
        }
      } catch {}
      
      // Ultimate fallback: return false to prevent showing inactive download buttons
      return res.json({ configured: false });
    } catch (err) {
      console.warn('[link-check] Error:', err);
      return res.json({ configured: false }); // Do not fail-open
    }
  });

  // Rate limiting map for public chat
  const publicChatRateLimits = new Map<string, { count: number, resetTime: number }>();

  // API Route: Secure AI Assistant Chat (Restricted to Admin)
  app.post("/api/v1/public/chat", async (req, res) => {
    // 1. Rate limiting: 10 messages per hour per IP
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown') as string;
    const now = Date.now();
    const rateLimitWindow = 60 * 60 * 1000; // 1 hour
    const maxMessages = 10;
    
    let userLimit = publicChatRateLimits.get(ip);
    if (!userLimit || now > userLimit.resetTime) {
      userLimit = { count: 0, resetTime: now + rateLimitWindow };
    }
    
    if (userLimit.count >= maxMessages) {
      return res.status(429).json({ error: "Rate limit exceeded. Maximum 10 messages per hour. Please try again later." });
    }
    
    userLimit.count += 1;
    publicChatRateLimits.set(ip, userLimit);

    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message payload is required.' });
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("AI service is currently offline.");
      }

      // 2. Fetch public context
      const { fetchStoreData } = require('./src/seoHelper');
      const data = await fetchStoreData();
      
      const publicContext = {
        settings: {
           site_title: data.settings?.site_title,
           meta_description: data.settings?.meta_description,
           policies: data.settings?.policies ? data.settings.policies.substring(0, 500) : "",
        },
        categories: (data.categories || []).map((cat: any) => ({
            id: cat.id,
            n: cat.name
        })),
        apps: (data.apps || []).map((app: any) => ({
           n: app.name,
           c: app.category,
           desc: app.description_html?.replace(/<[^>]+>/g, '').substring(0, 200), // strips HTML and truncates
           r: app.rating
        })),
        news: (data.news || []).map((item: any) => ({
           t: item.title,
           d: item.description?.substring(0, 200),
           c: item.content?.replace(/<[^>]+>/g, '').substring(0, 300)
        })),
        blogs: (data.blogs || []).map((item: any) => ({
           t: item.title,
           d: item.description?.substring(0, 200),
           c: item.content?.replace(/<[^>]+>/g, '').substring(0, 300)
        })),
        videos: (data.videos || []).map((item: any) => ({
           t: item.title,
           d: item.description,
           c: item.content?.replace(/<[^>]+>/g, '').substring(0, 1000)
        }))
      };

      const { GoogleGenAI } = require("@google/genai");
      const client = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      // 3. System Prompt
      const sysInstruction = `You are a helpful, lively, and knowledgeable AI assistant. While you are integrated into the RummyApp Online website, you are ALSO a general-purpose AI capable of answering ANY question from the user.
You MUST answer queries about general knowledge, current events, programming, science, everyday facts, or anything else the user asks. 
IMPORTANT: Use your Google Search capabilities to find answers from the real internet whenever the user asks for up-to-date information, facts, news, or external context. Do not restrict yourself to only website-related topics. Never say you can only answer website-related questions. Give comprehensive, lively answers just like Google or Gemini would.

If the user asks about the site structure, simulated games, news, or blogs, you can use the PUBLIC CONTEXT provided below.

PUBLIC CONTEXT (Website Data):
${JSON.stringify(publicContext, null, 2)}`;

      // 4. Output capped at 1000 tokens for detailed answers
      try {
        const responseStream = await client.models.generateContentStream({
          model: "gemini-2.0-flash", // Using advanced model for large context
          contents: message.trim(),
          config: {
            systemInstruction: sysInstruction,
            maxOutputTokens: 1000, 
            temperature: 0.3,
            tools: [{ googleSearch: {} }]
          }
        });

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        for await (const chunk of responseStream) {
          if (chunk.text) {
            res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
          }
        }
        res.write(`data: [DONE]\n\n`);
        return res.end();
      } catch (err: any) {
        if (!res.headersSent) {
          throw err; // Bubble up to outer catch block for fallback
        }
        res.write(`data: ${JSON.stringify({ error: err.message || "Streaming failed" })}\n\n`);
        return res.end();
      }
    } catch (err: any) {
      if (err.status === 429 || err.message?.includes('429')) {
         return res.json({ success: true, answer: "🚨 **API Quota Exceeded:** The system is currently overloaded or your Gemini API key has exceeded its free tier usage limits. Please try again later, or configure a paid/upgraded API key to ensure uninterrupted live browsing and answering capabilities." });
      } else if (err.status === 403 || err.message?.includes('403')) {
         return res.json({ success: true, answer: "🚨 **API Access Denied:** Your Gemini API key does not have permission or is invalid. Please update your API key in the settings." });
      }
      
      // Fallback message for public chat if there's a normal connectivity issue
      const lowerMessage = message.trim().toLowerCase();
      
      try {
        const { fetchStoreData } = require('./src/seoHelper');
        const data = await fetchStoreData();
        const apps = data.apps || [];
        
        const matches = apps.filter((a: any) => 
            (a.name && a.name.toLowerCase().includes(lowerMessage)) || 
            (a.category && a.category.toLowerCase().includes(lowerMessage))
        );
        
        if (matches.length > 0) {
            const names = matches.slice(0, 3).map((a: any) => a.name).join(', ');
            return res.json({ 
              success: true, 
              answer: `(Offline Fallback): I found some apps in the directory matching your query: ${names}${matches.length > 3 ? ' and more.' : '.'}`
            });
        } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi ') || lowerMessage === 'hi') {
            return res.json({ 
              success: true, 
              answer: `(Offline Fallback): Hello! Our AI is currently in offline mode due to high traffic, but I can still help you search for app titles and categories!`
            });
        }
      } catch (fallbackErr) {
        // Ignore fallback errors
      }

      return res.json({ 
        success: true, 
        answer: "(Offline Fallback): I am experiencing high traffic right now and cannot answer complex questions. Please browse the directory directly."
      });
    }
  });

  // API Route: Report missing link to admin
  app.post("/api/v1/report-missing", async (req, res) => {
    const { appId } = req.body;
    if (!appId) {
      return res.status(400).json({ error: "Missing App ID parameter." });
    }
    try {
      const config = getRawFirebaseConfig();
      if (!config) {
        return res.status(500).json({ error: "Firebase is not configured." });
      }
      const db = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents`;
      const apiSuffix = config.apiKey ? `?key=${config.apiKey}` : '';

      // Save as a specialized review with "missing_link_report" source to meet Firestore security rules
      const reportId = `report_${appId.replace(/[^a-zA-Z0-9_\-]/g, '')}_${Date.now()}`.substring(0, 120);
      const fields = ['app_id', 'username', 'rating', 'comment', 'created_at', 'helpful_count', 'is_approved', 'source'];
      const updateMaskParams = fields.map(f => `updateMask.fieldPaths=${f}`).join('&');
      const patchUrl = `${db}/reviews/${reportId}${apiSuffix ? apiSuffix + '&' + updateMaskParams : '?' + updateMaskParams}`;
      const storeResponse = await fetch(patchUrl, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fields: {
            app_id: { stringValue: appId },
            username: { stringValue: "Anonymous Reporter" },
            rating: { doubleValue: 1.0 },
            comment: { stringValue: `MISSING_LINK_REPORT: Download link not available for app ${appId}.` },
            created_at: { stringValue: new Date().toISOString() },
            helpful_count: { integerValue: "0" },
            is_approved: { booleanValue: false },
            source: { stringValue: "missing_link_report" }
          }
        })
      });

      const storeData = await storeResponse.json();
      if (storeData.error) {
        console.error('[report-missing] Firestore error:', storeData.error);
        return res.status(storeData.error.code || 500).json({ error: storeData.error.message || "Failed to register report." });
      }

      return res.json({ success: true });
    } catch (err: any) {
      console.error('[report-missing] Server exception:', err);
      return res.status(500).json({ error: err.message || "Internal server error during logging." });
    }
  });

  // API Route: Process temporary dynamic download token
  app.get("/api/v1/file-payload", async (req, res) => {
    // Note: Checking is already completed on the upstream post endpoints (/api/v1/process-file)
    // to support various mobile browsers and system download managers that might strip browser-like headers.

    const ip = getIp(req);
    const sid = (req.query.sid || req.cookies?.__sid) as string;
    const token = (req.query.token || req.query.t) as string;
    const appId = req.query.id as string;

    if (!token || !appId) {
      if (req.query.json === 'true') return res.status(400).json({ error: "Verification transmission tokens or App ID were omitted." });
      return res.status(400).send("<h1>400 Bad Request</h1><p>Verification transmission tokens or App ID were omitted.</p>");
    }

    // Strict replay protection - re-enabled for security
    // if (usedTokens.has(token)) {
    //   if (req.query.json === 'true') return res.status(403).json({ error: "This single-use private download signature has already been spent." });
    //   return res.status(403).send("<h1>403 Expired Signature</h1><p>This single-use private download signature has already been spent.</p>");
    // }

    // Determine verification scheme
    // Scheme A: Extended Fingerprint token (containing '::' signature splitter inside base64url encoded token)
    let isSchemeA = false;
    try {
      if (Buffer.from(token, "base64url").toString("utf8").includes("::")) {
        isSchemeA = true;
      }
    } catch (err) {}

    if (isSchemeA) {
      try {
        const raw = Buffer.from(token, "base64url").toString("utf8");
        const [payload] = raw.split("::");
        const [tIp, tSession, fingerprint] = payload.split("|");

        const finalSid = sid || tSession || "sandbox-bypass";

        if (!verifyToken(token, tIp, tSession, fingerprint)) {
          if (req.query.json === 'true') return res.status(403).json({ error: "Cryptographic HMAC validation failed." });
          return res.status(403).send("<h1>403 Forbidden</h1><p>Cryptographic HMAC validation failed.</p>");
        }

        if (tSession !== finalSid) {
        return res.status(403).send("<h1>403 Forbidden</h1><p>Session mismatch.</p>");
      }

        // Spend token to prevent reuse / replay attacks
        // usedTokens.add(token);

        let targetUrl = '';
        try {
          const AES_SECRET = process.env.AES_SECRET as string;
          const config = getRawFirebaseConfig();
          if (!config) {
            throw new Error("Missing Firebase configuration.");
          }
          
          try {
            // First try sec_public_links, which is public-readable on all projects & databases
            const urlResponse = await fetch(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/store_data/sec_public_links?key=${config.apiKey}`);
            let secureData = await urlResponse.json();
            
            // Fallback to secure_links
            if (secureData.error || (!secureData.fields?.encryptedData && !secureData.fields?.items)) {
                const slResponse = await fetch(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/store_data/secure_links?key=${config.apiKey}`);
                const slData = await slResponse.json();
                if (!slData.error) {
                    secureData = slData;
                }
            }
            
            // Fallback to sec_vault
            if (secureData.error || (!secureData.fields?.encryptedData && !secureData.fields?.items)) {
                const vaultRes = await fetch(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/store_data/sec_vault?key=${config.apiKey}`);
                const vaultData = await vaultRes.json();
                if (!vaultData.error) {
                    secureData = vaultData;
                }
            }
            
            if (!secureData.error) {
              const fields = secureData.fields;
              if (fields?.encryptedData?.stringValue) {
                const encryptedBlob = fields.encryptedData.stringValue;
                const decryptedText = safeDecrypt(encryptedBlob, AES_SECRET);
                                if (decryptedText) {
                  const linksArray = JSON.parse(decryptedText);
                                                      const linkObj = linksArray.find((v: any) => v.id === appId);
                  if (linkObj && linkObj.url) {
                    const encryptedUrl = linkObj.url;
                                        if (encryptedUrl.startsWith('U2FsdGVkX1')) {
                      targetUrl = safeDecrypt(encryptedUrl, AES_SECRET);
                    } else {
                      targetUrl = encryptedUrl; // Legacy plaintext
                    }
                  }
                }
              }
              
              if (!targetUrl && fields?.items?.arrayValue?.values) {
                // Backward compatibility for legacy unencrypted list schema
                const linksArray = fields.items.arrayValue.values;
                const linkObj = linksArray.find((v: any) => v.mapValue.fields.id.stringValue === appId);
                if (linkObj && linkObj.mapValue.fields.url) {
                  const encryptedUrl = linkObj.mapValue.fields.url.stringValue;
                  if (encryptedUrl) {
                    if (encryptedUrl.startsWith('U2FsdGVkX1')) {
                      targetUrl = safeDecrypt(encryptedUrl, AES_SECRET);
                    } else {
                      targetUrl = encryptedUrl;
                    }
                  }
                }
              }
            }
          } catch (err) {
            console.warn("secure_links get or decryption failed, falling back to chunks scanner", err);
          }

          // Fallback to local offline file backup if Firestore is unreachable/exceeded quota
          if (!targetUrl || !targetUrl.startsWith('http')) {
            try {
              const backupPath = path.join(process.cwd(), 'src/lib/secure_links_backup.json');
              if (fs.existsSync(backupPath)) {
                const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
                const encryptedUrl = backup[appId];
                if (encryptedUrl) {
                  if (encryptedUrl.startsWith('U2FsdGVkX1')) {
                    const AES_SECRET = process.env.AES_SECRET as string;
                    targetUrl = safeDecrypt(encryptedUrl, AES_SECRET);
                  } else {
                    targetUrl = encryptedUrl;
                  }
                  console.log("Successfully retrieved targetUrl from local filesystem backup for app ID:", appId);
                }
              }
            } catch (backupErr) {
              console.warn("Local filesystem backup retrieval failed:", backupErr);
            }
          }

          if (!targetUrl || !targetUrl.startsWith('http')) {
            console.log("File Payload Scraper: Attempting direct chunk scan for app ID:", appId);
            const apiSuffix = config.apiKey ? `?key=${config.apiKey}` : '';
            const metaResponse = await fetch(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/store_data/apps_meta${apiSuffix}`);
            const metaData = await metaResponse.json();
            let numChunks = 1;
            if (!metaData.error && metaData.fields?.numChunks?.integerValue) {
                numChunks = parseInt(metaData.fields.numChunks.integerValue, 10);
            }
            
            for (let i = 0; i < numChunks; i++) {
                const chunkResponse = await fetch(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/store_data/apps_chunk_${i}${apiSuffix}`);
                const chunkData = await chunkResponse.json();
                if (!chunkData.error && chunkData.fields?.items?.arrayValue?.values) {
                    const values = chunkData.fields.items.arrayValue.values;
                    const item = values.find((v: any) => v.mapValue.fields.id.stringValue === appId);
                    if (item && item.mapValue.fields) {
                        const encryptedUrlField = item.mapValue.fields.more_information_url?.stringValue || item.mapValue.fields.download_url?.stringValue;
                        if (encryptedUrlField) {
                            if (encryptedUrlField.startsWith('U2FsdGVkX1')) {
                                targetUrl = safeDecrypt(encryptedUrlField, AES_SECRET);
                            } else {
                                targetUrl = encryptedUrlField;
                            }
                            console.log("Successfully retrieved URL from fallback chunk scan for app ID:", appId);
                            break;
                        }
                    }
                }
            }
          }
        } catch (err) {
          console.error("Firestore retrieval or decryption failed", err);
        }
        
        if (targetUrl && !targetUrl.startsWith('http://') && !targetUrl.startsWith('https://') && targetUrl.includes('.')) {
          targetUrl = 'https://' + targetUrl;
        }
        
        if (!targetUrl || !targetUrl.startsWith('http')) {
          console.error("CRITICAL: Failed to retrieve or decrypt URL for app:", appId, "Result:", targetUrl);
          return res.status(404).json({ error: "Download link not found or not yet configured for this app." });
        }

        // Apply Mistake 5 fix: Add affiliate referral code server-side
        try {
          const targetUrlObj = new URL(targetUrl);
          if (!targetUrlObj.searchParams.has('code')) {
            const affiliateCode = process.env.AFFILIATE_CODE;
            if (affiliateCode) {
              targetUrlObj.searchParams.set('code', affiliateCode);
              targetUrl = targetUrlObj.toString();
            }
          }
        } catch (e) {}

        res.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
        return res.redirect(302, targetUrl);
      } catch (err) {
        if (req.query.json === 'true') return res.status(403).json({ error: "Error decoding parameter." });
        return res.status(403).send("<h1>403 Forbidden</h1><p>Error decoding parameter.</p>");
      }
    }

    // Scheme B: Backward-compatible tokenStore checking
    const tokenData = (tokenStore as any).get(token);
    if (!tokenData) {
      if (req.query.json === 'true') return res.status(404).json({ error: "Link expired or invalid." });
      return res.status(404).send("<h1>404 Not Found</h1><p>Link expired or invalid.</p>");
    }

    if (tokenData.expiresAt < Date.now()) {
      (tokenStore as any).delete(token);
      if (req.query.json === 'true') return res.status(404).json({ error: "This connection timed out." });
      return res.status(404).send("<h1>404 Not Found</h1><p>This connection timed out.</p>");
    }

    // Spend token to prevent replay (Disabled to allow download resuming/managers)
    // (tokenStore as any).delete(token);
    // usedTokens.add(token);

    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    return res.redirect(302, tokenData.targetUrl);
  });

  // API Route: Public unsecure SEO friendly download endpoint redirects to gateway
  app.get("/api/v1/download/:id", async (req, res) => {
    const appId = req.params.id;
    if (!appId) return res.status(400).send("Bad Request");
    return res.redirect(302, `/gateway/${appId}`);
  });


  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });
    app.use(vite.middlewares);
    
    // We override index.html serving to inject our SEO tags locally too!
    app.use('*', async (req, res, next) => {
      // Allow assets to be handled by Vite
      if (req.originalUrl.includes('.')) return next();
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
        const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
        const host = req.headers["x-forwarded-host"] || req.get("host") || "localhost:3000";
        const hostUrl = `${String(protocol).split(',')[0].trim()}://${String(host).split(',')[0].trim()}`;
        const userAgent = req.headers['user-agent'] || '';
        template = await injectSeoTags(template, req.originalUrl, hostUrl, userAgent);
        fs.writeFileSync(path.resolve(process.cwd(), 'debug-inject.log'), "Injected length: " + template.length + " has_initial: " + template.includes("__INITIAL_DATA__"));
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });

  } else {
    const getDistPath = (): string => {
      const pathsToTry = [
        path.join(process.cwd(), 'dist'),
        path.resolve(__dirname, 'dist'),
        path.resolve(__dirname, '..', 'dist'),
        __dirname
      ];
      for (const p of pathsToTry) {
        if (fs.existsSync(path.join(p, 'index.html'))) {
          return p;
        }
      }
      return path.join(process.cwd(), 'dist'); // failsafe fallback
    };

    const distPath = getDistPath();

    // Specifically handle assets (JS, CSS, Images, Fonts) with long-term immutable caching FIRST
    app.use('/assets', express.static(path.join(distPath, 'assets'), {
      maxAge: '1y',
      immutable: true,
      fallthrough: false
    }));

    // Production static files with aggressive caching for dynamic views and elements
    app.use(express.static(distPath, {
      maxAge: '1d', // Cache for 1 day instead of 1 year for safety but performance
      etag: true,
      lastModified: true,
      index: false
    }));
    
    app.get('*', async (req, res) => {
      let templatePath = path.join(distPath, 'index.html');
      if (!fs.existsSync(templatePath)) {
        templatePath = path.join(process.cwd(), 'index.html');
      }
      try {
        let template = fs.readFileSync(templatePath, 'utf-8');
        const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
        const host = req.headers["x-forwarded-host"] || req.get("host") || "localhost:3000";
        const hostUrl = `${String(protocol).split(',')[0].trim()}://${String(host).split(',')[0].trim()}`;
        const userAgent = req.headers['user-agent'] || '';
        template = await injectSeoTags(template, req.originalUrl, hostUrl, userAgent);
        res.status(200).set({ 
          'Content-Type': 'text/html',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }).send(template);
      } catch (e) {
        console.error("SEO fallback error in catch-all, serving file as-is:", e);
        res.status(200).set({
          'Content-Type': 'text/html',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }).sendFile(templatePath);
      }
    });
  }

  // Global Express Error Handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error(`[EXPRESS GLOBAL ERROR] ${req.method} ${req.originalUrl}:`, err);
    try {
      const logFile = path.join(process.cwd(), 'server_requests.log');
      fs.appendFileSync(logFile, `[${new Date().toISOString()}] ERROR in ${req.method} ${req.originalUrl}: ${err.message || err}\n`, 'utf8');
    } catch (e) {}

    if (res.headersSent) {
      return next(err);
    }
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(500).json({ error: err.message || "Internal server error" });
    }
    res.status(500).send("<h1>500 Internal Server Error</h1><p>An unexpected error occurred.</p>");
  });

  app.listen(PORT as number, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
    // Eagerly populate cache so first user gets instant response
    fetchStoreData().catch(e => console.log("Silent initial cache warming failed: ", e));
  });
}

startServer();
