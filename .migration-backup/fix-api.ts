const fs = require("fs");
let c = fs.readFileSync("api/index.ts", "utf8");

// Fallbacks
c = c.replace(/const fallbackKey = \["fallback", "secure", "store", "key", "19482"\]\.join\("-"\);\s*if \(primarySecret && primarySecret\.trim\(\) !== ""\) {/g, "if (primarySecret && primarySecret.trim() !== \"\") {");
c = c.replace(/try {\n\s*const bytes = CryptoJS\.AES\.decrypt\(ciphertext, fallbackKey\);\n\s*const text = bytes\.toString\(CryptoJS\.enc\.Utf8\);\n\s*if \(text\) return text;\n\s*} catch\(e\) {}\n\s*return '';/g, "return '';");
c = c.replace(/const fallbackKey = \["fallback", "secure", "store", "key", "19482"\]\.join\("-"\);\s*const AES_SECRET = process\.env\.AES_SECRET \|\| fallbackKey;/g, "const AES_SECRET = process.env.AES_SECRET as string;");
c = c.replace(/const AES_SECRET = process\.env\.AES_SECRET \|\| fallbackKey;/g, "const AES_SECRET = process.env.AES_SECRET as string;");

// AES_SECRET abort
c = c.replace(/const TOKEN_SECRET = process\.env\.TOKEN_SECRET \|\| crypto\.randomBytes\(32\)\.toString\('hex'\);/, "const TOKEN_SECRET = process.env.TOKEN_SECRET || crypto.randomBytes(32).toString('hex');\n\nif (!process.env.AES_SECRET) {\n  console.error(\"FATAL: AES_SECRET environment variable is not set. Server will not start.\");\n  process.exit(1);\n}");

// CORS
c = c.replace(/res\.setHeader\("Access-Control-Allow-Origin", "\*"\);/, "const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || \"https://yourdomain.com\";\n  res.setHeader(\"Access-Control-Allow-Origin\", ALLOWED_ORIGIN);\n  res.setHeader(\"Vary\", \"Origin\");");

// Expiry
c = c.replace(/const EXPIRY = 600;/g, "const EXPIRY = 120;");

// obfuscatedUrl
c = c.replace(/const obfuscatedUrl = req\.query\.url as string;\n\s*const appId = req\.query\.id as string;/, "const appId = req.query.id as string;");

c = c.replace(/let targetUrl = '';\n\s*if \(obfuscatedUrl\) {\n\s*try {\n\s*targetUrl = Buffer\.from\(obfuscatedUrl, "base64"\)\.toString\("utf-8"\);\n\s*} catch\(e\) {\n\s*targetUrl = '';\n\s*}\n\s*}/g, "let targetUrl = '';");
c = c.replace(/let targetUrl = '';\n\s*if \(obfuscatedUrl\) {\n\s*try {\n\s*targetUrl = Buffer\.from\(obfuscatedUrl, "base64"\)\.toString\("utf-8"\);\n\s*} catch {\n\s*targetUrl = '';\n\s*}\n\s*}/g, "let targetUrl = '';");


// secure-fetch
c = c.replace(/app\.get\(\["\/api\/v1\/secure-fetch", "\/api\/v1\/fetch-file"\], \(req, res\) => {[\s\S]*?^}\);/m, "");

fs.writeFileSync("api/index.ts", c);
