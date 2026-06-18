import fs from 'fs';

let content = fs.readFileSync('api/index.ts', 'utf8');

const endpoints = `
  // Admin API: Direct links save
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

if (!content.includes('/api/v1/admin/config-status')) {
  content = content.replace(/app\.all\("\/api\/\*", \(req, res\) => \{\s*res\.status\(404\)/, endpoints + '\napp.all("/api/*", (req, res) => {\n  res.status(404)');
  fs.writeFileSync('api/index.ts', content, 'utf8');
  console.log('Appended to api/index.ts');
} else {
  console.log('Already there.');
}
