import { fetchStoreData, getField } from "../src/seoHelper";

export default async function handler(req: any, res: any) {
  try {
    const data = await fetchStoreData();
    if (!data) {
      throw new Error("Unable to fetch store data");
    }
    const { apps = [], news = [], blogs = [], videos = [] } = data;
    
    const baseUrl = 'https://rummyapp.online'; // Canonical production domain fallback
    const host = req.headers.host ? `https://${req.headers.host}` : baseUrl;

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    
    // Static routes
    xml += `  <url>\n    <loc>${host}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
    xml += `  <url>\n    <loc>${host}/new-apps</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    xml += `  <url>\n    <loc>${host}/news</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    xml += `  <url>\n    <loc>${host}/blogs</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    xml += `  <url>\n    <loc>${host}/videos</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    xml += `  <url>\n    <loc>${host}/about</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.5</priority>\n  </url>\n`;
    xml += `  <url>\n    <loc>${host}/contact</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.5</priority>\n  </url>\n`;
    xml += `  <url>\n    <loc>${host}/privacy</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.3</priority>\n  </url>\n`;
    xml += `  <url>\n    <loc>${host}/terms</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.3</priority>\n  </url>\n`;
    xml += `  <url>\n    <loc>${host}/responsibility</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.3</priority>\n  </url>\n`;
    
    // Dynamic App Routes
    const escapeHtmlForSitemap = (unsafe: string) => {
      return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
    };

    // 1. Apps
    for (const app of apps) {
      const slug = getField(app, 'slug');
      if (slug) {
        // Standard app detail path
        xml += `  <url>\n`;
        xml += `    <loc>${host}/app/${escapeHtmlForSitemap(slug)}</loc>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.9</priority>\n`;
        xml += `  </url>\n`;

        // Direct shortcut path
        xml += `  <url>\n`;
        xml += `    <loc>${host}/${escapeHtmlForSitemap(slug)}</loc>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.8</priority>\n`;
        xml += `  </url>\n`;
        
        // Secure gateway path
        xml += `  <url>\n`;
        xml += `    <loc>${host}/gateway/${escapeHtmlForSitemap(slug)}</loc>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.8</priority>\n`;
        xml += `  </url>\n`;
      }
    }

    // 2. News
    for (const newsItem of news) {
      const slug = getField(newsItem, 'slug');
      if (slug) {
        xml += `  <url>\n`;
        xml += `    <loc>${host}/news/${escapeHtmlForSitemap(slug)}</loc>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.7</priority>\n`;
        xml += `  </url>\n`;
      }
    }

    // 3. Blogs
    for (const blog of blogs) {
      const slug = getField(blog, 'slug');
      if (slug) {
        xml += `  <url>\n`;
        xml += `    <loc>${host}/blog/${escapeHtmlForSitemap(slug)}</loc>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.7</priority>\n`;
        xml += `  </url>\n`;
      }
    }

    // 4. Videos
    for (const video of videos) {
      const slug = getField(video, 'slug');
      if (slug) {
        xml += `  <url>\n`;
        xml += `    <loc>${host}/videos/${escapeHtmlForSitemap(slug)}</loc>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.6</priority>\n`;
        xml += `  </url>\n`;
      }
    }
    
    xml += `</urlset>`;
    
    res.setHeader('Content-Type', 'application/xml');
    res.status(200).send(xml);
  } catch (e: any) {
    console.error('Sitemap Generation Error:', e);
    res.status(500).send(`Error generating sitemap: ${e?.message || e}`);
  }
}
