import fs from 'fs';
import path from 'path';

// Common secret patterns to look for
const patterns = [
  // Firebase configuration keys (often mistakenly hardcoded)
  /['"]?(firebase_api_key|apiKey)['"]?\s*:\s*['"][A-Za-z0-9_-]{39}['"]/i,
  // Hardcoded AWS keys
  /AKIA[0-9A-Z]{16}/,
  // Hardcoded Telegram bot tokens
  /[0-9]{9}:[a-zA-Z0-9_-]{35}/,
  // Hardcoded passwords or fallback secrets in logical ORs for our env
  /(?:AES_SECRET|TOKEN_SECRET|SESSION_SECRET)\s*(?:\|\||:|=)\s*['"]([^'"]+)['"]/i,
  // Generic "secret" assigned to a hardcoded string
  /const\s(?:[A-Z0-9_]*SECRET[A-Z0-9_]*)\s*=\s*['"][^'"]+['"]/i,
];

// Directories to skip
const excludeDirs = ['node_modules', 'dist', '.git', '.next'];

function scanDirectory(dir: string): boolean {
  let foundSecrets = false;
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!excludeDirs.includes(file)) {
        foundSecrets = scanDirectory(fullPath) || foundSecrets;
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.cjs')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        // Exclude this script itself
        if (fullPath.includes('check-secrets')) return;

        patterns.forEach(pattern => {
          if (pattern.test(line)) {
            console.error(`\n🚨 ALERT: Potential hardcoded secret detected!`);
            console.error(`File: ${fullPath}:${index + 1}`);
            console.error(`Line: ${line.trim()}`);
            console.error(`Advice: Move this secret to environment variables (.env).`);
            foundSecrets = true;
          }
        });
      });
    }
  }

  return foundSecrets;
}

console.log('🔍 Running pre-deployment secret scan...');
const currentDir = process.cwd();
const hasSecrets = scanDirectory(currentDir);

if (hasSecrets) {
  console.error('\n❌ BUILD RUN STOPPED: Hardcoded secrets found. Please secure them via environment variables before committing or deploying.');
  process.exit(1);
} else {
  console.log('✅ No hardcoded secrets detected. Proceeding...');
  process.exit(0);
}
