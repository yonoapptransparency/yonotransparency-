import fs from 'fs';
import path from 'path';

let cachedData: any = null;
let lastFetchTime = 0;
const CACHE_TTL = 60 * 1000; // 60 seconds

async function fetchStoreData() {
  const now = Date.now();
  if (cachedData && (now - lastFetchTime) < CACHE_TTL) {
    return cachedData;
  }

  let config;
  try {
    config = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf8'));
  } catch (e) {
    console.error('No firebase config found for SEO rendering.');
    return null;
  }

  try {
    const appsChunkUrl = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/store_data/apps_chunk_0`;
    const settingsUrl = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/store_data/settings`;

    const [appsRes, settingsRes] = await Promise.all([
      fetch(appsChunkUrl).catch(() => null),
      fetch(settingsUrl).catch(() => null)
    ]);

    const appsData = appsRes && appsRes.ok ? await appsRes.json() : null;
    const settingsData = settingsRes && settingsRes.ok ? await settingsRes.json() : null;

    let apps = [];
    if (appsData && appsData.fields && appsData.fields.items && appsData.fields.items.arrayValue && appsData.fields.items.arrayValue.values) {
      apps = appsData.fields.items.arrayValue.values.map((v: any) => v.mapValue.fields);
    }
    
    let settings = null;
    if (settingsData && settingsData.fields) {
      settings = settingsData.fields;
    }

    cachedData = { apps, settings };
    lastFetchTime = now;
    return cachedData;
  } catch (error) {
    console.error('Failed to fetch store data for SEO:', error);
    return cachedData;
  }
}

function escapeHtml(unsafe: string) {
    if (!unsafe) return '';
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

function stripHtml(html: string) {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '');
}

export async function injectSeoTags(template: string, urlPath: string): Promise<string> {
  const data = await fetchStoreData();
  if (!data || !data.settings) return template;

  const { apps, settings } = data;
  const siteTitle = settings.site_title?.stringValue || 'RUMMY STORE';
  let title = siteTitle;
  let description = settings.meta_description?.stringValue || '';
  let keywords = settings.seo_keywords?.stringValue || '';
  let ogImage = settings.logo_url?.stringValue || '';
  
  if (urlPath.startsWith('/app/')) {
    const slug = urlPath.split('/app/')[1].split('/')[0].split('?')[0];
    const app = apps.find((a: any) => a.slug && a.slug.stringValue === slug);
    
    if (app) {
      title = `${app.seo_title?.stringValue || app.name?.stringValue} | ${siteTitle}`;
      const descHtml = app.description_html?.stringValue || '';
      const fallbackDesc = `${app.name?.stringValue} technical specs and secure access profile.`;
      description = app.seo_description?.stringValue || (descHtml ? stripHtml(descHtml).substring(0, 160) : fallbackDesc);
      
      if (app.seo_keywords?.stringValue) {
        keywords = app.seo_keywords.stringValue;
      }
      if (app.og_image_url?.stringValue || app.icon_url?.stringValue) {
        ogImage = app.og_image_url?.stringValue || app.icon_url?.stringValue;
      }
    }
  } else if (urlPath.startsWith('/gateway/')) {
    const slug = urlPath.split('/gateway/')[1].split('/')[0].split('?')[0];
    const app = apps.find((a: any) => a.slug && a.slug.stringValue === slug);
    if (app) {
      title = `${app.seo_title?.stringValue || app.name?.stringValue} - Technical Info | ${siteTitle}`;
      const descHtml = app.description_html?.stringValue || '';
      const fallbackDesc = `Verified technical specs and secure access profile for ${app.name?.stringValue}.`;
      description = app.seo_description?.stringValue || (descHtml ? stripHtml(descHtml).substring(0, 160) : fallbackDesc);
      
      if (app.seo_keywords?.stringValue) {
        keywords = `${app.seo_keywords.stringValue}, info ${app.name?.stringValue}, secure ${app.name?.stringValue}`;
      }
      if (app.og_image_url?.stringValue || app.icon_url?.stringValue) {
        ogImage = app.og_image_url?.stringValue || app.icon_url?.stringValue;
      }
    }
  }

  // Construct replacement tags
  const tags = `
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    ${keywords ? `<meta name="keywords" content="${escapeHtml(keywords)}" />` : ''}
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    ${ogImage ? `<meta property="og:image" content="${escapeHtml(ogImage)}" />` : ''}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    ${ogImage ? `<meta name="twitter:image" content="${escapeHtml(ogImage)}" />` : ''}
  `;

  // Regex to remove any existing <title> and OpenGraph meta tags so we don't have duplicates
  let newTemplate = template.replace(/<title>.*?<\/title>/ims, '');
  newTemplate = newTemplate.replace(/<meta[^>]*(name|property)=["'](description|keywords|og:title|og:description|og:image|og:type|twitter:.*?)["'][^>]*>/gims, '');
  
  // Insert new tags before </head>
  newTemplate = newTemplate.replace('</head>', `${tags}</head>`);
  
  return newTemplate;
}
