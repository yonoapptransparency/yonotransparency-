import { Router } from "express";
import crypto from "crypto";
import type { Request, Response } from "express";

const router = Router();

const TOKEN_SECRET = process.env.TOKEN_SECRET || "";

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

const rawTurnstileSecret = process.env.CF_TURNSTILE_SECRET || "";
const isRealSecret = (val: string) =>
  val && val !== "PLACEHOLDER" && !val.includes("#") && !val.includes("*");
const CF_TURNSTILE_SECRET = isRealSecret(rawTurnstileSecret) ? rawTurnstileSecret : "";

const WINDOW = 60 * 1000;
const MAX_HITS = 30;
interface IpEntry { count: number; start: number; }
const ipMap = new Map<string, IpEntry>();

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const e = ipMap.get(ip) || { count: 0, start: now };
  if (now - e.start > WINDOW) { ipMap.set(ip, { count: 1, start: now }); return false; }
  e.count++;
  ipMap.set(ip, e);
  return e.count > MAX_HITS;
}

export function getIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

function isBotDetected(req: Request): boolean {
  const ua = (req.headers["user-agent"] || "") as string;
  if (!ua || ua.length < 20) return true;
  if (BAD_UA.some((rx) => rx.test(ua))) return true;
  const accept = req.headers["accept"];
  if (!accept) return true;
  return false;
}

function isFingerprintValid(fp: string): boolean {
  if (!fp || typeof fp !== "string") return false;
  if (fp.length < 8) return false;
  if (/^(.)\1+$/.test(fp)) return false;
  return true;
}

interface NonceEntry { sessionId: string; expiresAt: number; issuedAt?: number; }
const nonceStore = new Map<string, NonceEntry>();

function ensureSession(req: Request, res: Response): string {
  const cookies = (req as any).cookies || {};
  if (cookies.__sid) return cookies.__sid;
  const sid = crypto.randomBytes(24).toString("hex");
  res.cookie("__sid", sid, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 300000,
    secure: process.env.NODE_ENV === "production",
  });
  return sid;
}

export function generateToken(ip: string, sessionId: string, fingerprint: string): string {
  const EXPIRY = 120;
  const expires = Math.floor(Date.now() / 1000) + EXPIRY;
  const payload = `${ip}|${sessionId}|${fingerprint}|${expires}`;
  const sig = crypto.createHmac("sha256", TOKEN_SECRET).update(payload).digest("hex");
  return Buffer.from(`${payload}::${sig}`).toString("base64url");
}

export function verifyToken(token: string, _ip: string, sessionId: string, fingerprint: string): boolean {
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const [payload, sig] = raw.split("::");
    if (!payload || !sig) return false;
    const parts = payload.split("|");
    if (parts.length !== 4) return false;
    const [, tSession, , expires] = parts;
    if (tSession !== sessionId) return false;
    if (Math.floor(Date.now() / 1000) > parseInt(expires, 10)) return false;
    const expected = crypto.createHmac("sha256", TOKEN_SECRET).update(payload).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  if (!CF_TURNSTILE_SECRET || !token) return true;
  try {
    const params = new URLSearchParams({ secret: CF_TURNSTILE_SECRET, response: token, remoteip: ip });
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: params,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    const data = await res.json() as any;
    return data.success === true;
  } catch {
    return true;
  }
}

// Honeypot traps
["/trap/link", "/trap/form", "/trap/admin", "/trap/backup", "/trap/config"].forEach((pathway) => {
  router.all(pathway, (req, res) => {
    console.warn(`[DEFENSE] Honeypot triggered: ${pathway} from ${getIp(req)}`);
    res.status(403).send("Security Exception: Bot/Scraper traffic terminated.");
  });
});

// GET /v1/_chal — issue PoW challenge
router.get(["/v1/_chal", "/v1/get-challenge", "/v1/init-file"], (req, res): void => {
  const ip = getIp(req);
  if (rateLimit(ip)) { res.status(429).json({ error: "Too many requests." }); return; }
  if (isBotDetected(req)) { res.status(403).json({ error: "Access denied." }); return; }

  const sid = ensureSession(req, res);
  const nonce = crypto.randomBytes(20).toString("hex");
  const issuedAt = Date.now();

  nonceStore.set(nonce, { sessionId: sid, expiresAt: issuedAt + 120 * 1000, issuedAt });

  const jitter = Math.floor(Math.random() * 100) + 50;
  setTimeout(() => {
    res.json({ nonce, difficulty: "0000", sid });
  }, jitter);
});

// POST /v1/_proc — verify PoW, issue token
router.post(["/v1/_proc", "/v1/get-token", "/v1/process-file"], async (req, res): Promise<void> => {
  const ip = getIp(req);
  if (rateLimit(ip)) { res.status(429).json({ error: "Too many requests." }); return; }
  if (isBotDetected(req)) { res.status(403).json({ error: "Access denied." }); return; }

  const cookies = (req as any).cookies || {};
  const sid = req.body?.sid || cookies.__sid;
  if (!sid) { res.status(403).json({ error: "Session expired. Please reload." }); return; }

  const { nonce, solution, fingerprint, score, moved, touch, cfToken } = req.body || {};
  if (!nonce || !solution || !fingerprint) { res.status(400).json({ error: "Invalid request." }); return; }

  if (!isFingerprintValid(fingerprint)) { res.status(403).json({ error: "Access denied." }); return; }

  const entry = nonceStore.get(nonce);
  if (!entry) { res.status(403).json({ error: "Challenge expired." }); return; }
  if (entry.sessionId !== sid) { nonceStore.delete(nonce); res.status(403).json({ error: "Session mismatch." }); return; }
  if (entry.expiresAt < Date.now()) { nonceStore.delete(nonce); res.status(403).json({ error: "Challenge timed out." }); return; }

  const solveMs = Date.now() - (entry.issuedAt || entry.expiresAt - 120 * 1000);
  if (solveMs < 150) { nonceStore.delete(nonce); res.status(403).json({ error: "Access denied." }); return; }

  nonceStore.delete(nonce);

  if (typeof score !== "number" || score < 40) { res.status(403).json({ error: "Access denied: security check failed." }); return; }

  const attempt = nonce + solution;
  const hash = crypto.createHash("sha256").update(attempt).digest("hex");
  if (!hash.startsWith("0000")) { res.status(403).json({ error: "Access denied: verification failed." }); return; }

  if (CF_TURNSTILE_SECRET) {
    const cfPassed = await verifyTurnstile(cfToken || "", ip);
    if (!cfPassed) { res.status(403).json({ error: "Access denied: bot protection triggered." }); return; }
  }

  console.log(`[ACCESS] GRANTED ip=${ip} score=${score} solveMs=${solveMs} moved=${moved} touch=${touch}`);
  const token = generateToken(ip, sid, fingerprint);
  res.json({ token });
});

// Cleanup timer
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [nonce, data] of nonceStore.entries()) {
    if (data.expiresAt < now) nonceStore.delete(nonce);
  }
}, 30000);
if (cleanupTimer.unref) cleanupTimer.unref();

export default router;
