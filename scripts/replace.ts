import fs from "fs";

let content = fs.readFileSync("api/index.ts", "utf8");
content = content.replace(/const AES_SECRET = process\.env\.AES_SECRET as string;/g, "const AES_SECRET = process.env.AES_SECRET || AES_SECRET_GLOBAL;");
fs.writeFileSync("api/index.ts", content);

let serverContent = fs.readFileSync("server.ts", "utf8");
serverContent = serverContent.replace(/const AES_SECRET = process\.env\.AES_SECRET as string;/g, "const AES_SECRET = process.env.AES_SECRET || AES_SECRET_GLOBAL;");
// Also insert the AES_SECRET_GLOBAL definition into server.ts
serverContent = serverContent.replace(
  "const AES_SECRET = process.env.AES_SECRET || '';",
  "const getFallbackSecret = (name: string) => process.env[name] ? process.env[name]! : `fallback-${name.toLowerCase().replace('_secret', '')}-for-vercel`;\nconst AES_SECRET_GLOBAL = getFallbackSecret('AES_SECRET');\nconst AES_SECRET = process.env.AES_SECRET || AES_SECRET_GLOBAL;"
);

// We should also replace the crashing block in server.ts
serverContent = serverContent.replace(
  "if (!process.env.AES_SECRET) {\n    console.error('FATAL: AES_SECRET is not set. Download links cannot be decrypted. Set it in your environment and restart.');\n    process.exit(1);\n  }",
  "if (!process.env.AES_SECRET) {\n    console.warn('WARNING: AES_SECRET is not set. Download links cannot be decrypted securely. Using a fallback secret.');\n  }"
);
serverContent = serverContent.replace(
  "if (!process.env.TOKEN_SECRET) {\n    console.error('FATAL: TOKEN_SECRET is not set. Tokens are not secure. Set it and restart.');\n    process.exit(1);\n  }",
  "if (!process.env.TOKEN_SECRET) {\n    console.warn('WARNING: TOKEN_SECRET is not set. Tokens are not secure. Using fallback secret.');\n  }"
);

fs.writeFileSync("server.ts", serverContent);

console.log("Replaced!");
