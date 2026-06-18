import fs from "fs";
import path from "path";

function modifyFile(filePath: string) {
  let content = fs.readFileSync(filePath, "utf8");

  // Skip if already added
  if (content.includes('/api/v1/admin/seal-vault')) return;

  const adminEndpoints = `
  // Admin API: Seal Vault (AES encrypt target URLs for git commit)
  app.post("/api/v1/admin/seal-vault", verifyAdminToken, (req, res) => {
    try {
      const { items } = req.body;
      if (!items || !Array.isArray(items)) return res.status(400).json({ error: 'Valid items array required' });
      
      const vaultMap: Record<string, string> = {};
      items.forEach((item: any) => {
        if (item.id && (item.url || item.more_information_url)) {
            vaultMap[item.id] = item.url || item.more_information_url;
        }
      });
      
      const config = { AES_SECRET: process.env.AES_SECRET || (typeof AES_SECRET_GLOBAL !== 'undefined' ? AES_SECRET_GLOBAL : '') };
      if (!config.AES_SECRET) {
          return res.status(400).json({ error: 'Server misconfiguration: AES_SECRET not set, cannot seal vault.' });
      }

      let ciphertext = '';
      if (typeof safeEncrypt !== 'undefined') {
          ciphertext = safeEncrypt(JSON.stringify(vaultMap), config.AES_SECRET);
      } else {
        const CryptoJS = require('crypto-js');
        ciphertext = CryptoJS.AES.encrypt(JSON.stringify(vaultMap), config.AES_SECRET).toString();
      }

      res.json({ success: true, ciphertext });
    } catch(err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin API: Direct links save`;

  content = content.replace('// Admin API: Direct links save', adminEndpoints);

  // Update link-check
  content = content.replace(
      /\/\/ Lookup 2: Backup JSON([\s\S]*?)\/\/ Lookup 3: Firestore in parallel/m,
      `// Lookup 2: Git Vault & Backup JSON
  try {
    const vaultPath = require('path').join(process.cwd(), 'src/lib/secureVault.ts');
    if (require('fs').existsSync(vaultPath)) {
      const vaultContent = require('fs').readFileSync(vaultPath, 'utf8');
      const match = vaultContent.match(/export const ENCRYPTED_LINKS = "([^"]+)";/);
      if (match && match[1]) {
        // @ts-ignore
        const AES_SECRET = process.env.AES_SECRET || (typeof AES_SECRET_GLOBAL !== 'undefined' ? AES_SECRET_GLOBAL : '');
        let dec = '';
        if (typeof safeDecrypt !== 'undefined') dec = safeDecrypt(match[1], AES_SECRET);
        else {
           const CryptoJS = require('crypto-js');
           const bytes = CryptoJS.AES.decrypt(match[1], AES_SECRET);
           dec = bytes.toString(CryptoJS.enc.Utf8);
        }
        if (dec) {
           const map = JSON.parse(dec);
           if (map[appId]) return res.json({ configured: true });
        }
      }
    }
  } catch(e) {}
  
  $1// Lookup 3: Firestore in parallel`
  );

  // update targetUrl
  content = content.replace(
      /\/\/ 2\. Backup JSON([\s\S]*?)\/\/ 3\. StaticDataFull JSON \(from GitHub pull\/write\)/m,
      `// 2. Git Vault & Backup JSON
    if (!targetUrl) {
      try {
        const vaultPath = require('path').join(process.cwd(), 'src/lib/secureVault.ts');
        if (require('fs').existsSync(vaultPath)) {
          const vaultContent = require('fs').readFileSync(vaultPath, 'utf8');
          const match = vaultContent.match(/export const ENCRYPTED_LINKS = "([^"]+)";/);
          if (match && match[1]) {
            // @ts-ignore
            const AES_SECRET = process.env.AES_SECRET || (typeof AES_SECRET_GLOBAL !== 'undefined' ? AES_SECRET_GLOBAL : '');
            let dec = '';
            if (typeof safeDecrypt !== 'undefined') dec = safeDecrypt(match[1], AES_SECRET);
            else {
               const CryptoJS = require('crypto-js');
               const bytes = CryptoJS.AES.decrypt(match[1], AES_SECRET);
               dec = bytes.toString(CryptoJS.enc.Utf8);
            }
            if (dec) {
               const map = JSON.parse(dec);
               if (map[appId]) targetUrl = map[appId];
            }
          }
        }
      } catch(e) {}
    }
$1// 3. StaticDataFull JSON (from GitHub pull/write)`
  );

  fs.writeFileSync(filePath, content, "utf8");
}

modifyFile("api/index.ts");
modifyFile("server.ts");

console.log("Done");
