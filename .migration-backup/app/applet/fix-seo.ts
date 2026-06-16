import fs from 'fs';
import path from 'path';

function replaceFile(filePath: string, regex: RegExp, replacement: string) {
  const fullPath = path.resolve(filePath);
  if (!fs.existsSync(fullPath)) return;
  const content = fs.readFileSync(fullPath, 'utf8');
  const newContent = content.replace(regex, replacement);
  fs.writeFileSync(fullPath, newContent, 'utf8');
}

// 1. AppDetails.tsx
replaceFile('src/pages/AppDetails.tsx', 
  /const defaultDesc = .*\n\s*const desc = app\.seo_description \|\| defaultDesc;\n\s*const title = app\.seo_title \|\| `\$\{app\.name\} - Technical Specifications & Security Clearance`;/,
  `const title = \`\${app.name} - Technical Specifications & Security Clearance\`;\n  const desc = app.description_html ? app.description_html.replace(/<[^>]*>?/gm, '').substring(0, 160) : \`\${app.name} secure installation and specifications\`;`);

replaceFile('src/pages/AppDetails.tsx', 
  /"description": app\.seo_description \|\| `\$\{app\.name\} secure installation and specifications`,/,
  `"description": desc,`);

replaceFile('src/pages/AppDetails.tsx',
  /dangerouslySetInnerHTML=\{\{ __html: app\.description_html \|\| `<p>\$\{app\.seo_description \|\| 'No detailed description available yet\.'\}<\/p>` \}\}/,
  `dangerouslySetInnerHTML={{ __html: app.description_html || '<p>No detailed description available yet.</p>' }}`);

// 2. GatewayPage.tsx
replaceFile('src/pages/GatewayPage.tsx',
  /const title = app\.seo_title \|\| `\$\{app\.name\} - Secure Gateway`;\n\s*const desc = app\.seo_description \|\| `Authorized secure download mirror for \$\{app\.name\}\.`;/,
  `const title = \`\${app.name} - Secure Gateway\`;\n  const desc = \`Authorized secure download mirror for \${app.name}.\`;`);

// 3. NewsDetailPage.tsx
replaceFile('src/pages/NewsDetailPage.tsx',
  /<title>\{newsItem\.seo_title \|\| newsItem\.title\} - \{mockSettings\.site_title\}<\/title>\n\s*<meta name="description" content=\{newsItem\.seo_description \|\| newsItem\.description\} \/>/,
  `<title>{newsItem.title} - {mockSettings.site_title}</title>\n        <meta name="description" content={newsItem.description} />`);
replaceFile('src/pages/NewsDetailPage.tsx',
  /<meta property="og:title" content=\{newsItem\.seo_title \|\| newsItem\.title\} \/>\n\s*<meta property="og:description" content=\{newsItem\.seo_description \|\| newsItem\.description\} \/>/,
  `<meta property="og:title" content={newsItem.title} />\n        <meta property="og:description" content={newsItem.description} />`);
replaceFile('src/pages/NewsDetailPage.tsx',
  /<meta name="twitter:title" content=\{newsItem\.seo_title \|\| newsItem\.title\} \/>\n\s*<meta name="twitter:description" content=\{newsItem\.seo_description \|\| newsItem\.description\} \/>/,
  `<meta name="twitter:title" content={newsItem.title} />\n        <meta name="twitter:description" content={newsItem.description} />`);
replaceFile('src/pages/NewsDetailPage.tsx',
  /"headline": newsItem\.seo_title \|\| newsItem\.title,\n\s*"description": newsItem\.seo_description \|\| newsItem\.description,/,
  `"headline": newsItem.title,\n    "description": newsItem.description,`);

// 4. VideoDetailPage.tsx
replaceFile('src/pages/VideoDetailPage.tsx',
  /<title>\{video\.seo_title \|\| video\.title\} - \{mockSettings\.site_title\}<\/title>\n\s*<meta name="description" content=\{video\.seo_description \|\| video\.description\} \/>/,
  `<title>{video.title} - {mockSettings.site_title}</title>\n        <meta name="description" content={video.description} />`);
replaceFile('src/pages/VideoDetailPage.tsx',
  /<meta property="og:title" content=\{video\.seo_title \|\| video\.title\} \/>\n\s*<meta property="og:description" content=\{video\.seo_description \|\| video\.description\} \/>/,
  `<meta property="og:title" content={video.title} />\n        <meta property="og:description" content={video.description} />`);
replaceFile('src/pages/VideoDetailPage.tsx',
  /<meta name="twitter:title" content=\{video\.seo_title \|\| video\.title\} \/>\n\s*<meta name="twitter:description" content=\{video\.seo_description \|\| video\.description\} \/>/,
  `<meta name="twitter:title" content={video.title} />\n        <meta name="twitter:description" content={video.description} />`);

// 5. BlogDetailPage.tsx
replaceFile('src/pages/BlogDetailPage.tsx',
  /<title>\{blog\.seo_title \|\| blog\.title\} - \{mockSettings\.site_title\}<\/title>\n\s*<meta name="description" content=\{blog\.seo_description \|\| blog\.description\} \/>/,
  `<title>{blog.title} - {mockSettings.site_title}</title>\n        <meta name="description" content={blog.description} />`);
replaceFile('src/pages/BlogDetailPage.tsx',
  /<meta property="og:title" content=\{blog\.seo_title \|\| blog\.title\} \/>\n\s*<meta property="og:description" content=\{blog\.seo_description \|\| blog\.description\} \/>/,
  `<meta property="og:title" content={blog.title} />\n        <meta property="og:description" content={blog.description} />`);
replaceFile('src/pages/BlogDetailPage.tsx',
  /<meta name="twitter:title" content=\{blog\.seo_title \|\| blog\.title\} \/>\n\s*<meta name="twitter:description" content=\{blog\.seo_description \|\| blog\.description\} \/>/,
  `<meta name="twitter:title" content={blog.title} />\n        <meta name="twitter:description" content={blog.description} />`);

// 6. AdminDashboard.tsx Delete Blocks
const adminFile = 'src/pages/AdminDashboard.tsx';
if (fs.existsSync(adminFile)) {
  let content = fs.readFileSync(adminFile, 'utf8');
  
  // Remove SEO News Block
  content = content.replace(/<div>\s*<label[^>]*>\s*SEO Optimized Title<\/label>\s*<input[^>]*value=\{item\.seo_title\}[^>]*>\s*<\/div>/g, '');
  content = content.replace(/<div>\s*<label[^>]*>\s*SEO Meta Description<\/label>\s*<textarea[^>]*value=\{item\.seo_description\}[^>]*><\/textarea>\s*<\/div>/g, '');
  
  // Remove SEO Blog Block
  content = content.replace(/<div>\s*<label[^>]*>\s*SEO Title<\/label>\s*<input[^>]*value=\{blog\.seo_title(?:\s*\|\|\s*'')?\}[^>]*>\s*<\/div>/g, '');
  content = content.replace(/<div>\s*<label[^>]*>\s*SEO Description<\/label>\s*<textarea[^>]*value=\{blog\.seo_description(?:\s*\|\|\s*'')?\}[^>]*><\/textarea>\s*<\/div>/g, '');
  
  // Remove SEO Videos Block
  content = content.replace(/<div>\s*<label[^>]*>\s*SEO Optimized Header<\/label>\s*<input[^>]*value=\{item\.seo_title\}[^>]*>\s*<\/div>/g, '');
  content = content.replace(/<div>\s*<label[^>]*>\s*SEO Meta String<\/label>\s*<textarea[^>]*value=\{item\.seo_description\}[^>]*><\/textarea>\s*<\/div>/g, '');

  fs.writeFileSync(adminFile, content, 'utf8');
}
console.log("Replaced properly");
