import fs from 'fs';
let content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf-8');

content = content.replace(/text-slate-400/g, 'text-slate-600 dark:text-slate-400');
content = content.replace(/text-white/g, 'text-slate-900 dark:text-white');
content = content.replace(/bg-white\/5/g, 'bg-slate-100 dark:bg-white/5');
content = content.replace(/bg-white\/10/g, 'bg-slate-200 dark:bg-white/10');
content = content.replace(/border-white\/10/g, 'border-slate-300 dark:border-white/10');
content = content.replace(/bg-slate-900/g, 'bg-white dark:bg-slate-900');
content = content.replace(/bg-slate-800/g, 'bg-slate-50 dark:bg-slate-800');
content = content.replace(/text-slate-300/g, 'text-slate-700 dark:text-slate-300');
content = content.replace(/border-white\/20/g, 'border-slate-300 dark:border-white/20');
content = content.replace(/bg-pink-500\/10/g, 'bg-pink-100 dark:bg-pink-500/10');
content = content.replace(/border-pink-500\/20/g, 'border-pink-200 dark:border-pink-500/20');

// Fix accidental double replacements or bad class constructs
content = content.replace(/dark:text-slate-900 dark:text-white/g, 'dark:text-white');
content = content.replace(/text-slate-900 text-slate-900 dark:text-white/g, 'text-slate-900 dark:text-white');
content = content.replace(/dark:text-slate-600 dark:text-slate-400/g, 'dark:text-slate-400');

fs.writeFileSync('src/pages/AdminDashboard.tsx', content);

console.log('Admin Dashboard replaced successfully');
