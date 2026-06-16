import { Router } from "express";
import fs from "fs";
import path from "path";

const router = Router();

router.get("/v1/image", async (req, res): Promise<void> => {
  const url = req.query.url as string;
  if (!url) { res.status(400).send("Missing image URL"); return; }
  try {
    let targetUrl = url;
    if (!url.startsWith("http")) {
      try { targetUrl = Buffer.from(url, "base64").toString("utf-8"); } catch {}
    }
    const response = await fetch(targetUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
    });
    if (!response.ok) throw new Error("Failed to fetch image");
    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/jpeg";
    res.set("Content-Type", contentType);
    res.set("Cache-Control", "public, max-age=86400");
    res.send(Buffer.from(buffer));
  } catch {
    res.status(500).send("Image proxy error");
  }
});

router.get("/v1/download/:id", (req, res): void => {
  const appId = req.params.id;
  if (!appId) { res.status(400).send("Bad Request"); return; }
  res.redirect(302, `/gateway/${appId}`);
});

router.get("/v1/public/backup-data", (req, res): void => {
  try {
    const fullBackupPath = path.join(process.cwd(), "src/lib/staticDataFull.json");
    if (fs.existsSync(fullBackupPath)) {
      const raw = fs.readFileSync(fullBackupPath, "utf8");
      const data = JSON.parse(raw);
      if (data && Array.isArray(data.apps)) {
        data.apps = data.apps.map((app: any) => {
          const clean = { ...app };
          delete clean.more_information_url;
          delete clean.encrypted_download_url;
          delete clean.download_url;
          return clean;
        });
      }
      res.json(data);
      return;
    }
    res.json({ apps: [], settings: {}, news: [], blogs: [], videos: [] });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to retrieve local file data backup." });
  }
});

export default router;
