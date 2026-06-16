import fs from 'fs';
let content = fs.readFileSync('src/pages/DownloadPage.tsx', 'utf-8');

content = content.replace(/text-slate-400/g, 'text-slate-600 dark:text-slate-400');
content = content.replace(/text-slate-300/g, 'text-slate-700 dark:text-slate-300');
content = content.replace(/bg-white\/5/g, 'bg-slate-100 dark:bg-white/5');
content = content.replace(/bg-white\/10/g, 'bg-slate-200 dark:bg-white/10');
content = content.replace(/border-white\/10/g, 'border-slate-300 dark:border-white/10');

// Fix accidental double replacements or bad class constructs
content = content.replace(/dark:text-slate-700 dark:text-slate-300/g, 'dark:text-slate-300');
content = content.replace(/dark:text-slate-600 dark:text-slate-400/g, 'dark:text-slate-400');
content = content.replace(/text-slate-700 text-slate-700 dark:text-slate-300/g, 'text-slate-700 dark:text-slate-300');
content = content.replace(/text-slate-600 text-slate-600 dark:text-slate-400/g, 'text-slate-600 dark:text-slate-400');

fs.writeFileSync('src/pages/DownloadPage.tsx', content);

console.log('Download Page replaced successfully');
