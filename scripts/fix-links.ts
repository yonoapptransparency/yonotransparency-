import fs from "fs";
import path from "path";

function modifyFile(filePath: string) {
  let content = fs.readFileSync(filePath, "utf8");

  // 1. Add new admin endpoints before 'app.all("/api/*", ...)' or at the end of API routes
  const adminEndpoints = `
  // Admin API: Direct links save (no AES required)
  app.post("/api/v1/admin/save-links-direct", verifyAdminToken, (req, res) => {
    try {
      const { items } = req.body;
      if (!items || !Array.isArray(items)) return res.status(400).json({ error: 'Valid items array required' });
      
      const backupLinks: Record<string, string> = {};
      items.forEach((item: any) => {
        if (item.id && (item.url || item.more_information_url)) backupLinks[item.id] = item.url || item.more_information_url;
      });
      
      const backupPath = require('path').join(process.cwd(), 'src/lib/secure_links_backup.json');
      let mergedBackup = backupLinks;
      if (require('fs').existsSync(backupPath)) {
        try {
          const existingBackup = JSON.parse(require('fs').readFileSync(backupPath, 'utf8'));
          mergedBackup = { ...existingBackup, ...backupLinks };
        } catch(e) {}
      }
      require('fs').writeFileSync(backupPath, JSON.stringify(mergedBackup, null, 2), 'utf8');
      
      res.json({ success: true, message: "Links saved directly to backup JSON." });
    } catch(err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin API: Pull Links from GitHub
  app.post("/api/v1/admin/pull-links-from-github", verifyAdminToken, async (req, res) => {
    try {
      const config = getRawFirebaseConfig();
      if (!config) return res.status(500).json({ error: "Missing config" });
      const r = await fetch(\`https://firestore.googleapis.com/v1/projects/\${config.projectId}/databases/\${config.firestoreDatabaseId}/documents/sec_git/cfg\${config.apiKey ? '?key=' + config.apiKey : ''}\`);
      const repoData = await r.json();
      
      const gOwner = repoData.fields?.owner?.stringValue;
      const gRepo = repoData.fields?.repo?.stringValue;
      const gToken = repoData.fields?.token?.stringValue;
      
      if (!gOwner || !gRepo || !gToken) {
          return res.status(400).json({ error: "GitHub not fully configured" });
      }
      
      const ghRes = await fetch(\`https://api.github.com/repos/\${gOwner}/\${gRepo}/contents/src/lib/staticDataFull.json\`, {
          headers: {
              'Authorization': \`Bearer \${gToken}\`,
              'Accept': 'application/vnd.github.v3+json'
          }
      });
      
      if (ghRes.ok) {
          const fileData = await ghRes.json();
          const decoded = Buffer.from(fileData.content, 'base64').toString('utf8');
          const parsed = JSON.parse(decoded);
          const backupLinks: Record<string, string> = {};
          if (parsed.apps) {
              parsed.apps.forEach((a: any) => {
                  if (a.more_information_url) backupLinks[a.id] = a.more_information_url;
              });
          }
          
          const backupPath = require('path').join(process.cwd(), 'src/lib/secure_links_backup.json');
          require('fs').writeFileSync(backupPath, JSON.stringify(backupLinks, null, 2), 'utf8');
          return res.json({ success: true, message: "Pulled links from GitHub!" });
      }
      return res.status(400).json({ error: "Failed to fetch from GitHub." });
    } catch(err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/v1/admin/config-status", verifyAdminToken, (req, res) => {
    const hasAes = !!process.env.AES_SECRET;
    const hasSecLinks = !!process.env.SECURE_LINKS;
    const hasAdminEmail = !!process.env.ADMIN_EMAIL;
    res.json({ hasAes, hasSecLinks, hasAdminEmail });
  });
`;

  if (!content.includes('/api/v1/admin/save-links-direct')) {
    content = content.replace('app.get("/api/v1/debug-index",', adminEndpoints + '\napp.get("/api/v1/debug-index",');
  }

  // Rewrite link-check
  const linkCheckRegex = /app\.get\("\/api\/v1\/link-check"[\s\S]*?\/\/ Rate limiting map for public chat/m;
  const newLinkCheck = `app.get("/api/v1/link-check", async (req, res) => {
  const appId = req.query.id as string;
  if (!appId) return res.status(400).json({ configured: false });
  res.set("Cache-Control", "no-store");

  // Lookup 1: Env Var
  try {
    if (process.env.SECURE_LINKS) {
      const parsed = JSON.parse(process.env.SECURE_LINKS);
      if (parsed[appId]) return res.json({ configured: true });
    }
  } catch(e) {}

  // Lookup 2: Backup JSON
  try {
    const backupPath = require('path').join(process.cwd(), 'src/lib/secure_links_backup.json');
    if (require('fs').existsSync(backupPath)) {
      const backup = JSON.parse(require('fs').readFileSync(backupPath, 'utf8'));
      if (backup[appId]) return res.json({ configured: true });
    }
  } catch (e) {}

  // Lookup 3: Firestore in parallel
  try {
    const config = getRawFirebaseConfig();
    if (!config) return res.json({ configured: false });
    const db = \`https://firestore.googleapis.com/v1/projects/\${config.projectId}/databases/\${config.firestoreDatabaseId}/documents\`;
    const apiSuffix = config.apiKey ? \`?key=\${config.apiKey}\` : '';
    // @ts-ignore
    const AES_SECRET = process.env.AES_SECRET || (typeof AES_SECRET_GLOBAL !== 'undefined' ? AES_SECRET_GLOBAL : '');

    const paths = ['sec_public_links', 'secure_links', 'sec_vault'];
    const promises = paths.map(p => fetch(\`\${db}/store_data/\${p}\${apiSuffix}\`).then(r => r.json()));
    const results = await Promise.allSettled(promises);

    for (const res of results) {
      if (res.status === 'fulfilled' && !res.value.error) {
        const d = res.value;
        if (d.fields?.encryptedData?.stringValue) {
          try {
            const dec = safeDecrypt(d.fields.encryptedData.stringValue, AES_SECRET);
            if (dec) {
              const arr = JSON.parse(dec);
              if (arr.find((v: any) => v.id === appId && v.url)) return res.json({ configured: true });
            }
          } catch(e) {}
        }
        if (d.fields?.items?.arrayValue?.values) {
          const found = d.fields.items.arrayValue.values.find((v: any) => v.mapValue?.fields?.id?.stringValue === appId && v.mapValue?.fields?.url?.stringValue);
          if (found) return res.json({ configured: true });
        }
      }
    }
  } catch(e) {}

  return res.json({ configured: false });
});

// Rate limiting map for public chat`;
  content = content.replace(linkCheckRegex, newLinkCheck);
  
  // Rewrite secure-payload targetUrl extractor
  const securePayloadRegex = /let targetUrl = '';[\s\S]*?if \(!targetUrl && appId\) {([\s\S]*?)}[\s\S]*?if \(!targetUrl \|\|/m;
  const newSecurePayloadTarget = `let targetUrl = '';

  if (!targetUrl && appId) {
    // 1. Env Var
    try {
      if (process.env.SECURE_LINKS) {
        const parsed = JSON.parse(process.env.SECURE_LINKS);
        if (parsed[appId]) targetUrl = parsed[appId];
      }
    } catch(e) {}

    // 2. Backup JSON
    if (!targetUrl) {
      try {
        const backupPath = require('path').join(process.cwd(), 'src/lib/secure_links_backup.json');
        if (require('fs').existsSync(backupPath)) {
          const backup = JSON.parse(require('fs').readFileSync(backupPath, 'utf8'));
          if (backup[appId]) targetUrl = backup[appId];
        }
      } catch (e) {}
    }

    // 3. StaticDataFull JSON (from GitHub pull/write)
    if (!targetUrl) {
      try {
        const backupPath = require('path').join(process.cwd(), 'src/lib/staticDataFull.json');
        if (require('fs').existsSync(backupPath)) {
          const backup = JSON.parse(require('fs').readFileSync(backupPath, 'utf8'));
          if (backup.apps) {
              const bApp = backup.apps.find((a: any) => a.id === appId);
              if (bApp && bApp.more_information_url) targetUrl = bApp.more_information_url;
          }
        }
      } catch (e) {}
    }

    // 4. Firestore
    if (!targetUrl) {
      try {
        // @ts-ignore
        const AES_SECRET = process.env.AES_SECRET || (typeof AES_SECRET_GLOBAL !== 'undefined' ? AES_SECRET_GLOBAL : '');
        const config = getRawFirebaseConfig();
        if (config) {
          const db = \`https://firestore.googleapis.com/v1/projects/\${config.projectId}/databases/\${config.firestoreDatabaseId}/documents\`;
          const apiSuffix = config.apiKey ? \`?key=\${config.apiKey}\` : '';
          
          const paths = ['sec_public_links', 'secure_links', 'sec_vault'];
          const promises = paths.map(p => fetch(\`\${db}/store_data/\${p}\${apiSuffix}\`).then(r => r.json()));
          const results = await Promise.allSettled(promises);
          
          for (const res of results) {
            if (res.status === 'fulfilled' && !res.value.error && !targetUrl) {
              const d = res.value;
              if (d.fields?.encryptedData?.stringValue) {
                try {
                  const dec = safeDecrypt(d.fields.encryptedData.stringValue, AES_SECRET);
                  if (dec) {
                    const arr = JSON.parse(dec);
                    const linkObj = arr.find((v: any) => v.id === appId && v.url);
                    if (linkObj) targetUrl = linkObj.url;
                  }
                } catch(e) {}
              }
              if (!targetUrl && d.fields?.items?.arrayValue?.values) {
                const linkObj = d.fields.items.arrayValue.values.find((v: any) => v.mapValue?.fields?.id?.stringValue === appId);
                if (linkObj && linkObj.mapValue?.fields?.url?.stringValue) {
                  targetUrl = linkObj.mapValue.fields.url.stringValue;
                }
              }
            }
          }
        }
      } catch(e) {}
    }
  }

  // decrypt if needed
  if (targetUrl && targetUrl.startsWith('U2FsdGVkX1')) {
    try {
      // @ts-ignore
      const AES_SECRET = process.env.AES_SECRET || (typeof AES_SECRET_GLOBAL !== 'undefined' ? AES_SECRET_GLOBAL : '');
      const dec = safeDecrypt(targetUrl, AES_SECRET);
      if (dec) targetUrl = dec;
    } catch(e) {}
  }

  if (!targetUrl ||`;
  content = content.replace(securePayloadRegex, newSecurePayloadTarget);

  fs.writeFileSync(filePath, content, "utf8");
}

modifyFile("api/index.ts");
modifyFile("server.ts");

console.log("Done");
