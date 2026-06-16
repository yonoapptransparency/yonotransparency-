import { Router } from "express";
import fs from "fs";
import path from "path";
import { getRawFirebaseConfig } from "../lib/firebaseHelper.js";
import { safeDecrypt } from "../lib/cryptoHelper.js";
import { verifyToken } from "./pow.js";

const router = Router();

router.get(["/v1/secure-payload", "/v1/file-payload"], async (req, res) => {
  const cookies = (req as any).cookies || {};
  const sid = (req.query.sid || cookies.__sid) as string;
  const token = (req.query.token || req.query.t) as string;
  const appId = req.query.id as string;

  if (!token || !appId) {
    if (req.query.json === "true")
      return res.status(400).json({ error: "Verification tokens or App ID were omitted." });
    return res.status(400).send("<h1>400 Bad Request</h1><p>Verification tokens or App ID were omitted.</p>");
  }

  let isSchemeA = false;
  try {
    if (Buffer.from(token, "base64url").toString("utf8").includes("::")) isSchemeA = true;
  } catch {}

  if (isSchemeA) {
    try {
      const raw = Buffer.from(token, "base64url").toString("utf8");
      const [payload] = raw.split("::");
      const [, tSession, fingerprint] = payload.split("|");
      const finalSid = sid || tSession || "sandbox-bypass";

      if (!verifyToken(token, "", tSession, fingerprint)) {
        if (req.query.json === "true")
          return res.status(403).json({ error: "Cryptographic HMAC validation failed." });
        return res.status(403).send("<h1>403 Access Denied</h1><p>HMAC validation failed.</p>");
      }

      if (tSession !== finalSid) {
        return res.status(403).send("<h1>403 Forbidden</h1><p>Session mismatch.</p>");
      }

      let targetUrl = "";

      if (!targetUrl && appId) {
        try {
          const AES_SECRET = process.env.AES_SECRET as string;
          let config: any;
          try { config = getRawFirebaseConfig(); } catch { throw new Error("Missing Firebase configuration."); }

          for (const docName of ["sec_public_links", "secure_links", "sec_vault"]) {
            try {
              const urlResponse = await fetch(
                `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/store_data/${docName}?key=${config.apiKey}`
              );
              const secureData = await urlResponse.json() as any;
              if (!secureData.error && secureData.fields?.encryptedData?.stringValue) {
                const dec = safeDecrypt(secureData.fields.encryptedData.stringValue, AES_SECRET);
                if (dec) {
                  const arr = JSON.parse(dec);
                  const linkObj = arr.find((v: any) => v.id === appId);
                  if (linkObj?.url) {
                    targetUrl = linkObj.url.startsWith("U2FsdGVkX1")
                      ? safeDecrypt(linkObj.url, AES_SECRET)
                      : linkObj.url;
                    if (targetUrl) break;
                  }
                }
              } else if (!secureData.error && secureData.fields?.items?.arrayValue?.values) {
                const linkObj = secureData.fields.items.arrayValue.values.find(
                  (v: any) => v.mapValue.fields.id.stringValue === appId
                );
                if (linkObj?.mapValue?.fields?.url) {
                  const encUrl = linkObj.mapValue.fields.url.stringValue;
                  targetUrl = encUrl.startsWith("U2FsdGVkX1") ? safeDecrypt(encUrl, AES_SECRET) : encUrl;
                  if (targetUrl) break;
                }
              }
            } catch {}
          }

          if (!targetUrl) {
            const backupPath = path.join(process.cwd(), "src/lib/secure_links_backup.json");
            if (fs.existsSync(backupPath)) {
              const backup = JSON.parse(fs.readFileSync(backupPath, "utf8"));
              const encUrl = backup[appId];
              if (encUrl) {
                targetUrl = encUrl.startsWith("U2FsdGVkX1") ? safeDecrypt(encUrl, AES_SECRET) : encUrl;
              }
            }
          }

          if (!targetUrl) {
            const apiSuffix = config.apiKey ? `?key=${config.apiKey}` : "";
            const metaResponse = await fetch(
              `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/store_data/apps_meta${apiSuffix}`
            );
            const metaData = await metaResponse.json() as any;
            const numChunks =
              !metaData.error && metaData.fields?.numChunks?.integerValue
                ? parseInt(metaData.fields.numChunks.integerValue, 10)
                : 1;

            for (let i = 0; i < numChunks && !targetUrl; i++) {
              const chunkResponse = await fetch(
                `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/store_data/apps_chunk_${i}${apiSuffix}`
              );
              const chunkData = await chunkResponse.json() as any;
              if (!chunkData.error && chunkData.fields?.items?.arrayValue?.values) {
                const item = chunkData.fields.items.arrayValue.values.find(
                  (v: any) => v.mapValue.fields.id.stringValue === appId
                );
                if (item?.mapValue?.fields) {
                  const rawUrl =
                    item.mapValue.fields.more_information_url?.stringValue ||
                    item.mapValue.fields.download_url?.stringValue;
                  if (rawUrl) {
                    targetUrl = rawUrl.startsWith("U2FsdGVkX1") ? safeDecrypt(rawUrl, AES_SECRET) : rawUrl;
                  }
                }
              }
            }
          }
        } catch (err) {
          console.error("Firestore retrieval failed:", err);
        }
      }

      if (targetUrl && !targetUrl.startsWith("http://") && !targetUrl.startsWith("https://") && targetUrl.includes(".")) {
        targetUrl = "https://" + targetUrl;
      }

      if (!targetUrl || !targetUrl.startsWith("http")) {
        if (req.query.json === "true")
          return res.status(404).json({ error: "Destination link is currently not ready." });
        return res.redirect(302, "/");
      }

      try {
        const urlObj = new URL(targetUrl);
        if (!urlObj.searchParams.has("code")) {
          const affiliateCode = process.env.AFFILIATE_CODE;
          if (affiliateCode) { urlObj.searchParams.set("code", affiliateCode); targetUrl = urlObj.toString(); }
        }
      } catch {}

      res.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
      return res.redirect(302, targetUrl);
    } catch {
      if (req.query.json === "true")
        return res.status(403).json({ error: "Transaction error decoding verification signature." });
      return res.status(403).send("<h1>403 Forbidden</h1><p>Transaction error.</p>");
    }
  }

  if (req.query.json === "true")
    return res.status(403).json({ error: "Signature expired or invalid." });
  return res.status(403).send("<h1>403 Forbidden</h1><p>Signature expired or invalid.</p>");
});

export default router;
