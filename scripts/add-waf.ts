import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');
if (!content.includes('Basic WAF / Scanner Mitigation')) {
    content = content.replace(
        "app.get('*', async (req, res) => {",
        `app.get('*', async (req, res) => {\n      // Basic WAF / Scanner Mitigation for SPA fallback\n      if (req.originalUrl.match(/\\.(php|env|yml|yaml|ini|conf|log|sql|tar|gz|zip|bak|git|rsa)$/i) || req.originalUrl.includes('/etc/') || req.originalUrl.includes('/proc/') || req.originalUrl.includes('../') || req.originalUrl.includes('/.aws/')) {\n        return res.status(404).type('text/plain').send('Not found');\n      }`
    );
    fs.writeFileSync('server.ts', content);
    console.log('WAF mitigation added for SPA fallback.');
} else {
    console.log('WAF already exists.');
}
