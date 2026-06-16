import { Router } from "express";
import fs from "fs";
import path from "path";
import type { Request, Response, NextFunction } from "express";
import { getRawFirebaseConfig } from "../lib/firebaseHelper.js";
import { safeDecrypt, safeEncrypt } from "../lib/cryptoHelper.js";

const router = Router();

export const verifyAdminToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized: Missing verification token." });
    return;
  }
  const idToken = authHeader.split("Bearer ")[1];
  if (!idToken || idToken === "null" || idToken === "undefined") {
    res.status(401).json({ error: "Unauthorized: Empty session verification token." });
    return;
  }

  try {
    let config: any;
    try { config = getRawFirebaseConfig(); } catch {
      res.status(500).json({ error: "Internal Server Error: Missing app configuration." });
      return;
    }

    const lookupRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${config.apiKey}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken }) }
    );

    if (!lookupRes.ok) {
      res.status(401).json({ error: "Unauthorized: Verification token lookup failed." });
      return;
    }

    const lookupData = await lookupRes.json() as any;
    const user = lookupData.users?.[0];
    if (!user) {
      res.status(401).json({ error: "Unauthorized: Authenticated identity could not be located." });
      return;
    }

    const email = user.email?.toLowerCase() || "";
    let isDbAdmin = false;
    const configuredAdminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
    if (!configuredAdminEmail) {
      res.status(500).json({ error: "Server misconfiguration: ADMIN_EMAIL not set." });
      return;
    }

    if (email === configuredAdminEmail && user.emailVerified === true) {
      isDbAdmin = true;
    }

    if (!isDbAdmin && user.emailVerified === true) {
      try {
        const apiKey = config.apiKey ? `?key=${config.apiKey}` : "";
        const db = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents`;
        const r1 = await fetch(`${db}/admins/${user.localId}${apiKey}`);
        if (r1.ok) {
          isDbAdmin = true;
        } else {
          const r2 = await fetch(`${db}/admins/${email}${apiKey}`);
          if (r2.ok) isDbAdmin = true;
        }
      } catch (err) {
        console.error("verifyAdminToken db check failed:", err);
      }
    }

    if (isDbAdmin) {
      (req as any).adminUser = user;
      return next();
    }
    res.status(403).json({ error: "Forbidden: Admin authorization is required." });
  } catch (err: any) {
    res.status(500).json({ error: `Internal security validation error: ${err.message || err}` });
  }
};

router.get("/v1/admin/verify", verifyAdminToken, (req, res) => {
  res.json({ authorized: true, user: (req as any).adminUser });
});

router.post("/v1/admin/encrypt", verifyAdminToken, (req, res) => {
  const { url } = req.body;
  if (!url) { res.status(400).json({ error: "URL is required" }); return; }
  try {
    const ciphertext = safeEncrypt(url, process.env.AES_SECRET as string);
    res.json({ encrypted: ciphertext });
  } catch {
    res.status(500).json({ error: "Encryption failed" });
  }
});

router.post("/v1/admin/encrypt-links", verifyAdminToken, async (req, res) => {
  const { items } = req.body;
  if (!items || !Array.isArray(items)) { res.status(400).json({ error: "Valid links array is required." }); return; }

  const AES_SECRET = process.env.AES_SECRET as string;
  if (!AES_SECRET?.trim()) { res.status(500).json({ error: "AES_SECRET environment variable is missing." }); return; }

  try {
    let existingItems: any[] = [];
    let config: any;
    try { config = getRawFirebaseConfig(); } catch {}

    if (config) {
      const apiSuffix = config.apiKey ? `?key=${config.apiKey}` : "";
      const db = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents`;
      for (const docName of ["sec_public_links", "secure_links", "sec_vault"]) {
        try {
          const r = await fetch(`${db}/store_data/${docName}${apiSuffix}`);
          const d = await r.json() as any;
          if (d && !d.error && d.fields?.encryptedData?.stringValue) {
            const dec = safeDecrypt(d.fields.encryptedData.stringValue, AES_SECRET);
            if (dec) {
              const parsed = JSON.parse(dec);
              if (Array.isArray(parsed)) { existingItems = parsed; break; }
            }
          }
        } catch {}
      }
    }

    const finalMap = new Map();
    existingItems.forEach((e: any) => { if (e?.id) finalMap.set(e.id, e); });

    const processedItems = items.map((item: any) => {
      let finalUrl = item.url || "";
      if (finalUrl && !finalUrl.startsWith("http") && !finalUrl.startsWith("U2FsdGVkX1")) {
        finalUrl = "https://" + finalUrl;
      }
      if (finalUrl && !finalUrl.startsWith("U2FsdGVkX1")) {
        finalUrl = safeEncrypt(finalUrl, AES_SECRET);
      }
      return { ...item, url: finalUrl };
    });

    processedItems.forEach((newItem: any) => {
      if (newItem?.id) {
        const existing = finalMap.get(newItem.id);
        if (newItem.url || !existing) finalMap.set(newItem.id, newItem);
      }
    });

    const mergedItems = Array.from(finalMap.values());
    const ciphertext = safeEncrypt(JSON.stringify(mergedItems), AES_SECRET);
    res.json({ encrypted: ciphertext });
  } catch (err) {
    console.error("Links encryption failed:", err);
    res.status(500).json({ error: "Links encryption failed" });
  }
});

router.post("/v1/admin/decrypt-url", verifyAdminToken, (req, res) => {
  const { encryptedUrl } = req.body;
  if (!encryptedUrl) { res.status(400).json({ error: "Missing encryptedUrl" }); return; }
  try {
    const dec = safeDecrypt(encryptedUrl, process.env.AES_SECRET as string);
    res.json({ decrypted: dec || "Failed to decrypt or empty string" });
  } catch {
    res.status(500).json({ error: "Decryption failed" });
  }
});

router.post("/v1/admin/decrypt-links", verifyAdminToken, (req, res) => {
  const { encryptedData } = req.body;
  if (!encryptedData) { res.status(400).json({ error: "Encrypted payload is required." }); return; }
  try {
    const AES_SECRET = process.env.AES_SECRET as string;
    const dec = safeDecrypt(encryptedData, AES_SECRET);
    if (!dec) throw new Error("Empty decrypted block.");
    let items = JSON.parse(dec);
    items = items.map((item: any) => {
      let finalUrl = item.url || "";
      if (finalUrl.startsWith("U2FsdGVkX1")) {
        try { finalUrl = safeDecrypt(finalUrl, AES_SECRET); } catch {}
      }
      return { ...item, url: finalUrl };
    });
    res.json({ items });
  } catch {
    res.status(500).json({ error: "Links decryption failed." });
  }
});

router.post("/v1/admin/backup-data", verifyAdminToken, async (req: any, res) => {
  try {
    const { apps, settings, news, blogs, videos } = req.body;
    if (!apps || !settings) { res.status(400).json({ error: "Invalid backup payload." }); return; }

    fs.writeFileSync(
      path.join(process.cwd(), "src/lib/staticDataFull.json"),
      JSON.stringify({ apps, settings, news, blogs, videos }, null, 2),
      "utf8"
    );

    const backupLinks: Record<string, string> = {};
    apps.forEach((app: any) => {
      if (app.more_information_url) backupLinks[app.id] = app.more_information_url;
    });

    const backupPath = path.join(process.cwd(), "src/lib/secure_links_backup.json");
    let mergedBackup = backupLinks;
    if (fs.existsSync(backupPath)) {
      try {
        const existing = JSON.parse(fs.readFileSync(backupPath, "utf8"));
        mergedBackup = { ...existing, ...backupLinks };
      } catch {}
    }
    fs.writeFileSync(backupPath, JSON.stringify(mergedBackup, null, 2), "utf8");

    res.json({ success: true, message: "Backup successfully stored locally." });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to store backup: " + err.message });
  }
});

router.get("/v1/admin/backup-links-get", verifyAdminToken, (req, res) => {
  try {
    const backupPath = path.join(process.cwd(), "src/lib/secure_links_backup.json");
    if (fs.existsSync(backupPath)) {
      const backupData = JSON.parse(fs.readFileSync(backupPath, "utf8"));
      const AES_SECRET = process.env.AES_SECRET as string;
      const decryptedItems = Object.entries(backupData).map(([appId, encUrl]) => {
        let decryptedUrl = "";
        if (typeof encUrl === "string") {
          decryptedUrl = encUrl.startsWith("U2FsdGVkX1")
            ? safeDecrypt(encUrl, AES_SECRET)
            : encUrl;
        }
        return { id: appId, url: decryptedUrl };
      });
      res.json({ items: decryptedItems });
      return;
    }
    res.json({ items: [] });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to read backup links: " + err.message });
  }
});

export default router;
