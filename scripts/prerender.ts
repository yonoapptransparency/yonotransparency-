// prerender.ts
import fs from 'fs';
import path from 'path';
import { injectSeoTags } from '../src/seoHelper';
import { fetchStoreData } from '../src/seoHelper';

async function prerender() {
  console.log('Static Prerendering started...');
  const distPath = path.resolve(process.cwd(), 'dist');
  const indexHtmlPath = path.join(distPath, 'index.html');
  
  if (!fs.existsSync(indexHtmlPath)) {
    console.warn('dist/index.html not found, skipping prerender.');
    return;
  }
  
  try {
    const originalTemplate = fs.readFileSync(indexHtmlPath, 'utf-8');
    const data = await fetchStoreData() || { apps: [], news: [], blogs: [], videos: [], settings: {} };
    
    // Helper to generate a file for a specific path
    const generateRoute = async (routePath: string) => {
      console.log(`Prerendering route: ${routePath}`);
      // Don't remove og:url for specific routes since we want the exact share URL
      let template = await injectSeoTags(originalTemplate, routePath, 'https://rummyapp.online');
      
      const targetDir = path.join(distPath, routePath.startsWith('/') ? routePath.substring(1) : routePath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      fs.writeFileSync(path.join(targetDir, 'index.html'), template, 'utf-8');
    };

    // 1. Generate Home Route
    let homeTemplate = await injectSeoTags(originalTemplate, '/', 'https://rummyapp.online');
    homeTemplate = homeTemplate.replace(/<meta property=["']og:url["'] [^>]*\/>/gi, '');
    fs.writeFileSync(indexHtmlPath, homeTemplate, 'utf-8');

    // 2. Generate Application Routes
    for (const app of data.apps || []) {
      if (app.slug) {
        await generateRoute(`/app/${app.slug}`);
        await generateRoute(`/gateway/${app.slug}`);
        await generateRoute(`/info/${app.slug}`);
      }
    }

    // 3. Generate News Routes
    for (const newsItem of data.news || []) {
      if (newsItem.slug) {
        await generateRoute(`/news/${newsItem.slug}`);
      }
    }

    // 4. Generate Blog Routes
    for (const blog of data.blogs || []) {
      if (blog.slug) {
        await generateRoute(`/blog/${blog.slug}`);
      }
    }
    
    // 5. Generate Other Static Routes
    await generateRoute('/news');
    await generateRoute('/blog');
    await generateRoute('/contact');
    await generateRoute('/submit-app');

    console.log('Successfully injected static HTML and metadata into dist routes for Firebase Hosting.');
  } catch (err) {
    console.error('Error during prerender:', err);
  }
}

prerender();
