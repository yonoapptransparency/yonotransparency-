import * as fs from 'fs';

for (const file of ['server.ts', 'api/index.ts']) {
    let text = fs.readFileSync(file, 'utf8');
    text = text.replace(/AES_SECRET \|\| ""/g, 'AES_SECRET');
    
    if (file === 'server.ts') {
        if (!text.includes('if (!process.env.AES_SECRET) {')) {
            text = text.replace('async function startServer() {\n', 'async function startServer() {\n  if (!process.env.AES_SECRET) {\n    console.error(\'FATAL: AES_SECRET is not set. Download links cannot be decrypted. Set it in your environment and restart.\');\n    process.exit(1);\n  }\n');
        }
    }
    if (file === 'api/index.ts') {
        if (!text.includes('if (!process.env.AES_SECRET) {')) {
            text = text.replace('const app = express();\n', 'const app = express();\nif (!process.env.AES_SECRET) {\n  console.error(\'FATAL: AES_SECRET is not set. Download links cannot be decrypted. Set it in your environment and restart.\');\n  process.exit(1);\n}\n');
        }
    }

    // Google search fallback fix for server.ts
    if (file === 'server.ts') {
        text = text.replace('targetUrl = `https://google.com/search?q=${encodeURIComponent(appId)}`;', 'console.error("CRITICAL: Failed to retrieve or decrypt URL for app:", appId);\n          return res.status(404).json({ error: "Download link not found or not yet configured for this app." });');
        
        // Affiliate code fix
        text = text.replace(
            `targetUrlObj.searchParams.set('code', 'AFFILIATE_SECURE_123');\n            targetUrl = targetUrlObj.toString();`,
            `const affiliateCode = process.env.AFFILIATE_CODE;\n            if (affiliateCode) {\n              targetUrlObj.searchParams.set('code', affiliateCode);\n              targetUrl = targetUrlObj.toString();\n            }`
        );
    }
    
    // Check if the affiliate code fix worked, it might have slightly different whitespace
    // Google search fallback fix for api/index.ts
    if (file === 'api/index.ts') {
        text = text.replace('targetUrl = `https://google.com/search?q=${encodeURIComponent(appId)}`;', 'console.error("CRITICAL: Failed to retrieve or decrypt URL for app:", appId);\n      return res.status(404).json({ error: "Download link not found or not yet configured for this app." });');
        
        text = text.replace(
            `targetUrlObj.searchParams.set('code', 'AFFILIATE_SECURE_123');\n        targetUrl = targetUrlObj.toString();`,
            `const affiliateCode = process.env.AFFILIATE_CODE;\n        if (affiliateCode) {\n          targetUrlObj.searchParams.set('code', affiliateCode);\n          targetUrl = targetUrlObj.toString();\n        }`
        );
    }

    fs.writeFileSync(file, text);
}
