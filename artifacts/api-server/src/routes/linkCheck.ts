import { Router } from "express";
import { getRawFirebaseConfig } from "../lib/firebaseHelper.js";
import { safeDecrypt } from "../lib/cryptoHelper.js";

const router = Router();

router.get("/v1/link-check", async (req, res) => {
  const appId = req.query.id as string;
  if (!appId) return res.status(400).json({ configured: false });
  res.set("Cache-Control", "no-store");

  try {
    let config: any;
    try { config = getRawFirebaseConfig(); } catch { return res.json({ configured: false }); }

    const db = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents`;
    const apiSuffix = config.apiKey ? `?key=${config.apiKey}` : "";
    const AES_SECRET = process.env.AES_SECRET as string;
    const hasAesSecret = !!(AES_SECRET && AES_SECRET.trim());

    // Only check the encrypted vault if AES_SECRET is available —
    // without it we can't decrypt and would never find a match anyway.
    if (hasAesSecret) {
      for (const docName of ["sec_public_links", "secure_links", "sec_vault"]) {
        try {
          const r = await fetch(`${db}/store_data/${docName}${apiSuffix}`);
          const d = await r.json() as any;
          if (d.error) continue;
          if (d.fields?.encryptedData?.stringValue) {
            try {
              const dec = safeDecrypt(d.fields.encryptedData.stringValue, AES_SECRET);
              if (dec) {
                const arr = JSON.parse(dec);
                if (arr.find((v: any) => v.id === appId && v.url)) return res.json({ configured: true });
              }
            } catch {}
          }
          if (d.fields?.items?.arrayValue?.values) {
            const found = d.fields.items.arrayValue.values.find(
              (v: any) => v.mapValue?.fields?.id?.stringValue === appId && v.mapValue?.fields?.url?.stringValue
            );
            if (found) return res.json({ configured: true });
          }
        } catch {}
      }
    }

    // Fall back to app chunks — check for plaintext URL or link_configured flag.
    // link_configured is set by the frontend when saving and acts as a public indicator
    // that a URL exists in the vault (even though the URL itself is not stored in the chunk).
    // We only trust link_configured as "configured" when AES_SECRET is set, because without
    // it the payload route cannot decrypt and redirect — showing the button would be misleading.
    try {
      const metaR = await fetch(`${db}/store_data/apps_meta${apiSuffix}`);
      const metaD = await metaR.json() as any;
      const numChunks =
        !metaD.error && metaD.fields?.numChunks?.integerValue
          ? parseInt(metaD.fields.numChunks.integerValue, 10)
          : 2;
      for (let i = 0; i < numChunks; i++) {
        const chunkR = await fetch(`${db}/store_data/apps_chunk_${i}${apiSuffix}`);
        const chunkD = await chunkR.json() as any;
        if (!chunkD.error && chunkD.fields?.items?.arrayValue?.values) {
          const item = chunkD.fields.items.arrayValue.values.find(
            (v: any) => v.mapValue?.fields?.id?.stringValue === appId
          );
          if (item?.mapValue?.fields) {
            const plainUrl =
              item.mapValue.fields.more_information_url?.stringValue ||
              item.mapValue.fields.download_url?.stringValue;
            // A plaintext URL in the chunk always works regardless of AES_SECRET
            if (plainUrl) return res.json({ configured: true });
            // link_configured is a safe public indicator set by the admin — trust it
            // unconditionally. It contains no URL data. Whether the redirect succeeds
            // depends on AES_SECRET being set at payload time, not at check time.
            if (item.mapValue.fields.link_configured?.booleanValue === true) {
              return res.json({ configured: true });
            }
          }
        }
      }
    } catch {}

    return res.json({ configured: false });
  } catch (err) {
    console.warn("[link-check] Error:", err);
    return res.json({ configured: false });
  }
});

export default router;
