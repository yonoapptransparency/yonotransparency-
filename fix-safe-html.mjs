import fs from 'fs';
import path from 'path';

const files = [
  'src/pages/GatewayPage.tsx',
  'src/pages/AppDetails.tsx',
  'src/pages/NewsDetailPage.tsx'
];

function ensureSafeHtml() {
  const safeHtmlCode = `export function safeHtml(val: any, fallback: string = ''): string {
  if (!val) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'object' && 'stringValue' in val) return val.stringValue || fallback;
  return String(val);
}
`;
  fs.writeFileSync('src/lib/safeHtml.ts', safeHtmlCode, 'utf8');
}

function processFiles() {
  for (const file of files) {
    const filePath = path.join(process.cwd(), file);
    if (!fs.existsSync(filePath)) continue;
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Add import
    if (!content.includes("import { safeHtml } from '../lib/safeHtml'")) {
      content = content.replace("import { Link", "import { safeHtml } from '../lib/safeHtml';\nimport { Link");
    }
    
    // Remove DOMPurify import
    content = content.replace(/import DOMPurify.*?;\n/, '');
    
    // Replace DOMPurify.sanitize(String(app.features_html || '')) with safeHtml(app.features_html, '')
    // This is a bit tricky with regex, so let's do exactly what we see:
    
    content = content.replace(/DOMPurify\.sanitize\(String\((.*?)\s*\|\|\s*'(.*?)'\)\)/g, "safeHtml($1, '$2')");
    content = content.replace(/DOMPurify\.sanitize\(String\((.*?)\)\)/g, "safeHtml($1)");
    
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

ensureSafeHtml();
processFiles();
console.log("Done");
